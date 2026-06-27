import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from cookie
    const tokenCookie = req.cookies.get('refreshToken');
    let refreshToken = tokenCookie?.value;

    // Fallback to body
    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refreshToken;
      } catch {}
    }

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 400 });
    }

    // Verify token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Find token index in DB to check validity
    const tokenIndex = user.refreshTokens.findIndex((t: any) => t.token === refreshToken);

    if (tokenIndex === -1) {
      // Token reuse detection: if someone attempts to refresh with an old token, clear all for safety
      user.refreshTokens = [];
      await user.save();
      
      const response = NextResponse.json(
        { error: 'Token reuse detected. All sessions revoked.' },
        { status: 401 }
      );
      response.cookies.delete('refreshToken');
      return response;
    }

    // Rotate refresh token: remove old one, append new one
    user.refreshTokens.splice(tokenIndex, 1);

    const payload = { userId: user._id.toString(), username: user.username };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    const response = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        targetCalories: user.targetCalories,
      },
    });

    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Refresh Token Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
