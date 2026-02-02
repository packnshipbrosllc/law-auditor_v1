#!/usr/bin/env python3
"""
LawAuditor Whale Scraper v2.0
=============================
California Unclaimed Property Data Mining + Lead Enrichment

This script processes the California State Controller's Office (SCO) 
bulk CSV data to identify high-value business "whales" and enriches
them with decision-maker contact information via Apollo.io API.

Data Source: https://www.sco.ca.gov/upd_download_property_records.html
Download: 'Properties $500 and up' CSV file

Features:
- Filters for Sacramento + Bay Area businesses with $5k+ unclaimed
- Enriches with CEO/CFO/Owner contact info via Apollo.io
- Outputs ready-to-dial lead list with emails, phones, LinkedIn

Legal Compliance:
- CCP 1582: 10% fee cap enforced
- Disclosure requirement noted in output
- For licensed asset recovery investigators only

Usage:
    # Basic (no enrichment)
    python whale_scraper.py ca_unclaimed_500_plus.csv
    
    # With Apollo.io enrichment
    python whale_scraper.py ca_unclaimed_500_plus.csv --enrich --apollo-key YOUR_API_KEY

    # Limit results
    python whale_scraper.py ca_unclaimed_500_plus.csv --enrich --limit 100

Author: LawAuditor Team
"""

import pandas as pd
import argparse
import requests
import time
import os
import json
from datetime import datetime
from typing import Optional, Dict, List, Tuple

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

# Target decision-maker titles for enrichment
TARGET_TITLES = [
    'CEO', 'Chief Executive Officer',
    'CFO', 'Chief Financial Officer', 
    'Owner', 'Co-Owner',
    'President',
    'Controller', 'Comptroller',
    'Managing Partner', 'Managing Director',
    'Founder', 'Co-Founder',
    'General Counsel', 'Chief Legal Officer'
]

# Minimum cash value for "whale" status
MIN_WHALE_VALUE = 5000

# California legal fee cap
CA_FEE_CAP = 0.10  # 10%

# Default limit for enriched leads (200 for maximum pipeline)
DEFAULT_LEAD_LIMIT = 200

# API rate limiting
APOLLO_RATE_LIMIT_DELAY = 0.5  # seconds between requests


# ═══════════════════════════════════════════════════════════════════════════
# APOLLO.IO API INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════

class ApolloEnricher:
    """
    Apollo.io API client for lead enrichment.
    
    API Docs: https://apolloio.github.io/apollo-api-docs/
    
    Pricing: Apollo has a free tier with 50 credits/month.
    Each people search costs ~1 credit.
    """
    
    BASE_URL = "https://api.apollo.io/v1"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        })
    
    def search_organization(self, company_name: str, city: str = None) -> Optional[Dict]:
        """
        Search for an organization by name.
        Returns organization ID for people search.
        """
        try:
            # Clean company name for search
            clean_name = self._clean_company_name(company_name)
            
            payload = {
                "api_key": self.api_key,
                "q_organization_name": clean_name,
                "per_page": 1
            }
            
            if city:
                payload["organization_locations"] = [city.title()]
            
            response = self.session.post(
                f"{self.BASE_URL}/mixed_companies/search",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('organizations') and len(data['organizations']) > 0:
                    return data['organizations'][0]
            
            return None
            
        except Exception as e:
            print(f"      ⚠️ Org search error: {e}")
            return None
    
    def search_people(self, company_name: str, city: str = None) -> Optional[Dict]:
        """
        Search for decision-makers at a company.
        Returns best matching contact with title, email, phone.
        """
        try:
            # Clean company name
            clean_name = self._clean_company_name(company_name)
            
            payload = {
                "api_key": self.api_key,
                "q_organization_name": clean_name,
                "person_titles": TARGET_TITLES,
                "per_page": 5  # Get top 5, we'll pick the best
            }
            
            if city:
                payload["person_locations"] = [city.title()]
            
            response = self.session.post(
                f"{self.BASE_URL}/mixed_people/search",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                people = data.get('people', [])
                
                if people:
                    # Score and rank by title priority
                    return self._pick_best_contact(people)
            
            return None
            
        except Exception as e:
            print(f"      ⚠️ People search error: {e}")
            return None
    
    def _clean_company_name(self, name: str) -> str:
        """Remove common suffixes for better matching."""
        import re
        # Remove entity suffixes
        cleaned = re.sub(r'\s+(INC\.?|LLC|CORP\.?|LLP|L\.P\.|LP|CORPORATION|COMPANY|CO\.)$', '', name, flags=re.IGNORECASE)
        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())
        return cleaned
    
    def _pick_best_contact(self, people: List[Dict]) -> Optional[Dict]:
        """
        Rank contacts by title priority.
        CEO > CFO > Owner > President > Controller > Others
        """
        title_priority = {
            'ceo': 1, 'chief executive': 1,
            'cfo': 2, 'chief financial': 2,
            'owner': 3, 'co-owner': 3,
            'president': 4,
            'controller': 5, 'comptroller': 5,
            'founder': 6, 'co-founder': 6,
            'managing partner': 7, 'managing director': 7,
            'general counsel': 8, 'chief legal': 8
        }
        
        def score_contact(person):
            title = (person.get('title') or '').lower()
            for keyword, priority in title_priority.items():
                if keyword in title:
                    return priority
            return 100  # Low priority for unknown titles
        
        # Sort by priority
        sorted_people = sorted(people, key=score_contact)
        
        if sorted_people:
            best = sorted_people[0]
            return {
                'name': best.get('name'),
                'title': best.get('title'),
                'email': best.get('email'),
                'phone': best.get('phone_numbers', [{}])[0].get('sanitized_number') if best.get('phone_numbers') else None,
                'linkedin': best.get('linkedin_url'),
                'company_match': best.get('organization', {}).get('name')
            }
        
        return None


class HunterEnricher:
    """
    Hunter.io API client as fallback enrichment.
    
    API Docs: https://hunter.io/api-documentation
    
    Pricing: 25 free searches/month, then $49/month for 500.
    """
    
    BASE_URL = "https://api.hunter.io/v2"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def search_domain(self, company_name: str) -> Optional[Dict]:
        """
        Find company domain and emails.
        """
        try:
            # First, find the domain
            response = requests.get(
                f"{self.BASE_URL}/domain-search",
                params={
                    "api_key": self.api_key,
                    "company": company_name
                }
            )
            
            if response.status_code == 200:
                data = response.json().get('data', {})
                emails = data.get('emails', [])
                
                # Find decision-maker
                for email in emails:
                    title = (email.get('position') or '').lower()
                    if any(t.lower() in title for t in TARGET_TITLES):
                        return {
                            'name': f"{email.get('first_name', '')} {email.get('last_name', '')}".strip(),
                            'title': email.get('position'),
                            'email': email.get('value'),
                            'phone': email.get('phone_number'),
                            'linkedin': email.get('linkedin'),
                            'company_match': company_name
                        }
                
                # Fallback to first email if no title match
                if emails:
                    email = emails[0]
                    return {
                        'name': f"{email.get('first_name', '')} {email.get('last_name', '')}".strip(),
                        'title': email.get('position'),
                        'email': email.get('value'),
                        'phone': email.get('phone_number'),
                        'linkedin': email.get('linkedin'),
                        'company_match': company_name
                    }
            
            return None
            
        except Exception as e:
            print(f"      ⚠️ Hunter error: {e}")
            return None


# ═══════════════════════════════════════════════════════════════════════════
# DATA PROCESSING
# ═══════════════════════════════════════════════════════════════════════════

def load_sco_data(file_path: str) -> pd.DataFrame:
    """
    Load California SCO unclaimed property CSV.
    Handles large files with chunking if needed.
    """
    print(f"📂 Loading data from: {file_path}")
    
    try:
        df = pd.read_csv(file_path, low_memory=False, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, low_memory=False, encoding='latin-1')
    
    print(f"   ✓ Loaded {len(df):,} total records")
    return df


def identify_columns(df: pd.DataFrame) -> Tuple[str, str, str]:
    """
    Auto-detect column names from various SCO export formats.
    """
    df.columns = [col.upper().replace(' ', '_') for col in df.columns]
    
    # Cash column
    cash_col = None
    for possible in ['CASH_REPORTED', 'REPORTED_VALUE', 'AMOUNT', 'VALUE', 'CASH_AMOUNT']:
        if possible in df.columns:
            cash_col = possible
            break
    
    if not cash_col:
        raise ValueError(f"Could not identify cash column. Available: {df.columns.tolist()}")
    
    # Owner name column
    owner_col = None
    for possible in ['OWNER_NAME', 'PROPERTY_OWNER', 'NAME', 'OWNER']:
        if possible in df.columns:
            owner_col = possible
            break
    
    if not owner_col:
        raise ValueError(f"Could not identify owner column. Available: {df.columns.tolist()}")
    
    # City column
    city_col = None
    for possible in ['CITY', 'OWNER_CITY', 'ADDRESS_CITY']:
        if possible in df.columns:
            city_col = possible
            break
    
    if not city_col:
        raise ValueError(f"Could not identify city column. Available: {df.columns.tolist()}")
    
    return cash_col, owner_col, city_col


def filter_whales(df: pd.DataFrame, limit: int = None) -> pd.DataFrame:
    """
    Apply whale filtering criteria and return top leads.
    """
    print("\n🔍 Applying whale filters...")
    
    cash_col, owner_col, city_col = identify_columns(df)
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
    
    # Sort by value (highest first)
    whales = whales.sort_values(by=cash_col, ascending=False)
    
    # Apply limit
    if limit:
        whales = whales.head(limit)
    
    print(f"\n   🐋 Combined (Whales): {len(whales):,} records")
    
    return whales, cash_col, owner_col, city_col


def enrich_leads(whales: pd.DataFrame, owner_col: str, city_col: str, 
                 apollo_key: str = None, hunter_key: str = None) -> pd.DataFrame:
    """
    Enrich whale leads with contact information.
    """
    print("\n🔎 Enriching leads with contact data...")
    
    # Initialize enrichers
    apollo = ApolloEnricher(apollo_key) if apollo_key else None
    hunter = HunterEnricher(hunter_key) if hunter_key else None
    
    if not apollo and not hunter:
        print("   ⚠️ No enrichment API keys provided. Skipping enrichment.")
        whales['CONTACT_NAME'] = ''
        whales['CONTACT_TITLE'] = ''
        whales['CONTACT_EMAIL'] = ''
        whales['CONTACT_PHONE'] = ''
        whales['LINKEDIN_URL'] = ''
        whales['ENRICHMENT_STATUS'] = 'Needs Manual Research'
        return whales
    
    # Add enrichment columns
    enrichment_data = []
    
    total = len(whales)
    enriched_count = 0
    
    for idx, (_, row) in enumerate(whales.iterrows()):
        company = row[owner_col]
        city = row[city_col] if pd.notna(row[city_col]) else None
        
        print(f"   [{idx+1}/{total}] {company[:50]}...", end='')
        
        contact = None
        
        # Try Apollo first
        if apollo:
            contact = apollo.search_people(company, city)
            time.sleep(APOLLO_RATE_LIMIT_DELAY)
        
        # Fallback to Hunter
        if not contact and hunter:
            contact = hunter.search_domain(company)
            time.sleep(APOLLO_RATE_LIMIT_DELAY)
        
        if contact and contact.get('email'):
            enriched_count += 1
            enrichment_data.append({
                'CONTACT_NAME': contact.get('name', ''),
                'CONTACT_TITLE': contact.get('title', ''),
                'CONTACT_EMAIL': contact.get('email', ''),
                'CONTACT_PHONE': contact.get('phone', ''),
                'LINKEDIN_URL': contact.get('linkedin', ''),
                'ENRICHMENT_STATUS': 'Enriched'
            })
            print(f" ✓ {contact.get('name', 'Found')}")
        else:
            enrichment_data.append({
                'CONTACT_NAME': '',
                'CONTACT_TITLE': '',
                'CONTACT_EMAIL': '',
                'CONTACT_PHONE': '',
                'LINKEDIN_URL': '',
                'ENRICHMENT_STATUS': 'Needs Manual Research'
            })
            print(" ✗ Not found")
    
    # Add enrichment columns to dataframe
    enrichment_df = pd.DataFrame(enrichment_data)
    whales = whales.reset_index(drop=True)
    whales = pd.concat([whales, enrichment_df], axis=1)
    
    print(f"\n   ✅ Enriched {enriched_count}/{total} leads ({enriched_count/total*100:.1f}%)")
    
    return whales


def score_and_export(whales: pd.DataFrame, cash_col: str, owner_col: str, 
                     city_col: str, output_file: str) -> pd.DataFrame:
    """
    Add lead scoring and export to CSV.
    """
    print("\n💰 Calculating lead scores...")
    
    # Calculate potential fee (10% CA legal cap)
    whales['POTENTIAL_FEE'] = (whales[cash_col] * CA_FEE_CAP).round(2)
    
    # Lead score based on value + enrichment
    def score_lead(row):
        value = row[cash_col]
        has_contact = row.get('ENRICHMENT_STATUS') == 'Enriched'
        
        if value >= 100000:
            base = 'A+'
        elif value >= 50000:
            base = 'A'
        elif value >= 25000:
            base = 'B'
        elif value >= 10000:
            base = 'C'
        else:
            base = 'D'
        
        # Boost score if enriched
        if has_contact:
            return f"{base} (Ready to Contact)"
        else:
            return f"{base} (Needs Research)"
    
    whales['LEAD_SCORE'] = whales.apply(score_lead, axis=1)
    
    # Build clean export dataframe
    export_cols = [
        owner_col, city_col, cash_col, 'POTENTIAL_FEE', 'LEAD_SCORE',
        'CONTACT_NAME', 'CONTACT_TITLE', 'CONTACT_EMAIL', 'CONTACT_PHONE', 
        'LINKEDIN_URL', 'ENRICHMENT_STATUS'
    ]
    
    # Only include columns that exist
    available_cols = [c for c in export_cols if c in whales.columns]
    export_df = whales[available_cols].copy()
    
    # Rename for clarity
    rename_map = {
        owner_col: 'BUSINESS_NAME',
        city_col: 'CITY',
        cash_col: 'UNCLAIMED_VALUE',
        'POTENTIAL_FEE': 'YOUR_FEE_10PCT'
    }
    export_df = export_df.rename(columns=rename_map)
    
    # Export
    export_df.to_csv(output_file, index=False)
    print(f"\n✅ Exported {len(export_df):,} whale leads to: {output_file}")
    
    # Also export as JSON for dashboard import
    json_file = output_file.replace('.csv', '.json')
    export_df.to_json(json_file, orient='records', indent=2)
    print(f"✅ JSON export: {json_file}")
    
    # Summary stats
    total_value = export_df['UNCLAIMED_VALUE'].sum()
    total_fees = export_df['YOUR_FEE_10PCT'].sum()
    enriched = len(export_df[export_df.get('ENRICHMENT_STATUS', '') == 'Enriched']) if 'ENRICHMENT_STATUS' in export_df.columns else 0
    
    print("\n" + "="*70)
    print("📊 WHALE SUMMARY")
    print("="*70)
    print(f"   Total Unclaimed Value:     ${total_value:,.2f}")
    print(f"   Potential Fee Revenue:     ${total_fees:,.2f}")
    print(f"   Average Whale Size:        ${total_value/len(export_df):,.2f}")
    print(f"   Largest Whale:             ${export_df['UNCLAIMED_VALUE'].max():,.2f}")
    print(f"   Leads with Contact Info:   {enriched}/{len(export_df)} ({enriched/len(export_df)*100:.1f}%)")
    print("="*70)
    
    # City breakdown
    print("\n📍 BY CITY:")
    city_summary = export_df.groupby('CITY').agg({
        'UNCLAIMED_VALUE': ['count', 'sum']
    }).round(2)
    city_summary.columns = ['Count', 'Total Value']
    city_summary = city_summary.sort_values('Total Value', ascending=False)
    print(city_summary.head(10).to_string())
    
    # Top 5 whales preview
    print("\n🐋 TOP 5 WHALES:")
    print("-"*70)
    for _, row in export_df.head(5).iterrows():
        contact = row.get('CONTACT_NAME', '') or 'No contact'
        email = row.get('CONTACT_EMAIL', '') or ''
        print(f"   ${row['UNCLAIMED_VALUE']:>12,.2f}  {row['BUSINESS_NAME'][:35]:<35}")
        if contact != 'No contact':
            print(f"                   → {contact} | {email}")
    
    # Legal reminder
    print("\n" + "="*70)
    print("⚠️  LEGAL COMPLIANCE REMINDER (CCP 1582):")
    print("-"*70)
    print("   ✓ Disclosure: 'You can claim this for free at claimit.ca.gov'")
    print("   ✓ Use SCO-approved Investigator Agreement template")
    print("   ✓ Fee cap: 10% (Hard-coded, do not modify)")
    print("   ✓ Keep records of all client communications")
    print("="*70)
    
    return export_df


def main():
    parser = argparse.ArgumentParser(
        description='LawAuditor Whale Scraper v2.0 - CA Unclaimed Property + Lead Enrichment'
    )
    parser.add_argument('input_file', help='SCO CSV file (Properties $500 and up)')
    parser.add_argument('-o', '--output', default='sac_bay_whales.csv', help='Output filename')
    parser.add_argument('--min-value', type=int, default=MIN_WHALE_VALUE, help='Minimum cash value')
    parser.add_argument('--limit', type=int, default=DEFAULT_LEAD_LIMIT, help='Max leads to process')
    parser.add_argument('--enrich', action='store_true', help='Enable lead enrichment')
    parser.add_argument('--apollo-key', help='Apollo.io API key (or set APOLLO_API_KEY env var)')
    parser.add_argument('--hunter-key', help='Hunter.io API key (or set HUNTER_API_KEY env var)')
    
    args = parser.parse_args()
    
    # Override globals if specified
    global MIN_WHALE_VALUE
    MIN_WHALE_VALUE = args.min_value
    
    # Get API keys from args or environment
    apollo_key = args.apollo_key or os.environ.get('APOLLO_API_KEY')
    hunter_key = args.hunter_key or os.environ.get('HUNTER_API_KEY')
    
    print("\n" + "="*70)
    print("🐋 LAWAUDITOR WHALE SCRAPER v2.0")
    print("   California Unclaimed Property + Lead Enrichment")
    print("="*70)
    print(f"   Input:       {args.input_file}")
    print(f"   Output:      {args.output}")
    print(f"   Min Value:   ${MIN_WHALE_VALUE:,}")
    print(f"   Lead Limit:  {args.limit}")
    print(f"   Fee Cap:     {CA_FEE_CAP*100:.0f}%")
    print(f"   Enrichment:  {'Apollo.io' if apollo_key else 'Hunter.io' if hunter_key else 'Disabled'}")
    print("="*70)
    
    # Load data
    df = load_sco_data(args.input_file)
    
    # Filter whales
    whales, cash_col, owner_col, city_col = filter_whales(df, limit=args.limit)
    
    if len(whales) == 0:
        print("\n❌ No whales found matching criteria. Try lowering --min-value.")
        return
    
    # Enrich if requested
    if args.enrich and (apollo_key or hunter_key):
        whales = enrich_leads(whales, owner_col, city_col, apollo_key, hunter_key)
    else:
        # Add empty enrichment columns
        whales['CONTACT_NAME'] = ''
        whales['CONTACT_TITLE'] = ''
        whales['CONTACT_EMAIL'] = ''
        whales['CONTACT_PHONE'] = ''
        whales['LINKEDIN_URL'] = ''
        whales['ENRICHMENT_STATUS'] = 'Needs Manual Research'
    
    # Score and export
    score_and_export(whales, cash_col, owner_col, city_col, args.output)
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"   1. Import {args.output} into LawAuditor Admin Dashboard")
    print(f"   2. Prioritize 'Ready to Contact' leads")
    print(f"   3. Use click-to-call/email from dashboard")
    print(f"   4. Convert whales → Legal audit cross-sell")
    print()


if __name__ == "__main__":
    main()
