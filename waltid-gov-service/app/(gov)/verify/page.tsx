'use client';

import { useState } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Home
} from 'lucide-react';
import Link from 'next/link';

import { credentialTypes } from '@/lib/config';
import { getCredentialRegistryEntry } from '@/lib/credentials/registry';

interface SelectedCredential {
  type: string;
  claims: Array<{ path: string[]; label: string; sd?: boolean }>;
}

const credentialIcons: Record<string, React.ElementType> = {
  employee_status: Users,
  photo_id: FileText,
  address_proof: Home,
  tax_registration: Receipt,
  bank_account: CreditCard,
};

export default function VerifyPage() {
  const [selectedCredentials, setSelectedCredentials] = useState<SelectedCredential[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleCredentialToggle = (credKey: string, checked: boolean) => {
    if (checked) {
      const entry = getCredentialRegistryEntry(credKey);
      if (entry) {
        setSelectedCredentials(prev => [
          ...prev,
          {
            type: credKey,
            claims: entry.claims.map(c => ({ ...c })),
          },
        ]);
      }
    } else {
      setSelectedCredentials(prev => prev.filter(c => c.type !== credKey));
    }
    setQrCodeUrl('');
    setError('');
  };

  const handleClaimToggle = (credType: string, claimPath: string[], checked: boolean) => {
    setSelectedCredentials(prev =>
      prev.map(cred => {
        if (cred.type !== credType) return cred;
        
        if (checked) {
          const entry = getCredentialRegistryEntry(credType);
          const claim = entry?.claims.find(c => JSON.stringify(c.path) === JSON.stringify(claimPath));
          if (claim && !cred.claims.find(c => JSON.stringify(c.path) === JSON.stringify(claimPath))) {
            return { ...cred, claims: [...cred.claims, { ...claim }] };
          }
        } else {
          return {
            ...cred,
            claims: cred.claims.filter(c => JSON.stringify(c.path) !== JSON.stringify(claimPath)),
          };
        }
        return cred;
      })
    );
    setQrCodeUrl('');
  };

  const handleGenerateQR = async () => {
    if (selectedCredentials.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: selectedCredentials.map(cred => ({
            type: cred.type,
            claims: cred.claims.map(c => ({ path: c.path })),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating verification session');
      }

      const data = await response.json();
      setQrCodeUrl(data.bootstrapAuthorizationRequestUrl);
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCredentials([]);
    setQrCodeUrl('');
    setSessionId('');
    setError('');
  };

  const isCredentialSelected = (credKey: string) => 
    selectedCredentials.some(c => c.type === credKey);

  const isClaimSelected = (credType: string, claimPath: string[]) => {
    const cred = selectedCredentials.find(c => c.type === credType);
    return cred?.claims.some(c => JSON.stringify(c.path) === JSON.stringify(claimPath)) ?? false;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F5F5F5] via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-gov-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to homepage
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-accent text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gov-primary">Verify Identity</h1>
              <p className="text-muted-foreground">
                Request credentials from a user&apos;s wallet to verify their identity
              </p>
            </div>
          </div>
        </div>

        {/* Credential Selection */}
        <Card className="mb-6 border-gov-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge className="bg-gov-primary">Step 1</Badge>
              <CardTitle className="text-xl text-gov-primary">Select Credentials to Verify</CardTitle>
            </div>
            <CardDescription>
              Choose which credentials you want to request from the user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(credentialTypes).map(([credKey, credConfig]) => {
                const Icon = credentialIcons[credKey] || FileText;
                const entry = getCredentialRegistryEntry(credKey);
                const isSelected = isCredentialSelected(credKey);

                return (
                  <div
                    key={credKey}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-gov-primary bg-gov-primary/5'
                        : 'border-gov-primary/20 bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={`cred-${credKey}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCredentialToggle(credKey, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-gov-primary text-white' : 'bg-gov-primary/10 text-gov-primary'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <Label 
                              htmlFor={`cred-${credKey}`}
                              className="font-semibold text-gov-primary cursor-pointer"
                            >
                              {credConfig.name}
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {credConfig.format}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Claims selection */}
                        {isSelected && entry && (
                          <div className="mt-4 ml-2 space-y-2 border-l-2 border-gov-primary/20 pl-4">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Select claims to request:
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {entry.claims.map((claim, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`claim-${credKey}-${idx}`}
                                    checked={isClaimSelected(credKey, claim.path)}
                                    onCheckedChange={(checked) => 
                                      handleClaimToggle(credKey, claim.path, checked as boolean)
                                    }
                                  />
                                  <Label 
                                    htmlFor={`claim-${credKey}-${idx}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {claim.label}
                                    {claim.sd && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        SD
                                      </Badge>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate QR Button */}
        {selectedCredentials.length > 0 && !qrCodeUrl && (
          <div className="mb-8 flex justify-center">
            <Button
              onClick={handleGenerateQR}
              disabled={isLoading || selectedCredentials.every(c => c.claims.length === 0)}
              size="lg"
              className="bg-gov-accent hover:bg-gov-accent/90"
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating verification session...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <QrCode className="mr-2 h-5 w-5" />
                  Generate Verification QR
                </span>
              )}
            </Button>
          </div>
        )}

        {/* QR Code Display */}
        {qrCodeUrl && (
          <Card className="mb-6 border-gov-accent/30 bg-gov-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Scan to Present Credentials</CardTitle>
              </div>
              <CardDescription>
                Ask the user to scan this QR code with their Wallet to present their credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={qrCodeUrl} />
              
              {sessionId && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Session ID: <code className="rounded bg-muted px-2 py-1">{sessionId}</code>
                </p>
              )}
              
              <Separator className="my-6" />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gov-accent text-gov-accent hover:bg-gov-accent/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Start new verification
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
