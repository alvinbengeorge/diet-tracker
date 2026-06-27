import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Log from '@/models/Log';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format

    let query: any = { userId: user.userId };

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const logs = await Log.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Fetch Logs Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();
    const data = await req.json();

    const { type, name, date, caloriesIn, protein, carbs, fat, mealType, image, caloriesOut, duration } = data;

    if (!type || !name || !date) {
      return NextResponse.json({ error: 'Type, name, and date are required' }, { status: 400 });
    }

    const newLog = await Log.create({
      userId: user.userId,
      type,
      name,
      date: new Date(date),
      caloriesIn: caloriesIn || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      mealType: mealType || 'none',
      image: image || null,
      caloriesOut: caloriesOut || 0,
      duration: duration || 0,
    });

    return NextResponse.json({ log: newLog }, { status: 201 });
  } catch (error: any) {
    console.error('Create Log Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const deletedLog = await Log.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deletedLog) {
      return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Log deleted successfully' });
  } catch (error: any) {
    console.error('Delete Log Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();
    const data = await req.json();
    const { id, name, date, caloriesIn, protein, carbs, fat, mealType, caloriesOut, duration } = data;

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (date !== undefined) updateFields.date = new Date(date);
    if (caloriesIn !== undefined) updateFields.caloriesIn = caloriesIn;
    if (protein !== undefined) updateFields.protein = protein;
    if (carbs !== undefined) updateFields.carbs = carbs;
    if (fat !== undefined) updateFields.fat = fat;
    if (mealType !== undefined) updateFields.mealType = mealType;
    if (caloriesOut !== undefined) updateFields.caloriesOut = caloriesOut;
    if (duration !== undefined) updateFields.duration = duration;

    const updatedLog = await Log.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedLog) {
      return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ log: updatedLog });
  } catch (error: any) {
    console.error('Update Log Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
