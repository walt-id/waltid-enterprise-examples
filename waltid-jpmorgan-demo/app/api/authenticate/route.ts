import { createVerificationSession } from '@/lib/api/client';
import { JPMorganCredentialTypes } from '@/lib/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Authenticate endpoint called');
    console.log('Using credential type:', JPMorganCredentialTypes.IDENTITY);

    // For W3C VC, we request specific claims from credentialSubject
    const claims = [
      { path: ['firstName'] },
      { path: ['lastName'] },
      { path: ['dateOfBirth'] },
      { path: ['idvComplete'] },
    ];

    console.log('Creating verification session for W3C VC Identity with claims:', claims);

    const result = await createVerificationSession(
      JPMorganCredentialTypes.IDENTITY,
      claims
    );

    console.log('W3C VC verification session created:', result);
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
