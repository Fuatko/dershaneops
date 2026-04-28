'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditParentPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [linkedStudents, setLinkedStudents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { load() }, [params.id])

  async function load() {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', params.id).single()
    if (!p) { router.push('/parents'); return }
    setForm(p)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return

    const { data: studs } = await supabase.from('profiles').select('id, full_name, grade_level')
      .eq('tenant_id', prof.tenant_id).eq('role', 'student').order('full_name')
    setStudents(studs ?? [])

    const { data: links } = await supabase.from('parent_students').select('student_id').eq('parent_id', params.id)
    setLinkedStudents(links?.map(l => l.student_id) ?? [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
    }).eq('id', params.id)

    if (err) { setError(err.message); setSaving(false); return }

    // Veli-ogrenci baglantisini guncelle
    await supabase.from('parent_students').delete().eq('parent_id', params.id)
    for (const sid of linkedStudents) {
      await supabase.from('parent_students').insert({ parent_id: params.id, student_id: sid })
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push('/parents'), 1500)
  }

  function toggleStudent(id: string) {
    setLinkedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  if (!form) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  const inp = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' as any }
  const lbl = { display:'block', fontSize:'11px', fontWeight:600 as any, color:'#475569', marginBottom:'5px' }

  return (
    <div style={{ padding:'24px 20px', maxWidth:'700px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ marginBottom:'20px' }}>
        <a href="/parents" style={{ fontSize:'12px', color:'#94A3B8', textDecoration:'none' }}>← Veliler</a>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:'6px 0 0' }}>Veli Duzenle</h1>
      </div>

      <form onSubmit={handleSave} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px' }}>
          <div>
            <label style={lbl}>AD SOYAD</label>
            <input value={form.full_name ?? ''} onChange={e => setForm((p:any)=>({...p,full_name:e.target.value}))} style={inp} />
          </div>
          <div>
            <label style={lbl}>TELEFON</label>
            <input value={form.phone ?? ''} onChange={e => setForm((p:any)=>({...p,phone:e.target.value}))} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ ...lbl, marginBottom:'10px' }}>BAGLI OGRENCILER</label>
          {students.length === 0 ? (
            <div style={{ fontSize:'12px', color:'#94A3B8' }}>Ogrenci bulunamadi</div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {students.map(s => (
                <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                  style={{ padding:'6px 14px', borderRadius:'20px', border:'1.5px solid', borderColor:linkedStudents.includes(s.id)?'#1B3A6B':'#E2E8F0', background:linkedStudents.includes(s.id)?'#1B3A6B':'#fff', color:linkedStudents.includes(s.id)?'#fff':'#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                  {s.full_name} {s.grade_level ? '('+s.grade_level+'. Sinif)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px', marginBottom:'12px', fontSize:'12px', color:'#DC2626' }}>{error}</div>}
        {success && <div style={{ background:'#DCFCE7', border:'1px solid #A7D9B8', borderRadius:'8px', padding:'10px', marginBottom:'12px', fontSize:'12px', color:'#2E7D52', fontWeight:600 }}>Kaydedildi!</div>}

        <div style={{ display:'flex', gap:'8px' }}>
          <button type="submit" disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button type="button" onClick={() => router.push('/parents')}
            style={{ padding:'11px 20px', borderRadius:'8px', background:'#F0F4F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
            Iptal
          </button>
        </div>
      </form>
    </div>
  )
}
