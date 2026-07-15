import { NextRequest, NextResponse } from 'next/server';
import { createVerificationSession, createMultiCredentialVerificationSession, getVerificationSessionStatus } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialType, claims, credentials, transactionData } = body;

    // Multi-credential verification (for loan approval flow)
    if (credentials && Array.isArray(credentials)) {
      const result = await createMultiCredentialVerificationSession(credentials);
      return NextResponse.json(result);
    }

    // Single credential verification
    if (!credentialType || !claims || !Array.isArray(claims)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createVerificationSession(
      credentialType,
      claims,
      transactionData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const result = await getVerificationSessionStatus(sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify status API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
