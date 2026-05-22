import { NextRequest, NextResponse } from 'next/server';
import { getVerifierOpenIdMetadata } from '@/lib/api/client';
import { verifierCard } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const metadata = await getVerifierOpenIdMetadata(forceRefresh);

  return NextResponse.json({
    verifiers: [
      {
        id: verifierCard.id,
        metadata,
      },
    ],
  });
}

export async function POST() {
  const metadata = await getVerifierOpenIdMetadata(true);
  return NextResponse.json({ id: verifierCard.id, metadata });
}
