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
  primaryState: 'TX' as StateCode,
};

export const STATE_METADATA: Record<string, StateMetadata> = {
  texas: {
    name: 'Texas',
    aiActName: 'Texas Responsible AI Governance Act',
    complianceRefs: ['TX Rule 1.04', 'Texas Bar Guidelines'],
    regionalTies: 'Built for the demanding legal markets of Houston and Tampa.',
    rule: 'Texas Rule 1.04',
    address: SITE_CONFIG.address,
    disclosureText: `In accordance with the ${SITE_CONFIG.primaryState === 'TX' ? 'Texas Responsible AI Governance Act' : 'AI Transparency Standards'}, LawAuditor is strictly a data-processing tool. All outputs must be reviewed by a licensed attorney (Human-in-the-Loop) who remains responsible for all findings and subsequent actions.`,
  },
  california: {
    name: 'California',
    aiActName: 'California AI Transparency Act (SB 37)',
    complianceRefs: ['CCPA', 'CPRA', 'CA SB 37', 'AB 316'],
    regionalTies: 'Optimized for Silicon Valley and Los Angeles innovation.',
    rule: 'CA SB 37 Compliance',
    address: SITE_CONFIG.address,
    disclosureText: `In accordance with the California AI Transparency Act (SB 37) and AB 316, LawAuditor is a software-first analysis tool. The user remains the definitive Decision Maker, and all results require an independent human review by a qualified legal professional.`,
  },
  florida: {
    name: 'Florida',
    aiActName: 'Florida AI Ethics Standards',
    complianceRefs: ['FL Rule 4-1.5', 'Florida Bar Guidelines'],
    regionalTies: 'Serving the Miami and Tampa legal ecosystems.',
    rule: 'Florida Rule 4-1.5',
    address: SITE_CONFIG.address,
    disclosureText: `Aligned with Florida AI Ethics Standards, LawAuditor provides automated assistance for Rule 4-1.5 verification. It is not a substitute for professional legal judgment; human review of all software-generated inconsistencies is mandatory.`,
  },
};

export function getActiveStateMetadata(stateKey?: string): StateMetadata {
  const normalizedKey = stateKey?.toLowerCase() || SITE_CONFIG.primaryState.toLowerCase();
  // Map 'tx' to 'texas' etc if needed, but the keys in STATE_METADATA are full names
  const mapping: Record<string, string> = {
    tx: 'texas',
    ca: 'california',
    fl: 'florida',
    texas: 'texas',
    california: 'california',
    florida: 'florida'
  };
  const key = mapping[normalizedKey] || 'texas';
  return STATE_METADATA[key];
}
