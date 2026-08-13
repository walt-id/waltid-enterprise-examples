import { issueCredential } from '@/lib/api/client';
import { JPMorganCredentialTypes } from '@/lib/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, dateOfBirth, idvComplete } = await request.json();

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, dateOfBirth' },
        { status: 400 }
      );
    }

    // idvComplete determines whether full verification (true) or limited enrollment (false)
    const isFullVerification = idvComplete === true;

    // Use W3C VC format instead of mDoc
    const credentialData = {
      firstName,
      lastName,
      dateOfBirth,
      idvComplete: isFullVerification,
    };

    console.log('Issuing W3C VC Identity credential with idvComplete:', isFullVerification);
    if (!isFullVerification) {
      console.log('User will have limited access - needs to provide government ID later');
    }

    // Issue as W3C VC identity credential
    const result = await issueCredential(
      JPMorganCredentialTypes.IDENTITY,
      credentialData,
      'pre-auth-code'
    );

    console.log('W3C VC Identity Issuance result:', result);

    return NextResponse.json({
      ...result,
      format: 'jwt_vc_json',
      credentialType: 'JPMorganIdentityCredential',
      idvComplete: isFullVerification,
      message: isFullVerification
        ? 'Identity credential issued with full verification'
        : 'Identity credential issued with limited access - government ID verification pending',
    });
  } catch (error) {
    console.error('IDV error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Credential issuance failed' },
      { status: 500 }
    );
  }
}
