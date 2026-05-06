'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Search, Plus, Wallet, X } from 'lucide-react';

const transactions = [
  { date: '12. Apr', merchant: 'Delhaize Proxy', amount: -42.30 },
  { date: '11. Apr', merchant: 'Sarah Peeters', amount: 5.00 },
  { date: '10. Apr', merchant: 'SNCB/NMBS', amount: -12.40 },
  { date: '10. Apr', merchant: 'Telenet NV', amount: -59.00 },
  { date: '8. Apr', merchant: 'Starbucks', amount: -6.75 },
  { date: '8. Apr', merchant: 'Basic-Fit', amount: -27.30 },
  { date: '7. Apr', merchant: 'Too Good To Go', amount: -4.99 },
  { date: '7. Apr', merchant: 'Starbucks', amount: -6.75 },
  { date: '5. Apr', merchant: 'Amazon', amount: -34.99 },
  { date: '4. Apr', merchant: 'Salary', amount: 2850.00 },
  { date: '3. Apr', merchant: 'Albert Heijn', amount: -28.45 },
  { date: '2. Apr', merchant: 'Netflix', amount: -15.99 },
];

const sidebarLinks = [
  'New Transfer',
  'Donations',
  'Account Statement',
  'Standing Orders',
  'Round Up Savings',
  'SEPA Mandates',
];

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function OverviewContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get('firstName') || 'Marc';
  const lastName = searchParams.get('lastName') || 'Janssens';
  const fullName = `${firstName} ${lastName}`;
  const iban = 'BE68 5390 0754 7034';

  // SCA credential issuance modal state
  const [showModal, setShowModal] = useState(false);
  const [offerUrl, setOfferUrl] = useState('');
  const [offerId, setOfferId] = useState('');
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Open SSE connection once we have an offerId
  useEffect(() => {
    if (!offerId) return;

    const es = new EventSource(`/api/issue/events?offerId=${offerId}`);
    esRef.current = es;

    const markIssued = () => {
      setClaiming(false);
      setClaimed(true);
      setClaimSuccess(true);
      es.close();
      esRef.current = null;
    };

    const markFailed = () => {
      setClaiming(false);
      setClaimed(true);
      setClaimSuccess(false);
      es.close();
      esRef.current = null;
    };

    // Named event listeners (fired when upstream sends `event: <name>`)
    es.addEventListener('resolved_credential_offer', () => setClaiming(true));
    es.addEventListener('requested_token', () => setClaiming(true));
    es.addEventListener('sdjwt_issue', markIssued);
    es.addEventListener('jwt_issue', markIssued);
    es.addEventListener('generated_mdoc', markIssued);
    es.addEventListener('issuance_status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'FAILED' || data.status === 'EXPIRED') markFailed();
      } catch { /* ignore */ }
    });

    // All events arrive as plain `data:` messages — the event type is inside data.event
    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const eventType = (data.event ?? '').toLowerCase();
        if (eventType === 'sdjwt_issue' || eventType === 'jwt_issue' || eventType === 'generated_mdoc') {
          markIssued();
        } else if (eventType === 'resolved_credential_offer' || eventType === 'requested_token') {
          setClaiming(true);
        } else if (eventType === 'issuance_status') {
          const sessionStatus = (data.session?.status ?? '').toUpperCase();
          if (sessionStatus === 'SUCCESSFUL') {
            markIssued();
          } else if (sessionStatus === 'FAILED' || sessionStatus === 'EXPIRED') {
            markFailed();
          }
        }
      } catch { /* not JSON – ignore */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [offerId]);

  const handleClaimSCA = async () => {
    setIsLoadingOffer(true);
    setOfferUrl('');
    setOfferId('');
    setOfferError('');
    setClaiming(false);
    setClaimed(false);
    setClaimSuccess(false);
    setShowModal(true);

    try {
      const response = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: 'payment_account',
          credentialData: {
            iban: iban.replace(/\s/g, ''),
            bic: 'AXABBE22',
            currency: 'EUR',
            category: 'urn:eu:europa:ec:eudi:sua:sca',
          },
          flowType: 'pre-auth-code',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create credential offer');
      }

      const data = await response.json();
      setOfferUrl(data.offerUrl);
      setOfferId(data.offerId);
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : 'Failed to create credential offer');
    } finally {
      setIsLoadingOffer(false);
    }
  };

  const handleCloseModal = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setShowModal(false);
    setOfferUrl('');
    setOfferId('');
    setOfferError('');
    setClaiming(false);
    setClaimed(false);
    setClaimSuccess(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="relative flex items-center justify-center mb-10 pb-6 border-b border-brand/10">
        <h1 className="text-2xl font-semibold text-gray-800">Overview</h1>
        <div className="absolute right-0">
          <Link href={`/transfer?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`}>
            <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* Left sidebar */}
        <aside className="w-52 shrink-0">
          <div className="rounded-lg border border-brand/20 bg-white p-4 mb-4 shadow-sm">
            <p className="text-sm font-semibold text-brand">{fullName}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Account</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{iban}</p>
          </div>

          <div className="rounded-lg border border-brand/20 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-brand/10">
              <p className="text-sm font-semibold text-brand">History</p>
            </div>
            <nav className="flex flex-col">
              {sidebarLinks.map((link) => (
                link === 'New Transfer' ? (
                  <Link
                    key={link}
                    href={`/transfer?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`}
                    className="px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-brand/5 hover:text-brand transition-colors border-b border-brand/5"
                  >
                    {link}
                  </Link>
                ) : (
                  <button
                    key={link}
                    className="px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-brand/5 hover:text-brand transition-colors border-b border-brand/5 last:border-0"
                  >
                    {link}
                  </button>
                )
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 border-brand/20 focus-visible:ring-brand/30 bg-white"
            />
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between px-1">
            <button className="flex items-center gap-2 text-sm text-brand hover:text-brand-light transition-colors font-medium">
              <FilterIcon />
              Filter
            </button>
            <div className="flex items-center gap-3 text-muted-foreground">
              <button className="hover:text-brand transition-colors p-1 rounded hover:bg-brand/5">
                <PrintIcon />
              </button>
              <button className="hover:text-brand transition-colors p-1 rounded hover:bg-brand/5">
                <DownloadIcon />
              </button>
            </div>
          </div>

          {/* Transaction list */}
          <div className="rounded-lg border border-brand/20 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] border-b border-brand/10">
              <p className="text-sm font-semibold text-gray-700">April 2026</p>
            </div>
            <div className="divide-y divide-brand/5">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-brand/[0.03] transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-16 shrink-0">{tx.date}</span>
                    <span className="text-sm font-medium text-gray-800">{tx.merchant}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+ ' : '- '}€ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-64 shrink-0">
          <div className="rounded-lg border border-brand/20 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-brand" />
              <p className="text-sm font-semibold text-brand">EUDI Wallet</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Confirm payments with the EUDI Wallet.
            </p>
            <Button
              size="sm"
              className="w-full bg-brand hover:bg-brand/90 text-white text-xs"
              onClick={handleClaimSCA}
              disabled={isLoadingOffer}
            >
              Claim SCA Credential
            </Button>
          </div>
        </aside>

      </div>

      {/* SCA Credential issuance modal */}
      {showModal && (
        offerUrl ? (
          <QRCodeDisplay
            value={offerUrl}
            title="Claim SCA Credential"
            description="Scan with your EUDI Wallet to add the payment account credential."
            verifying={claiming}
            verified={claimed}
            verificationSuccess={claimSuccess}
            verifyingLabel="Claiming"
            verifiedLabel="Claimed"
            onClose={handleCloseModal}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              {offerError ? (
                <p className="text-sm text-red-500 text-center">{offerError}</p>
              ) : (
                <>
                  <div className="w-10 h-10 border-2 border-brand border-b-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Preparing credential offer…</p>
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-muted-foreground text-sm">
        Loading...
      </div>
    }>
      <OverviewContent />
    </Suspense>
  );
}
