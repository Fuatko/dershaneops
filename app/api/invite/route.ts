import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const {
      email, full_name, phone, role,
      grade_level, classroom_id, school_id,
      branch
    } = await req.json()

    if (!email || !full_name || !role) {
      return NextResponse.json({ ok: false, error: 'Email, ad ve rol zorunludur.' }, { status: 400 })
    }

    // Çağıran adminin tenant_id'sini al
    const supabaseServer = createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Yetkisiz erişim.' }, { status: 401 })

    const { data: adminProfile } = await supabaseServer
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    const tenant_id = adminProfile?.tenant_id
    if (!tenant_id) return NextResponse.json({ ok: false, error: 'Tenant bulunamadı.' }, { status: 400 })

    // Supabase Auth'da kullanıcı oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `https://dershaneops.vercel.app/login`,
    })

    if (authError) {
      return NextResponse.json({ ok: false, error: authError.message }, { status: 400 })
    }

    // Classroom ID'yi belirle — branch (şube) girilmişse classroom ara veya oluştur
    let finalClassroomId = classroom_id || null

    if (!finalClassroomId && grade_level && branch) {
      // Bu tenant için bu sınıf ve şube var mı?
      const { data: existingClass } = await supabaseAdmin
        .from('classrooms')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('grade_level', grade_level)
        .eq('name', `${grade_level}-${branch}`)
        .single()

      if (existingClass) {
        finalClassroomId = existingClass.id
      } else {
        // Yoksa oluştur
        const { data: newClass } = await supabaseAdmin
          .from('classrooms')
          .insert({
            tenant_id,
            name: `${grade_level}-${branch}`,
            grade_level: parseInt(grade_level),
          })
          .select()
          .single()
        finalClassroomId = newClass?.id
      }
    }

    // Profil oluştur
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: authData.user.id,
      full_name,
      phone: phone || null,
      phone_number: phone || null,
      role,
      tenant_id,
      grade_level: grade_level ? parseInt(grade_level) : null,
      classroom_id: finalClassroomId,
      school_id: school_id || null,
    })

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, user_id: authData.user.id })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}