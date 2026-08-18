import { createVerificationSession } from '@/lib/api/client';
import { AcmeCredentialTypes } from '@/lib/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Authenticate endpoint called');
    console.log('Using credential type:', AcmeCredentialTypes.PHOTO_ID);

    // For mDoc, we request specific elements using mDoc element names
    const claims = [
      { path: ['given_name'] },
      { path: ['family_name'] },
      { path: ['date_of_birth'] },
      { path: ['employee_id'] },
      { path: ['idv_complete'] },
    ];

    console.log('Creating verification session for mDoc Photo ID with claims:', claims);

    const result = await createVerificationSession(
      AcmeCredentialTypes.PHOTO_ID,
      claims
    );

    console.log('mDoc verification session created:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Authentication error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication setup failed';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
