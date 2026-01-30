/**
 * LawAuditor Professional Violation Engine
 * Parses LEDES 1998B pipe-delimited files and enforces "Big Three" audit rules
 * with full ABA Model Rule 1.5 and State Bar compliance citations.
 */

export interface LedesEntry {
  id: string;
  invoiceDate: string;
  invoiceNumber: string;
  clientMatterId: string;
  timekeeperId: string;
  timekeeperName: string;
  timekeeperClassification: string;
  taskCode: string;
  activityCode: string;
  expenseCode: string;
  description: string;
  units: number;        // Hours billed
  rate: number;         // Hourly rate
  lineTotal: number;    // units * rate
  rawLine: string;      // Original line for audit trail
}

export interface AuditFlag {
  id: string;
  type: 'Block Billing' | 'Administrative Overhead' | 'Vague Entry' | 'Excessive Time' | 'Duplicate Entry';
  severity: 'critical' | 'high' | 'medium';
  originalEntry: string;
  description: string;
  legalCitation: string;
  suggestedAction: string;
  leakageAmount: number;
  confidence: number;   // 0-100 confidence score
}

/**
 * LEDES 1998B Column Mapping (pipe-delimited)
 * Standard columns: INVOICE_DATE|INVOICE_NUMBER|CLIENT_ID|CLIENT_MATTER_ID|TIMEKEEPER_ID|
 * TIMEKEEPER_NAME|TIMEKEEPER_CLASSIFICATION|TASK_BASED_CODE|ACTIVITY_CODE|EXPENSE_CODE|
 * LINE_ITEM_NUMBER|EXP/FEE/INV_ADJ_TYPE|LINE_ITEM_NUMBER_OF_UNITS|LINE_ITEM_ADJUSTMENT_AMOUNT|
 * LINE_ITEM_TOTAL|LINE_ITEM_DATE|LINE_ITEM_TASK_DESCRIPTION|LAW_FIRM_ID|LINE_ITEM_UNIT_COST
 */
const LEDES_COLUMN_MAP = {
  INVOICE_DATE: 0,
  INVOICE_NUMBER: 1,
  CLIENT_MATTER_ID: 3,
  TIMEKEEPER_ID: 4,
  TIMEKEEPER_NAME: 5,
  TIMEKEEPER_CLASSIFICATION: 6,
  TASK_CODE: 7,
  ACTIVITY_CODE: 8,
  EXPENSE_CODE: 9,
  UNITS: 12,
  LINE_TOTAL: 14,
  DESCRIPTION: 16,
  UNIT_COST: 18,
};

/**
 * Robust LEDES 1998B Parser
 * Handles pipe-delimited format with header detection and column mapping
 */
export function parseLedes1998B(rawText: string): LedesEntry[] {
  const entries: LedesEntry[] = [];
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Skip header row if present (contains "INVOICE_DATE" or similar)
  const startIdx = lines[0]?.toUpperCase().includes('INVOICE') ? 1 : 0;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split('|');
    
    // Skip malformed lines
    if (columns.length < 15) continue;
    
    const units = parseFloat(columns[LEDES_COLUMN_MAP.UNITS]) || 0;
    const rate = parseFloat(columns[LEDES_COLUMN_MAP.UNIT_COST]) || 0;
    const lineTotal = parseFloat(columns[LEDES_COLUMN_MAP.LINE_TOTAL]) || (units * rate);
    
    entries.push({
      id: `LEDES-${i}-${Date.now()}`,
      invoiceDate: columns[LEDES_COLUMN_MAP.INVOICE_DATE]?.trim() || '',
      invoiceNumber: columns[LEDES_COLUMN_MAP.INVOICE_NUMBER]?.trim() || '',
      clientMatterId: columns[LEDES_COLUMN_MAP.CLIENT_MATTER_ID]?.trim() || '',
      timekeeperId: columns[LEDES_COLUMN_MAP.TIMEKEEPER_ID]?.trim() || '',
      timekeeperName: columns[LEDES_COLUMN_MAP.TIMEKEEPER_NAME]?.trim() || '',
      timekeeperClassification: columns[LEDES_COLUMN_MAP.TIMEKEEPER_CLASSIFICATION]?.trim() || '',
      taskCode: columns[LEDES_COLUMN_MAP.TASK_CODE]?.trim() || '',
      activityCode: columns[LEDES_COLUMN_MAP.ACTIVITY_CODE]?.trim() || '',
      expenseCode: columns[LEDES_COLUMN_MAP.EXPENSE_CODE]?.trim() || '',
      description: columns[LEDES_COLUMN_MAP.DESCRIPTION]?.trim() || '',
      units,
      rate,
      lineTotal,
      rawLine: line,
    });
  }
  
  return entries;
}

/**
 * Fallback parser for non-LEDES formats (CSV, plain text)
 * Attempts to extract billing entries from various formats
 */
export function parseGenericBilling(rawText: string): LedesEntry[] {
  const entries: LedesEntry[] = [];
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Detect delimiter (pipe, comma, tab)
  const firstDataLine = lines.find(l => !l.toLowerCase().includes('date') && l.trim());
  const delimiter = firstDataLine?.includes('|') ? '|' : 
                    firstDataLine?.includes('\t') ? '\t' : ',';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('date') && i === 0) continue; // Skip header
    
    const columns = line.split(delimiter).map(c => c.trim());
    if (columns.length < 3) continue;
    
    // Try to extract hours and rate from various column positions
    const numbers = columns.map(c => parseFloat(c.replace(/[$,]/g, ''))).filter(n => !isNaN(n));
    const units = numbers.find(n => n > 0 && n <= 24) || 1; // Hours likely 0-24
    const rate = numbers.find(n => n >= 100 && n <= 2000) || 450; // Rate likely $100-$2000
    
    // Description is usually the longest text field
    const description = columns.reduce((longest, col) => 
      col.length > longest.length && isNaN(parseFloat(col)) ? col : longest, '');
    
    if (description) {
      entries.push({
        id: `GEN-${i}-${Date.now()}`,
        invoiceDate: columns[0] || '',
        invoiceNumber: '',
        clientMatterId: '',
        timekeeperId: '',
        timekeeperName: columns[1] || 'Unknown',
        timekeeperClassification: '',
        taskCode: '',
        activityCode: '',
        expenseCode: '',
        description,
        units,
        rate,
        lineTotal: units * rate,
        rawLine: line,
      });
    }
  }
  
  return entries;
}

/**
 * THE BIG THREE VIOLATION ENGINE
 * Professional audit logic with full legal citations
 */
export function analyzeLineItems(data: LedesEntry[]): AuditFlag[] {
  const flags: AuditFlag[] = [];
  let flagCounter = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 1: BLOCK BILLING DETECTION
  // ABA Model Rule 1.5(a) - Fees must be reasonable and transparent
  // ═══════════════════════════════════════════════════════════════════════════
  const blockBillingPatterns = [
    /\b(and|&)\b/gi,           // Conjunctions indicating multiple tasks
    /;/g,                       // Semicolons often separate tasks
    /\b(also|additionally)\b/gi,
    /\b(then|thereafter)\b/gi,
    /\b(including|as well as)\b/gi,
  ];

  data.forEach((entry) => {
    const hasMultipleTasks = blockBillingPatterns.some(pattern => pattern.test(entry.description));
    const isLongEntry = entry.units > 2.0;
    
    if (hasMultipleTasks && isLongEntry) {
      // Count approximate number of tasks
      const taskCount = (entry.description.match(/\b(and|&|;|also|then)\b/gi) || []).length + 1;
      const estimatedLeakage = entry.lineTotal * (0.15 * Math.min(taskCount, 4)); // Up to 60% for 4+ tasks
      
      flags.push({
        id: `FLAG-${++flagCounter}`,
        type: 'Block Billing',
        severity: 'critical',
        originalEntry: entry.description,
        description: `Entry of ${entry.units} hours contains approximately ${taskCount} distinct tasks bundled together. Block billing obscures the reasonableness of individual task durations and prevents meaningful audit.`,
        legalCitation: 'ABA Model Rule 1.5(a): "A lawyer shall not make an agreement for, charge, or collect an unreasonable fee." Block billing impedes verification of reasonableness. See also CA State Bar Formal Op. 2007-168.',
        suggestedAction: 'Request itemized breakdown of each task with individual time allocations. Apply 15-25% reduction pending clarification.',
        leakageAmount: estimatedLeakage,
        confidence: 92,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 2: ADMINISTRATIVE OVERHEAD DETECTION
  // OCG Standard: Clerical tasks are non-billable overhead
  // ═══════════════════════════════════════════════════════════════════════════
  const adminKeywords = [
    { pattern: /\b(filing|file)\b/i, weight: 1.0 },
    { pattern: /\b(copying|photocopying|photocopy)\b/i, weight: 1.0 },
    { pattern: /\b(scanning|scan)\b/i, weight: 1.0 },
    { pattern: /\b(mailing|mail|postage)\b/i, weight: 1.0 },
    { pattern: /\b(scheduling|schedule|calendar)\b/i, weight: 0.8 },
    { pattern: /\b(organizing|organized|organization)\b/i, weight: 0.9 },
    { pattern: /\b(data entry|input)\b/i, weight: 1.0 },
    { pattern: /\b(bates|stamping|stamp)\b/i, weight: 0.9 },
    { pattern: /\b(indexing|index)\b/i, weight: 0.8 },
    { pattern: /\b(clerical)\b/i, weight: 1.0 },
  ];

  data.forEach((entry) => {
    let adminScore = 0;
    const matchedKeywords: string[] = [];
    
    adminKeywords.forEach(({ pattern, weight }) => {
      if (pattern.test(entry.description)) {
        adminScore += weight;
        const match = entry.description.match(pattern);
        if (match) matchedKeywords.push(match[0]);
      }
    });
    
    if (adminScore >= 0.8) {
      flags.push({
        id: `FLAG-${++flagCounter}`,
        type: 'Administrative Overhead',
        severity: 'high',
        originalEntry: entry.description,
        description: `Administrative/clerical task "${matchedKeywords.join(', ')}" billed at professional rate ($${entry.rate}/hr). These tasks should be absorbed as firm overhead, not charged at attorney rates.`,
        legalCitation: 'ABA Formal Op. 93-379: Clerical and secretarial services should not be billed separately. TX Disciplinary Rule 1.04(a): Fees must be reasonable and not include non-legal overhead.',
        suggestedAction: 'Deduct full amount. Administrative tasks are non-billable overhead per standard OCG provisions.',
        leakageAmount: entry.lineTotal,
        confidence: 88,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 3: VAGUE ENTRY DETECTION
  // OCG Standard: Descriptions must be sufficiently detailed for audit
  // ═══════════════════════════════════════════════════════════════════════════
  const vaguePatterns = [
    /^(email|call|conference|meeting|review|research|draft|work|attention)$/i,
    /^(misc|miscellaneous|various|general|other)$/i,
    /^(continued|cont|cont'd)$/i,
  ];

  data.forEach((entry) => {
    const wordCount = entry.description.split(/\s+/).filter(Boolean).length;
    const isVagueKeyword = vaguePatterns.some(p => p.test(entry.description.trim()));
    
    if (wordCount < 4 || isVagueKeyword) {
      const haircut = entry.lineTotal * 0.15; // 15% administrative haircut
      
      flags.push({
        id: `FLAG-${++flagCounter}`,
        type: 'Vague Entry',
        severity: 'medium',
        originalEntry: entry.description,
        description: `Entry "${entry.description}" contains only ${wordCount} words and lacks sufficient detail to verify that work was performed or assess its necessity.`,
        legalCitation: 'ABA Model Rule 1.5 Comment [1]: Clients must be able to understand the services rendered. FL Bar Rule 4-1.5: Billing must enable client to assess reasonableness.',
        suggestedAction: 'Request detailed description. If not provided, apply 15% administrative haircut pending clarification.',
        leakageAmount: haircut,
        confidence: 75,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS: EXCESSIVE TIME DETECTION
  // Industry benchmark violations
  // ═══════════════════════════════════════════════════════════════════════════
  const excessiveTimePatterns = [
    { pattern: /\b(email|e-mail)\b/i, maxHours: 0.5, benchmark: '0.3 hours per email' },
    { pattern: /\b(voicemail|voice mail)\b/i, maxHours: 0.2, benchmark: '0.1 hours per voicemail' },
    { pattern: /\b(letter|correspondence)\b/i, maxHours: 1.0, benchmark: '0.5-1.0 hours per letter' },
  ];

  data.forEach((entry) => {
    excessiveTimePatterns.forEach(({ pattern, maxHours, benchmark }) => {
      if (pattern.test(entry.description) && entry.units > maxHours * 2) {
        const excess = entry.units - maxHours;
        const leakage = excess * entry.rate;
        
        flags.push({
          id: `FLAG-${++flagCounter}`,
          type: 'Excessive Time',
          severity: 'high',
          originalEntry: entry.description,
          description: `${entry.units} hours billed for task typically requiring ${benchmark}. Excess time of ${excess.toFixed(1)} hours flagged.`,
          legalCitation: 'ABA Model Rule 1.5(a)(1): Time and labor required for the matter. OCG Benchmark: Industry standard timing expectations.',
          suggestedAction: `Reduce to benchmark maximum of ${maxHours} hours or provide justification for extended time.`,
          leakageAmount: leakage,
          confidence: 70,
        });
      }
    });
  });

  return flags;
}

/**
 * Master Analysis Function
 * Automatically detects format and processes billing data
 */
export function processAuditData(rawText: string): {
  entries: LedesEntry[];
  violations: AuditFlag[];
  totalBilled: number;
  totalLeakage: number;
  summaryStats: {
    totalEntries: number;
    flaggedEntries: number;
    criticalFlags: number;
    highFlags: number;
    mediumFlags: number;
  };
} {
  // Detect and parse format
  const isLedes = rawText.includes('|') && 
                  (rawText.toUpperCase().includes('INVOICE') || rawText.split('|').length > 10);
  
  const entries = isLedes ? parseLedes1998B(rawText) : parseGenericBilling(rawText);
  const violations = analyzeLineItems(entries);
  
  const totalBilled = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  const totalLeakage = violations.reduce((sum, v) => sum + v.leakageAmount, 0);
  
  return {
    entries,
    violations,
    totalBilled,
    totalLeakage,
    summaryStats: {
      totalEntries: entries.length,
      flaggedEntries: new Set(violations.map(v => v.originalEntry)).size,
      criticalFlags: violations.filter(v => v.severity === 'critical').length,
      highFlags: violations.filter(v => v.severity === 'high').length,
      mediumFlags: violations.filter(v => v.severity === 'medium').length,
    },
  };
}
