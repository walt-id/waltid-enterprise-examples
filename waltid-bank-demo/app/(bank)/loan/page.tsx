'use client';

import { useState, useEffect } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Euro,
  Calendar,
  FileText,
  Wallet,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';
import Link from 'next/link';

const steps = [
  { id: 1, label: 'Choose Loan' },
  { id: 2, label: 'Review Documents' },
  { id: 3, label: 'Confirm Data' },
  { id: 4, label: 'Application Submitted' },
];

const loanTypes = [
  {
    id: 'personal',
    name: 'Personal Loan',
    description: 'Flexible loan for your personal needs',
    features: ['Interest from 4.99%', 'Term up to 84 months', 'Extra payments possible'],
    minAmount: 1000,
    maxAmount: 50000,
  },
  {
    id: 'home',
    name: 'Home Loan',
    description: 'Secure home financing with low interest rates',
    features: ['Interest from 3.49%', 'Term up to 30 years', 'Fixed interest rate up to 30 years'],
    minAmount: 50000,
    maxAmount: 1000000,
  },
];

type VerificationStep = 'none' | 'both' | 'complete' | 'submitted';

export default function BankLoanPage() {
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('60');
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('none');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [pidData, setPidData] = useState<Record<string, unknown> | null>(null);
  const [taxData, setTaxData] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<Record<string, unknown> | null>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const handleLoanSelect = (loanId: string) => {
    setSelectedLoan(loanId);
    const loan = loanTypes.find(l => l.id === loanId);
    if (loan) {
      setLoanAmount(loan.minAmount.toString());
    }
    setVerificationStep('none');
    setQrCodeUrl('');
    setSessionId('');
    setError('');
    setVerificationStatus('');
    setPidData(null);
    setTaxData(null);
    setRawResponse(null);
    setShowRawResponse(false);
  };

  // Extract credential data from verification response
  const extractCredentialData = (session: unknown): { pid: Record<string, unknown> | null; tax: Record<string, unknown> | null } => {
    const results = session as { presented_credentials?: { pid: Array<{ credentialData: Record<string, unknown> }>; tax: Array<{ credentialData: Record<string, unknown> }> } } | undefined;
    let pid: Record<string, unknown> | null = null;
    let tax: Record<string, unknown> | null = null;

    if (results?.presented_credentials) {
      pid = results.presented_credentials.pid[0].credentialData['eu.europa.ec.eudi.pid.1'] as Record<string, unknown>;
      tax = results.presented_credentials.tax[0].credentialData;
      delete tax['iss'];
      delete tax['cnf'];
      delete tax['vct'];
    }

    return { pid, tax };
  };

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError('');
    setVerificationStep('both');

    try {
      // Request both PID and Tax credentials in a single verification session
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: [
            {
              type: 'pid',
              claims: [
                { path: ['family_name'], intent_to_retain: true },
                { path: ['given_name'], intent_to_retain: true },
                { path: ['birth_date'], intent_to_retain: true },
                { path: ['nationality'], intent_to_retain: true },
              ],
            },
            {
              type: 'tax',
              claims: [
                { path: ['tax_id'], intent_to_retain: true },
                { path: ['annual_income'], intent_to_retain: true },
                { path: ['tax_class'], intent_to_retain: true },
                { path: ['employer_name'], intent_to_retain: true },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error starting verification');
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

  // Poll for verification status
  useEffect(() => {
    if (!sessionId || verificationStatus === 'SUCCESSFUL') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/verify?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setVerificationStatus(data.session.status);
          
          if (data.session.status === 'SUCCESSFUL' && data.session.presented_credentials) {
            // Store raw response for debugging
            setRawResponse(data);

            // Extract both PID and Tax data from the multi-credential response
            const { pid, tax } = extractCredentialData(data.session);

            if (pid) setPidData(pid);
            if (tax) setTaxData(tax);

            // Move to complete step if we have both credentials
            if (pid && tax) {
              setVerificationStep('complete');
              setQrCodeUrl('');
              setSessionId('');
              setVerificationStatus('');
            }
            clearInterval(interval);
          }
          
          if (data.session.status === 'FAILED' || data.session.status === 'ERROR') {
            setError(data.session.error || 'Verification failed');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, verificationStatus, verificationStep]);

  const handleComplete = () => {
    setVerificationStep('submitted');
  };

  const handleReset = () => {
    setSelectedLoan(null);
    setLoanAmount('');
    setLoanTerm('60');
    setVerificationStep('none');
    setQrCodeUrl('');
    setSessionId('');
    setError('');
    setVerificationStatus('');
    setPidData(null);
    setTaxData(null);
    setRawResponse(null);
    setShowRawResponse(false);
  };

  const selectedLoanData = loanTypes.find(l => l.id === selectedLoan);
  
  const getCurrentStepNumber = () => {
    if (verificationStep === 'submitted') return 4;
    if (pidData && taxData) return 3;
    if (qrCodeUrl) return 2;
    return 1;
  };
  
  const currentStep = getCurrentStepNumber();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F5F5F5] via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-brand-light"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand">Apply for Loan</h1>
              <p className="text-muted-foreground">
                Apply for your loan securely with PID and tax certificate
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                      currentStep >= step.id
                        ? 'border-brand bg-brand text-white'
                        : 'border-muted-foreground/20 bg-background text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.id ? 'text-brand' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      currentStep > step.id ? 'bg-brand' : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Loan Type */}
        {!qrCodeUrl && verificationStep !== 'complete' && verificationStep !== 'submitted' && (
          <Card className="mb-6 border-brand/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge
                  variant={currentStep >= 1 ? "default" : "secondary"}
                  className={currentStep >= 1 ? "bg-brand" : ""}
                >
                  Step 1
                </Badge>
                <CardTitle className="text-xl text-brand">Choose Loan</CardTitle>
              </div>
              <CardDescription>
                Choose the loan that best suits you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {loanTypes.map((loan) => (
                  <button
                    key={loan.id}
                    onClick={() => handleLoanSelect(loan.id)}
                    className={`group rounded-xl border-2 p-6 text-left transition-all ${
                      selectedLoan === loan.id
                        ? 'border-brand bg-brand/5'
                        : 'border-brand/20 bg-card hover:border-brand/40'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold text-brand">{loan.name}</span>
                      {selectedLoan === loan.id && (
                        <CheckCircle2 className="h-5 w-5 text-brand" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{loan.description}</p>
                    <ul className="space-y-1 mb-3">
                      {loan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Amount: {loan.minAmount.toLocaleString()} € - {loan.maxAmount.toLocaleString()} €
                    </p>
                  </button>
                ))}
              </div>

              {selectedLoan && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-brand flex items-center gap-2">
                        <Euro className="h-4 w-4 text-brand-light" />
                        Loan Amount
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min={selectedLoanData?.minAmount}
                        max={selectedLoanData?.maxAmount}
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="border-brand/20 focus:border-brand focus:ring-brand"
                      />
                      <p className="text-xs text-muted-foreground">
                        Min: {selectedLoanData?.minAmount.toLocaleString()} €, Max: {selectedLoanData?.maxAmount.toLocaleString()} €
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="term" className="text-brand flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-light" />
                        Term (Months)
                      </Label>
                      <Input
                        id="term"
                        type="number"
                        min="12"
                        max="360"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(e.target.value)}
                        className="border-brand/20 focus:border-brand focus:ring-brand"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleStartVerification()}
                      disabled={isLoading || !loanAmount}
                      size="lg"
                      className="bg-brand hover:bg-brand/90"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Starting...
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <ShieldCheck className="mr-2 h-5 w-5" />
                          Apply with Documents
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: QR Code for Verification */}
        {qrCodeUrl && verificationStep !== 'complete' && verificationStep !== 'submitted' && (
          <Card className="mb-6 border-brand/30 bg-brand/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Waiting for Scan
                </Badge>
                <CardTitle className="text-xl text-brand">
                  Present Documents
                </CardTitle>
              </div>
              <CardDescription>
                Open your EUDI Wallet and scan this QR code to present your ID card and tax certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode
                value={qrCodeUrl}
                action="present"
              />
              
              {verificationStatus && verificationStatus !== 'SUCCESSFUL' && (
                <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Waiting for verification...</span>
                </div>
              )}

              {(pidData || taxData) && (
                <div className="mt-6 w-full rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      {pidData && taxData ? 'Both documents verified' : 'One document verified'}
                    </span>
                  </div>
                  <p className="text-sm text-green-600">
                    {pidData && `${String(pidData.given_name || '')} ${String(pidData.family_name || '')} - `}
                    {pidData && taxData
                      ? 'All required documents have been successfully verified.'
                      : pidData && !taxData
                        ? 'Waiting for tax certificate...'
                        : 'Waiting for ID card...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 3: Confirm Data */}
        {verificationStep === 'complete' && (
          <Card className="mb-6 border-green-500/30 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
                <CardTitle className="text-xl text-brand">Confirm Data</CardTitle>
              </div>
              <CardDescription>
                All documents have been successfully verified. Please review your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Loan Details */}
              <div className="rounded-lg bg-background p-4 border mb-4">
                <h4 className="font-medium text-brand mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-light" />
                  Loan Details
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Type:</span>
                    <span className="font-medium">{selectedLoanData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{parseInt(loanAmount).toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-medium">{loanTerm} months</span>
                  </div>
                </div>
              </div>

              {/* Verified PID Data */}
              {pidData && (
                <div className="rounded-lg bg-background p-4 border mb-4">
                  <h4 className="font-medium text-brand mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand-light" />
                    Verified ID Card (PID)
                  </h4>
                  <div className="grid gap-2 text-sm">
                    {Object.entries(pidData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Tax Data */}
              {taxData && (
                <div className="rounded-lg bg-background p-4 border mb-6">
                  <h4 className="font-medium text-brand mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand" />
                    Verified Tax Certificate
                  </h4>
                  <div className="grid gap-2 text-sm">
                    {Object.entries(taxData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Response Dropdown */}
              {rawResponse && (
                <div className="rounded-lg bg-background border mb-6 overflow-hidden">
                  <button
                    onClick={() => setShowRawResponse(!showRawResponse)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-brand" />
                      <span className="font-medium text-brand">Verification Raw Data</span>
                    </div>
                    {showRawResponse ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showRawResponse && (
                    <div className="border-t p-4">
                      <pre className="text-xs text-muted-foreground overflow-auto max-h-96 bg-muted p-3 rounded">
                        {JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <Separator className="my-6" />

              <div className="flex justify-center">
                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="bg-brand hover:bg-brand/90"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Submit Loan Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {verificationStep === 'submitted' && (
          <Card className="mb-6 border-green-500/30 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-brand">Application Submitted Successfully!</CardTitle>
              <CardDescription>
                Your loan application has been successfully submitted. We will review your documents and get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-background p-6 border mb-6">
                <h4 className="font-medium text-brand mb-4">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Type:</span>
                    <span className="font-medium">{selectedLoanData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{parseInt(loanAmount).toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-medium">{loanTerm} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified with:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      EUDI Wallet (PID + Tax)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link href="/">
                  <Button variant="outline" className="border-brand text-brand hover:bg-brand/10">
                    Back to Home
                  </Button>
                </Link>
                <Button
                  onClick={handleReset}
                  className="bg-brand hover:bg-brand/90"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Submit Another Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
