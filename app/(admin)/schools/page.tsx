'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TYPES = [
  { value: 'dershane', label: 'Dershane' },
  { value: 'okul', label: 'Okul' },
  { value: 'etud', label: 'Etut Merkezi' },
  { value: 'kurs', label: 'Kurs Merkezi' },
]

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBranchForm, setShowBranchForm] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [form, setForm] = useState({ name:'', address:'', phone:'', type:'dershane' })
  const [branchForm, setBranchForm] = useState({ name:'', address:'', phone:'', manager_name:'' })
  const [deleting, setDeleting] = useState<string|null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data: s } = await supabase.from('schools').select('*').eq('tenant_id', prof.tenant_id).order('name')
    const { data: b } = await supabase.from('branches').select('*').eq('tenant_id', prof.tenant_id).order('name')
    setSchools(s ?? [])
    setBranches(b ?? [])
    setLoading(false)
  }

  async function handleSaveSchool(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('schools').insert({ ...form, tenant_id: tenantId })
    setForm({ name:'', address:'', phone:'', type:'dershane' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleSaveBranch(e: React.FormEvent, schoolId: string) {
    e.preventDefault()
    if (!branchForm.name.trim()) return
    setSaving(true)
    await supabase.from('branches').insert({ ...branchForm, school_id: schoolId, tenant_id: tenantId })
    setBranchForm({ name:'', address:'', phone:'', manager_name:'' })
    setShowBranchForm(null)
    await load()
    setSaving(false)
  }

  async function handleDeleteSchool(id: string, name: string) {
    if (!confirm('"' + name + '" silinsin mi? Altindaki subeler de silinecek.')) return
    setDeleting(id)
    await supabase.from('branches').delete().eq('school_id', id)
    await supabase.from('schools').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  async function handleDeleteBranch(id: string, name: string) {
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Kurum ve Sube Yonetimi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Okul, dershane ve subelerini tanimlayin</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
          + Kurum Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveSchool} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Yeni Kurum</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={lbl}>KURUM ADI *</label>
              <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ornek: VISIO CCT Dershane" required style={inp} />
            </div>
            <div>
              <label style={lbl}>KURUM TURU</label>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} style={inp}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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

      {schools.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>🏫</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B' }}>Henuz kurum eklenmemis</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {schools.map(school => {
            const schoolBranches = branches.filter(b => b.school_id === school.id)
            const typeLabel = TYPES.find(t => t.value === school.type)?.label ?? school.type
            return (
              <div key={school.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                {/* Kurum baslik */}
                <div style={{ padding:'14px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'16px' }}>
                      {school.type === 'okul' ? '🏫' : '📚'}
                    </div>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>{school.name}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{typeLabel} {school.phone ? '· '+school.phone : ''}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => setShowBranchForm(showBranchForm === school.id ? null : school.id)}
                      style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1E40AF', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                      + Sube Ekle
                    </button>
                    <button onCli=> handleDeleteSchool(school.id, school.name)} disabled={deleting===school.id}
                      style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                      {deleting===school.id ? '...' : 'Sil'}
                    </button>
                  </div>
                </div>

                {/* Sube ekleme formu */}
                {showBranchForm === school.id && (
                  <form onSubmit={e => handleSaveBranch(e, school.id)} style={{ padding:'14px 16px', background:'#F0F7FF', borderBottom:'1px solid #E2E8F0' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Yeni Sube — {school.name}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:'8px', alignItems:'flex-end' }}>
                      <div>
                        <label style={lbl}>SUBE ADI *</label>
                        <input value={branchForm.name} onChange={e => setBranchForm(p=>({...p,name:e.target.value}))} placeholder="Kadikoy Subesi" required style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>MUDUR</label>
                        <input value={branchForm.manager_name} onChange={e => setBranchForm(p=>({...p,manager_name:e.target.value}))} placeholder="Ad Soyad" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>TELEFON</label>
                        <input value={branchForm.phone} onChange={e => setBranchForm(p=>({...p,phone:e.target.value}))} placeholder="0212 xxx xx xx" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>ADRES</label>
                        <input value={branchForm.address} onChange={e => setBranchForm(p=>({...p,address:e.target.value}))} placeholder="Adres" style={inp} />
                      </div>
                      <button type="submit" disabled={saving}
                        style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                        {saving ? '...' : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Subeler */}
                {schoolBranches.length === 0 ? (
                  <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#94A3B8' }}>
                    Bu kurumun henuz subesi yok — "Sube Ekle" butonuna tiklayin
                  </div>
                ) : (
                  <div>
                    {schoolBranches.map((b, i) => (
                      <div key={b.id} style={{ padding:'10px 16px', borderBottom:i<schoolBranches.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#10B981', flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B' }}>{b.name}</div>
                          <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                            {b.manager_name ? 'Mudur: '+b.manager_name+' ' : ''}
                            {b.phone ? '· '+b.phone : ''}
                            {b.address ? ' · '+b.address : ''}
                          </div>
                        </div>
                        <a href={'/branch-report/'+b.id}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #D5DFF0', background:'#F8FAFC', color:'#1B3A6B', fontSize:'11px', fontWeight:600, textDecoration:'none' }}>
                          Rapor
                        </a>
                        <button onClick={() => handleDeleteBranch(b.id, b.name)} disabled={deleting===b.id}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', ze:'11px', fontWeight:600, cursor:'pointer' }}>
                          {deleting===b.id ? '...' : 'Sil'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
