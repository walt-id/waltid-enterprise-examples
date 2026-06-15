'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  QrCode, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Home,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

import { OpenIdCardMetadata, credentialTypes } from '@/lib/config';
import { getCredentialRegistryEntry } from '@/lib/credentials/registry';

interface SelectedCredential {
  type: string;
  claims: Array<{ path: string[]; label: string; sd?: boolean }>;
}

type VerificationStatus = 'pending' | 'success' | 'failed';
type VerifierKind = 'trusted' | 'untrusted';

interface PolicyExecuted {
  policy: string;
  id: string;
  description?: string;
}

interface VpPolicyResult {
  policy_executed: PolicyExecuted;
  success: boolean;
  results?: Record<string, unknown>;
  errors?: string[];
  execution_time?: string;
}

interface VcPolicyResult {
  policy: {
    policy: string;
    id: string;
    [key: string]: unknown;
  };
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  query_id?: string;
  credential_index?: number;
}

interface PolicyViolation {
  policy: {
    policy: string;
    id: string;
    [key: string]: unknown;
  };
  success: boolean;
  error: string;
  query_id?: string;
  credential_index?: number;
}

interface SessionFailure {
  type: string;
  reason: string;
  violations?: PolicyViolation[];
}

interface PolicyResults {
  vp_policies?: Record<string, Record<string, VpPolicyResult>>;
  vc_policies?: VcPolicyResult[];
  specific_vc_policies?: Record<string, unknown>;
  overallSuccess?: boolean;
}

interface VerificationResult {
  status: VerificationStatus;
  verifierKind: VerifierKind;
  credentials?: Record<string, unknown>;
  error?: string;
  policyResults?: PolicyResults;
  failure?: SessionFailure;
}

const credentialIcons: Record<string, React.ElementType> = {
  employee_status: Users,
  photo_id: FileText,
  untrusted_photo_id: FileText,
  address_proof: Home,
  tax_registration: Receipt,
  bank_account: CreditCard,
};

const POLL_INTERVAL = 2000; // Poll every 2 seconds

function formatExecutionTime(time?: string): string {
  if (!time) return '';
  const match = time.match(/PT(\d+\.?\d*)S/);
  if (match) {
    const seconds = parseFloat(match[1]);
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
  }
  return time;
}

function formatPolicyName(policyId: string): string {
  return policyId
    .replace(/[/_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function PolicyResultItem({ 
  policyId, 
  result, 
  isSuccess 
}: { 
  policyId: string; 
  result: VpPolicyResult | VcPolicyResult; 
  isSuccess: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const isVpPolicy = 'policy_executed' in result;
  const policyName = isVpPolicy 
    ? formatPolicyName(result.policy_executed.id)
    : formatPolicyName(result.policy.id);
  const description = isVpPolicy ? result.policy_executed.description : undefined;
  const executionTime = isVpPolicy ? formatExecutionTime(result.execution_time) : undefined;
  const resultData = isVpPolicy ? result.results : result.result;
  const errorMessage = isVpPolicy 
    ? (result.errors && result.errors.length > 0 ? result.errors.join(', ') : undefined)
    : result.error;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
          isSuccess 
            ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
            : 'border-red-200 bg-red-50/50 hover:bg-red-50'
        }`}>
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <div className="text-left">
              <span className={`font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                {policyName}
              </span>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {executionTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {executionTime}
              </span>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`mt-1 p-3 rounded-lg border text-sm ${
          isSuccess ? 'border-green-100 bg-white' : 'border-red-100 bg-white'
        }`}>
          {errorMessage && (
            <div className="mb-3">
              <span className="font-medium text-red-700">Error: </span>
              <span className="text-red-600">{errorMessage}</span>
            </div>
          )}
          {resultData && Object.keys(resultData).length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Details:</span>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            </div>
          )}
          {!errorMessage && (!resultData || Object.keys(resultData).length === 0) && (
            <span className="text-muted-foreground">No additional details available</span>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FailureDisplay({ 
  failure, 
  policyResults 
}: { 
  failure?: SessionFailure; 
  policyResults?: PolicyResults;
}) {
  const [expandedCredentials, setExpandedCredentials] = useState<Set<string>>(new Set());

  const toggleCredential = (credId: string) => {
    setExpandedCredentials(prev => {
      const next = new Set(prev);
      if (next.has(credId)) {
        next.delete(credId);
      } else {
        next.add(credId);
      }
      return next;
    });
  };

  const failedVcPolicies = policyResults?.vc_policies?.filter(p => !p.success) || [];
  const passedVcPolicies = policyResults?.vc_policies?.filter(p => p.success) || [];

  return (
    <div className="space-y-4">
      {/* Failure Summary */}
      {failure && (
        <Alert variant="destructive" className="border-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{failure.type.replace(/_/g, ' ').toUpperCase()}: </span>
            {failure.reason}
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Policies Section */}
      {failedVcPolicies.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <h4 className="font-semibold text-red-800 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed Policies ({failedVcPolicies.length})
            </h4>
          </div>
          <div className="p-4 space-y-2">
            {failedVcPolicies.map((policy, idx) => (
              <PolicyResultItem 
                key={`failed-${idx}`}
                policyId={policy.policy.id}
                result={policy}
                isSuccess={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Passed Policies Section */}
      {passedVcPolicies.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Passed Policies ({passedVcPolicies.length})
            </h4>
          </div>
          <div className="p-4 space-y-2">
            {passedVcPolicies.map((policy, idx) => (
              <PolicyResultItem 
                key={`passed-${idx}`}
                policyId={policy.policy.id}
                result={policy}
                isSuccess={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* VP Policies by Credential */}
      {policyResults?.vp_policies && Object.keys(policyResults.vp_policies).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Presentation Policies by Credential
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(policyResults.vp_policies).map(([credId, policies]) => {
              const isExpanded = expandedCredentials.has(credId);
              const policyEntries = Object.entries(policies);
              const allPassed = policyEntries.every(([, p]) => p.success);
              const passedCount = policyEntries.filter(([, p]) => p.success).length;

              return (
                <Collapsible key={credId} open={isExpanded} onOpenChange={() => toggleCredential(credId)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      allPassed 
                        ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                        : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${allPassed ? 'text-green-600' : 'text-amber-600'}`} />
                        <div className="text-left">
                          <span className="font-medium text-gray-800">
                            {credId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {passedCount}/{policyEntries.length} policies passed
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 ml-4 space-y-2">
                      {policyEntries.map(([policyId, policyResult]) => (
                        <PolicyResultItem
                          key={policyId}
                          policyId={policyId}
                          result={policyResult}
                          isSuccess={policyResult.success}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessDisplay({ 
  credentials, 
  policyResults 
}: { 
  credentials?: Record<string, unknown>; 
  policyResults?: PolicyResults;
}) {
  const [expandedCredentials, setExpandedCredentials] = useState<Set<string>>(new Set());
  const [expandedPolicySections, setExpandedPolicySections] = useState<Set<string>>(new Set(['vc']));

  const toggleCredential = (credId: string) => {
    setExpandedCredentials(prev => {
      const next = new Set(prev);
      if (next.has(credId)) {
        next.delete(credId);
      } else {
        next.add(credId);
      }
      return next;
    });
  };

  const togglePolicySection = (section: string) => {
    setExpandedPolicySections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const vcPolicies = policyResults?.vc_policies || [];

  // Group VC policies by credential (query_id + credential_index)
  const vcPoliciesByCredential = useMemo(() => {
    const grouped: Record<string, VcPolicyResult[]> = {};
    vcPolicies.forEach(policy => {
      const queryId = policy.query_id || 'unknown';
      const credIndex = policy.credential_index ?? 0;
      const key = `${queryId}:${credIndex}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(policy);
    });
    return grouped;
  }, [vcPolicies]);

  const totalVcPoliciesPassed = vcPolicies.filter(p => p.success).length;

  return (
    <div className="space-y-4">
      {/* VC Policies by Credential */}
      {vcPolicies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Credential Policies
            </h4>
            <span className="text-sm text-green-700">
              {totalVcPoliciesPassed}/{vcPolicies.length} passed
            </span>
          </div>
          {Object.entries(vcPoliciesByCredential).map(([credKey, policies]) => {
            const [queryId, credIndexStr] = credKey.split(':');
            const credIndex = parseInt(credIndexStr, 10);
            const Icon = credentialIcons[queryId] || FileText;
            const formattedQueryId = queryId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            // Check if there are multiple credentials for this query_id
            const credentialsForQuery = Object.keys(vcPoliciesByCredential).filter(k => k.startsWith(`${queryId}:`));
            const displayName = credentialsForQuery.length > 1 
              ? `${formattedQueryId} #${credIndex + 1}`
              : formattedQueryId;
            
            const isExpanded = expandedPolicySections.has(credKey);
            const passedCount = policies.filter(p => p.success).length;
            const allPassed = passedCount === policies.length;

            return (
              <Collapsible 
                key={credKey} 
                open={isExpanded} 
                onOpenChange={() => togglePolicySection(credKey)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    allPassed 
                      ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                      : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {allPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                      <Icon className={`h-5 w-5 ${allPassed ? 'text-green-600' : 'text-amber-600'}`} />
                      <div className="text-left">
                        <span className={`font-medium ${allPassed ? 'text-green-800' : 'text-amber-800'}`}>
                          {displayName}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {passedCount}/{policies.length} policies passed
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-4 space-y-2">
                    {policies.map((policy, idx) => (
                      <PolicyResultItem
                        key={`${credKey}-${idx}`}
                        policyId={policy.policy.id}
                        result={policy}
                        isSuccess={policy.success}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* VP Policies by Credential */}
      {policyResults?.vp_policies && Object.keys(policyResults.vp_policies).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2 px-1">
            <ShieldCheck className="h-4 w-4" />
            Presentation Policies
          </h4>
          {Object.entries(policyResults.vp_policies).map(([credId, policies]) => {
            const isExpanded = expandedCredentials.has(credId);
            const policyEntries = Object.entries(policies);
            const passedCount = policyEntries.filter(([, p]) => p.success).length;

            return (
              <Collapsible key={credId} open={isExpanded} onOpenChange={() => toggleCredential(credId)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <span className="font-medium text-gray-800">
                          {credId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {passedCount}/{policyEntries.length} policies passed
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-4 space-y-2">
                    {policyEntries.map(([policyId, policyResult]) => (
                      <PolicyResultItem
                        key={policyId}
                        policyId={policyId}
                        result={policyResult}
                        isSuccess={policyResult.success}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Presented Credentials Data */}
      {credentials && Object.keys(credentials).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2 px-1">
            <FileText className="h-4 w-4" />
            Presented Credentials
          </h4>
          {Object.entries(credentials).map(([queryId, credentialArray]) => {
            const credArray = Array.isArray(credentialArray) ? credentialArray : [credentialArray];
            const Icon = credentialIcons[queryId] || FileText;
            const formattedQueryId = queryId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            return credArray.map((credential, credIndex) => {
              const credentialKey = `${queryId}-${credIndex}`;
              const isExpanded = expandedCredentials.has(credentialKey);
              const credentialObj = credential as Record<string, unknown>;
              const credentialType = credentialObj?.vct || credentialObj?.type || formattedQueryId;
              const displayName = credArray.length > 1 
                ? `${formattedQueryId} #${credIndex + 1}`
                : formattedQueryId;
              
              return (
                <Collapsible 
                  key={credentialKey} 
                  open={isExpanded} 
                  onOpenChange={() => toggleCredential(credentialKey)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="text-left">
                          <span className="font-medium text-gray-800">
                            {displayName}
                          </span>
                          {typeof credentialType === 'string' && credentialType !== formattedQueryId && (
                            <p className="text-xs text-muted-foreground">
                              {credentialType}
                            </p>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 p-3 rounded-lg border border-gray-100 bg-white">
                      <pre className="text-xs overflow-auto max-h-64">
                        {JSON.stringify(credential, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}

const verifierOptions: Record<VerifierKind, {
  title: string;
  description: string;
  badge: string;
  badgeClassName: string;
}> = {
  trusted: {
    title: 'Trusted central verifier',
    description: 'Runs signature and ETSI trust-list policies against the trust registry.',
    badge: 'Trust-list verified',
    badgeClassName: 'bg-green-600',
  },
  untrusted: {
    title: 'Untrusted verifier',
    description: 'Runs signature checks only because no trust registry is linked.',
    badge: 'Signature only',
    badgeClassName: 'bg-amber-600',
  },
};

function MetadataIcon({ metadata }: { metadata?: OpenIdCardMetadata }) {
  if (metadata?.logoUri) {
    return (
      <span
        aria-label={metadata.logoAltText || metadata.name || 'OpenID metadata logo'}
        role="img"
        className="h-5 w-5 rounded bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${metadata.logoUri})` }}
      />
    );
  }

  return <ShieldCheck className="h-5 w-5" />;
}

export default function VerifyPage() {
  const [selectedCredentials, setSelectedCredentials] = useState<SelectedCredential[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<VerifierKind>('trusted');
  const [signedRequest, setSignedRequest] = useState(false);
  const [verifierMetadata, setVerifierMetadata] = useState<Record<string, OpenIdCardMetadata>>({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/verifiers/metadata')
      .then(response => (response.ok ? response.json() : undefined))
      .then(data => {
        if (cancelled || !Array.isArray(data?.verifiers)) return;

        setVerifierMetadata(
          Object.fromEntries(
            data.verifiers.map((verifier: { id: string; metadata?: OpenIdCardMetadata }) => [
              verifier.id,
              verifier.metadata || {},
            ])
          )
        );
      })
      .catch(() => {
        // Metadata is optional; verifier cards render their static fallbacks.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const verifierDisplayOptions = useMemo(
    () =>
      Object.fromEntries(
        (Object.entries(verifierOptions) as [VerifierKind, typeof verifierOptions.trusted][]).map(([kind, option]) => {
          const metadata = verifierMetadata[kind];
          return [
            kind,
            {
              ...option,
              metadata,
              title: metadata?.name || option.title,
              description: metadata?.description || option.description,
            },
          ];
        })
      ) as Record<VerifierKind, typeof verifierOptions.trusted & { metadata?: OpenIdCardMetadata }>,
    [verifierMetadata],
  );

  // Polling function
  const pollStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/verify?sessionId=${sessionId}&verifierKind=${selectedVerifier}`);
      if (!response.ok) {
        console.error('Polling error:', await response.text());
        return;
      }

      const data = await response.json();
      console.log('Poll response:', data);

      // Check for completion - adjust based on actual API response structure
      const status = data.session?.status || data.status;
      
      if (status === 'SUCCESSFUL') {
        setVerificationResult({
          status: 'success',
          verifierKind: selectedVerifier,
          credentials: data.session?.presented_credentials,
          policyResults: data.session?.policy_results,
        });
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (status === 'failed' || status === 'FAILED' || status === 'error') {
        setVerificationResult({
          status: 'failed',
          verifierKind: selectedVerifier,
          error: data.session?.failure?.reason || data.error || data.message || 'Verification failed',
          policyResults: data.session?.policy_results,
          failure: data.session?.failure,
          credentials: data.session?.presented_credentials,
        });
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [selectedVerifier, sessionId]);

  // Start polling when sessionId is set
  useEffect(() => {
    if (!sessionId || verificationResult) return;

    // Start polling
    pollingRef.current = setInterval(pollStatus, POLL_INTERVAL);

    // Cleanup on unmount or when sessionId changes
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, verificationResult, pollStatus]);

  const handleCredentialToggle = (credKey: string, checked: boolean) => {
    if (checked) {
      const entry = getCredentialRegistryEntry(credKey);
      if (entry) {
        setSelectedCredentials(prev => [
          ...prev,
          {
            type: credKey,
            claims: entry.claims.map(c => ({ ...c })),
          },
        ]);
      }
    } else {
      setSelectedCredentials(prev => prev.filter(c => c.type !== credKey));
    }
    setQrCodeUrl('');
    setError('');
  };

  const handleVerifierSelect = (verifierKind: VerifierKind) => {
    setSelectedVerifier(verifierKind);
    setQrCodeUrl('');
    setSessionId('');
    setVerificationResult(null);
    setError('');
  };

  const handleClaimToggle = (credType: string, claimPath: string[], checked: boolean) => {
    setSelectedCredentials(prev =>
      prev.map(cred => {
        if (cred.type !== credType) return cred;
        
        if (checked) {
          const entry = getCredentialRegistryEntry(credType);
          const claim = entry?.claims.find(c => JSON.stringify(c.path) === JSON.stringify(claimPath));
          if (claim && !cred.claims.find(c => JSON.stringify(c.path) === JSON.stringify(claimPath))) {
            return { ...cred, claims: [...cred.claims, { ...claim }] };
          }
        } else {
          return {
            ...cred,
            claims: cred.claims.filter(c => JSON.stringify(c.path) !== JSON.stringify(claimPath)),
          };
        }
        return cred;
      })
    );
    setQrCodeUrl('');
  };

  const handleGenerateQR = async () => {
    if (selectedCredentials.length === 0) return;

    setIsLoading(true);
    setError('');
    setVerificationResult(null);

    // Stop any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: selectedCredentials.map(cred => ({
            type: cred.type,
            claims: cred.claims.map(c => ({ path: c.path })),
          })),
          verifierKind: selectedVerifier,
          signedRequest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating verification session');
      }

      const data = await response.json();
      setQrCodeUrl(data.bootstrapAuthorizationRequestUrl);
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setSelectedCredentials([]);
    setQrCodeUrl('');
    setSessionId('');
    setError('');
    setVerificationResult(null);
  };

  const isCredentialSelected = (credKey: string) => 
    selectedCredentials.some(c => c.type === credKey);

  const verifiableCredentials = Object.entries(credentialTypes).filter(
    ([credKey]) => credKey !== 'untrusted_photo_id'
  );

  const isClaimSelected = (credType: string, claimPath: string[]) => {
    const cred = selectedCredentials.find(c => c.type === credType);
    return cred?.claims.some(c => JSON.stringify(c.path) === JSON.stringify(claimPath)) ?? false;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F5F5F5] via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-gov-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to homepage
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-accent text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gov-primary">Verify Identity</h1>
              <p className="text-muted-foreground">
                Request credentials from a user&apos;s wallet to verify their identity
              </p>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <Card className={`mb-6 ${
            verificationResult.status === 'success' 
              ? 'border-green-500/30 bg-green-50' 
              : 'border-red-500/30 bg-red-50'
          }`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {verificationResult.status === 'success' ? (
                  <>
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                    <Badge className={verifierDisplayOptions[verificationResult.verifierKind].badgeClassName}>
                      {verifierDisplayOptions[verificationResult.verifierKind].badge}
                    </Badge>
                    <CardTitle className="text-xl text-green-700">Verification Successful</CardTitle>
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed
                    </Badge>
                    <Badge variant="destructive">
                      Not trust verified
                    </Badge>
                    <CardTitle className="text-xl text-red-700">Verification Failed</CardTitle>
                  </>
                )}
              </div>
              <CardDescription>
                {verificationResult.status === 'success' 
                  ? verificationResult.verifierKind === 'trusted'
                    ? 'The user presented credentials that passed signature and trust-list policies.'
                    : 'The user presented credentials with a valid signature. No trust-list policy was applied.'
                  : verificationResult.failure?.reason || verificationResult.error || 'The verification process failed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationResult.status === 'success' ? (
                <SuccessDisplay 
                  credentials={verificationResult.credentials}
                  policyResults={verificationResult.policyResults}
                />
              ) : (
                <FailureDisplay 
                  failure={verificationResult.failure}
                  policyResults={verificationResult.policyResults}
                />
              )}
            </CardContent>
            <CardContent className="pt-0">
              <Button
                onClick={handleReset}
                variant="outline"
                className={verificationResult.status === 'success' 
                  ? 'border-green-600 text-green-600 hover:bg-green-50'
                  : 'border-red-600 text-red-600 hover:bg-red-50'
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Start new verification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Verifier Selection - hide when showing result */}
        {!verificationResult && (
          <Card className="mb-6 border-gov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-gov-primary">Step 1</Badge>
                <CardTitle className="text-xl text-gov-primary">Select Verifier</CardTitle>
              </div>
              <CardDescription>
                Choose whether the verifier should enforce trust-list validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.entries(verifierDisplayOptions) as [VerifierKind, typeof verifierDisplayOptions.trusted][]).map(([kind, option]) => (
                  <button
                    key={kind}
                    onClick={() => handleVerifierSelect(kind)}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      selectedVerifier === kind
                        ? 'border-gov-accent bg-gov-accent/5'
                        : 'border-gov-primary/20 bg-card hover:border-gov-primary/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          selectedVerifier === kind ? 'bg-gov-accent text-white' : 'bg-gov-accent/10 text-gov-accent'
                        }`}>
                          <MetadataIcon metadata={option.metadata} />
                        </div>
                        <span className="font-semibold text-gov-primary">{option.title}</span>
                      </div>
                      {selectedVerifier === kind && (
                        <CheckCircle2 className="h-5 w-5 text-gov-accent" />
                      )}
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{option.description}</p>
                    <Badge className={option.badgeClassName}>{option.badge}</Badge>
                  </button>
                ))}
              </div>

              {/* Signed Request Option */}
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-gov-primary/20 p-4">
                <Checkbox
                  id="signed-request"
                  checked={signedRequest}
                  onCheckedChange={(checked) => setSignedRequest(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="signed-request" className="font-medium text-gov-primary cursor-pointer">
                    Use Signed Request
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable JAR (JWT-Secured Authorization Request) for the verification request
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credential Selection - hide when showing result */}
        {!verificationResult && (
          <Card className="mb-6 border-gov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-gov-primary">Step 2</Badge>
                <CardTitle className="text-xl text-gov-primary">Select Credentials to Verify</CardTitle>
              </div>
              <CardDescription>
                Choose which credentials you want to request from the user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verifiableCredentials.map(([credKey, credConfig]) => {
                  const Icon = credentialIcons[credKey] || FileText;
                  const entry = getCredentialRegistryEntry(credKey);
                  const isSelected = isCredentialSelected(credKey);

                  return (
                    <div
                      key={credKey}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-gov-primary bg-gov-primary/5'
                          : 'border-gov-primary/20 bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id={`cred-${credKey}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCredentialToggle(credKey, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isSelected ? 'bg-gov-primary text-white' : 'bg-gov-primary/10 text-gov-primary'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <Label 
                                htmlFor={`cred-${credKey}`}
                                className="font-semibold text-gov-primary cursor-pointer"
                              >
                                {credConfig.name}
                              </Label>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {credConfig.format}
                                </Badge>
                                {credKey === 'photo_id' && selectedVerifier === 'trusted' && (
                                  <Badge className="bg-green-600 text-xs">
                                    Trust-list checked
                                  </Badge>
                                )}
                                {credKey === 'photo_id' && selectedVerifier === 'untrusted' && (
                                  <Badge className="bg-amber-600 text-xs">
                                    Not trust verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Claims selection */}
                          {isSelected && entry && (
                            <div className="mt-4 ml-2 space-y-2 border-l-2 border-gov-primary/20 pl-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Select claims to request:
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {entry.claims.map((claim, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`claim-${credKey}-${idx}`}
                                      checked={isClaimSelected(credKey, claim.path)}
                                      onCheckedChange={(checked) => 
                                        handleClaimToggle(credKey, claim.path, checked as boolean)
                                      }
                                    />
                                    <Label 
                                      htmlFor={`claim-${credKey}-${idx}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {claim.label}
                                      {claim.sd && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          SD
                                        </Badge>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate QR Button */}
        {!verificationResult && selectedCredentials.length > 0 && !qrCodeUrl && (
          <div className="mb-8 flex justify-center">
            <Button
              onClick={handleGenerateQR}
              disabled={isLoading || selectedCredentials.every(c => c.claims.length === 0)}
              size="lg"
              className="bg-gov-accent hover:bg-gov-accent/90"
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating verification session...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <QrCode className="mr-2 h-5 w-5" />
                  Generate Verification QR
                </span>
              )}
            </Button>
          </div>
        )}

        {/* QR Code Display - hide when showing result */}
        {!verificationResult && qrCodeUrl && (
          <Card className="mb-6 border-gov-accent/30 bg-gov-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-600">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Waiting
                </Badge>
                <Badge className={verifierDisplayOptions[selectedVerifier].badgeClassName}>
                  {verifierDisplayOptions[selectedVerifier].badge}
                </Badge>
                <CardTitle className="text-xl text-gov-primary">Scan to Present Credentials</CardTitle>
              </div>
              <CardDescription>
                Ask the user to scan this QR code with their Wallet to present their credentials to the {verifierDisplayOptions[selectedVerifier].title.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={qrCodeUrl} action="present" />
              
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for credential presentation...
              </div>
              
              {sessionId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Session: <code className="rounded bg-muted px-2 py-0.5">{sessionId}</code>
                </p>
              )}
              
              <Separator className="my-6" />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gov-accent text-gov-accent hover:bg-gov-accent/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Cancel verification
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
