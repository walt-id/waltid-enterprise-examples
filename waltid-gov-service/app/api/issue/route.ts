import { NextRequest, NextResponse } from 'next/server';
import { issueCredential } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialType, credentialData, flowType } = body;

    if (!credentialType || !credentialData) {
      return NextResponse.json(
        { error: 'Missing required fields: credentialType, credentialData' },
        { status: 400 }
      );
    }

    const result = await issueCredential(
      credentialType,
      credentialData,
      flowType || 'pre-auth-code'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Issuance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
