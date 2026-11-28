import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Initialize Supabase Admin client (Bypasses RLS for server-side inserts)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. AUTHENTICATION: Get the user's session from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('xeco_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Verify the JWT to get the merchant_id
    // Note: Ensure JWT_SECRET matches your Express backend
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as { merchantId: number };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    // 2. GET PAYLOAD
    const body = await req.json();
    const {
      full_name, id_number, email, date_of_birth, phone,
      taxpayer_type, notification_channel,
      county, sub_county, building_name, po_box, zip_code,
      service, terms_accepted,
      kra_pin, kra_holder_name, kra_status, obligations
    } = body;

    // 3. INSERT USER PROFILE
    const { error: profileErr } = await supabaseAdmin.from('user_profiles').upsert({
      user_id: merchantId, // INTEGER ID from JWT
      full_name,
      id_number,
      date_of_birth: date_of_birth || null,
      phone_number: phone,
      email,
      profile_status: 'completed'
    }, { onConflict: 'user_id' });

    if (profileErr) throw new Error(`Profile Error: ${profileErr.message}`);

    // 4. INSERT ADDRESS
    await supabaseAdmin.from('user_addresses').upsert({
      user_id: merchantId,
      county,
      sub_county,
      building_name,
      po_box,
      postal_code: zip_code
    }, { onConflict: 'user_id' });

    // 5. INSERT PREFERENCES
    await supabaseAdmin.from('user_preferences').upsert({
      user_id: merchantId,
      notification_channel
    }, { onConflict: 'user_id' });

    // 6. INSERT TAXPAYER PROFILE (KRA Data)
    const { data: taxProfile, error: taxErr } = await supabaseAdmin.from('taxpayer_profiles').upsert({
      user_id: merchantId,
      kra_pin: kra_pin,
      taxpayer_type,
      taxpayer_name: kra_holder_name,
      kra_account_status: kra_status,
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).select().single();

    if (taxErr) throw new Error(`Tax Profile Error: ${taxErr.message}`);

    // 7. INSERT OBLIGATIONS
    if (obligations && obligations.length > 0) {
      // Clear old ones first
      await supabaseAdmin.from('taxpayer_obligations').delete().eq('taxpayer_profile_id', taxProfile.id);
      
      const obligationsToInsert = obligations.map((ob: string) => ({
        taxpayer_profile_id: taxProfile.id,
        obligation_code: ob,
        obligation_name: ob.replace(/_/g, ' ').toUpperCase(),
        obligation_status: 'Active'
      }));
      
      await supabaseAdmin.from('taxpayer_obligations').insert(obligationsToInsert);
    }

    // 8. RECORD CONSENT
    if (terms_accepted) {
      await supabaseAdmin.from('user_consents').insert({
        user_id: merchantId,
        consent_type: 'TERMS_AND_PRIVACY',
        policy_version: 'v1.0',
        is_accepted: true
      });
    }

    // 9. RECORD AUTHORIZATION FOR SELECTED SERVICE
    if (service) {
      await supabaseAdmin.from('taxpayer_authorizations').insert({
        taxpayer_profile_id: taxProfile.id,
        service_code: service,
        authorization_status: 'granted',
        authorization_method: 'digital_signature'
      });
    }

    // 10. LOG ACTIVITY
    await supabaseAdmin.from('profile_activity_logs').insert({
      user_id: merchantId,
      event_type: 'PROFILE_COMPLETED',
      description: `User completed profile setup and selected service: ${service}`,
      actor_type: 'user'
    });

    return NextResponse.json({ success: true, message: 'Profile saved successfully' });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}