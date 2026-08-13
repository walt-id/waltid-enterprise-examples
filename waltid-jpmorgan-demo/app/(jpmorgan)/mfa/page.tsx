'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Smartphone, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type MFAMethod = 'wallet' | 'sms' | null;

export default function MFAPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('loginEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleWalletVerification = () => {
    setSelectedMethod('wallet');
    sessionStorage.setItem('mfaMethod', 'wallet');
    router.push('/authenticate');
  };

  const handleSMSVerification = () => {
    setSelectedMethod('sms');
    sessionStorage.setItem('mfaMethod', 'sms');
    // Redirect to SMS verification flow (placeholder)
    router.push('/dashboard?mfa=sms');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4efe7] to-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-jp-primary hover:text-jp-accent">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b border-jp-primary/10">
            <CardTitle className="text-jp-primary">Multi-Factor Authentication</CardTitle>
            <CardDescription>
              Choose how you'd like to verify your identity for {email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <Alert className="border-jp-primary/20 bg-jp-primary/5">
              <AlertDescription className="text-jp-primary">
                Select your preferred authentication method to continue
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {/* Wallet Verification Option */}
              <button
                onClick={handleWalletVerification}
                disabled={selectedMethod !== null && selectedMethod !== 'wallet'}
                className="group relative overflow-hidden rounded-lg border-2 border-jp-primary/20 p-6 transition-all hover:border-jp-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-jp-primary/0 to-jp-primary/5 group-hover:to-jp-primary/10 transition-all" />

                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-jp-primary/10 flex items-center justify-center group-hover:bg-jp-primary/20 transition-colors">
                    <Wallet className="h-6 w-6 text-jp-primary" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-jp-primary text-lg">Verify with Wallet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use your digital wallet with verified credentials for secure authentication
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-700">Recommended</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-jp-primary">→</div>
                </div>
              </button>

              {/* SMS Verification Option */}
              <button
                onClick={handleSMSVerification}
                disabled={selectedMethod !== null && selectedMethod !== 'sms'}
                className="group relative overflow-hidden rounded-lg border-2 border-jp-primary/20 p-6 transition-all hover:border-jp-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-jp-primary/0 to-jp-primary/5 group-hover:to-jp-primary/10 transition-all" />

                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-jp-primary/10 flex items-center justify-center group-hover:bg-jp-primary/20 transition-colors">
                    <Smartphone className="h-6 w-6 text-jp-primary" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-jp-primary text-lg">Verify with SMS</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive a verification code via SMS to your registered phone number
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-jp-primary">→</div>
                </div>
              </button>
            </div>

            <div className="pt-4 border-t border-jp-primary/10">
              <p className="text-xs text-muted-foreground text-center">
                Your authentication method is secure and encrypted
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
