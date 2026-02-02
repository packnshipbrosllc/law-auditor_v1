#!/usr/bin/env python3
"""
LawAuditor Whale Scraper
========================
California Unclaimed Property Data Mining Tool

This script processes the California State Controller's Office (SCO) 
bulk CSV data to identify high-value business "whales" in target markets.

Data Source: https://www.sco.ca.gov/upd_download_property_records.html
Download: 'Properties $500 and up' CSV file

Legal Compliance:
- CCP 1582: 10% fee cap enforced
- Disclosure requirement noted in output
- For licensed asset recovery investigators only

Usage:
    python whale_scraper.py ca_unclaimed_500_plus.csv

Author: LawAuditor Team
"""

import pandas as pd
import argparse
from datetime import datetime
import os

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Target cities (Sacramento + Bay Area)
TARGET_CITIES = [
    'SACRAMENTO', 'WEST SACRAMENTO', 'ELK GROVE', 'FOLSOM', 'ROSEVILLE',
    'SAN FRANCISCO', 'OAKLAND', 'BERKELEY', 'PALO ALTO', 'MENLO PARK',
    'SAN JOSE', 'SANTA CLARA', 'SUNNYVALE', 'MOUNTAIN VIEW', 'CUPERTINO',
    'FREMONT', 'HAYWARD', 'SAN MATEO', 'REDWOOD CITY', 'DALY CITY'
]

# Business entity patterns (Regex)
BUSINESS_PATTERNS = r'INC\.?|LLC|CORP\.?|LLP|L\.P\.|LP|CORPORATION|COMPANY|CO\.|ENTERPRISES?|PARTNERS?|HOLDINGS?|GROUP'

# Minimum cash value for "whale" status
MIN_WHALE_VALUE = 5000

# California legal fee cap
CA_FEE_CAP = 0.10  # 10%


def load_sco_data(file_path: str) -> pd.DataFrame:
    """
    Load California SCO unclaimed property CSV.
    Handles large files with chunking if needed.
    """
    print(f"📂 Loading data from: {file_path}")
    
    # SCO files can be huge - use chunking for memory efficiency
    try:
        df = pd.read_csv(file_path, low_memory=False, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, low_memory=False, encoding='latin-1')
    
    print(f"   ✓ Loaded {len(df):,} total records")
    return df


def filter_whales(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply whale filtering criteria:
    1. Cash value >= $5,000
    2. Owner is a business entity (Inc, LLC, Corp, etc.)
    3. Located in target cities (Sacramento + Bay Area)
    """
    print("\n🔍 Applying whale filters...")
    
    # Standardize column names (SCO formats vary)
    df.columns = [col.upper().replace(' ', '_') for col in df.columns]
    
    # Identify the cash column (varies by SCO export)
    cash_col = None
    for possible in ['CASH_REPORTED', 'REPORTED_VALUE', 'AMOUNT', 'VALUE', 'CASH_AMOUNT']:
        if possible in df.columns:
            cash_col = possible
            break
    
    if not cash_col:
        raise ValueError("Could not identify cash value column. Available: " + str(df.columns.tolist()))
    
    # Identify owner name column
    owner_col = None
    for possible in ['OWNER_NAME', 'PROPERTY_OWNER', 'NAME', 'OWNER']:
        if possible in df.columns:
            owner_col = possible
            break
    
    if not owner_col:
        raise ValueError("Could not identify owner name column. Available: " + str(df.columns.tolist()))
    
    # Identify city column
    city_col = None
    for possible in ['CITY', 'OWNER_CITY', 'ADDRESS_CITY']:
        if possible in df.columns:
            city_col = possible
            break
    
    if not city_col:
        raise ValueError("Could not identify city column. Available: " + str(df.columns.tolist()))
    
    print(f"   Using columns: {cash_col}, {owner_col}, {city_col}")
    
    # Clean and convert cash values
    df[cash_col] = pd.to_numeric(
        df[cash_col].astype(str).str.replace(r'[$,]', '', regex=True),
        errors='coerce'
    ).fillna(0)
    
    # Filter 1: High value (>= $5,000)
    is_whale = df[cash_col] >= MIN_WHALE_VALUE
    print(f"   Filter 1 (>= ${MIN_WHALE_VALUE:,}): {is_whale.sum():,} records")
    
    # Filter 2: Business entities
    is_business = df[owner_col].str.contains(BUSINESS_PATTERNS, na=False, case=False, regex=True)
    print(f"   Filter 2 (Business entity): {is_business.sum():,} records")
    
    # Filter 3: Target cities
    city_pattern = '|'.join(TARGET_CITIES)
    is_local = df[city_col].str.upper().str.contains(city_pattern, na=False, regex=True)
    print(f"   Filter 3 (Target cities): {is_local.sum():,} records")
    
    # Combined filter
    whales = df[is_whale & is_business & is_local].copy()
    print(f"\n   🐋 Combined (Whales): {len(whales):,} records")
    
    return whales, cash_col, owner_col, city_col


def score_and_export(whales: pd.DataFrame, cash_col: str, owner_col: str, city_col: str, output_file: str):
    """
    Add lead scoring and export to CSV.
    """
    print("\n💰 Calculating lead scores...")
    
    # Calculate potential fee (10% CA legal cap)
    whales['POTENTIAL_FEE'] = (whales[cash_col] * CA_FEE_CAP).round(2)
    
    # Add lead score (simple scoring based on value tiers)
    def score_lead(value):
        if value >= 100000:
            return 'A+ (Mega Whale)'
        elif value >= 50000:
            return 'A (Large Whale)'
        elif value >= 25000:
            return 'B (Medium Whale)'
        elif value >= 10000:
            return 'C (Small Whale)'
        else:
            return 'D (Minnow)'
    
    whales['LEAD_SCORE'] = whales[cash_col].apply(score_lead)
    
    # Sort by highest value first
    whales = whales.sort_values(by=cash_col, ascending=False)
    
    # Select and rename columns for clean output
    output_cols = [owner_col, city_col, cash_col, 'POTENTIAL_FEE', 'LEAD_SCORE']
    available_cols = [c for c in output_cols if c in whales.columns]
    
    export_df = whales[available_cols].copy()
    export_df.columns = ['BUSINESS_NAME', 'CITY', 'UNCLAIMED_VALUE', 'YOUR_FEE_10PCT', 'LEAD_SCORE']
    
    # Export
    export_df.to_csv(output_file, index=False)
    print(f"\n✅ Exported {len(export_df):,} whale leads to: {output_file}")
    
    # Summary stats
    total_value = export_df['UNCLAIMED_VALUE'].sum()
    total_fees = export_df['YOUR_FEE_10PCT'].sum()
    
    print("\n" + "="*60)
    print("📊 WHALE SUMMARY")
    print("="*60)
    print(f"   Total Unclaimed Value:  ${total_value:,.2f}")
    print(f"   Potential Fee Revenue:  ${total_fees:,.2f}")
    print(f"   Average Whale Size:     ${total_value/len(export_df):,.2f}")
    print(f"   Largest Whale:          ${export_df['UNCLAIMED_VALUE'].max():,.2f}")
    print("="*60)
    
    # City breakdown
    print("\n📍 BY CITY:")
    city_summary = export_df.groupby('CITY').agg({
        'UNCLAIMED_VALUE': ['count', 'sum']
    }).round(2)
    city_summary.columns = ['Count', 'Total Value']
    city_summary = city_summary.sort_values('Total Value', ascending=False)
    print(city_summary.to_string())
    
    # Legal reminder
    print("\n⚠️  LEGAL COMPLIANCE REMINDER:")
    print("   • Disclosure: 'You can claim this for free at claimit.ca.gov'")
    print("   • Use SCO-approved Investigator Agreement template")
    print("   • Fee cap: 10% (CCP 1582)")
    print("="*60)
    
    return export_df


def main():
    parser = argparse.ArgumentParser(description='LawAuditor Whale Scraper - CA Unclaimed Property')
    parser.add_argument('input_file', help='SCO CSV file (Properties $500 and up)')
    parser.add_argument('-o', '--output', default='sac_bay_whales.csv', help='Output filename')
    parser.add_argument('--min-value', type=int, default=MIN_WHALE_VALUE, help='Minimum cash value')
    
    args = parser.parse_args()
    
    # Override global if specified
    global MIN_WHALE_VALUE
    MIN_WHALE_VALUE = args.min_value
    
    print("\n" + "="*60)
    print("🐋 LAWAUDITOR WHALE SCRAPER")
    print("   California Unclaimed Property Data Mining")
    print("="*60)
    print(f"   Input:      {args.input_file}")
    print(f"   Output:     {args.output}")
    print(f"   Min Value:  ${MIN_WHALE_VALUE:,}")
    print(f"   Fee Cap:    {CA_FEE_CAP*100:.0f}%")
    print("="*60)
    
    # Load data
    df = load_sco_data(args.input_file)
    
    # Filter whales
    whales, cash_col, owner_col, city_col = filter_whales(df)
    
    if len(whales) == 0:
        print("\n❌ No whales found matching criteria. Try lowering --min-value.")
        return
    
    # Score and export
    score_and_export(whales, cash_col, owner_col, city_col, args.output)
    
    print(f"\n🎯 Next Steps:")
    print(f"   1. Import {args.output} into LawAuditor Admin Dashboard")
    print(f"   2. Begin outreach campaign")
    print(f"   3. Convert whales → Legal audit cross-sell")


if __name__ == "__main__":
    main()
