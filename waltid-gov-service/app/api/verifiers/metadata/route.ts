import { NextRequest, NextResponse } from 'next/server';
import { getVerifierOpenIdMetadata } from '@/lib/api/client';
import { VerifierKind, verifierCards } from '@/lib/config';

function isVerifierKind(value: unknown): value is VerifierKind {
  return value === 'trusted' || value === 'untrusted';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  const verifiers = await Promise.all(
    (Object.keys(verifierCards) as VerifierKind[]).map(async verifierKind => {
      const metadata = await getVerifierOpenIdMetadata(verifierKind, forceRefresh);

      return {
        id: verifierKind,
        metadata,
      };
    })
  );

  return NextResponse.json({ verifiers });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const verifierKind = body.verifierKind;

  if (!isVerifierKind(verifierKind)) {
    return NextResponse.json(
      { error: 'verifierKind must be "trusted" or "untrusted"' },
      { status: 400 },
    );
  }

  const metadata = await getVerifierOpenIdMetadata(verifierKind, true);
  return NextResponse.json({ id: verifierKind, metadata });
}
