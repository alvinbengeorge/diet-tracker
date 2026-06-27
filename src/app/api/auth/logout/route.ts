import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const tokenCookie = req.cookies.get('refreshToken');
    const refreshToken = tokenCookie?.value;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        // Remove token from database
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: { token: refreshToken } },
        });
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear cookie
    response.cookies.set({
      name: 'refreshToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
