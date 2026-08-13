'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // For demo: accept any email/password combination
      // In production, this would validate against your auth system
      console.log('Login attempt:', { email, password });

      // Store the email in sessionStorage for the MFA screen
      sessionStorage.setItem('loginEmail', email);

      // Redirect to MFA selection screen
      router.push('/mfa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4efe7] to-[#f8fafc] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-2 border-b border-jp-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-jp-primary rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-jp-primary">JPMorgan Portal</CardTitle>
              <CardDescription>Secure Authentication</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-jp-primary font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-2 border-jp-primary/20 focus:border-jp-primary"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-jp-primary font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-2 border-jp-primary/20 focus:border-jp-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-jp-primary hover:bg-jp-primary/90 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-jp-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              Demo credentials: Use any email and password to proceed to MFA
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
