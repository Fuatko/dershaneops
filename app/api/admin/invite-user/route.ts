import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, full_name, role, tenant_id } = await req.json()

  if (!email || !full_name || !role || !tenant_id) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
  }

  // Service role key ile admin client oluştur
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Supabase Auth'a kullanıcı oluştur — mail gönderir
  const { data: authUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role, tenant_id }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Profiles tablosuna ekle
  const { error: profileError } = await adminClient.from('profiles').upsert({
    user_id: authUser.user.id,
    full_name,
    role,
    tenant_id,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, user_id: authUser.user.id })
}