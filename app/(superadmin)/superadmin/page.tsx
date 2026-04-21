'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [stats, setStats] = useState({ totalTenants:0, totalStudents:0, totalTeachers:0, totalLessons:0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', slug:'', plan:'basic', contact_email:'', max_students:50, max_teachers:10 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: t } = await supabase.from('tenants').select('*').order('created_at', { ascending:false })
    const { count: s } = await supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'student')
    const { count: tc } = await supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'teacher')
    const { count: l } = await supabase.from('lessons').select('*', { count:'exact', head:true })
    setTenants(t??[])
    setStats({ totalTenants:t?.length??0, totalStudents:s??0, totalTeachers:tc??0, totalLessons:l??0 })
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const { error: err } = await supabase.from('tenants').insert({ ...form, is_active:true })
    if (err) { setError(err.message); setSaving(false); return }
    setShowModal(false)
    setForm({ name:'', slug:'', plan:'basic', contact_email:'', max_students:50, max_teachers:10 })
    load(); setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('tenants').update({ is_active:!current }).eq('id', id)
    load()
  }

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.3px' }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <div style={{ padding:'3px 10px', borderRadius:'20px', background:'#EDE9FE', border:'1px solid #C4B5FD', fontSize:'11px', fontWeight:700, color:'#4C1D95', display:'inline-block', marginBottom:'6px' }}>SÜPER ADMİN</div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Platform Yönetimi</h1>
          <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Tüm kurumları ve kullanıcıları yönet</p>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
          + Yeni Kurum
        </button>
      </div>

      <div className="metrics-row">
        {[
          { label:'Toplam Kurum', value:stats.totalTenants, color:'#4C1D95', bg:'#EDE9FE' },
          { label:'Toplam Öğrenci', value:stats.totalStudents, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Toplam Öğretmen', value:stats.totalTeachers, color:'#14532D', bg:'#DCFCE7' },
          { label:'Toplam Ders', value:stats.totalLessons, color:'#92400E', bg:'#FEF3C7' },
        ].map(m=>(
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'4px' }}>{m.label}</div>
            <div style={{ fontSize:'28px', fontWeight:700, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
          Kurumlar ({tenants.length})
        </div>
        {tenants.length===0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Henüz kurum yok</div>
        ) : tenants.map((t,i)=>(
          <div key={t.id} style={{ padding:'12px 16px', borderBottom:i<tenants.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
              {t.name[0]}
            </div>
            <div style={{ flex:1, minWidth:'120px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{t.name}</span>
                <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:'#EEF3FB', color:'#1B3A6B' }}>{t.plan?.toUpperCase()}</span>
                {!t.is_active&&<span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:'#FEF2F2', color:'#7F1D1D' }}>PASİF</span>}
              </div>
              <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{t.slug} · {t.contact_email} · Maks: {t.max_students} öğrenci</div>
            </div>
            <button onClick={()=>toggleActive(t.id,t.is_active)} style={{ padding:'6px 12px', borderRadius:'7px', border:'1px solid #E2E8F0', background:t.is_active?'#FEF3C7':'#DCFCE7', color:t.is_active?'#92400E':'#14532D', fontSize:'11.5px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
              {t.is_active?'Pasife Al':'Aktive Et'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }} onClick={()=>setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', width:'460px', maxWidth:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
              <h2 style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Yeni Kurum Ekle</h2>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:'18px', cursor:'pointer', color:'#7A8FA8' }}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2" style={{ marginBottom:'12px' }}>
                <div><label style={lbl}>Kurum Adı</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required placeholder="ABC Dershane" style={inp} /></div>
                <div><label style={lbl}>Slug</label><input value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s/g,'-')}))} required placeholder="abc-dershane" style={inp} /></div>
              </div>
              <div style={{ marginBottom:'12px' }}><label style={lbl}>E-posta</label><input type="email" value={form.contact_email} onChange={e=>setForm(p=>({...p,contact_email:e.target.value}))} placeholder="admin@dershane.com" style={inp} /></div>
              <div style={{ marginBottom:'12px' }}>
                <label style={lbl}>Plan</label>
                <select value={form.plan} onChange={e=>setForm(p=>({...p,plan:e.target.value}))} style={inp}>
                  <option value="basic">Basic (50 öğrenci)</option>
                  <option value="pro">Pro (200 öğrenci)</option>
                  <option value="enterprise">Enterprise (Sınırsız)</option>
                </select>
              </div>
              <div className="grid-2" style={{ marginBottom:'18px' }}>
                <div><label style={lbl}>Maks Öğrenci</label><input type="number" value={form.max_students} onChange={e=>setForm(p=>({...p,max_students:parseInt(e.target.value)}))} style={inp} /></div>
                <div><label style={lbl}>Maks Öğretmen</label><input type="number" value={form.max_teachers} onChange={e=>setForm(p=>({...p,max_teachers:parseInt(e.target.value)}))} style={inp} /></div>
              </div>
              {error&&<div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px', fontSize:'12px', color:'#7F1D1D', marginBottom:'12px' }}>{error}</div>}
              <div style={{ display:'flex', gap:'8px' }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  {saving?'Oluşturuluyor...':'Kurumu Oluştur'}
                </button>
                <button type="button" onClick={()=>setShowModal(false)} style={{ padding:'10px 16px', borderRadius:'8px', background:'#F1F5F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}