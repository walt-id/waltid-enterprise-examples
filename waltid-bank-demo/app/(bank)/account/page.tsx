'use client';

import { useState, useEffect, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Landmark, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Home,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { OpenIdCardMetadata, verifierCard } from '@/lib/config';

const steps = [
  { id: 1, label: 'Choose Account' },
  { id: 2, label: 'Verify PID' },
  { id: 3, label: 'Confirm Data' },
  { id: 4, label: 'Account Opened' },
];

const accountTypes = [
  {
    id: 'giro',
    name: 'Current Account',
    description: 'The classic current account for your everyday needs',
    features: ['Free debit card', 'Online banking', 'Banking App'],
    monthlyFee: '0.00 €',
  },
  {
    id: 'premium',
    name: 'Premium Account',
    description: 'More benefits for higher demands',
    features: ['Premium credit card', 'Travel insurance', 'Priority service'],
    monthlyFee: '9.90 €',
  },
];

function MetadataLogo({
  metadata,
  fallback: Fallback,
}: {
  metadata?: OpenIdCardMetadata;
  fallback: ElementType;
}) {
  if (metadata?.logoUri) {
    return (
      <span
        aria-label={metadata.logoAltText || metadata.name || 'OpenID metadata logo'}
        role="img"
        className="h-6 w-6 rounded bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${metadata.logoUri})` }}
      />
    );
  }

  return <Fallback className="h-6 w-6" />;
}

export default function BankAccountPage() {
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [signedRequest, setSignedRequest] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [presentedData, setPresentedData] = useState<Record<string, unknown> | null>(null);
  const [verifierMetadata, setVerifierMetadata] = useState<OpenIdCardMetadata>({});
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
    setQrCodeUrl('');
    setSessionId('');
    setError('');
    setVerificationStatus('');
    setPresentedData(null);
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/verifiers/metadata')
      .then(response => (response.ok ? response.json() : undefined))
      .then(data => {
        if (cancelled || !Array.isArray(data?.verifiers)) return;
        setVerifierMetadata(data.verifiers[0]?.metadata || {});
      })
      .catch(() => {
        // Metadata is optional; verifier UI renders static fallbacks.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: 'pid',
          claims: [
            { path: ['family_name'], intent_to_retain: true },
            { path: ['given_name'], intent_to_retain: true },
            { path: ['birth_date'], intent_to_retain: true },
            { path: ['nationality'], intent_to_retain: true },
          ],
          signedRequest,
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
          
          if (data.session.status === 'SUCCESSFUL' && data.session.policy_results?.vc_policies?.length > 0) {
            const verifiedData = data.session.policy_results.vc_policies[0].result.verified_data as Record<string, unknown>;
            const docType = verifiedData.docType as string;
            const credentialFields = (docType && verifiedData[docType] as Record<string, unknown>) || verifiedData;
            setPresentedData(credentialFields);
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
  }, [sessionId, verificationStatus]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    const firstName = (presentedData?.given_name as string) || '';
    const lastName = (presentedData?.family_name as string) || '';
    const params = new URLSearchParams({ firstName, lastName });
    router.push(`/overview?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedAccount(null);
    setQrCodeUrl('');
    setSessionId('');
    setError('');
    setVerificationStatus('');
    setPresentedData(null);
    setFormData({
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    });
  };

  const selectedAccountData = accountTypes.find(a => a.id === selectedAccount);
  const currentStep = verificationStatus === 'COMPLETED' ? 4 : presentedData ? 3 : qrCodeUrl ? 2 : 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F5F5F5] via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand">Open Account</h1>
              <p className="text-muted-foreground">
                Open your account securely with your digital ID card
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

        {/* Step 1: Select Account Type */}
        {!qrCodeUrl && !presentedData && verificationStatus !== 'COMPLETED' && (
          <Card className="mb-6 border-brand/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge
                  variant={currentStep >= 1 ? "default" : "secondary"}
                  className={currentStep >= 1 ? "bg-brand" : ""}
                >
                  Step 1
                </Badge>
                <CardTitle className="text-xl text-brand">Choose Account</CardTitle>
              </div>
              <CardDescription>
                Choose the account that best suits you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {accountTypes.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account.id)}
                    className={`group rounded-xl border-2 p-6 text-left transition-all ${
                      selectedAccount === account.id
                        ? 'border-brand bg-brand/5'
                        : 'border-brand/20 bg-card hover:border-brand/40'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold text-brand">{account.name}</span>
                      {selectedAccount === account.id && (
                        <CheckCircle2 className="h-5 w-5 text-brand" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{account.description}</p>
                    <ul className="space-y-1 mb-3">
                      {account.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-medium text-brand">
                      {account.monthlyFee} <span className="text-xs text-muted-foreground font-normal">/ month</span>
                    </p>
                  </button>
                ))}
              </div>

              {selectedAccount && (
                <div className="mt-6 space-y-4">
                  {/* Signed Request Option */}
                  <div className="flex items-center gap-3 rounded-lg border border-brand/20 p-4">
                    <Checkbox
                      id="signed-request"
                      checked={signedRequest}
                      onCheckedChange={(checked) => setSignedRequest(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="signed-request" className="font-medium text-brand cursor-pointer">
                        Use Signed Request
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable JAR (JWT-Secured Authorization Request) for the verification request
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleStartVerification}
                      disabled={isLoading}
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
                          Verify with {verifierMetadata.name || verifierCard.fallbackTitle}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: QR Code for PID Verification */}
        {qrCodeUrl && !presentedData && (
          <Card className="mb-6 border-brand/30 bg-brand/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Waiting for scan
                </Badge>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <MetadataLogo metadata={verifierMetadata} fallback={ShieldCheck} />
                </div>
                <CardTitle className="text-xl text-brand">
                  {verifierMetadata.name || verifierCard.fallbackTitle}
                </CardTitle>
              </div>
              <CardDescription>
                {verifierMetadata.description || verifierCard.fallbackDescription}
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
        {presentedData && verificationStatus !== 'COMPLETED' && (
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
                Your identity has been successfully verified. Please add your contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Verified PID Data */}
              <div className="rounded-lg bg-background p-4 border mb-6">
                <h4 className="font-medium text-brand mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-brand" />
                  Verified Identity Data
                </h4>
                <div className="grid gap-2 text-sm">
                  {Object.entries(presentedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Data Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-brand flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-brand/20 focus:border-brand focus:ring-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-brand flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="border-brand/20 focus:border-brand focus:ring-brand"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-brand flex items-center gap-2">
                    <Home className="h-4 w-4 text-brand" />
                    Street and House Number
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Main Street 123"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="border-brand/20 focus:border-brand focus:ring-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-brand">Postal Code</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="12345"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="border-brand/20 focus:border-brand focus:ring-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-brand">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="border-brand/20 focus:border-brand focus:ring-brand"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-center">
                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="bg-brand hover:bg-brand/90"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Open Account
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {verificationStatus === 'COMPLETED' && (
          <Card className="mb-6 border-green-500/30 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-brand">Account successfully opened!</CardTitle>
              <CardDescription>
                Your {selectedAccountData?.name} has been successfully opened. You will receive a confirmation email shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-background p-6 border mb-6">
                <h4 className="font-medium text-brand mb-4">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account type:</span>
                    <span className="font-medium">{selectedAccountData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly fee:</span>
                    <span className="font-medium">{selectedAccountData?.monthlyFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified with:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      EUDI Wallet (PID)
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
                  Open Another Account
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
