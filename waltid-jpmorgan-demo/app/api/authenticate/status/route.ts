import { getVerificationSessionStatus } from '@/lib/api/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }

    const result = await getVerificationSessionStatus(sessionId);

    // Check if verification was successful
    const isSuccessful = result.session?.status === 'SUCCESSFUL' && result.session?.attempted === true;

    // Extract idvComplete claim from presented W3C VC credentials
    let idvComplete: boolean | undefined;
    if (isSuccessful && result.session?.presented_credentials) {
      const presentedCreds = result.session.presented_credentials as Record<string, unknown>;
      console.log('Presented credentials keys:', Object.keys(presentedCreds));
      console.log('Full presented credentials:', JSON.stringify(presentedCreds, null, 2));

      // For W3C VC, the credential is stored under jpmorgan_identity_credential
      const w3cCreds = presentedCreds['jpmorgan_identity_credential'] as unknown[];

      if (Array.isArray(w3cCreds) && w3cCreds.length > 0) {
        const firstCred = w3cCreds[0] as Record<string, unknown>;
        console.log('First credential structure:', JSON.stringify(firstCred, null, 2));

        // For W3C VC format, extract from credentialSubject
        if (firstCred.credentialData && typeof firstCred.credentialData === 'object') {
          const credData = firstCred.credentialData as Record<string, unknown>;
          console.log('Credential data:', JSON.stringify(credData, null, 2));

          if (credData.credentialSubject && typeof credData.credentialSubject === 'object') {
            const subject = credData.credentialSubject as Record<string, unknown>;
            console.log('Credential subject:', JSON.stringify(subject, null, 2));

            if ('idvComplete' in subject) {
              idvComplete = subject.idvComplete === true || subject.idvComplete === 'true';
              console.log('✓ Found idvComplete in W3C VC credentialSubject:', idvComplete);
            } else {
              console.log('✗ idvComplete NOT found in credentialSubject. Available keys:', Object.keys(subject));
            }
          }
        } else {
          console.log('✗ credentialData structure not found. Available keys in credential:', Object.keys(firstCred));
        }
      } else {
        console.log('✗ No credentials found under jpmorgan_identity_credential');
      }

      console.log('W3C VC credential presentation completed. IDV Complete:', idvComplete);
    } else {
      console.log('Verification not successful or no presented credentials. Status:', result.session?.status, 'Attempted:', result.session?.attempted);
    }

    return NextResponse.json({
      status: isSuccessful ? 'done' : result.session?.status || 'pending',
      idvComplete: idvComplete ?? false,
      credentialFormat: 'jwt_vc_json',
      credentialType: 'JPMorganIdentityCredential',
      session: result.session,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
}
