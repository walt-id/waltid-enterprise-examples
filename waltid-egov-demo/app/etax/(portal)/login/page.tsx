'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Fingerprint,
  FileText,
  RefreshCw,
  QrCode,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { taxRegistrationCertDefaultValues } from '@/lib/schemas/tax-registration-cert';

type Step = 'idle' | 'verifying' | 'verified' | 'issuing' | 'done';

interface VerifiedData {
  nameEnglish?: string;
  nativeName?: string;
  uidNumber?: string;
  nationalIdNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
}

const POLL_INTERVAL = 2000;

function extractVerifiedData(presented: unknown): VerifiedData {
  if (!presented || typeof presented !== 'object') return {};
  const p = presented as Record<string, unknown>;

  const findInObject = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
    for (const key of keys) {
      if (key in obj && typeof obj[key] === 'string') return obj[key] as string;
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object') {
        const found = findInObject(val as Record<string, unknown>, keys);
        if (found) return found;
      }
    }
    return undefined;
  };

  return {
    nameEnglish: findInObject(p, ['nameEnglish', 'name_english', 'given_name']),
    nativeName: findInObject(p, ['nativeName', 'native_name']),
    uidNumber: findInObject(p, ['uidNumber', 'uid_number', 'uid']),
    nationalIdNumber: findInObject(p, ['nationalIdNumber', 'national_id_number']),
    dateOfBirth: findInObject(p, ['dateOfBirth', 'date_of_birth', 'birthdate']),
    gender: findInObject(p, ['gender']),
    nationality: findInObject(p, ['nationality']),
  };
}

export default function EtaxLoginPage() {
  const [step, setStep] = useState<Step>('idle');
  const [verifyQrUrl, setVerifyQrUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [verifiedData, setVerifiedData] = useState<VerifiedData>({});
  const [issueQrUrl, setIssueQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollStatus = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/etax/verify?sessionId=${sessionId}`);
      if (!response.ok) return;

      const data = await response.json();
      const status = data.session?.status || data.status;

      if (status === 'SUCCESSFUL') {
        stopPolling();
        const extracted = extractVerifiedData(data.session?.presented_credentials);
        setVerifiedData(extracted);
        setStep('verified');
      } else if (status === 'FAILED' || status === 'failed' || status === 'error') {
        stopPolling();
        setError(data.error || data.message || 'Verification failed. Please try again.');
        setStep('idle');
      }
    } catch {
      // ignore polling errors
    }
  }, [sessionId]);

  useEffect(() => {
    if (step !== 'verifying' || !sessionId) return;
    pollingRef.current = setInterval(pollStatus, POLL_INTERVAL);
    return stopPolling;
  }, [step, sessionId, pollStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return stopPolling;
  }, []);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/etax/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create verification session');
      }
      const data = await response.json();
      setVerifyQrUrl(data.bootstrapAuthorizationRequestUrl);
      setSessionId(data.sessionId);
      setStep('verifying');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTaxCertificate = async () => {
    setIsLoading(true);
    setError('');
    setStep('issuing');

    const credentialData = {
      linkedUid: verifiedData.uidNumber || taxRegistrationCertDefaultValues.linkedUid,
      taxpayerIdentificationNumber: taxRegistrationCertDefaultValues.taxpayerIdentificationNumber,
      taxpayerName: verifiedData.nameEnglish || taxRegistrationCertDefaultValues.taxpayerName,
      taxOfficeBranch: taxRegistrationCertDefaultValues.taxOfficeBranch,
      registrationDate: taxRegistrationCertDefaultValues.registrationDate,
      taxpayerStatus: taxRegistrationCertDefaultValues.taxpayerStatus,
    };

    try {
      const response = await fetch('/api/etax/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialData }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create credential offer');
      }
      const data = await response.json();
      setIssueQrUrl(data.offerUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('verified');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setStep('idle');
    setVerifyQrUrl('');
    setSessionId('');
    setVerifiedData({});
    setIssueQrUrl('');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-etax-surface via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/etax"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-etax-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to e-Tax Portal
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-etax-primary text-etax-accent">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-etax-primary">Login with National eID</h1>
              <p className="text-muted-foreground">
                Present your eID, then claim your Tax Registration Certificate
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {[
              { id: 1, label: 'Present eID', activeIn: ['idle', 'verifying'] },
              { id: 2, label: 'Identity Verified', activeIn: ['verified'] },
              { id: 3, label: 'Claim Tax Cert', activeIn: ['issuing', 'done'] },
            ].map((s, index) => {
              const isActive = s.activeIn.includes(step) ||
                (s.id === 1 && ['verified', 'issuing', 'done'].includes(step)) ||
                (s.id === 2 && ['issuing', 'done'].includes(step)) ||
                (s.id === 3 && step === 'done');
              const isDone =
                (s.id === 1 && ['verified', 'issuing', 'done'].includes(step)) ||
                (s.id === 2 && ['issuing', 'done'].includes(step)) ||
                (s.id === 3 && step === 'done');

              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'border-etax-primary bg-etax-primary text-white'
                          : 'border-muted-foreground/20 bg-background text-muted-foreground'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-etax-primary' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 transition-colors ${
                        (s.id === 1 && ['verified', 'issuing', 'done'].includes(step)) ||
                        (s.id === 2 && ['issuing', 'done'].includes(step))
                          ? 'bg-etax-primary'
                          : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step: idle */}
        {step === 'idle' && (
          <Card className="mb-6 border-etax-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-etax-primary text-etax-accent">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-etax-primary">Login with National eID</CardTitle>
                  <CardDescription>
                    Present your National Mobile Identity Credential to log in securely
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-etax-surface border border-etax-primary/10 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-etax-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-etax-primary">What happens next?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A QR code will be displayed. Open your digital wallet app and scan it to present your National Mobile Identity Credential.
                      Once verified, you can claim your Tax Registration Certificate.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleStartVerification}
                disabled={isLoading}
                size="lg"
                className="w-full bg-etax-primary hover:bg-etax-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating verification session...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Start Identity Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: verifying */}
        {step === 'verifying' && verifyQrUrl && (
          <Card className="mb-6 border-etax-accent/30 bg-etax-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-amber-500">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Waiting
                </Badge>
                <CardTitle className="text-xl text-etax-primary">Scan to Present National eID</CardTitle>
              </div>
              <CardDescription>
                Open your digital wallet and scan this QR code to present your National Mobile Identity Credential
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={verifyQrUrl} />
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for credential presentation...
              </div>
              {sessionId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Session: <code className="rounded bg-muted px-2 py-0.5">{sessionId}</code>
                </p>
              )}
              <Separator className="my-6" />
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-etax-primary text-etax-primary hover:bg-etax-primary/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: verified */}
        {step === 'verified' && (
          <Card className="mb-6 border-green-500/30 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
                <CardTitle className="text-xl text-green-700">Identity Verified</CardTitle>
              </div>
              <CardDescription>
                Your National Mobile Identity has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(verifiedData.nameEnglish || verifiedData.uidNumber || verifiedData.nationalIdNumber) && (
                <div className="rounded-lg border border-green-200 bg-white p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Verified Identity</span>
                  </div>
                  <div className="space-y-2">
                    {verifiedData.nameEnglish && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Name (English):</span>
                        <span className="font-medium text-green-700">{verifiedData.nameEnglish}</span>
                      </div>
                    )}
                    {verifiedData.nativeName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Native Name:</span>
                        <span className="font-medium text-green-700">{verifiedData.nativeName}</span>
                      </div>
                    )}
                    {verifiedData.uidNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">UID Number:</span>
                        <span className="font-mono font-medium text-green-700">{verifiedData.uidNumber}</span>
                      </div>
                    )}
                    {verifiedData.nationalIdNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">National ID Number:</span>
                        <span className="font-mono font-medium text-green-700">{verifiedData.nationalIdNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-etax-surface border border-etax-primary/10 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-etax-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-etax-primary">Tax Registration Certificate ready to issue</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click below to claim your Tax Registration Certificate from the Revenue Authority.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleClaimTaxCertificate}
                disabled={isLoading}
                size="lg"
                className="w-full bg-etax-primary hover:bg-etax-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing certificate...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Claim Tax Registration Certificate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: issuing */}
        {step === 'issuing' && issueQrUrl && (
          <Card className="mb-6 border-etax-primary/30 bg-etax-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  eID Verified
                </Badge>
                <Badge className="bg-etax-primary">Ready to Claim</Badge>
                <CardTitle className="text-xl text-etax-primary">Scan to Claim Tax Certificate</CardTitle>
              </div>
              <CardDescription>
                Open your wallet and scan this QR code to receive your Tax Registration Certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={issueQrUrl} />

              <Separator className="my-6" />

              <div className="w-full max-w-sm rounded-lg bg-white border border-etax-primary/20 p-4 text-center mb-4">
                <p className="text-sm font-medium text-etax-primary mb-1">Credential being issued</p>
                <p className="text-xs text-muted-foreground">TaxRegistrationCertificate</p>
                <p className="text-xs text-muted-foreground">Issued by: Revenue Authority (RA)</p>
                {verifiedData.nameEnglish && (
                  <p className="text-xs font-mono text-etax-primary mt-2">{verifiedData.nameEnglish}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-etax-primary text-etax-primary hover:bg-etax-primary/10"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
