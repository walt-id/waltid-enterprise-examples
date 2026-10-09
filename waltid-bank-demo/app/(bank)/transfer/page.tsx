'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Wallet, X, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const IBAN = 'BE68 5390 0754 7034';
const BALANCE = '€2.458,50';
const PAYMENT_AUTHORIZATION_TRANSACTION_TYPE =
  'org.waltid.transaction-data.payment-authorization';

const PAYMENT_ACCOUNT_CLAIMS = [
  { path: ['iban'], intent_to_retain: true },
  { path: ['bic'], intent_to_retain: false },
  { path: ['currency'], intent_to_retain: false },
  { path: ['category'], intent_to_retain: false },
];

type PolicyResult = {
  policy?: string | { policy?: string; id?: string };
  policyName?: string;
  name?: string;
  status?: string;
  success?: boolean;
  result?: {
    verified_data?: Record<string, unknown>;
    success?: boolean;
    status?: string;
  };
};

type VerificationSession = {
  status?: string;
  error?: string;
  presented_credentials?: Record<string, unknown>;
  policy_results?: {
    vc_policies?: PolicyResult[];
  };
};

function TransferContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const firstName = searchParams.get('firstName') || 'Marc';
  const lastName = searchParams.get('lastName') || 'Janssens';
  const backUrl = `/overview?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;

  const [form, setForm] = useState({
    name: '',
    iban: '',
    amount: '',
    text: '',
    reference: '',
    communication: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [scaData, setScaData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const buildPaymentAuthorizationTransactionData = () => {
    const reference = form.reference.trim() || form.communication.trim() || form.text.trim();

    return {
      type: PAYMENT_AUTHORIZATION_TRANSACTION_TYPE,
      credentialIds: ['payment_account'],
      fields: {
        amount: form.amount.trim().replace(',', '.'),
        currency: 'EUR',
        payee: form.name.trim(),
        payee_iban: form.iban.trim(),
        ...(reference ? { reference } : {}),
        ...(form.communication.trim() ? { communication: form.communication.trim() } : {}),
        ...(form.text.trim() ? { description: form.text.trim() } : {}),
      },
    };
  };

  const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const normalizeCredentialData = useCallback((data: Record<string, unknown>) => {
    const docType = data.docType as string | undefined;
    const credentialFields =
      docType && typeof data[docType] === 'object' && data[docType] !== null
        ? (data[docType] as Record<string, unknown>)
        : data;

    return Object.fromEntries(
      Object.entries(credentialFields).filter(([key]) => !['iss', 'cnf', 'vct', 'docType'].includes(key))
    );
  }, []);

  const extractScaData = useCallback((session: VerificationSession) => {
    const verifiedData = session.policy_results?.vc_policies
      ?.map(policy => policy.result?.verified_data)
      .find((data): data is Record<string, unknown> => Boolean(data));

    if (verifiedData) {
      return normalizeCredentialData(verifiedData);
    }

    const paymentCredential = session.presented_credentials?.payment_account;
    if (Array.isArray(paymentCredential)) {
      const firstCredential = paymentCredential[0] as { credentialData?: Record<string, unknown> } | undefined;
      if (firstCredential?.credentialData) {
        return normalizeCredentialData(firstCredential.credentialData);
      }
    }

    return null;
  }, [normalizeCredentialData]);

  const getPolicyName = (policy: PolicyResult, index: number) => {
    if (policy.policyName) return policy.policyName;
    if (policy.name) return policy.name;
    if (typeof policy.policy === 'string') return policy.policy;
    if (policy.policy?.policy) return policy.policy.policy;
    if (policy.policy?.id) return policy.policy.id;
    return `Policy ${index + 1}`;
  };

  const didPolicyPass = (policy: PolicyResult) =>
    policy.success === true ||
    policy.status === 'SUCCESSFUL' ||
    policy.result?.success === true ||
    policy.result?.status === 'SUCCESSFUL' ||
    Boolean(policy.result?.verified_data);

  const handleSignWithWallet = async () => {
    setIsLoadingQR(true);
    setQrCodeUrl('');
    setSessionId('');
    setVerifying(false);
    setVerified(false);
    setVerificationSuccess(false);
    setVerificationSession(null);
    setScaData(null);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: 'payment_account',
          claims: PAYMENT_ACCOUNT_CLAIMS,
          transactionData: buildPaymentAuthorizationTransactionData(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start verification');
      }

      const data = await response.json();
      setQrCodeUrl(data.bootstrapAuthorizationRequestUrl);
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification');
    } finally {
      setIsLoadingQR(false);
    }
  };

  // Poll for verification status
  useEffect(() => {
    if (!sessionId || verified) return;

    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/verify?sessionId=${sessionId}`);
        if (!response.ok) return;

        const data = await response.json();
        const status = data.session?.status;

        if (status === 'SUCCESSFUL') {
          clearInterval(intervalRef.current!);
          setVerifying(false);
          setVerified(true);
          setVerificationSuccess(true);
          setVerificationSession(data.session);
          setScaData(extractScaData(data.session));
        } else if (status === 'FAILED' || status === 'ERROR') {
          clearInterval(intervalRef.current!);
          setVerifying(false);
          setVerified(true);
          setVerificationSuccess(false);
          setVerificationSession(data.session);
          setError(data.session?.error || 'Verification failed');
        } else if (status === 'IN_PROGRESS' || status === 'ATTEMPTED') {
          setVerifying(true);
        }
      } catch {
        // silently retry
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [extractScaData, sessionId, verified]);

  const handleResetVerification = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setQrCodeUrl('');
    setSessionId('');
    setVerifying(false);
    setVerified(false);
    setVerificationSuccess(false);
    setVerificationSession(null);
    setScaData(null);
    setError('');
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: 'name', label: 'Name', placeholder: 'Sophie Willems' },
    { key: 'iban', label: 'IBAN/account number', placeholder: 'BE42 2100 8562 4419' },
    { key: 'amount', label: 'Amount', placeholder: '125,50', type: 'number' },
    { key: 'text', label: 'Text', placeholder: 'Dinner and drinks at Grand Place' },
    { key: 'reference', label: 'Payment reference', placeholder: '+++090/1234/56789+++' },
    { key: 'communication', label: 'Free communication', placeholder: 'Shared Expenses Apr 2026' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Transfer header bar */}
      <div className="relative bg-brand text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex flex-col">
          <span className="text-xs text-white/70 uppercase tracking-wide">Account</span>
          <span className="text-sm font-mono text-white/90">{IBAN}</span>
          <span className="text-base font-bold">{BALANCE}</span>
        </div>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-wide">
          New Transfer
        </h1>
        <button
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
        >
          Close <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form and verification */}
      <div className="flex flex-1 items-start justify-center px-4 py-10 overflow-y-auto">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="w-full bg-white rounded-lg border border-brand/15 shadow-sm p-8">
          <div className="flex flex-col gap-5">
            {fields.map(({ key, label, placeholder, type }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="text-sm text-gray-600">
                  {label}
                </Label>
                <Input
                  id={key}
                  type={type || 'text'}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  className="border-brand/20 focus-visible:ring-brand/30"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex justify-center gap-3 mt-8">
            <Button
              className="bg-brand hover:bg-brand/90 text-white gap-2 px-6"
              onClick={handleSignWithWallet}
              disabled={isLoadingQR || verificationSuccess}
            >
              {isLoadingQR ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : verificationSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {verificationSuccess ? 'Transaction Completed' : 'Sign with EUDI Wallet'}
            </Button>
            <Button
              variant="outline"
              className="border-brand/30 text-gray-600 hover:bg-brand/5 px-6"
              onClick={() => router.push(backUrl)}
            >
              Cancel
            </Button>
          </div>
        </div>

        <aside className="w-full rounded-lg border border-brand/15 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/70">
                Payment Authorization
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Strong Customer Authentication</h2>
            </div>
            {verificationSuccess ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
            ) : verified && !verificationSuccess ? (
              <AlertCircle className="h-6 w-6 shrink-0 text-red-500" />
            ) : (
              <ShieldCheck className="h-6 w-6 shrink-0 text-brand" />
            )}
          </div>

          {!qrCodeUrl && !isLoadingQR && !verified && (
            <div className="rounded-xl border border-dashed border-brand/25 bg-brand/5 p-6 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-brand" />
              <p className="text-sm font-medium text-gray-900">Ready to sign</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the transfer details, then sign with your EUDI Wallet. The QR code will appear here.
              </p>
            </div>
          )}

          {isLoadingQR && (
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-8 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand" />
              <p className="text-sm font-medium text-gray-900">Preparing verification...</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Creating a signed payment authorization request.
              </p>
            </div>
          )}

          {qrCodeUrl && !verificationSuccess && (
            <div className="flex flex-col items-center">
              <InlineQRCode
                value={qrCodeUrl}
                title="Authorize Payment"
                description="Scan with your EUDI Wallet to approve this transfer."
                verifying={verifying}
                verified={verified}
                verificationSuccess={verificationSuccess}
              />
              {verifying && (
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for wallet confirmation...
                </div>
              )}
              {verified && !verificationSuccess && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Payment authorization failed. Please retry the verification.
                </div>
              )}
            </div>
          )}

          {verificationSuccess && (
            <div className="space-y-5">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction completed</h3>
                <p className="mt-2 text-sm text-green-700">
                  The SCA credential was verified and the transfer was submitted.
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-brand">Transfer Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Payee:</span>
                    <span className="text-right font-medium">{form.name || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">IBAN:</span>
                    <span className="text-right font-medium">{form.iban || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-right font-medium">€ {form.amount || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-right font-medium text-green-700">Completed</span>
                  </div>
                </div>
              </div>

              {scaData && (
                <div className="rounded-lg border bg-background p-4">
                  <h4 className="mb-3 text-sm font-semibold text-brand">Verified SCA Credential</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(scaData).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{formatLabel(key)}:</span>
                        <span className="text-right font-medium">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verificationSession?.policy_results?.vc_policies?.length ? (
                <div className="rounded-lg border bg-background p-4">
                  <h4 className="mb-3 text-sm font-semibold text-brand">Policies Passed</h4>
                  <div className="space-y-2">
                    {verificationSession.policy_results.vc_policies.map((policy, index) => (
                      <div key={`${getPolicyName(policy, index)}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{getPolicyName(policy, index)}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          didPolicyPass(policy)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {didPolicyPass(policy) ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {didPolicyPass(policy) ? 'Passed' : 'Checked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-brand hover:bg-brand/90 text-white"
                  onClick={() => router.push(backUrl)}
                >
                  Back to Overview
                </Button>
                <Button
                  variant="outline"
                  className="border-brand/30 text-gray-600 hover:bg-brand/5"
                  onClick={handleResetVerification}
                >
                  New Signature
                </Button>
              </div>
            </div>
          )}
        </aside>
        </div>
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}
