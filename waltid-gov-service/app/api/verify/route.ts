import { NextRequest, NextResponse } from 'next/server';
import { 
  createVerificationSession, 
  createMultiCredentialVerificationSession,
  getVerificationSessionStatus 
} from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentials } = body;

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: credentials (array)' },
        { status: 400 }
      );
    }

    let result;

    if (credentials.length === 1) {
      result = await createVerificationSession(
        credentials[0].type,
        credentials[0].claims
      );
    } else {
      result = await createMultiCredentialVerificationSession(credentials);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification session error:', error);
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
        { error: 'Missing required query parameter: sessionId' },
        { status: 400 }
      );
    }

    const result = await getVerificationSessionStatus(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
