'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewParentPage() {
  const [form, setForm] = useState({
    full_name:'', email:'', phone:'',
    whatsapp_number:'', student_ids:[] as string[],
  })
  const [students, setStudents] = useState<any[]>([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const inp = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', fontSize:'13px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' as const, fontFamily:'inherit' }
  const lbl = { display:'block' as const, fontSize:'11.5px', fontWeight:600, color:'#4A6080', marginBottom:'5px' }

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, grade_level')
      .eq('role', 'student').order('grade_level')
      .then(({ data }) => setStudents(data ?? []))
  }, [])

  function toggleStudent(id: string) {
    setForm(p => ({
      ...p,
      student_ids: p.student_ids.includes(id)
        ? p.student_ids.filter(x => x !== id)
        : [...p.student_ids, id]
    }))
  }

  async function handleSubmit() {
    if (!form.full_name || !form.email) { setError('Ad soyad ve e-posta zorunludur.'); return }
    setSaving(true); setError('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'parent' }),
    })
    const d = await res.json()
    if (!d.ok) { setError(d.error); setSaving(false); return }

    // Öğrenci eşleştirmesi yap
    if (form.student_ids.length > 0 && d.user_id) {
      const { data: parentProfile } = await supabase
        .from('profiles').select('id').eq('user_id', d.user_id).single()
      if (parentProfile) {
        await Promise.all(form.student_ids.map(sid =>
          supabase.from('parent_students').upsert({
            parent_id: parentProfile.id,
            student_id: sid,
          })
        ))
      }
    }

    // WhatsApp numarası kaydet
    if (form.whatsapp_number && d.user_id) {
      await supabase.from('profiles')
        .update({ phone_number: form.whatsapp_number, whatsapp_enabled: true })
        .eq('user_id', d.user_id)
    }

    setSuccess(true)
    setForm({ full_name:'', email:'', phone:'', whatsapp_number:'', student_ids:[] })
    setSaving(false)
  }

  return (
    <div style={{ padding:'28px', maxWidth:'620px', fontFamily:'sans-serif' }}>

      <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
        <a href="/parents" style={{ fontSize:'12.5px', color:'#7A8FA8', textDecoration:'none' }}>Veliler</a>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12.5px', color:'#1B3A6B', fontWeight:600 }}>Yeni Veli</span>
      </div>

      <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
        <div style={{ fontSize:'12.5px', color:'#1B3A6B', lineHeight:1.6 }}>
          Veli e-posta adresine davet maili gonderilecek. Ayni zamanda cocuklariyla eslestirebilirsiniz.
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #D5DFF0', padding:'24px' }}>
        <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', marginBottom:'20px' }}>Veli Bilgileri</div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Ad Soyad *</label>
          <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name:e.target.value }))} placeholder="Ahmet Yilmaz" style={inp} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>E-posta *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} placeholder="ahmet@email.com" style={inp} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Telefon</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone:e.target.value }))} placeholder="0532 xxx xx xx" style={inp} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>WhatsApp Numarasi</label>
          <input value={form.whatsapp_number} onChange={e => setForm(p => ({ ...p, whatsapp_number:e.target.value }))} placeholder="+905321234567" style={inp} />
          <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'4px' }}>Bildirim gondermek icin +90 ile baslayan format</div>
        </div>

        <div style={{ height:'1px', background:'#F0F4F9', margin:'18px 0' }} />
        <div style={{ fontSize:'12px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>
          Cocuk Eslestirme
        </div>

        {students.length === 0 ? (
          <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12px', color:'#92400E' }}>
            Henuz ogrenci kaydi yok. Once ogrenci ekleyin.
          </div>
        ) : (
          <div style={{ marginBottom:'20px' }}>
            <label style={lbl}>Cocuklari Secin</label>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'200px', overflowY:'auto', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px' }}>
              {students.map(s => (
                <div key={s.id} onClick={() => toggleStudent(s.id)}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'7px', cursor:'pointer', background:form.student_ids.includes(s.id)?'#EEF3FB':'#fff', border:'1px solid', borderColor:form.student_ids.includes(s.id)?'#1B3A6B':'#F0F4F9' }}>
                  <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:`2px solid ${form.student_ids.includes(s.id)?'#1B3A6B':'#E2E8F0'}`, background:form.student_ids.includes(s.id)?'#1B3A6B':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {form.student_ids.includes(s.id) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B' }}>{s.full_name}</div>
                    <div style={{ fontSize:'11px', color:'#94A3B8' }}>{s.grade_level}. Sinif</div>
                  </div>
                </div>
              ))}
            </div>
            {form.student_ids.length > 0 && (
              <div style={{ fontSize:'11px', color:'#10B981', marginTop:'6px', fontWeight:600 }}>
                {form.student_ids.length} ogrenci secildi
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#C0392B' }}>{error}</div>
        )}
        {success && (
          <div style={{ background:'#EAF4EE', border:'1px solid #A7D9B8', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#2E7D52', fontWeight:600 }}>
            Davet maili gonderildi! <a href="/parents" style={{ color:'#1B3A6B' }}>Listeye don</a>
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
            {saving ? 'Gonderiliyor...' : 'Davet Gonder'}
          </button>
          <a href="/parents"
            style={{ padding:'11px 18px', borderRadius:'9px', background:'#F0F4F9', color:'#4A6080', fontSize:'13px', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center' }}>
            Iptal
          </a>
        </div>
      </div>
    </div>
  )
}