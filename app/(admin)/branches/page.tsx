'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [tenantId, setTenantId] = useState('')
  const [form, setForm] = useState({ name:'', address:'', phone:'', manager_name:'' })
  const [stats, setStats] = useState<Record<string,any>>({})
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data } = await supabase.from('branches').select('*').eq('tenant_id', prof.tenant_id).order('name')
    setBranches(data ?? [])

    // Her şube için istatistik
    const branchStats: Record<string,any> = {}
    for (const b of data ?? []) {
      const { count: studentCount } = await supabase.from('profiles').select('*', { count:'exact', head:true }).eq('branch_id', b.id).eq('role', 'student')
      const { count: teacherCount } = await supabase.from('profiles').select('*', { count:'exact', head:true }).eq('branch_id', b.id).eq('role', 'teacher')
      branchStats[b.id] = { students: studentCount ?? 0, teachers: teacherCount ?? 0 }
    }
    setStats(branchStats)
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('branches').insert({ ...form, tenant_id: tenantId })
    setForm({ name:'', address:'', phone:'', manager_name:'' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm('"' + name + '" subesi silinsin mi?')) return
    setDeleting(id)
    await supabase.from('branches').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  const inp = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' as any }
  const lbl = { display:'block', fontSize:'11px', fontWeight:600 as any, color:'#475569', marginBottom:'5px' }

  return (
    <div style={{ padding:'24px 20px', maxWidth:'900px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ ftSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Sube Yonetimi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Kurum subelerini tanimlayin ve yonetin</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
          + Sube Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Yeni Sube</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={lbl}>SUBE ADI *</label>
              <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ornek: Kadikoy Subesi" required style={inp} />
            </div>
            <div>
              <label style={lbl}>SUBE MUDURU</label>
              <input value={form.manager_name} onChange={e => setForm(p=>({...p,manager_name:e.target.value}))} placeholder="Ad Soyad" style={inp} />
            </div>
            <div>
              <label style={lbl}>TELEFON</label>
              <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="0212 xxx xx xx" style={inp} />
            </div>
            <div>
              <label style={lbl}>ADRES</label>
              <input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="Adres" style={inp} />
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

      {branches.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>🏢</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B', marginBottom:'6px' }}>Henuz sube eklenmemis</div>
          <div style={{ fontSize:'12px', color:'#94A3B8' }}>Yukardaki butona tiklayarak sube ekleyin</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'12px' }}>
          {branches.map(b => (
            <div key={b.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>{b.name}</div>
                  {b.manager_name && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>Mudur: {b.manager_name}</div>}
                  {b.phone && <div style={{ fontSize:'11px', color:'#94A3B8' }}>{b.phone}</div>}
                  {b.address && <div style={{ fontSize:'11px', color:'#94A3B8' }}>{b.address}</div>}
                </div>
                <button onClick={() => handleDelete(b.id, b.name)} disabled={deleting===b.id}
                  style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                  {deleting===b.id ? '...' : 'Sil'}
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div style={{ background:'#EEF3FB', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:'20px', fontWeight:800, color:'#1B3A6B' }}>{stats[b.id]?.students ?? 0}</div>
                  <div style={{ fontSize:'10px', color:'#7A8FA8' }}>Ogrenci</div>
                </div>
                <div style={{ background:'#DCFCE7', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:'20px', fontWeight:800, color:'#2E7D52' }}>{stats[b.id]?.teachers ?? 0}</div>
                  <div style={{ fontSize:'10px', color:'#2E7D52' }}>Ogretmen</div>
                </div>
              </div>
              <a href={'/branch-report/' + b.id}
                style={{ display:'block', marginTop:'10px', padding:'7px', borderRadius:'7px', background:'#F0F4F9', color:'#1B3A6B', fontSize:'12px', fontWeight:600, textDecoration:'none', textAlign:'center' }}>
                Sube Raporu
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
