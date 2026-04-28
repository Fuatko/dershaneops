'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ApplyForm() {
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', grade_level:'', target_exam:'YKS', current_school:'', parent_name:'', parent_phone:'', source:'web' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tenantName, setTenantName] = useState('')
  const searchParams = useSearchParams()
  const tenantId = searchParams.get('tenant')
  const supabase = createClient()

  useEffect(() => {
    if (tenantId) {
      supabase.from('tenants').select('name').eq('id', tenantId).single()
        .then(({ data }) => { if (data) setTenantName(data.name) })
    }
  }, [tenantId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.phone) { setError('Ad soyad ve telefon zorunludur'); return }
    if (!tenantId) { setError('Gecersiz basvuru linki'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('candidates').insert({
      ...form,
      grade_level: form.grade_level ? parseInt(form.grade_level) : null,
      tenant_id: tenantId,
      status: 'new',
    })
    if (err) { setError('Hata: ' + err.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
  }

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#F0F4F9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'48px', textAlign:'center', maxWidth:'400px' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>Basarimiz</div>
        <div style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Basvurunuz Alindi!</div>
        <div style={{ fontSize:'13px', color:'#94A3B8' }}>En kisa surede sizinle iletisime gececegiz.</div>
      </div>
    </div>
  )

  const inp = { width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' as any }
  const lbl = { display:'block', fontSize:'11px', fontWeight:600 as any, color:'#475569', marginBottom:'5px' }

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F9', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'32px', maxWidth:'500px', width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'24px' }}>D</div>
          <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:'0 0 4px' }}>{tenantName || 'Dershane'} Kayit Formu</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>Bilgilerinizi doldurun, sizi arayalim</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label style={lbl}>AD SOYAD *</label>
              <input value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} placeholder="Ornek: Ali Yilmaz" style={inp} />
            </div>
            <div>
              <label style={lbl}>TELEFON *</label>
              <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="05xx xxx xx xx" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>E-POSTA</label>
            <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="ornek@mail.com" style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label style={lbl}>SINIF</label>
              <select value={form.grade_level} onChange={e => setForm(p=>({...p,grade_level:e.target.value}))} style={inp}>
                <option value="">Secin...</option>
                {[5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}. Sinif</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>HEDEF SINAV</label>
              <select value={form.target_exam} onChange={e => setForm(p=>({...p,target_exam:e.target.value}))} style={inp}>
                {['YKS','LGS','KPSS','DGS','ALES'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>OKUDUGU OKUL</label>
            <input value={form.current_school} onChange={e => setForm(p=>({...p,current_school:e.target.value}))} placeholder="Okul adi" style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label style={lbl}>VELİ ADI</label>
              <input value={form.parent_name} onChange={e => setForm(p=>({...p,parent_name:e.target.value}))} placeholder="Anne/Baba adi" style={inp} />
            </div>
            <div>
              <label style={lbl}>VELİ TELEFONU</label>
              <input value={form.parent_phone} onChange={e => setForm(p=>({...p,parent_phone:e.target.value}))} placeholder="05xx xxx xx xx" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>BIZI NEREDEN DUYDUNUZ?</label>
            <select value={form.source} onChange={e => setForm(p=>({...p,source:e.target.value}))} style={inp}>
              {['web','instagram','facebook','whatsapp','referans','diger'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px', fontSize:'12px', color:'#DC2626' }}>{error}</div>}

          <button type="submit" disabled={saving}
            style={{ padding:'12px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer', marginTop:'4px' }}>
            {saving ? 'Gonderiliyor...' : 'Basvuruyu Gonder'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  return <Suspense fallback={<div>Yukleniyor...</div>}><ApplyForm /></Suspense>
}
