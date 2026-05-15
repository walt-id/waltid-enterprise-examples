'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
  verifying?: boolean;
  verified?: boolean;
  verificationSuccess?: boolean;
  verifyingLabel?: string;
  verifiedLabel?: string;
  onClose?: () => void;
}

export function QRCodeDisplay({ 
  value, 
  size = 200, 
  title = 'Scan with EUDI Wallet', 
  description = 'Open your EUDI Wallet app and scan this QR code',
  verifying = false,
  verified = false,
  verificationSuccess = false,
  verifyingLabel = 'Verifying',
  verifiedLabel = 'Verified',
  onClose
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  useEffect(() => {
    if (value) {
      setIsLoading(true);
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => {
          setDataUrl(url);
          setError('');
          setIsLoading(false);
        })
        .catch(err => {
          setError('Failed to generate QR code');
          setIsLoading(false);
          console.error('QR Code generation error:', err);
        });
    }
  }, [value, size]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8 overflow-hidden bg-white rounded-2xl shadow-xl">
        {/* Close button */}
        {onClose && (
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="-m-2 p-2 text-gray-400 hover:text-gray-500 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-medium text-gray-900 mt-5 text-center">
            {title}
          </h3>
          
          {/* Description */}
          <p className="mt-4 text-sm text-gray-500 text-center">
            {description}
          </p>

          {/* QR Code Area */}
          <div className="mt-10 flex justify-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-b-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* QR Code */}
                {!isLoading && dataUrl && (
                  <img
                    src={dataUrl}
                    alt="QR Code"
                    className={`w-full h-full transition-opacity duration-300 ${
                      verifying || verified ? 'opacity-5' : 'opacity-100'
                    }`}
                    style={{ width: size, height: size }}
                  />
                )}

                {/* Verifying Overlay */}
                {verifying && (
                  <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-500 border-b-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">{verifyingLabel}</p>
                  </div>
                )}

                {/* Success Overlay */}
                {!verifying && verified && verificationSuccess && (
                  <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">{verifiedLabel}</p>
                  </div>
                )}

                {/* Failed Overlay */}
                {!verifying && verified && !verificationSuccess && (
                  <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-400">Failed</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Copy URL Button */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleCopyUrl}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                copied
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy URL
                </>
              )}
            </button>
          </div>

          {/* Walt.id Branding */}
          <div className="flex flex-col items-center mt-12">
            <div className="flex flex-row gap-2 items-center text-sm text-gray-500">
              <p>Secured by walt.id</p>
              <svg width="15" height="15" viewBox="0 0 141 141" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="70.5" cy="70.5" r="70.5" fill="#CBD2D9" />
                <rect x="39.0461" y="45.5538" width="30.3692" height="8.67692" fill="#52606D" />
                <path d="M112.8 74.8385L105.208 73.7538C99.7846 103.038 68.3307 103.038 68.3307 103.038L67.2461 111.715C100.218 112.583 111.354 87.4923 112.8 74.8385Z" fill="#52606D" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline QR display with walt.id branding
interface InlineQRCodeProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
  verifying?: boolean;
  verified?: boolean;
  verificationSuccess?: boolean;
}

export function InlineQRCode({
  value,
  size = 280,
  title = 'Scan with EUDI Wallet',
  description = 'Open your EUDI Wallet app and scan this QR code',
  verifying = false,
  verified = false,
  verificationSuccess = false,
}: InlineQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  useEffect(() => {
    if (value) {
      setIsLoading(true);
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => {
          setDataUrl(url);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('QR Code generation error:', err);
          setIsLoading(false);
        });
    }
  }, [value, size]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden bg-white rounded-2xl shadow-xl p-6">
      {/* Title */}
      <h3 className="text-xl font-medium text-gray-900 text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        {description}
      </p>

      {/* QR Code Area */}
      <div className="mt-10 flex justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[200px] h-[200px] flex items-center justify-center">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-400 border-b-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* QR Code */}
            {!isLoading && dataUrl && (
              <img
                src={dataUrl}
                alt="QR Code"
                className={`w-full h-full transition-opacity duration-300 ${
                  verifying || verified ? 'opacity-5' : 'opacity-100'
                }`}
                style={{ width: 200, height: 200 }}
              />
            )}

            {/* Verifying Overlay */}
            {verifying && (
              <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-500 border-b-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Verifying</p>
              </div>
            )}

            {/* Success Overlay */}
            {!verifying && verified && verificationSuccess && (
              <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            )}

            {/* Failed Overlay */}
            {!verifying && verified && !verificationSuccess && (
              <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-400">Failed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy URL Button */}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={handleCopyUrl}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            copied
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy URL
            </>
          )}
        </button>
      </div>

      {/* Walt.id Branding */}
      <div className="flex flex-col items-center mt-12">
        <div className="flex flex-row gap-2 items-center text-sm text-gray-500">
          <p>Secured by walt.id</p>
          <svg width="15" height="15" viewBox="0 0 141 141" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="70.5" cy="70.5" r="70.5" fill="#CBD2D9" />
            <rect x="39.0461" y="45.5538" width="30.3692" height="8.67692" fill="#52606D" />
            <path d="M112.8 74.8385L105.208 73.7538C99.7846 103.038 68.3307 103.038 68.3307 103.038L67.2461 111.715C100.218 112.583 111.354 87.4923 112.8 74.8385Z" fill="#52606D" />
          </svg>
        </div>
      </div>
    </div>
  );
}
