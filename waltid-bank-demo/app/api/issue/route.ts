import { NextRequest, NextResponse } from 'next/server';
import { issueCredential } from '@/lib/api/client';
import { credentialTypes } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialType, credentialConfigurationId, credentialData, flowType, useTxCode } = body;

    // Support both old format (credentialConfigurationId) and new format (credentialType)
    let type = credentialType;
    const configId = credentialConfigurationId;

    if (!type && configId) {
      // Backward compatibility: find type by credentialConfigurationId
      const entry = Object.entries(credentialTypes).find(
        ([, config]) => config.credentialConfigurationId === configId
      );
      if (entry) {
        type = entry[0];
      }
    }

    if (!type || !credentialData || !flowType) {
      return NextResponse.json(
        { error: 'Missing required fields: credentialType, credentialData, flowType' },
        { status: 400 }
      );
    }

    const result = await issueCredential(type, credentialData, flowType, useTxCode);

    return NextResponse.json({ 
      offerUrl: result.offerUrl, 
      offerId: result.offerId,
      txCodeValue: result.txCodeValue,
    });
  } catch (error) {
    console.error('Issue API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
