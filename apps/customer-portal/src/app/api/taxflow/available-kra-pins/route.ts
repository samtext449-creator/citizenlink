// src/app/api/taxflow/available-kra-pins/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchant_id');

    if (!merchantId) {
      return NextResponse.json({ success: false, message: 'Merchant ID required' }, { status: 400 });
    }

    // 1. Fetch taxpayer profile
    const { data: profile, error: profileError } = await supabase
      .from('taxpayer_profiles')
      .select('id, kra_pin, taxpayer_name, taxpayer_type')
      .eq('user_id', merchantId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ success: true, accounts: [] });
    }

    // 2. Fetch obligations for this profile
    const { data: obligations } = await supabase
      .from('taxpayer_obligations')
      .select('obligation_name')
      .eq('taxpayer_profile_id', profile.id);

    const obligationNames = obligations?.map((o) => o.obligation_name) || [];

    const account = {
      kra_pin: profile.kra_pin,
      taxpayer_name: profile.taxpayer_name,
      taxpayer_type: profile.taxpayer_type === 'Company' ? 'Company' : 'Individual',
      obligations: obligationNames,
    };

    return NextResponse.json({ success: true, accounts: [account] });
  } catch (err) {
    console.error('Fetch KRA PINs error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}