'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data } = await supabase.from('schools').select('*').eq('tenant_id', prof.tenant_id).order('name')
    setSchools(data ?? [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('schools').insert({
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      tenant_id: tenantId,
    })
    setForm({ name: '', address: '', phone: '' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm('"' + name + '" silinsin mi?')) return
    setDeleting(id)
    await supabase.from('schools').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'24px 20px', maxWidth:'800px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Okul Yonetimi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Ogrencilerin kayitli oldugu okullari tanimlayin</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
          + Okul Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Yeni Okul</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>OKUL ADI *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ornek: Sisli Terakki Lisesi" required
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>ADRES</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Okul adresi (opsiyonel)"
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>TELEFON</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Okul telefonu (opsiyonel)"
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
              <button type="submit" disabled={saving}
                style={{ flex:1, padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding:'10px 16px', borderRadius:'8px', background:'#F0F4F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                İptal
              </button>
            </div>
          </div>
        </form>
      )}

      {schools.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>🏫</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B', marginBottom:'6px' }}>Henuz okul eklenmemis</div>
          <div style={{ fontSize:'12px', color:'#94A3B8' }}>Yukardaki butona tiklayarak okul ekleyin</div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', fontSize:'12px', fontWeight:700, color:'#475569' }}>
            {schools.length} okul kayitli
          </div>
          {schools.map((school, i) => (
            <div key={school.id} style={{ padding:'12px 16px', borderBottom:i<schools.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                🏫
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B' }}>{school.name}</div>
                {school.address && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{school.address}</div>}
                {school.phone && <div style={{ fontSize:'11px', color:'#94A3B8' }}>{school.phone}</div>}
              </div>
              <button onClick={() => handleDelete(school.id, school.name)} disabled={deleting === school.id}
                style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                {deleting === school.id ? '...' : 'Sil'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
