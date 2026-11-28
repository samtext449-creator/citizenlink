// src/app/api/taxflow/verify-identity/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('merchant_id, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !merchant) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, merchant.password_hash);

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ success: true, merchant_id: merchant.merchant_id });
  } catch (err) {
    console.error('Verify identity error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}