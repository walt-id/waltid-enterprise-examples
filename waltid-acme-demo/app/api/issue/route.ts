import { issueCredential } from '@/lib/api/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { credentialType, credentialData, flowType } = await request.json();

    if (!credentialType || !flowType) {
      return NextResponse.json(
        { error: 'Missing required fields: credentialType, flowType' },
        { status: 400 }
      );
    }

    const result = await issueCredential(
      credentialType,
      credentialData,
      flowType
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Issuance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Issuance failed' },
      { status: 500 }
    );
  }
}
