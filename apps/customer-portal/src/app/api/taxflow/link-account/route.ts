// src/app/api/taxflow/link-account/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { kra_pin, taxpayer_name, taxpayer_type, obligations } = await req.json();

    // Find the taxpayer profile ID for this PIN
    const { data: profile, error: profileError } = await supabase
      .from('taxpayer_profiles')
      .select('id')
      .eq('kra_pin', kra_pin)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: 'Taxpayer profile not found' }, { status: 404 });
    }

    // Insert the authorization record
    const { data: authData, error: authError } = await supabase
      .from('taxpayer_authorizations')
      .insert({
        taxpayer_profile_id: profile.id,
        service_code: 'nil_return', // Defaulting for now
        authorization_status: 'granted',
        authorization_method: 'digital_signature',
        granted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (authError) {
      console.error('Auth insert error:', authError);
      return NextResponse.json({ success: false, message: 'Failed to link account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: authData.id });
  } catch (err) {
    console.error('Link account error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}