'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AuthStatus = 'init' | 'loading' | 'qr-displayed' | 'verifying' | 'success' | 'failed';

export default function AuthenticatePage() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [idvComplete, setIdvComplete] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('loginEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
    setStatus('init');
  }, [router]);

  const startAuthentication = async () => {
    setError('');
    setStatus('loading');

    try {
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication setup failed');
      }

      const data = await response.json();
      setQrCodeUrl(data.bootstrapAuthorizationRequestUrl);
      setSessionId(data.sessionId);
      setStatus('qr-displayed');

      setTimeout(() => pollStatus(data.sessionId), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setStatus('init');
    }
  };

  const pollStatus = async (id: string) => {
    setStatus('verifying');
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      try {
        const response = await fetch(`/api/authenticate/status?sessionId=${id}`);

        if (!response.ok) {
          throw new Error('Status check failed');
        }

        const data = await response.json();
        console.log(`[Poll attempt ${attempts + 1}] Status: ${data.status}, IDV Complete: ${data.idvComplete}`);
        console.log('Full response data:', data);

        if (data.status === 'done' || data.status === 'SUCCESSFUL') {
          const idvVal = data.idvComplete;
          setIdvComplete(idvVal);
          console.log('✓ Verification complete');
          console.log('✓ IDV Complete claim value:', idvVal, `(type: ${typeof idvVal})`);

          sessionStorage.setItem('mfaVerified', 'true');

          if (idvVal === true) {
            console.log('✓ idvComplete is TRUE - Full verification granted');
            sessionStorage.setItem('idvComplete', 'true');
          } else {
            console.log('⏳ idvComplete is FALSE - Limited access granted');
            console.log('  User can still access dashboard but will see pending status');
            sessionStorage.setItem('idvComplete', 'false');
          }


          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
          setStatus('success');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 500);
        } else {
          setError('Verification timeout');
          setStatus('failed');
        }
      } catch (err) {
        console.error('Poll error:', err);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 500);
        } else {
          setError(err instanceof Error ? err.message : 'Verification failed');
          setStatus('failed');
        }
      }
    };

    poll();
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4efe7] to-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link href="/mfa" className="mb-6 inline-flex items-center gap-2 text-jp-primary hover:text-jp-accent">
            <ArrowLeft className="h-4 w-4" />
            Back to MFA Options
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-jp-primary/10">
              <CardTitle className="text-jp-primary">Wallet Verification</CardTitle>
              <CardDescription>
                Verify your identity using your wallet for {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* FIX 1: Removed duplicate 'loading' block that appeared before 'init' */}

              {status === 'init' && (
                  <>
                    <Alert className="border-jp-primary/20 bg-jp-primary/5">
                      <AlertCircle className="h-4 w-4 text-jp-primary" />
                      <AlertDescription className="text-jp-primary/90">
                        Scan the QR code below with your wallet to complete verification.
                      </AlertDescription>
                    </Alert>

                    <Button
                        onClick={startAuthentication}
                        className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
                    >
                      Start Verification
                    </Button>
                  </>
              )}

              {status === 'loading' && (
                  <div className="space-y-4 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-jp-primary" />
                    <p className="text-sm text-muted-foreground">Setting up verification...</p>
                    <p className="text-xs text-gray-400">This may take up to 30 seconds</p>
                  </div>
              )}

              {(status === 'qr-displayed' || status === 'verifying') && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="mb-4 text-sm text-muted-foreground">Scan this QR code with your wallet:</p>
                      {qrCodeUrl && <InlineQRCode value={qrCodeUrl} />}
                      <p className="mt-4 text-xs text-muted-foreground">Session ID: {sessionId}</p>
                    </div>

                    {status === 'verifying' && (
                        <div className="space-y-2 text-center">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-jp-primary" />
                          <p className="text-sm text-muted-foreground">Verifying credential...</p>
                        </div>
                    )}
                  </div>
              )}

              {status === 'success' && (
                  <div className="space-y-4">
                    {idvComplete === true ? (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-900">Full Verification Complete ✓</h4>
                            <p className="text-sm text-green-800 mt-1">
                              Your identity has been fully verified. You have full access to all features.
                              Redirecting to your dashboard...
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-6 w-6 text-amber-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-amber-900">Limited Access Verified ✓</h4>
                            <p className="text-sm text-amber-800 mt-1">
                              Your credential has been verified. You have limited access. Complete full
                              identity verification to unlock all features. Redirecting to your dashboard...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-jp-primary" />
                    </div>
                  </div>
              )}

              {status === 'failed' && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-900">Verification Failed</h4>
                          <p className="text-sm text-red-800 mt-1">
                            {error || 'Unable to verify your identity credential.'}
                          </p>
                        </div>
                      </div>
                    </div>

             
                    <div className="space-y-2">
                      <Button
                          onClick={() => {
                            setStatus('init');
                            setError('');
                            setQrCodeUrl('');
                            setSessionId('');
                          }}
                          className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white"
                      >
                        Try Again
                      </Button>

                      <Button
                          onClick={() => router.push('/login')}
                          variant="outline"
                          className="w-full border-jp-primary/20 text-jp-primary hover:bg-jp-primary/5"
                      >
                        Return to Login
                      </Button>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}