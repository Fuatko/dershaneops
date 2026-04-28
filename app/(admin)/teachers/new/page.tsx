'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const BRANCHES = [
  'Matematik','Fizik','Kimya','Biyoloji','Turkce','Edebiyat',
  'Tarih','Cografya','Felsefe','Din Kulturu','Ingilizce','Almanca',
  'Fransizca','Beden Egitimi','Muzik','Gorsel Sanatlar','Bilisim',
  'Matematik-Fen','Sosyal Bilgiler','Diger'
]

export default function NewTeacherPage() {
  const [form, setForm] = useState({
    full_name:'', email:'', phone:'', subject:'', subject_custom:'',
    classroom_ids: [] as string[],
    branch_id: '',
    institution_id: '',
  })
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const inp = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', fontSize:'13px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' as const, fontFamily:'inherit' }
  const lbl = { display:'block' as const, fontSize:'11.5px', fontWeight:600, color:'#4A6080', marginBottom:'5px' }

  useEffect(() => {
    supabase.from('classrooms').select('id, name, grade_level').order('grade_level')
      .then(({ data }) => setClassrooms(data ?? []))
    supabase.from('branches').select('id, name, school_id').order('name')
      .then(({ data }) => setBranches(data ?? []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
        .then(({ data: prof }) => {
          if (!prof?.tenant_id) return
          setTenantId(prof.tenant_id)
          supabase.from('schools').select('id, name, type').eq('tenant_id', prof.tenant_id).order('name')
            .then(({ data }) => setSchools(data ?? []))
        })
    })
  }, [])

  async function handleSubmit() {
    if (!form.full_name || !form.email) { setError('Ad soyad ve e-posta zorunludur.'); return }
    setSaving(true); setError('')
    const subject = form.subject === 'Diger' ? form.subject_custom : form.subject
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, subject, role: 'teacher' }),
    })
    const d = await res.json()
    if (!d.ok) { setError(d.error); setSaving(false); return }
    setSuccess(true)
    setForm({ full_name:'', email:'', phone:'', subject:'', subject_custom:'', classroom_ids:[], branch_id:'', institution_id:'' })
    setSaving(false)
  }

  function toggleClassroom(id: string) {
    setForm(p => ({
      ...p,
      classroom_ids: p.classroom_ids.includes(id)
        ? p.classroom_ids.filter(x => x !== id)
        : [...p.classroom_ids, id]
    }))
  }

  return (
    <div style={{ padding:'28px', maxWidth:'620px', fontFamily:'sans-serif' }}>

      <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
        <a href="/teachers" style={{ fontSize:'12.5px', color:'#7A8FA8', textDecoration:'none' }}>Ogretmenler</a>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12.5px', color:'#1B3A6B', fontWeight:600 }}>Yeni Ogretmen</span>
      </div>

      <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
        <div style={{ fontSize:'12.5px', color:'#1B3A6B', lineHeight:1.6 }}>
          Ogretmen e-posta adresine davet maili gonderilecek.
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #D5DFF0', padding:'24px' }}>
        <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', marginBottom:'20px' }}>Ogretmen Bilgileri</div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Ad Soyad *</label>
          <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name:e.target.value }))} placeholder="Ali Demir" style={inp} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>E-posta *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} placeholder="ali@email.com" style={inp} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Telefon</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone:e.target.value }))} placeholder="0532 xxx xx xx" style={inp} />
        </div>

        <div style={{ height:'1px', background:'#F0F4F9', margin:'18px 0' }} />
        <div style={{ fontSize:'12px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>
          Mesleki Bilgiler
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Brans</label>
          <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject:e.target.value }))} style={inp}>
            <option value="">Secin...</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {form.subject === 'Diger' && (
          <div style={{ marginBottom:'14px' }}>
            <label style={lbl}>Brans Adi</label>
            <input value={form.subject_custom} onChange={e => setForm(p => ({ ...p, subject_custom:e.target.value }))} placeholder="Brans adinizi yazin..." style={inp} />
          </div>
        )}

        {classrooms.length > 0 && (
          <div style={{ marginBottom:'20px' }}>
            <label style={lbl}>Sorumlu Oldugu Siniflar</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'6px' }}>
              {classrooms.map(c => (
                <button key={c.id} type="button" onClick={() => toggleClassroom(c.id)}
                  style={{ padding:'5px 12px', borderRadius:'20px', border:'1.5px solid', borderColor:form.classroom_ids.includes(c.id)?'#1B3A6B':'#E2E8F0', background:form.classroom_ids.includes(c.id)?'#1B3A6B':'#fff', color:form.classroom_ids.includes(c.id)?'#fff':'#475569', fontSize:'11.5px', fontWeight:600, cursor:'pointer' }}>
                  {c.name}
                </button>
              ))}
            </div>
            {form.classroom_ids.length > 0 && (
              <div style={{ fontSize:'11px', color:'#10B981', marginTop:'6px', fontWeight:600 }}>
                {form.classroom_ids.length} sinif secildi
              </div>
            )}
          </div>
        )}
        <div style={{ marginBottom:'20px' }}>
          <label style={lbl}>Calistigi Kurum (Okul/Dershane)</label>
          {schools.length > 0 ? (
            <select value={form.institution_id} onChange={e => setForm(p => ({ ...p, institution_id: e.target.value, branch_id: '' }))} style={inp}>
              <option value="">Secin (Opsiyonel)</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
            <div style={{ padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', background:'#F8FAFC', fontSize:'12px', color:'#94A3B8' }}>
              Kurum tanimlanmamis — <a href="/schools" style={{ color:'#1B3A6B', fontWeight:600 }}>Kurum ekle</a>
            </div>
          )}
        </div>


        <div style={{ marginBottom:'20px' }}>
          <label style={lbl}>Sube</label>
          {branches.length > 0 ? (
            <select value={form.branch_id} onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))} style={inp}>
              <option value="">Sube Secin (Opsiyonel)</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          ) : (
            <div style={{ padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', background:'#F8FAFC', fontSize:'12px', color:'#94A3B8' }}>
              Sube tanimlanmamis — <a href="/branches" style={{ color:'#1B3A6B', fontWeight:600 }}>Sube ekle</a>
            </div>
          )}
        </div>
        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#C0392B' }}>{error}</div>
        )}
        {success && (
          <div style={{ background:'#EAF4EE', border:'1px solid #A7D9B8', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#2E7D52', fontWeight:600 }}>
            Davet maili gonderildi! <a href="/teachers" style={{ color:'#1B3A6B' }}>Listeye don</a>
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
            {saving ? 'Gonderiliyor...' : 'Davet Gonder'}
          </button>
          <a href="/teachers"
            style={{ padding:'11px 18px', borderRadius:'9px', background:'#F0F4F9', color:'#4A6080', fontSize:'13px', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center' }}>
            Iptal
          </a>
        </div>
      </div>
    </div>
  )
}