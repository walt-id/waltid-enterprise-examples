'use client';

import { useState } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { pidDefaultValues, pidFields } from '@/lib/schemas/pid';
import { mdlDefaultValues, mdlFields } from '@/lib/schemas/mdl';
import { taxCredentialDefaultValues, taxCredentialFields } from '@/lib/schemas/tax';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Fingerprint, 
  FileText,
  Car,
  QrCode, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Landmark,
  KeyRound,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { paymentAccountDefaultValues, paymentAccountFields } from '@/lib/schemas/payment_account';

type CredentialType = 'pid' | 'mdl' | 'tax' | 'payment_account' | null;
type FlowType = 'pre-auth-code' | 'auth-code' | null;

const steps = [
  { id: 1, label: 'Choose ID' },
  { id: 2, label: 'Choose Flow' },
  { id: 3, label: 'Enter Data' },
  { id: 4, label: 'Scan QR Code' },
];

export default function BankDemoIssuePage() {
  const [selectedCredential, setSelectedCredential] = useState<CredentialType>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(null);
  const [useTxCode, setUseTxCode] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [txCodeValue, setTxCodeValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const getCredentialConfig = (type: CredentialType) => {
    switch (type) {
      case 'pid':
        return {
          id: 'eu.europa.ec.eudi.pid.1',
          doctype: 'eu.europa.ec.eudi.pid.1',
          defaultValues: pidDefaultValues,
          fields: pidFields,
          title: 'ID Card (PID)',
          description: 'Federal Republic of Germany',
          icon: Fingerprint,
        };
      case 'mdl':
        return {
          id: 'org.iso.18013.5.1.mDL',
          doctype: 'org.iso.18013.5.1.mDL',
          defaultValues: mdlDefaultValues,
          fields: mdlFields,
          title: 'Driving Licence (MDL)',
          description: 'Mobile Driving Licence',
          icon: Car,
        };
      case 'tax':
        return {
          id: 'de.bundestag.tax.1',
          doctype: 'de.bundestag.tax.1',
          defaultValues: taxCredentialDefaultValues,
          fields: taxCredentialFields,
          title: 'Tax Certificate',
          description: 'Berlin Tax Office',
          icon: FileText,
        };
      case 'payment_account':
        return {
          id: 'org.waltid.payment-account.1',
          vct: '',
          defaultValues: paymentAccountDefaultValues,
          fields: paymentAccountFields,
          title: 'Payment Account',
          description: 'Payment Account',
          icon: CreditCard,
        };
      default:
        return null;
    }
  };

  const handleCredentialSelect = (type: CredentialType) => {
    setSelectedCredential(type);
    setQrCodeUrl('');
    setError('');
    
    // Tax credential only supports pre-auth-code flow
    if (type === 'tax') {
      setSelectedFlow('pre-auth-code');
    } else {
      setSelectedFlow(null);
    }
    
    const config = getCredentialConfig(type);
    if (config) {
      setFormData({ ...config.defaultValues });
    }
  };

  const handleFlowSelect = (flow: FlowType) => {
    setSelectedFlow(flow);
    setQrCodeUrl('');
    setError('');
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateQR = async () => {
    if (!selectedCredential || !selectedFlow) return;

    setIsLoading(true);
    setError('');

    try {
      const config = getCredentialConfig(selectedCredential);
      if (!config) return;

      const credentialData = formData as Record<string, unknown>;

      const response = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: selectedCredential,
          credentialData,
          flowType: selectedFlow,
          useTxCode: selectedFlow === 'pre-auth-code' ? useTxCode : false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generating QR code');
      }

      const data = await response.json();
      setQrCodeUrl(data.offerUrl);
      if (data.txCodeValue) {
        setTxCodeValue(data.txCodeValue);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCredential(null);
    setSelectedFlow(null);
    setUseTxCode(false);
    setFormData({});
    setQrCodeUrl('');
    setTxCodeValue('');
    setError('');
  };

  const config = getCredentialConfig(selectedCredential);
  const currentFields = config?.fields || [];
  const currentStep = qrCodeUrl ? 4 : selectedFlow ? 3 : selectedCredential ? 2 : 1;

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
            Back to homepage
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand">Load ID to Wallet</h1>
              <p className="text-muted-foreground">
                Load your ID card, driving licence, or tax certificate into your EUDI wallet
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

        {/* Step 1: Select Credential Type */}
        <Card className="mb-6 border-brand/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge 
                variant={currentStep >= 1 ? "default" : "secondary"}
                className={currentStep >= 1 ? "bg-brand" : ""}
              >
                Step 1
              </Badge>
              <CardTitle className="text-xl text-brand">Choose ID</CardTitle>
            </div>
            <CardDescription>
              Choose the ID you want to load into your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => handleCredentialSelect('pid')}
                className={`group rounded-xl border-2 p-6 text-left transition-all ${
                  selectedCredential === 'pid'
                    ? 'border-brand bg-brand/5'
                    : 'border-brand/20 bg-card hover:border-brand/40'
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    selectedCredential === 'pid' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                  }`}>
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-brand">ID Card (PID)</span>
                    {selectedCredential === 'pid' && (
                      <CheckCircle2 className="ml-2 inline h-4 w-4 text-brand" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Digital ID card of the Federal Republic of Germany
                </p>
              </button>

              <button
                onClick={() => handleCredentialSelect('mdl')}
                className={`group rounded-xl border-2 p-6 text-left transition-all ${
                  selectedCredential === 'mdl'
                    ? 'border-brand bg-brand/5'
                    : 'border-brand/20 bg-card hover:border-brand/40'
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    selectedCredential === 'mdl' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                  }`}>
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-brand">Driving Licence (MDL)</span>
                    {selectedCredential === 'mdl' && (
                      <CheckCircle2 className="ml-2 inline h-4 w-4 text-brand" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mobile driving licence for your EUDI wallet
                </p>
              </button>

              <button
                onClick={() => handleCredentialSelect('tax')}
                className={`group rounded-xl border-2 p-6 text-left transition-all ${
                  selectedCredential === 'tax'
                    ? 'border-brand bg-brand/5'
                    : 'border-brand/20 bg-card hover:border-brand/40'
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    selectedCredential === 'tax' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                  }`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-brand">Tax Certificate</span>
                    {selectedCredential === 'tax' && (
                      <CheckCircle2 className="ml-2 inline h-4 w-4 text-brand" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Digital tax certificate from the tax office
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Flow Type */}
        {selectedCredential && selectedCredential !== 'tax' && (
          <Card className="mb-6 border-brand/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentStep >= 2 ? "default" : "secondary"}
                  className={currentStep >= 2 ? "bg-brand" : ""}
                >
                Step 2
              </Badge>
              <CardTitle className="text-xl text-brand">Choose Flow</CardTitle>
            </div>
            <CardDescription>
              Choose how the ID should be issued
            </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handleFlowSelect('pre-auth-code')}
                  className={`rounded-xl border-2 p-6 text-left transition-all ${
                    selectedFlow === 'pre-auth-code'
                      ? 'border-brand bg-brand/5'
                      : 'border-brand/20 bg-card hover:border-brand/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-brand">Pre-Authorization Code</span>
                    {selectedFlow === 'pre-auth-code' && (
                      <CheckCircle2 className="h-5 w-5 text-brand" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Wallet scans QR code to receive ID
                  </p>
                  {selectedFlow === 'pre-auth-code' && (
                    <div 
                      className="mt-4 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="useTxCode"
                        checked={useTxCode}
                        onCheckedChange={(checked) => setUseTxCode(checked as boolean)}
                      />
                      <label
                        htmlFor="useTxCode"
                        className="text-sm font-medium text-brand cursor-pointer flex items-center gap-2"
                      >
                        <KeyRound className="h-4 w-4" />
                        Use Transaction Code (PIN)
                      </label>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleFlowSelect('auth-code')}
                  className={`rounded-xl border-2 p-6 text-left transition-all ${
                    selectedFlow === 'auth-code'
                      ? 'border-brand bg-brand/5'
                      : 'border-brand/20 bg-card hover:border-brand/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-brand">Authorization Code</span>
                    {selectedFlow === 'auth-code' && (
                      <CheckCircle2 className="h-5 w-5 text-brand" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User authenticates before receiving ID
                  </p>
                  {selectedFlow === 'auth-code' && (
                    <div className="mt-4 rounded-lg bg-brand/5 p-3 border border-brand/20">
                      <p className="text-sm font-medium text-brand mb-2">Login credentials:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Username:</span>
                          <code className="rounded bg-background px-2 py-0.5 text-brand font-mono">{process.env.NEXT_PUBLIC_DEMO_USERNAME || 'user@example.com'}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Password:</span>
                          <code className="rounded bg-background px-2 py-0.5 text-brand font-mono">{process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'password123'}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tax Credential Flow Info (Pre-auth only) */}
        {selectedCredential === 'tax' && (
          <Card className="mb-6 border-brand/20 bg-brand/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Automatic
                </Badge>
                <CardTitle className="text-xl text-brand">Flow</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The tax certificate is issued using the <strong>Pre-Authorization Code</strong> flow.
                The Authorization Code flow is not available for this ID.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Configure Credential Data */}
        {selectedCredential && selectedFlow && (
          <Card className="mb-6 border-brand/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentStep >= 3 ? "default" : "secondary"}
                  className={currentStep >= 3 ? "bg-brand" : ""}
                >
                Step 3
              </Badge>
              <CardTitle className="text-xl text-brand">Enter Data</CardTitle>
            </div>
            <CardDescription>
              Customize the ID data before issuance
            </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {currentFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-brand">
                      {field.label}
                      {field.required && <span className="text-brand">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={String(formData[field.key] ?? '')}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="border-brand/20 focus:border-brand focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
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

        {/* Generate QR Button */}
        {selectedCredential && selectedFlow && !qrCodeUrl && (
          <div className="mb-8 flex justify-center">
            <Button
              onClick={handleGenerateQR}
              disabled={isLoading}
              size="lg"
              className="bg-brand hover:bg-brand/90"
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating QR code...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <QrCode className="mr-2 h-5 w-5" />
                  Generate QR code
                </span>
              )}
            </Button>
          </div>
        )}

        {/* QR Code Display */}
        {qrCodeUrl && (
          <Card className="mb-6 border-brand/30 bg-brand/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
                <CardTitle className="text-xl text-brand">Scan with EUDI Wallet</CardTitle>
            </div>
            <CardDescription>
              Open your EUDI Wallet app and scan this QR code to receive the ID
            </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode
                value={qrCodeUrl}
              />
              
              {txCodeValue && (
                <div className="mt-6 w-full max-w-sm">
                  <div className="rounded-xl border-2 border-brand bg-white p-6 text-center shadow-lg">
                    <div className="mb-2 flex items-center justify-center gap-2 text-brand">
                      <KeyRound className="h-5 w-5" />
                      <span className="font-semibold">Transaction Code (PIN)</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter this code in your wallet when prompted
                    </p>
                    <div className="font-mono text-4xl font-bold tracking-[0.5em] text-brand">
                      {txCodeValue}
                    </div>
                  </div>
                </div>
              )}
              
              <Separator className="my-6" />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-brand text-brand hover:bg-brand/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Load another ID
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
