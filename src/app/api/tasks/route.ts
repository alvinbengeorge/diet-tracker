import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const startOfDay = new Date(dateStr + 'T00:00:00');
    const endOfDay = new Date(dateStr + 'T23:59:59.999');

    // Retrieve:
    // 1. One-off tasks scheduled for the selected day
    // 2. Recurring daily habits created on or before the selected day
    const tasks = await Task.find({
      userId: user.userId,
      $or: [
        { isRecurring: false, date: { $gte: startOfDay, $lte: endOfDay } },
        { isRecurring: true, createdAt: { $lte: endOfDay } },
      ],
    }).sort({ createdAt: 1 });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Fetch Tasks Error:', error);
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

    const { text, date, isRecurring, time } = data;

    if (!text || !date) {
      return NextResponse.json({ error: 'Text and date are required' }, { status: 400 });
    }

    const newTask = await Task.create({
      userId: user.userId,
      text,
      date: new Date(date),
      isRecurring: !!isRecurring,
      time: time || '',
      completed: false,
      completedDates: [],
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error: any) {
    console.error('Create Task Error:', error);
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

    const { id, completed, dateStr } = data;

    if (!id || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Task ID and completed state are required' }, { status: 400 });
    }

    const task = await Task.findOne({ _id: id, userId: user.userId });
    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    if (task.isRecurring) {
      if (!dateStr) {
        return NextResponse.json({ error: 'Date string (dateStr) is required to toggle a recurring task' }, { status: 400 });
      }
      
      if (completed) {
        await Task.updateOne(
          { _id: id },
          { $addToSet: { completedDates: dateStr } }
        );
      } else {
        await Task.updateOne(
          { _id: id },
          { $pull: { completedDates: dateStr } }
        );
      }
    } else {
      await Task.updateOne(
        { _id: id },
        { $set: { completed: completed } }
      );
    }

    const updatedTask = await Task.findOne({ _id: id });
    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Update Task Error:', error);
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
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const deletedTask = await Task.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete Task Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
