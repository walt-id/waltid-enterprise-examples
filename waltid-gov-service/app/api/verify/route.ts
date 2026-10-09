import { NextRequest, NextResponse } from 'next/server';
import { 
  createVerificationSession, 
  createMultiCredentialVerificationSession,
  getVerificationSessionStatus 
} from '@/lib/api/client';
import { VerifierKind, verificationPoliciesFor, verifierKeyReferenceFor, verifierTargetFor } from '@/lib/config';


function isVerifierKind(value: unknown): value is VerifierKind {
  return value === 'trusted' || value === 'untrusted';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentials, verifierKind = 'trusted', signedRequest = false } = body;

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: credentials (array)' },
        { status: 400 }
      );
    }

    if (!isVerifierKind(verifierKind)) {
      return NextResponse.json(
        { error: 'verifierKind must be "trusted" or "untrusted"' },
        { status: 400 }
      );
    }

    const options = {
      verifierTarget: verifierTargetFor(verifierKind),
      vcPolicies: verificationPoliciesFor(verifierKind),
      signedRequest: Boolean(signedRequest),
      keyReference: verifierKeyReferenceFor(verifierKind),
    };

    let result;

    if (credentials.length === 1) {
      result = await createVerificationSession(
        credentials[0].type,
        credentials[0].claims,
        options
      );
    } else {
      result = await createMultiCredentialVerificationSession(credentials, options);
    }

    return NextResponse.json({ ...result, verifierKind });
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
    const verifierKind = searchParams.get('verifierKind') || 'trusted';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: sessionId' },
        { status: 400 }
      );
    }

    if (!isVerifierKind(verifierKind)) {
      return NextResponse.json(
        { error: 'verifierKind must be "trusted" or "untrusted"' },
        { status: 400 }
      );
    }

    const result = await getVerificationSessionStatus(sessionId, verifierTargetFor(verifierKind));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
