export type StateCode = 'TX' | 'CA' | 'FL';

export interface StateMetadata {
  name: string;
  aiActName: string;
  complianceRefs: string[];
  regionalTies: string;
  rule: string;
  address: string;
  disclosureText: string;
}

export const SITE_CONFIG = {
  companyName: 'LawAuditor',
  entityName: 'LawAuditor (A Technology Platform)',
  address: '1809 S Street, Suite 101, #204, Sacramento, CA 95811',
  primaryState: 'CA' as StateCode,
};

export const STATE_METADATA: Record<string, StateMetadata> = {
  texas: {
    name: 'Texas',
    aiActName: 'Texas Responsible AI Governance Act (SB 1311)',
    complianceRefs: ['SB 1311', 'TX Rule 1.04'],
    regionalTies: 'Built for the demanding legal markets of Houston and Tampa.',
    rule: 'Texas SB 1311 Standards',
    address: SITE_CONFIG.address,
    disclosureText: `In accordance with Texas SB 1311 and Rule 1.04, LawAuditor is strictly a data-processing tool. All outputs must be reviewed by a licensed attorney (Human-in-the-Loop) who remains responsible for all findings.`,
  },
  california: {
    name: 'California',
    aiActName: 'California AI Transparency Act (AB 853)',
    complianceRefs: ['AB 853', 'SB 37', 'AB 316'],
    regionalTies: 'Optimized for Silicon Valley and Los Angeles innovation.',
    rule: 'CA AB 853 Compliance',
    address: SITE_CONFIG.address,
    disclosureText: `In accordance with CA AB 853 and SB 37, LawAuditor is a software-first analysis tool. The user remains the definitive Decision Maker, and all results require an independent human review.`,
  },
  florida: {
    name: 'Florida',
    aiActName: 'Florida AI Ethics Standards (Rule 4-1.5)',
    complianceRefs: ['FL Rule 4-1.5', 'Bar Guidelines'],
    regionalTies: 'Serving the Miami and Tampa legal ecosystems.',
    rule: 'Florida Rule 4-1.5',
    address: SITE_CONFIG.address,
    disclosureText: `Aligned with Florida Rule 4-1.5, LawAuditor provides automated assistance for fee-transparency verification. It is not a substitute for professional legal judgment; human review is mandatory.`,
  },
};

export function getActiveStateMetadata(stateKey?: string): StateMetadata {
  let resolvedKey = stateKey;
  
  if (typeof window !== 'undefined' && !resolvedKey) {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user-state='))
      ?.split('=')[1];
    resolvedKey = cookieValue;
  }

  const normalizedKey = resolvedKey?.toLowerCase() || 'ca'; // Default to CA for Sacramento testing
  
  const mapping: Record<string, string> = {
    tx: 'texas',
    ca: 'california',
    fl: 'florida',
    texas: 'texas',
    california: 'california',
    florida: 'florida'
  };
  
  const key = mapping[normalizedKey] || 'california';
  return STATE_METADATA[key];
}
