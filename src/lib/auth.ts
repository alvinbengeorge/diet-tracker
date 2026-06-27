import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export interface TokenPayload {
  userId: string;
  username: string;
}

export function generateAccessToken(user: TokenPayload): string {
  return jwt.sign({ userId: user.userId, username: user.username }, ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(user: TokenPayload): string {
  return jwt.sign({ userId: user.userId, username: user.username }, REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Authentication check helper for API route handlers
export async function getAuthenticatedUser(req: NextRequest): Promise<TokenPayload | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// Helper to return 401 response
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
