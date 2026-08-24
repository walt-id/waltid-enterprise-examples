'use client';

import { useState } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, User, Calendar, CreditCard, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

// Mock credential data that would come from a real IDV provider
const MOCK_CREDENTIAL = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  dateOfBirth: '1990-05-15',
  employeeId: 'EMP-50234',
  idvComplete: true,
};

const CREDENTIAL_ATTRIBUTES = [
  { label: 'Given Name', value: MOCK_CREDENTIAL.firstName, icon: User, mdocField: 'given_name' },
  { label: 'Family Name', value: MOCK_CREDENTIAL.lastName, icon: User, mdocField: 'family_name' },
  { label: 'Date of Birth', value: MOCK_CREDENTIAL.dateOfBirth, icon: Calendar, mdocField: 'date_of_birth' },
  { label: 'Employee ID', value: MOCK_CREDENTIAL.employeeId, icon: CreditCard, mdocField: 'employee_id' },
  { label: 'IDV Status', value: 'Complete', icon: BadgeCheck, mdocField: 'idv_complete' },
];

type FlowStage = 'verified' | 'issuing' | 'issued';

export default function IDVPage() {
  const [flowStage, setFlowStage] = useState<FlowStage>('verified');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [offerId, setOfferId] = useState('');
  const [error, setError] = useState('');

  const handleIssueCredential = async () => {
    setError('');
    setIsLoading(true);
    setFlowStage('issuing');

    // Simulate biometric/issuance processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/idv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: MOCK_CREDENTIAL.firstName,
          lastName: MOCK_CREDENTIAL.lastName,
          dateOfBirth: MOCK_CREDENTIAL.dateOfBirth,
          employeeId: MOCK_CREDENTIAL.employeeId,
          idvComplete: MOCK_CREDENTIAL.idvComplete,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Credential issuance failed');
      }

      const data = await response.json();
      setQrCodeUrl(data.offerUrl);
      setOfferId(data.offerId);
      setFlowStage('issued');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issuance failed');
      setFlowStage('verified');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#f8fafc] to-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-jp-primary hover:text-jp-accent">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* IDV Complete State */}
        {(flowStage === 'verified' || flowStage === 'issuing') && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-jp-primary">ID Verification Complete</CardTitle>
                  <CardDescription>Identity confirmed by Acme IDV service</CardDescription>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-700 border-0">Verified</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Identity verification passed. The following attributes will be embedded in your mDoc credential (ISO/IEC 23220-4).
                </AlertDescription>
              </Alert>

              {/* Credential Attributes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Credential Attributes · <span className="font-mono normal-case">org.iso.23220.photoid.1</span>
                </p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden">
                  {CREDENTIAL_ATTRIBUTES.map(({ label, value, icon: Icon, mdocField }) => (
                    <div key={mdocField} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-jp-primary/60 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs font-mono text-muted-foreground">{mdocField}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {mdocField === 'idv_complete' ? (
                          <Badge className="bg-green-100 text-green-700 border-0">{value}</Badge>
                        ) : (
                          <span className="text-sm text-gray-700">{value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleIssueCredential}
                disabled={isLoading}
                className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing Credential...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Issue mDoc Credential to Wallet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* QR Code Stage */}
        {flowStage === 'issued' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <CardTitle className="text-jp-primary">Credential Ready</CardTitle>
                  <CardDescription>Scan the QR code with your wallet to receive your mDoc Photo ID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-medium text-green-900 mb-1">✓ mDoc Photo ID issued</p>
                <p className="text-sm text-green-800">
                  Your ISO/IEC 23220-4 credential is ready. Scan the QR code below to add it to your digital wallet.
                </p>
              </div>

              <div className="text-center">
                <p className="mb-4 text-sm text-muted-foreground">Scan with your wallet app:</p>
                {qrCodeUrl && <InlineQRCode value={qrCodeUrl} />}
                <p className="mt-4 text-xs text-muted-foreground font-mono">Offer ID: {offerId}</p>
              </div>

              <Button
                onClick={() => (window.location.href = '/')}
                className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
              >
                Proceed to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
