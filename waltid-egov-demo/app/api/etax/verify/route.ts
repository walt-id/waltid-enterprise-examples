import { NextRequest, NextResponse } from 'next/server';
import { createVerificationSession, getVerificationSessionStatus } from '@/lib/api/client';
import { config } from '@/lib/config';

const VC_POLICIES = [{ policy: 'signature' }];

export async function POST(_request: NextRequest) {
  try {
    const result = await createVerificationSession(
      'national_mobile_id',
      [
        { path: ['vc', 'credentialSubject', 'uidNumber'] },
        { path: ['vc', 'credentialSubject', 'nameEnglish'] },
        { path: ['vc', 'credentialSubject', 'nativeName'] },
        { path: ['vc', 'credentialSubject', 'nationalIdNumber'] },
        { path: ['vc', 'credentialSubject', 'dateOfBirth'] },
        { path: ['vc', 'credentialSubject', 'nationality'] },
      ],
      {
        verifierTarget: config.taxVerifierTarget,
        vcPolicies: VC_POLICIES,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('eTax verification error:', error);
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

    const result = await getVerificationSessionStatus(sessionId, config.taxVerifierTarget);
    return NextResponse.json(result);
  } catch (error) {
    console.error('eTax verification status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
