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

    // Extract idv_complete claim from presented mDoc credentials
    let idvComplete: boolean | undefined;
    if (isSuccessful && result.session?.presented_credentials) {
      const presentedCreds = result.session.presented_credentials as Record<string, unknown>;
      console.log('Presented credentials:', JSON.stringify(presentedCreds, null, 2));

      // For mDoc org.iso.23220.photoid.1, credentials are in an array
      const mdocCredsArray = presentedCreds['org.iso.23220.photoid.1'] as unknown[];

      if (Array.isArray(mdocCredsArray) && mdocCredsArray.length > 0) {
        const firstCred = mdocCredsArray[0] as Record<string, unknown>;
        console.log('=== FULL CREDENTIAL STRUCTURE ===');
        console.log(JSON.stringify(firstCred, null, 2));

        // Extract from credentialData.org.iso.23220.photoid.1 (mDoc element name)
        if (firstCred.credentialData && typeof firstCred.credentialData === 'object') {
          const credData = firstCred.credentialData as Record<string, unknown>;
          const namespaceData = credData['org.iso.23220.photoid.1'] as Record<string, unknown>;

          console.log('=== NAMESPACE DATA ===');
          console.log('Keys available:', Object.keys(namespaceData || {}));
          console.log(JSON.stringify(namespaceData, null, 2));

          if (namespaceData && typeof namespaceData === 'object') {
            // Check for idv_complete (mDoc element name with underscore)
            if ('idv_complete' in namespaceData) {
              idvComplete = namespaceData.idv_complete === true || namespaceData.idv_complete === 'true';
              console.log('✓ Found idv_complete in mDoc:', idvComplete, 'Type:', typeof namespaceData.idv_complete);
            } else {
              console.log('✗ idv_complete not found. Available keys:', Object.keys(namespaceData));
            }
          }
        }
      }

      console.log('=== IDV Complete value extracted:', idvComplete, '===');
    }

    return NextResponse.json({
      status: isSuccessful ? 'done' : result.session?.status || 'pending',
      idvComplete: idvComplete ?? false,
      credentialFormat: 'mso_mdoc',
      credentialType: 'org.iso.23220.photoid.1',
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
