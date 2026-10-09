import { NextResponse } from 'next/server';
import { getIssuerOpenIdMetadata } from '@/lib/api/client';
import { credentialTypes, issuerCard } from '@/lib/config';

export async function GET() {
  console.log('[issuer-metadata] API route requested');

  const metadata = await getIssuerOpenIdMetadata(
    issuerCard.issuerTarget,
    credentialTypes[issuerCard.credentialKeys[0]]?.credentialConfigurationId,
  );

  return NextResponse.json({
    issuers: [
      {
        id: issuerCard.id,
        metadata,
      },
    ],
  });
}
