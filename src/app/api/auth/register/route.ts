import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide username, email and password' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (userExists) {
      return NextResponse.json(
        { error: 'Username or email already registered' },
        { status: 400 }
      );
    }

    // Create user (password hashing happens in pre-save hook)
    await User.create({
      username,
      email,
      password,
    });

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
