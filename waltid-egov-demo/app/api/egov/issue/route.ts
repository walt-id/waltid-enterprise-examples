import { NextRequest, NextResponse } from 'next/server';
import { issueCredential } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialData } = body;

    if (!credentialData) {
      return NextResponse.json(
        { error: 'Missing required field: credentialData' },
        { status: 400 }
      );
    }

    const result = await issueCredential('national_mobile_id', credentialData, 'pre-auth-code');
    return NextResponse.json(result);
  } catch (error) {
    console.error('eGov issuance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
