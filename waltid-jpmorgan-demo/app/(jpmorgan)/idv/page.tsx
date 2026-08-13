'use client';

import { useState } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FlowStage = 'form' | 'biometric' | 'issued';

export default function IDVPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [flowStage, setFlowStage] = useState<FlowStage>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [offerId, setOfferId] = useState('');
  const [error, setError] = useState('');
  const [isFullVerification, setIsFullVerification] = useState(true);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, withGovId: boolean = true) => {
    e.preventDefault?.();
    setError('');
    setIsLoading(true);
    setFlowStage('biometric');
    setIsFullVerification(withGovId);

    // Simulate biometric scanning (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const credentialData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        idvComplete: withGovId,  // true if gov ID provided, false if skipped
      };

      const response = await fetch('/api/idv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialData),
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
      setError(err instanceof Error ? err.message : 'Verification failed');
      setFlowStage('form');
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

        {flowStage === 'form' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-jp-primary">Identity Verification</CardTitle>
              <CardDescription>
                Provide your identity information to complete verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-jp-primary/20 bg-jp-primary/5">
                <AlertCircle className="h-4 w-4 text-jp-primary" />
                <AlertDescription className="text-jp-primary/90">
                  Mock Government IDV - This is a demonstration of identity verification. In production, this would integrate with real IDV providers.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName" className="text-jp-primary">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    disabled={isLoading}
                    className="mt-2 border-jp-primary/20 focus:border-jp-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-jp-primary">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    disabled={isLoading}
                    className="mt-2 border-jp-primary/20 focus:border-jp-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-jp-primary">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={isLoading}
                    className="mt-2 border-jp-primary/20 focus:border-jp-primary"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading || !formData.firstName || !formData.lastName || !formData.dateOfBirth}
                  className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify with Government ID'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isLoading || !formData.firstName || !formData.lastName || !formData.dateOfBirth}
                  variant="outline"
                  className="w-full border-jp-primary/20 text-jp-primary hover:bg-jp-primary/5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue Without ID (Limited Access)'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {flowStage === 'biometric' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-jp-primary">Biometric Verification</CardTitle>
              <CardDescription>
                Scanning your identity document and face
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-12">
                {/* Passport Scanner Animation */}
                <div className="relative mb-8 w-64 h-80">
                  <div className="absolute inset-0 bg-gradient-to-br from-jp-primary/10 to-jp-accent/10 rounded-lg border-2 border-jp-primary/30" />

                  {/* Scanning Frame */}
                  <div className="absolute inset-4 flex items-center justify-center">
                    <svg className="w-32 h-40 text-jp-primary/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm2 2h14v10H5V7zm5 3h4v4h-4v-4z" />
                    </svg>
                  </div>

                  {/* Animated Scanning Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-jp-primary to-transparent"
                    style={{
                      top: '50%',
                      animation: 'scan 2s ease-in-out infinite'
                    }}
                  />
                </div>

                {/* Face Scanner Animation */}
                <div className="relative mb-8 w-40 h-40">
                  <div className="absolute inset-0 rounded-full border-4 border-jp-primary/30" />

                  {/* Face Circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-24 rounded-full border-2 border-jp-primary/50 relative">
                      <svg className="w-full h-full text-jp-primary/60" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="8" cy="9" r="1.5" />
                        <circle cx="16" cy="9" r="1.5" />
                        <path d="M12 16c-2 0-3-1-3-2h6c0 1-1 2-3 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Scanning Arc */}
                  <svg className="absolute inset-0 w-full h-full"
                    style={{
                      animation: 'rotate 3s linear infinite'
                    }}
                  >
                    <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-jp-primary/40" strokeDasharray="30 220" />
                  </svg>
                </div>

                <style jsx>{`
                  @keyframes scan {
                    0%, 100% { transform: translateY(-120px); opacity: 0; }
                    50% { opacity: 1; }
                  }
                  @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>

                <div className="text-center space-y-2">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-jp-primary" />
                  <p className="text-sm font-medium text-jp-primary">Verifying your identity...</p>
                  <p className="text-xs text-muted-foreground">Scanning passport and facial features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {flowStage === 'issued' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <CardTitle className="text-jp-primary">
                    {isFullVerification ? 'Identity Verified ✓' : 'Credential Created ✓'}
                  </CardTitle>
                  <CardDescription>
                    {isFullVerification
                      ? 'Full identity verification completed'
                      : 'Credential created (limited access - verification pending)'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFullVerification ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-900 mb-2">✓ Full Identity Verification</p>
                  <p className="text-sm text-green-800">
                    Your government ID has been verified. You now have full access to JPMorgan services. Your credential has been issued and is ready to be added to your wallet.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-900 mb-2">⏳ Limited Enrollment</p>
                  <p className="text-sm text-amber-800 mb-2">
                    Your credential has been created but government ID verification is pending. You will have limited access until you complete full identity verification.
                  </p>
                  <p className="text-xs text-amber-700">
                    You can log in and use MFA, but will need to complete government ID verification to unlock all features.
                  </p>
                </div>
              )}

              <div className="text-center">
                <p className="mb-4 text-sm text-muted-foreground">Scan this QR code with your wallet:</p>
                {qrCodeUrl && <InlineQRCode value={qrCodeUrl} />}
                <p className="mt-4 text-xs text-muted-foreground">Offer ID: {offerId}</p>
              </div>

              {isFullVerification ? (
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
                >
                  Proceed to Login
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
                  >
                    Proceed to Login (Limited Access)
                  </Button>
                  <Button
                    onClick={() => {
                      setFlowStage('form');
                      setQrCodeUrl('');
                      setOfferId('');
                      setError('');
                    }}
                    variant="outline"
                    className="w-full border-jp-primary/20 text-jp-primary hover:bg-jp-primary/5"
                  >
                    Start Over with Government ID
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
