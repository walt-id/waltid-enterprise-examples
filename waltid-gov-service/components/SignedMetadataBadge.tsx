'use client';

import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { OpenIdCardMetadata } from '@/lib/config';

interface SignedMetadataBadgeProps {
  metadata?: OpenIdCardMetadata;
  className?: string;
}

export function SignedMetadataBadge({ metadata, className }: SignedMetadataBadgeProps) {
  if (!metadata) return null;

  if (metadata.isSignedMetadata) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-green-50 text-green-700 border-green-200 ${className || ''}`}
      >
        <ShieldCheck className="mr-1 h-3 w-3" />
        Signed Metadata
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-amber-50 text-amber-700 border-amber-200 ${className || ''}`}
    >
      <ShieldAlert className="mr-1 h-3 w-3" />
      Unsigned Metadata
    </Badge>
  );
}
