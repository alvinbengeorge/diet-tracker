import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Log from '@/models/Log';
import User from '@/models/User';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();

    const userDoc = await User.findById(user.userId);
    const targetCalories = userDoc?.targetCalories || 2000;

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD
    const range = searchParams.get('range'); // 'day' | 'week'

    const targetDate = dateStr ? new Date(dateStr) : new Date();

    if (range === 'week') {
      // Fetch last 7 days of summary
      const daysData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];

        const start = new Date(dateString);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateString);
        end.setHours(23, 59, 59, 999);

        const logs = await Log.find({
          userId: user.userId,
          date: { $gte: start, $lte: end },
        });

        let caloriesIn = 0;
        let caloriesOut = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;

        logs.forEach((log) => {
          if (log.type === 'food') {
            caloriesIn += log.caloriesIn || 0;
            protein += log.protein || 0;
            carbs += log.carbs || 0;
            fat += log.fat || 0;
          } else {
            caloriesOut += log.caloriesOut || 0;
          }
        });

        // Format day name e.g., Mon, Tue
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

        daysData.push({
          date: dateString,
          label: dayLabel,
          caloriesIn,
          caloriesOut,
          net: caloriesIn - caloriesOut,
          protein,
          carbs,
          fat,
        });
      }

      return NextResponse.json({ weekly: daysData });
    }

    // Default: Single day summary
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await Log.find({
      userId: user.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    let caloriesIn = 0;
    let caloriesOut = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    const mealBreakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    logs.forEach((log) => {
      if (log.type === 'food') {
        caloriesIn += log.caloriesIn || 0;
        protein += log.protein || 0;
        carbs += log.carbs || 0;
        fat += log.fat || 0;

        const meal = log.mealType as keyof typeof mealBreakdown;
        if (mealBreakdown[meal] !== undefined) {
          mealBreakdown[meal] += log.caloriesIn || 0;
        }
      } else {
        caloriesOut += log.caloriesOut || 0;
      }
    });

    return NextResponse.json({
      summary: {
        date: targetDate.toISOString().split('T')[0],
        caloriesIn,
        caloriesOut,
        net: caloriesIn - caloriesOut,
        protein,
        carbs,
        fat,
        mealBreakdown,
        targetCalories,
        profile: {
          weight: userDoc?.weight || null,
          height: userDoc?.height || null,
          age: userDoc?.age || null,
          gender: userDoc?.gender || 'none',
          activityLevel: userDoc?.activityLevel || 'none',
        }
      },
    });
  } catch (error: any) {
    console.error('Fetch Summary Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
