import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Firebase token exchange is not implemented.' },
    { status: 501 }
  );
}
