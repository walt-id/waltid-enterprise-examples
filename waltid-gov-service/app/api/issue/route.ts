import { NextRequest, NextResponse } from 'next/server';
import { issueCredential } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialType, credentialData, flowType, useTxCode } = body;

    if (!credentialType) {
      return NextResponse.json(
        { error: 'Missing required field: credentialType' },
        { status: 400 }
      );
    }

    // credentialData is required for pre-auth flow, optional for auth-code flow
    if (flowType === 'pre-auth-code' && !credentialData) {
      return NextResponse.json(
        { error: 'Missing required field: credentialData (required for pre-auth flow)' },
        { status: 400 }
      );
    }

    const result = await issueCredential(
      credentialType,
      credentialData,
      flowType || 'pre-auth-code',
      useTxCode
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
