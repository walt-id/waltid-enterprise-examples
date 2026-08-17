import { issueCredential } from '@/lib/api/client';
import { JPMorganCredentialTypes } from '@/lib/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, dateOfBirth, idvComplete , employeeId } = await request.json();

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, dateOfBirth' },
        { status: 400 }
      );
    }

    // idvComplete determines whether full verification (true) or limited enrollment (false)
    const isFullVerification = idvComplete === true;

    // Use mDoc Photo ID format (ISO/IEC 23220-4)
    const credentialData = {
      firstName,
      lastName,
      dateOfBirth,
      idvComplete: isFullVerification,
      employeeId
    };

    console.log('Issuing mDoc Photo ID credential with data:', JSON.stringify(credentialData, null, 2));
    console.log('Issuing mDoc Photo ID credential with idvComplete:', isFullVerification);
    if (!isFullVerification) {
      console.log('User will have limited access - needs to provide government ID later');
    }

    // Issue as mDoc Photo ID credential
    const result = await issueCredential(
      JPMorganCredentialTypes.PHOTO_ID,
      credentialData,
      'pre-auth-code'
    );

    console.log('mDoc Photo ID Issuance result:', result);

    return NextResponse.json({
      ...result,
      format: 'mso_mdoc',
      credentialType: 'org.iso.23220.photoid.1',
      idvComplete: isFullVerification,
      message: isFullVerification
        ? 'mDoc Photo ID issued with full identity verification'
        : 'mDoc Photo ID issued with limited access - government ID verification pending',
    });
  } catch (error) {
    console.error('IDV error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Credential issuance failed' },
      { status: 500 }
    );
  }
}
