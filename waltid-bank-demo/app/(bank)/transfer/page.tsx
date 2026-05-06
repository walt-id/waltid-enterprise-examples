'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Wallet, X, CheckCircle2 } from 'lucide-react';

const IBAN = 'BE68 5390 0754 7034';
const BALANCE = '€2.458,50';

const PAYMENT_ACCOUNT_CLAIMS = [
  { path: ['iban'], intent_to_retain: true },
  { path: ['bic'], intent_to_retain: false },
  { path: ['currency'], intent_to_retain: false },
  { path: ['category'], intent_to_retain: false },
];

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

  // QR modal state
  const [showModal, setShowModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSignWithWallet = async () => {
    setIsLoadingQR(true);
    setShowModal(true);
    setQrCodeUrl('');
    setSessionId('');
    setVerifying(false);
    setVerified(false);
    setVerificationSuccess(false);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: 'payment_account',
          claims: PAYMENT_ACCOUNT_CLAIMS,
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
        } else if (status === 'FAILED' || status === 'ERROR') {
          clearInterval(intervalRef.current!);
          setVerifying(false);
          setVerified(true);
          setVerificationSuccess(false);
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
  }, [sessionId, verified]);

  const handleCloseModal = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowModal(false);
    setQrCodeUrl('');
    setSessionId('');
    setVerifying(false);
    setVerified(false);
    setVerificationSuccess(false);
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

      {/* Form */}
      <div className="flex flex-1 items-start justify-center px-4 py-10 overflow-y-auto">
        <div className="w-full max-w-lg bg-white rounded-lg border border-brand/15 shadow-sm p-8">
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
              disabled={isLoadingQR}
            >
              <Wallet className="h-4 w-4" />
              Sign with EUDI Wallet
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
      </div>

      {/* QR Modal */}
      {showModal && (
        qrCodeUrl ? (
          /* Use existing QRCodeDisplay once QR is ready */
          verificationSuccess ? (
            // Success state — replace modal with confirmation
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
              <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">Payment Authorised</h3>
                <p className="text-sm text-gray-500 text-center">
                  Your SCA payment credential has been verified. The transfer has been submitted.
                </p>
                <Button
                  className="mt-4 bg-brand hover:bg-brand/90 text-white px-8"
                  onClick={() => router.push(backUrl)}
                >
                  Back to Overview
                </Button>
              </div>
            </div>
          ) : (
            <QRCodeDisplay
              value={qrCodeUrl}
              title="Authorize Payment"
              description="Scan the QR code with your Digital ID wallet"
              verifying={verifying}
              verified={verified}
              verificationSuccess={verificationSuccess}
              onClose={handleCloseModal}
            />
          )
        ) : (
          /* Loading state while fetching QR */
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 border-2 border-brand border-b-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Preparing verification…</p>
            </div>
          </div>
        )
      )}
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
