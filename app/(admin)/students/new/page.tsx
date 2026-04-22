'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const GRADES = [
  { value: '1',  label: '1. Sınıf (İlkokul)' },
  { value: '2',  label: '2. Sınıf (İlkokul)' },
  { value: '3',  label: '3. Sınıf (İlkokul)' },
  { value: '4',  label: '4. Sınıf (İlkokul)' },
  { value: '5',  label: '5. Sınıf (Ortaokul)' },
  { value: '6',  label: '6. Sınıf (Ortaokul)' },
  { value: '7',  label: '7. Sınıf (Ortaokul)' },
  { value: '8',  label: '8. Sınıf (Ortaokul)' },
  { value: '9',  label: '9. Sınıf (Lise)' },
  { value: '10', label: '10. Sınıf (Lise)' },
  { value: '11', label: '11. Sınıf (Lise)' },
  { value: '12', label: '12. Sınıf (Lise)' },
  { value: '13', label: 'Hazırlık' },
]

const BRANCHES = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','Y','Z']

export default function NewStudentPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    grade_level: '', branch: '', school_id: '',
  })
  const [schools, setSchools]   = useState<any[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const supabase = createClient()

  useEffect(() => { loadSchools() }, [])

  async function loadSchools() {
    const { data } = await supabase.from('schools').select('id, name').order('name')
    setSchools(data ?? [])
  }

  async function handleSubmit() {
    if (!form.full_name || !form.email) { setError('Ad soyad ve e-posta zorunludur.'); return }
    if (!form.grade_level) { setError('Sınıf seviyesi seçiniz.'); return }
    setSaving(true); setError('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'student' }),
    })
    const d = await res.json()

    if (!d.ok) { setError(d.error); setSaving(false); return }

    setSuccess(true)
    setForm({ full_name:'', email:'', phone:'', grade_level:'', branch:'', school_id:'' })
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:'8px',
    border:'1px solid #D5DFF0', fontSize:'13px', color:'#1B3A6B',
    outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit'
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:'11.5px', fontWeight:600,
    color:'#4A6080', marginBottom:'5px'
  }

  return (
    <div style={{ padding:'28px', maxWidth:'620px', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
        <a href="/students" style={{ fontSize:'12.5px', color:'#7A8FA8', textDecoration:'none' }}>← Öğrenciler</a>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12.5px', color:'#1B3A6B', fontWeight:600 }}>Yeni Öğrenci</span>
      </div>

      {/* Bilgi kutusu */}
      <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
        <div style={{ fontSize:'12.5px', color:'#1B3A6B', lineHeight:1.6 }}>
          Öğrenci e-posta adresine <strong>davet maili</strong> gönderilecek. Öğrenci maildeki linke tıklayarak şifresini belirleyip giriş yapabilecek.
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #D5DFF0', padding:'24px' }}>
        <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', marginBottom:'20px' }}>Öğrenci Bilgileri</div>

        {/* Ad Soyad */}
        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Ad Soyad *</label>
          <input
            value={form.full_name}
            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Ayşe Yılmaz"
            style={inp}
          />
        </div>

        {/* E-posta */}
        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>E-posta *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="ayse@email.com"
            style={inp}
          />
        </div>

        {/* Telefon */}
        <div style={{ marginBottom:'14px' }}>
          <label style={lbl}>Telefon</label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="0532 xxx xx xx"
            style={inp}
          />
        </div>

        {/* Ayırıcı */}
        <div style={{ height:'1px', background:'#F0F4F9', margin:'18px 0' }} />
        <div style={{ fontSize:'12px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>
          Akademik Bilgiler
        </div>

        {/* Sınıf + Şube — yan yana */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
          <div>
            <label style={lbl}>Sınıf Seviyesi *</label>
            <select
              value={form.grade_level}
              onChange={e => setForm(p => ({ ...p, grade_level: e.target.value }))}
              style={inp}
            >
              <option value="">Seçin...</option>
              {GRADES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Şube (A–Z)</label>
            <select
              value={form.branch}
              onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
              style={inp}
            >
              <option value="">Seçin...</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b} Şubesi</option>
              ))}
            </select>
          </div>
        </div>

        {/* Şube önizleme */}
        {form.grade_level && form.branch && (
          <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'8px', padding:'8px 14px', marginBottom:'14px', fontSize:'12px', color:'#14532D', fontWeight:600 }}>
            Sınıf: {form.grade_level}-{form.branch} ({GRADES.find(g=>g.value===form.grade_level)?.label})
          </div>
        )}

        {/* Okul */}
        <div style={{ marginBottom:'20px' }}>
          <label style={lbl}>Devam Ettiği Okul</label>
          {schools.length > 0 ? (
            <select
              value={form.school_id}
              onChange={e => setForm(p => ({ ...p, school_id: e.target.value }))}
              style={inp}
            >
              <option value="">Seçin...</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={form.school_id}
              onChange={e => setForm(p => ({ ...p, school_id: e.target.value }))}
              placeholder="Okul adı yazın..."
              style={inp}
            />
          )}
          <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'4px' }}>
            Raporlama için kullanılır. Okul yoksa boş bırakılabilir.
          </div>
        </div>

        {/* Hata / Başarı */}
        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#C0392B' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:'#EAF4EE', border:'1px solid #A7D9B8', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color:'#2E7D52', fontWeight:600 }}>
            Davet maili gönderildi! Öğrenci e-postasını kontrol etmeli.{' '}
            <a href="/students" style={{ color:'#1B3A6B' }}>Listeye dön →</a>
          </div>
        )}

        {/* Butonlar */}
        <div style={{ display:'flex', gap:'10px' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}
          >
            {saving ? 'Davet Gönderiliyor...' : '📧 Davet Gönder'}
          </button>
          
            href="/students"
            style={{ padding:'11px 18px', borderRadius:'9px', background:'#F0F4F9', color:'#4A6080', fontSize:'13px', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center' }}
          >
            İptal
          </a>
        </div>
      </div>
    </div>
  )
}