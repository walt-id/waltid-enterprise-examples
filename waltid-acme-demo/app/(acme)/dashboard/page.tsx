'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Calendar,
  Mail,
  Building2,
  Briefcase,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [idvStatus, setIdvStatus] = useState<'completed' | 'pending'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('loginEmail');
    const mfaVerified = sessionStorage.getItem('mfaVerified');
    const idvComplete = sessionStorage.getItem('idvComplete');

    if (!storedEmail || !mfaVerified) {
      router.push('/login');
      return;
    }

    setEmail(storedEmail);
    setIdvStatus(idvComplete === 'true' ? 'completed' : 'pending');
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4efe7] to-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jp-primary border-r-transparent"></div>
          <p className="mt-4 text-jp-primary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4efe7] to-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-jp-primary/10 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-jp-primary">Acme</h1>
            <p className="text-xs text-muted-foreground">Employee Portal</p>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-muted-foreground hover:text-jp-primary"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="rounded-lg bg-gradient-to-r from-jp-primary/10 to-jp-accent/10 border border-jp-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-jp-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-jp-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-jp-primary">Welcome back!</h2>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✓ Your session is secured with multi-factor authentication
          </AlertDescription>
        </Alert>

        {/* Grid Layout */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Identity Verification Card */}
          <Card className="border-0 shadow-lg md:col-span-2">
            <CardHeader className="border-b border-jp-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-jp-primary">Identity Verification</CardTitle>
                  <CardDescription>
                    Your verified identity status
                  </CardDescription>
                </div>
                {idvStatus === 'completed' && (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
                {idvStatus === 'pending' && (
                  <Clock className="h-8 w-8 text-amber-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {idvStatus === 'completed' && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900">Verification Complete</h4>
                        <p className="text-sm text-green-800 mt-1">
                          Your identity has been successfully verified through wallet verification.
                        </p>
                        <div className="mt-3 text-xs text-green-700 font-medium">
                          Verified via: Wallet Credential
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {idvStatus === 'pending' && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900">Verification Pending</h4>
                        <p className="text-sm text-amber-800 mt-1">
                          Your identity verification is pending. Complete the verification process to unlock all features.
                        </p>
                        <Button
                          onClick={() => router.push('/mfa')}
                          className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        >
                          Complete Verification
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-jp-primary text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">MFA Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verification Method</p>
                <p className="text-sm font-medium text-jp-primary mt-1">Wallet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Information Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-6">
          {/* Department Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-jp-primary" />
                <CardTitle className="text-jp-primary text-base">Department</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Corporate Operations</p>
              <p className="text-xs text-muted-foreground mt-1">New York, NY</p>
            </CardContent>
          </Card>

          {/* Role Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-jp-primary" />
                <CardTitle className="text-jp-primary text-base">Job Title</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Senior Operations Manager</p>
              <p className="text-xs text-muted-foreground mt-1">Active Status</p>
            </CardContent>
          </Card>

          {/* Email Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-jp-primary" />
                <CardTitle className="text-jp-primary text-base">Email</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium truncate">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">Corporate Email</p>
            </CardContent>
          </Card>

          {/* Hire Date Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-jp-primary" />
                <CardTitle className="text-jp-primary text-base">Hire Date</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">January 15, 2020</p>
              <p className="text-xs text-muted-foreground mt-1">6 years at Acme</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 rounded-lg border border-jp-primary/10 bg-white/50 p-6">
          <h3 className="font-semibold text-jp-primary mb-4">Security & Privacy</h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <Button
              variant="outline"
              className="border-jp-primary/20 text-jp-primary hover:bg-jp-primary/5"
            >
              Update Password
            </Button>
            <Button
              variant="outline"
              className="border-jp-primary/20 text-jp-primary hover:bg-jp-primary/5"
            >
              Manage Credentials
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
