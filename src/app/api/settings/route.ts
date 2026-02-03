import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserSettings,
  saveUserSettings,
  createUserSettingsTable,
} from '@/lib/db';

/**
 * GET /api/settings
 * 
 * Fetch user settings.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure table exists
    await createUserSettingsTable();

    const settings = await getUserSettings(userId);
    
    return NextResponse.json({ settings });
    
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', settings: null },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * 
 * Save or update user settings.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Ensure table exists
    await createUserSettingsTable();

    // Validate fee percentage (max 10% per CCP 1582)
    const feePercentage = Math.min(10, Math.max(0, body.default_fee_percentage || 10));

    // Save settings
    const id = await saveUserSettings(userId, {
      investigator_registration_number: body.investigator_registration_number || null,
      registration_state: body.registration_state || 'CA',
      registration_expiry: body.registration_expiry || null,
      business_name: body.business_name || null,
      business_address: body.business_address || null,
      business_phone: body.business_phone || null,
      business_email: body.business_email || null,
      apollo_api_key: body.apollo_api_key || null,
      peopledatalabs_api_key: body.peopledatalabs_api_key || null,
      default_fee_percentage: feePercentage,
      default_min_balance: body.default_min_balance || 10000,
      auto_fill_contracts: body.auto_fill_contracts !== false,
    });

    return NextResponse.json({ success: true, id });
    
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
