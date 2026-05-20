'use client';

import { useState } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  BadgeCheck,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

import { departments, credentialTypes, DepartmentId } from '@/lib/config';
import { getCredentialRegistryEntry } from '@/lib/credentials/registry';

type CredentialTypeKey = keyof typeof credentialTypes | null;
type FlowType = 'pre-auth-code' | 'auth-code' | null;

const steps = [
  { id: 1, label: 'Department' },
  { id: 2, label: 'Credential' },
  { id: 3, label: 'Flow' },
  { id: 4, label: 'Data' },
  { id: 5, label: 'QR Code' },
];

const departmentIcons: Record<DepartmentId, React.ElementType> = {
  hr: Users,
  identity: FileText,
  revenue: Receipt,
  finance: CreditCard,
  untrusted: Building2,
};

export default function IssuePage() {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentId | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<CredentialTypeKey>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowType>('pre-auth-code');
  const [useTxCode, setUseTxCode] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [txCodeValue, setTxCodeValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDepartmentSelect = (deptId: DepartmentId) => {
    setSelectedDepartment(deptId);
    setSelectedCredential(null);
    setFormData({});
    setQrCodeUrl('');
    setError('');
  };

  const handleCredentialSelect = (credKey: string) => {
    setSelectedCredential(credKey as CredentialTypeKey);
    setQrCodeUrl('');
    setError('');
    
    // Reset flow selection - trusted employee_status supports both flows, others default to pre-auth
    if (credKey === 'employee_status') {
      setSelectedFlow(null);
    } else {
      setSelectedFlow('pre-auth-code');
    }
    
    const entry = getCredentialRegistryEntry(credKey);
    if (entry) {
      setFormData({ ...entry.schema.defaultValues });
    }
  };

  const handleFlowSelect = (flow: FlowType) => {
    setSelectedFlow(flow);
    setQrCodeUrl('');
    setTxCodeValue('');
    setError('');
    setUseTxCode(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateQR = async () => {
    if (!selectedCredential || !selectedFlow) return;

    setIsLoading(true);
    setError('');
    setTxCodeValue('');

    try {
      // For auth-code flow, don't send credential data (it comes from user auth)
      const shouldSendData = selectedFlow === 'pre-auth-code';
      
      const response = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: selectedCredential,
          credentialData: shouldSendData ? formData : undefined,
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
    setSelectedDepartment(null);
    setSelectedCredential(null);
    setSelectedFlow(null);
    setUseTxCode(false);
    setFormData({});
    setQrCodeUrl('');
    setTxCodeValue('');
    setError('');
  };

  // Check if credential supports auth-code flow (only jwt_vc_json credentials)
  const supportsAuthCodeFlow = selectedCredential === 'employee_status';
  
  // Auth-code flow skips data entry step
  const showDataEntryStep = selectedFlow === 'pre-auth-code' || !supportsAuthCodeFlow;
  
  // Calculate current step based on state
  const getCurrentStep = () => {
    if (qrCodeUrl) return 5;
    // For auth-code flow, skip data entry step (go from flow selection to QR)
    if (selectedFlow === 'auth-code' && supportsAuthCodeFlow) return 5;
    if (selectedFlow && selectedCredential && showDataEntryStep) return 4;
    if (selectedCredential && supportsAuthCodeFlow && !selectedFlow) return 3;
    if (selectedCredential && !supportsAuthCodeFlow) return 4; // Skip flow step
    if (selectedDepartment) return 2;
    return 1;
  };
  const currentStep = getCurrentStep();
  
  const availableCredentials = selectedDepartment 
    ? Object.entries(credentialTypes).filter(([, config]) => config.department === selectedDepartment)
    : [];

  const currentRegistryEntry = selectedCredential ? getCredentialRegistryEntry(selectedCredential) : null;

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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-primary text-white">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gov-primary">Issue Credentials</h1>
              <p className="text-muted-foreground">
                Select a department and credential type to issue to your wallet
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
                        ? 'border-gov-primary bg-gov-primary text-white'
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
                      currentStep >= step.id ? 'text-gov-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      currentStep > step.id ? 'bg-gov-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Department */}
        <Card className="mb-6 border-gov-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge 
                variant={currentStep >= 1 ? "default" : "secondary"}
                className={currentStep >= 1 ? "bg-gov-primary" : ""}
              >
                Step 1
              </Badge>
              <CardTitle className="text-xl text-gov-primary">Select Department</CardTitle>
            </div>
            <CardDescription>
              Choose the government department to issue credentials from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.entries(departments) as [DepartmentId, typeof departments.hr][]).map(([deptId, dept]) => {
                const Icon = departmentIcons[deptId];
                return (
                  <button
                    key={deptId}
                    onClick={() => handleDepartmentSelect(deptId)}
                    className={`group rounded-xl border-2 p-6 text-left transition-all ${
                      selectedDepartment === deptId
                        ? 'border-gov-primary bg-gov-primary/5'
                        : 'border-gov-primary/20 bg-card hover:border-gov-primary/40'
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        selectedDepartment === deptId ? 'bg-gov-primary text-white' : 'bg-gov-primary/10 text-gov-primary'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="font-semibold text-gov-primary">{dept.name}</span>
                        {selectedDepartment === deptId && (
                          <CheckCircle2 className="ml-2 inline h-4 w-4 text-gov-primary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dept.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Credential Type */}
        {selectedDepartment && (
          <Card className="mb-6 border-gov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentStep >= 2 ? "default" : "secondary"}
                  className={currentStep >= 2 ? "bg-gov-primary" : ""}
                >
                  Step 2
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Select Credential</CardTitle>
              </div>
              <CardDescription>
                Choose the type of credential to issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {availableCredentials.map(([credKey, credConfig]) => (
                  <button
                    key={credKey}
                    onClick={() => handleCredentialSelect(credKey)}
                    className={`rounded-xl border-2 p-6 text-left transition-all ${
                      selectedCredential === credKey
                        ? 'border-gov-primary bg-gov-primary/5'
                        : 'border-gov-primary/20 bg-card hover:border-gov-primary/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-gov-primary">{credConfig.name}</span>
                      {selectedCredential === credKey && (
                        <CheckCircle2 className="h-5 w-5 text-gov-primary" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {credConfig.format}
                      </Badge>
                      {credConfig.department === 'untrusted' ? (
                        <Badge variant="destructive" className="text-xs">
                          Not in trust registry
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600 text-xs">
                          In trust registry
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Flow Type (only for employee_status) */}
        {selectedCredential === 'employee_status' && (
          <Card className="mb-6 border-gov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentStep >= 3 ? "default" : "secondary"}
                  className={currentStep >= 3 ? "bg-gov-primary" : ""}
                >
                  Step 3
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Choose Flow</CardTitle>
              </div>
              <CardDescription>
                Choose how the credential should be issued
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handleFlowSelect('pre-auth-code')}
                  className={`rounded-xl border-2 p-6 text-left transition-all ${
                    selectedFlow === 'pre-auth-code'
                      ? 'border-gov-primary bg-gov-primary/5'
                      : 'border-gov-primary/20 bg-card hover:border-gov-primary/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-gov-primary">Pre-Authorization Code</span>
                    {selectedFlow === 'pre-auth-code' && (
                      <CheckCircle2 className="h-5 w-5 text-gov-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Wallet scans QR code to receive credential
                  </p>
                  {selectedFlow === 'pre-auth-code' && (
                    <div 
                      className="mt-4 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="useTxCodeFlow"
                        checked={useTxCode}
                        onCheckedChange={(checked) => setUseTxCode(checked as boolean)}
                      />
                      <label
                        htmlFor="useTxCodeFlow"
                        className="text-sm font-medium text-gov-primary cursor-pointer flex items-center gap-2"
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
                      ? 'border-gov-primary bg-gov-primary/5'
                      : 'border-gov-primary/20 bg-card hover:border-gov-primary/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-gov-primary">Authorization Code</span>
                    {selectedFlow === 'auth-code' && (
                      <CheckCircle2 className="h-5 w-5 text-gov-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User authenticates before receiving credential
                  </p>
                  {selectedFlow === 'auth-code' && (
                    <div className="mt-4 rounded-lg bg-gov-primary/5 p-3 border border-gov-primary/20">
                      <p className="text-sm font-medium text-gov-primary mb-2">Login credentials:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Username:</span>
                          <code className="rounded bg-background px-2 py-0.5 text-gov-primary font-mono">{process.env.NEXT_PUBLIC_DEMO_USERNAME || 'user@example.com'}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Password:</span>
                          <code className="rounded bg-background px-2 py-0.5 text-gov-primary font-mono">{process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'password123'}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Configure Credential Data (only for pre-auth flow) */}
        {selectedCredential && currentRegistryEntry && showDataEntryStep && (supportsAuthCodeFlow ? selectedFlow === 'pre-auth-code' : true) && (
          <Card className="mb-6 border-gov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentStep >= 4 ? "default" : "secondary"}
                  className={currentStep >= 4 ? "bg-gov-primary" : ""}
                >
                  Step {supportsAuthCodeFlow ? '4' : '3'}
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Enter Data</CardTitle>
              </div>
              <CardDescription>
                Customize the credential data before issuance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {currentRegistryEntry.schema.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-gov-primary">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={String(formData[field.key] ?? '')}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="border-gov-primary/20 focus:border-gov-primary focus:ring-gov-primary"
                    />
                  </div>
                ))}
              </div>
              
              {/* Transaction Code Option - only for pre-auth flow on non-employee_status credentials */}
              {selectedFlow === 'pre-auth-code' && !supportsAuthCodeFlow && (
                <div className="mt-6 pt-4 border-t border-gov-primary/10">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="useTxCode"
                      checked={useTxCode}
                      onCheckedChange={(checked) => setUseTxCode(checked as boolean)}
                    />
                    <label
                      htmlFor="useTxCode"
                      className="text-sm font-medium text-gov-primary cursor-pointer flex items-center gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      Use Transaction Code (PIN)
                    </label>
                  </div>
                  <p className="mt-1 ml-6 text-xs text-muted-foreground">
                    Requires the user to enter a PIN code when claiming the credential
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

        {/* Generate QR Button */}
        {selectedCredential && selectedFlow && !qrCodeUrl && (
          <div className="mb-8 flex justify-center">
            <Button
              onClick={handleGenerateQR}
              disabled={isLoading}
              size="lg"
              className="bg-gov-primary hover:bg-gov-primary/90"
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
          <Card className="mb-6 border-gov-primary/30 bg-gov-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Scan with Wallet</CardTitle>
              </div>
              <CardDescription>
                Open your Wallet app and scan this QR code to receive the credential
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={qrCodeUrl} />
              
              {txCodeValue && (
                <div className="mt-6 w-full max-w-sm">
                  <div className="rounded-xl border-2 border-gov-primary bg-white p-6 text-center shadow-lg">
                    <div className="mb-2 flex items-center justify-center gap-2 text-gov-primary">
                      <KeyRound className="h-5 w-5" />
                      <span className="font-semibold">Transaction Code (PIN)</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter this code in your wallet when prompted
                    </p>
                    <div className="font-mono text-4xl font-bold tracking-[0.5em] text-gov-primary">
                      {txCodeValue}
                    </div>
                  </div>
                </div>
              )}
              
              <Separator className="my-6" />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gov-primary text-gov-primary hover:bg-gov-primary/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Issue another credential
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
