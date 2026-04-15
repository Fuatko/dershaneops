import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { email, full_name, phone, role, tenant_id } = await req.json()

    if (!email || !full_name || !role) {
      return NextResponse.json({ ok: false, error: 'Email, ad ve rol zorunludur.' }, { status: 400 })
    }

    // Supabase Auth'da kullanıcı oluştur ve davet maili gönder
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    })

    if (authError) {
      return NextResponse.json({ ok: false, error: authError.message }, { status: 400 })
    }

    // Profil oluştur
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: authData.user.id,
      full_name,
      phone: phone || null,
      role,
      tenant_id: tenant_id || '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
    })

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, user_id: authData.user.id })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}