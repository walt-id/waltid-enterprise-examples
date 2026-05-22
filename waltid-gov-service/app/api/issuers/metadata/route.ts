import { NextResponse } from 'next/server';
import { getIssuerOpenIdMetadata } from '@/lib/api/client';
import { issuerCards } from '@/lib/config';

export async function GET() {
  console.log('[issuer-metadata] API route requested');

  const issuers = await Promise.all(
    issuerCards.map(async issuer => {
      console.log('[issuer-metadata] loading issuer card', {
        id: issuer.id,
        issuerTarget: issuer.issuerTarget,
        credentialKey: issuer.credentialKeys[0],
      });

      const metadata = await getIssuerOpenIdMetadata(
        issuer.issuerTarget,
        issuer.credentialKeys[0],
      );

      console.log('[issuer-metadata] loaded issuer card', {
        id: issuer.id,
        hasName: Boolean(metadata.name),
        hasLogo: Boolean(metadata.logoUri),
      });

      return {
        id: issuer.id,
        metadata,
      };
    })
  );

  return NextResponse.json({ issuers });
}
