import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    // 1. INITIALIZE SUPABASE INSIDE THE REQUEST USING ANON KEY
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. AUTHENTICATION: Get the user's session from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('xeco_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized: No session token" }, { status: 401 });
    }

    // 3. VERIFY JWT
    let merchantId: number;
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as { merchantId: number };
      merchantId = decoded.merchantId;
    } catch (err: any) {
      console.error("JWT Verification Failed:", err.message);
      return NextResponse.json({ success: false, message: "Invalid or expired session" }, { status: 401 });
    }

    if (!merchantId) {
      return NextResponse.json({ success: false, message: "Invalid session: Missing merchant ID" }, { status: 401 });
    }

    // 4. GET PAYLOAD
    const body = await req.json();
    const {
      full_name, id_number, email, date_of_birth, phone,
      taxpayer_type, notification_channel,
      county, sub_county, building_name, po_box, zip_code,
      service, terms_accepted,
      kra_pin, kra_holder_name, kra_status, obligations
    } = body;

    // 5. INSERT USER PROFILE
    const { error: profileErr } = await supabase.from('user_profiles').upsert({
      user_id: merchantId,
      full_name,
      id_number,
      date_of_birth: date_of_birth || null,
      phone_number: phone,
      email,
      profile_status: 'completed'
    }, { onConflict: 'user_id' });

    if (profileErr) throw new Error(`Profile Error: ${profileErr.message}`);

    // 6. INSERT ADDRESS
    const { error: addressErr } = await supabase.from('user_addresses').upsert({
      user_id: merchantId,
      county,
      sub_county,
      building_name,
      po_box,
      postal_code: zip_code
    }, { onConflict: 'user_id' });

    if (addressErr) throw new Error(`Address Error: ${addressErr.message}`);

    // 7. INSERT PREFERENCES
    const { error: prefErr } = await supabase.from('user_preferences').upsert({
      user_id: merchantId,
      notification_channel
    }, { onConflict: 'user_id' });

    if (prefErr) throw new Error(`Preferences Error: ${prefErr.message}`);

    // 8. INSERT TAXPAYER PROFILE (KRA Data)
    const { data: taxProfile, error: taxErr } = await supabase.from('taxpayer_profiles').upsert({
      user_id: merchantId,
      kra_pin: kra_pin,
      taxpayer_type,
      taxpayer_name: kra_holder_name,
      kra_account_status: kra_status,
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).select().single();

    if (taxErr) throw new Error(`Tax Profile Error: ${taxErr.message}`);

    // 9. INSERT OBLIGATIONS
    if (obligations && obligations.length > 0 && taxProfile) {
      await supabase.from('taxpayer_obligations').delete().eq('taxpayer_profile_id', taxProfile.id);
      
      const obligationsToInsert = obligations.map((ob: string) => ({
        taxpayer_profile_id: taxProfile.id,
        obligation_code: ob,
        obligation_name: ob.replace(/_/g, ' ').toUpperCase(),
        obligation_status: 'Active'
      }));
      
      const { error: obErr } = await supabase.from('taxpayer_obligations').insert(obligationsToInsert);
      if (obErr) throw new Error(`Obligations Error: ${obErr.message}`);
    }

    // 10. RECORD CONSENT
    if (terms_accepted) {
      const { error: consentErr } = await supabase.from('user_consents').insert({
        user_id: merchantId,
        consent_type: 'TERMS_AND_PRIVACY',
        policy_version: 'v1.0',
        is_accepted: true
      });
      if (consentErr) throw new Error(`Consent Error: ${consentErr.message}`);
    }

    // 11. RECORD AUTHORIZATION FOR SELECTED SERVICE
    if (service && taxProfile) {
      const { error: authErr } = await supabase.from('taxpayer_authorizations').insert({
        taxpayer_profile_id: taxProfile.id,
        service_code: service,
        authorization_status: 'granted',
        authorization_method: 'digital_signature'
      });
      if (authErr) throw new Error(`Authorization Error: ${authErr.message}`);
    }

    // 12. LOG ACTIVITY
    const { error: logErr } = await supabase.from('profile_activity_logs').insert({
      user_id: merchantId,
      event_type: 'PROFILE_COMPLETED',
      description: `User completed profile setup and selected service: ${service}`,
      actor_type: 'user'
    });
    
    if (logErr) console.error('Activity Log Error:', logErr.message);

    return NextResponse.json({ success: true, message: 'Profile saved successfully' });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}