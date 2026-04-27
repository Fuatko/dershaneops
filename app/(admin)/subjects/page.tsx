'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SECTIONS = ['SAYISAL', 'SOZEL', 'DIL', 'DIN', 'DIGER']
const COLORS = ['#1B3A6B','#2E7D52','#B45309','#6B4FC8','#C0392B','#0F7070','#E74C3C','#8E44AD','#27AE60','#F39C12','#7F8C8D','#16A085']

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [tenantId, setTenantId] = useState('')
  const [form, setForm] = useState({ name:'', section:'SAYISAL', color:'#1B3A6B' })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data } = await supabase.from('subjects').select('*').eq('tenant_id', prof.tenant_id).order('section').order('name')
    setSubjects(data ?? [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('subjects').insert({
      name: form.name.trim(),
      section: form.section,
      color: form.color,
      tenant_id: tenantId,
      status: 'active',
    })
    setForm({ name:'', section:'SAYISAL', color:'#1B3A6B' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm('"' + name + '" dersini silmek istiyor musunuz?')) return
    setDeleting(id)
    await supabase.from('subjects').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  const sections = [...new Set(subjects.map(s => s.section))].filter(Boolean)

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'24px 20px', maxWidth:'800px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Ders Yonetimi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Kurumunuza ait dersleri tanimlayin</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
          + Ders Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Yeni Ders</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>DERS ADI *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ornek: Matematik" required
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>BOLUM</label>
              <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' }}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'8px' }}>RENK</label>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer', border: form.color === c ? '3px solid #1B3A6B' : '2px solid transparent', boxSizing:'border-box' }} />
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button type="submit" disabled={saving}
              style={{ flex:1, padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ padding:'10px 16px', borderRadius:'8px', background:'#F0F4F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
              Iptal
            </button>
          </div>
        </form>
      )}

      {subjects.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>📚</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B', marginBottom:'6px' }}>Henuz ders eklenmemis</div>
          <div style={{ fontSize:'12px', color:'#94A3B8' }}>Yukardaki butona tiklayarak ders ekleyin</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {(sections.length > 0 ? sections : ['DIGER']).map(section => {
            const sectionSubjects = subjects.filter(s => s.section === section)
            if (sectionSubjects.length === 0) return null
            return (
              <div key={section} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                <div style={{ padding:'10px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', fontSize:'12px', fontWeight:700, color:'#475569' }}>
                  {section} — {sectionSubjects.length} ders
                </div>
                {sectionSubjects.map((s, i) => (
                  <div key={s.id} style={{ padding:'11px 16px', borderBottom:i<sectionSubjects.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:s.color ?? '#1B3A6B', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B' }}>{s.name}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{s.section}</div>
                    </div>
                    <button onClick={() => handleDelete(s.id, s.name)} disabled={deleting === s.id}
                      style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                      {deleting === s.id ? '...' : 'Sil'}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
