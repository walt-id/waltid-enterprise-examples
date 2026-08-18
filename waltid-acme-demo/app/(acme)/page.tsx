'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { branding } from '@/lib/branding';

export default function AcmeHome() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-jp-primary via-jp-primary to-jp-accent px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
          >
            Credential-Based Authentication
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {branding.tagline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            {branding.description}
          </p>
        </div>
      </section>

      {/* Main Actions */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Verify Identity Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-jp-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-jp-primary" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-jp-primary to-jp-accent text-white shadow-lg transition-transform group-hover:scale-110">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-jp-primary">Complete Identity Verification</CardTitle>
                <CardDescription className="text-base">
                  Verify your identity and receive a credential for authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/idv">
                  <Button className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white">
                    Start Verification
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Login Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-jp-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-jp-accent" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-jp-accent to-jp-primary text-white shadow-lg transition-transform group-hover:scale-110">
                  <Lock className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-jp-primary">Secure Login</CardTitle>
                <CardDescription className="text-base">
                  Sign in with email and use credentials for MFA.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-jp-accent hover:bg-jp-accent/90 text-white"
                >
                  Login Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* How It Works Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-jp-primary">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jp-primary text-white text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold text-jp-primary">Verify Identity</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete mock identity verification
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jp-primary text-white text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold text-jp-primary">Receive Credential</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get a credential in your wallet
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jp-primary text-white text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold text-jp-primary">Authenticate</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Prove your identity to access services
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8fafc] to-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white border-l-4 border-jp-primary shadow-md p-6">
            <div className="flex gap-4">
              <ShieldCheck className="h-6 w-6 text-jp-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-jp-primary mb-2">Secure by Design</h3>
                <p className="text-muted-foreground">
                  Your identity verification is cryptographically secured. The credential proves you have completed identity verification and cannot be forged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
