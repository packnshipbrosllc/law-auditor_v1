/**
 * Lead Scoring - "Unfair Advantage" Logic
 * ========================================
 * 
 * Score deceased estate leads based on potential value and opportunity.
 * 
 * Based on:
 * - California CCP 1582 requirements
 * - Investigator Handbook best practices
 * - Competitive advantage analysis
 */

import type { HeirInfo, LeadPriority } from '@/lib/db';

/**
 * Score a lead based on the "Unfair Advantage" logic:
 * 
 * HIGH PRIORITY if:
 * - Relation To Property is "Decedent" (confirmed deceased owner)
 * - No Heirs are listed (opportunity to find heirs first)
 * - Amount is >= $25,000 (higher value = higher priority)
 * 
 * MEDIUM PRIORITY if:
 * - Relation is "Decedent" but heirs ARE listed
 * - Amount is >= $10,000 but < $25,000
 * 
 * LOW PRIORITY if:
 * - Relation is NOT "Decedent" (may be heir already claiming)
 * - Heirs are listed and verified
 * 
 * Per Investigator Handbook:
 * - Focus on high-value leads where you can add value
 * - Leads with no known heirs = competitive advantage
 * - CCP 1582 requires 10% fee cap
 * 
 * @param relationToProperty - The relation field from SCO CSV
 * @param heirsListed - Raw heirs string from CSV
 * @param heirs - Parsed heir information array
 * @param amount - Current balance
 * @returns Priority level and reason
 */
export function scoreLead(
  relationToProperty: string,
  heirsListed: string,
  heirs: HeirInfo[],
  amount: number
): { priority: LeadPriority; reason: string } {
  const isDecedent = relationToProperty.toLowerCase().includes('decedent');
  const hasHeirs = heirs.length > 0 || 
    (heirsListed && 
     heirsListed.toLowerCase() !== 'none' && 
     heirsListed.toLowerCase() !== 'no' &&
     heirsListed !== '-' &&
     heirsListed.trim() !== '');
  const isHighValue = amount >= 25000;
  const isMediumValue = amount >= 10000;
  
  // ═══════════════════════════════════════════════════════════════════════
  // HIGH PRIORITY: Decedent + No Heirs + High Value
  // This is the "Unfair Advantage" - you can find heirs before competitors
  // ═══════════════════════════════════════════════════════════════════════
  if (isDecedent && !hasHeirs && isHighValue) {
    return {
      priority: 'HIGH',
      reason: 'Decedent property with no known heirs - High value ($25k+)',
    };
  }
  
  // HIGH PRIORITY: Decedent + No Heirs (any amount above threshold)
  if (isDecedent && !hasHeirs) {
    return {
      priority: 'HIGH',
      reason: 'Decedent property with no known heirs - Skip-trace opportunity',
    };
  }
  
  // HIGH PRIORITY: Very high value even with heirs listed
  if (isDecedent && amount >= 50000) {
    return {
      priority: 'HIGH',
      reason: `High value property ($${amount.toLocaleString()}) - Worth pursuing even with heirs listed`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MEDIUM PRIORITY: Decedent with heirs, or medium value
  // ═══════════════════════════════════════════════════════════════════════
  if (isDecedent && hasHeirs && isMediumValue) {
    return {
      priority: 'MEDIUM',
      reason: 'Decedent property with heirs listed - Contact heirs for representation',
    };
  }
  
  if (isDecedent) {
    return {
      priority: 'MEDIUM',
      reason: 'Confirmed decedent property',
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LOW PRIORITY: Not clearly a decedent, or heirs already active
  // ═══════════════════════════════════════════════════════════════════════
  if (!isDecedent && hasHeirs) {
    return {
      priority: 'LOW',
      reason: 'Heirs may already be claiming - lower opportunity',
    };
  }
  
  return {
    priority: 'LOW',
    reason: 'Relation to property unclear',
  };
}

/**
 * Determine if a lead is "High Priority - No Known Heir"
 * This is the key "Unfair Advantage" indicator.
 */
export function isHighPriorityNoHeir(
  relationToProperty: string,
  heirsListed: string,
  heirs: HeirInfo[]
): boolean {
  const isDecedent = relationToProperty.toLowerCase().includes('decedent');
  const hasHeirs = heirs.length > 0 || 
    (heirsListed && 
     heirsListed.toLowerCase() !== 'none' && 
     heirsListed.toLowerCase() !== 'no' &&
     heirsListed !== '-' &&
     heirsListed.trim() !== '');
  
  return isDecedent && !hasHeirs;
}

/**
 * Calculate potential fee based on amount.
 * CCP 1582 caps fees at 10%.
 */
export function calculateFee(amount: number, feePercentage: number = 0.10): number {
  // Ensure fee doesn't exceed 10% (CCP 1582)
  const cappedPercentage = Math.min(feePercentage, 0.10);
  return amount * cappedPercentage;
}
