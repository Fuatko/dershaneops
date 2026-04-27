'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TopicsPage() {
  const [mounted, setMounted] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [tenantId, setTenantId] = useState('')
  const [name, setName] = useState('')
  const [orderNo, setOrderNo] = useState(1)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data } = await supabase.from('subjects').select('*').eq('tenant_id', prof.tenant_id).order('name')
    setSubjects(data ?? [])
    setLoading(false)
  }

  async function selectSubject(s: any) {
    setSelectedSubject(s)
    setShowForm(false)
    setError('')
    const { data } = await supabase.from('topics').select('*').eq('subject_id', s.id).order('order_no')
    setTopics(data ?? [])
    setOrderNo((data?.length ?? 0) + 1)
  }

  async function handleSave() {
    if (!name.trim() || !selectedSubject) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('topics').insert({
      name: name.trim(),
      subject_id: selectedSubject.id,
      order_no: orderNo,
    })
    if (err) {
      setError(err.message)
    } else {
      setName('')
      setShowForm(false)
      await selectSubject(selectedSubject)
    }
    setSaving(false)
  }

  async function handleDelete(id: string, n: string) {
    if (!confirm('"' + n + '" silinsin mi?')) return
    setDeleting(id)
    await supabase.from('topics').delete().eq('id', id)
    await selectSubject(selectedSubject)
    setDeleting(null)
  }

  if (!mounted || loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'24px 20px', maxWidth:'1000px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Konu Yonetimi</h1>
        <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Dersler altindaki konulari tanimlayin</p>
      </div>

      {subjects.length === 0 ? (
        <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
          <div style={{ fontSize:'13px', color:'#92400E', fontWeight:600, marginBottom:'10px' }}>Once Dersler sayfasindan ders ekleyin</div>
          <a href="/subjects" style={{ padding:'7px 14px', borderRadius:'7px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:600, textDecoration:'none' }}>
            Ders Yonetimine Git
          </a>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', alignSelf:'start' }}>
            <div style={{ padding:'10px 14px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', fontSize:'12px', fontWeight:700, color:'#475569' }}>
              Ders Sec
            </div>
            {subjects.map(s => (
              <div key={s.id} onClick={() => selectSubject(s)}
                style={{ padding:'10px 14px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', background:selectedSubject?.id===s.id?'#EEF3FB':'#fff', borderLeft:selectedSubject?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:s.color??'#1B3A6B', flexShrink:0 }} />
                <span style={{ fontSize:'12.5px', fontWeight:selectedSubject?.id===s.id?700:500, color:'#1B3A6B' }}>{s.name}</span>
              </div>
            ))}
          </div>

          <div>
            {!selectedSubject ? (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'13px', color:'#94A3B8' }}>Sol listeden ders secin</div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:selectedSubject.color??'#1B3A6B' }} />
                    <span style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B' }}>{selectedSubject.name}</span>
                    <span style={{ fontSize:'11px', color:'#94A3B8' }}>{topics.length} konu</span>
                  </div>
                  <button onClick={() => setShowForm(!showForm)}
                    style={{ padding:'7px 14px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer' }}>
                    + Konu Ekle
                  </button>
                </div>

                {error && (
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'10px', fontSize:'12px', color:'#DC2626' }}>
                    Hata: {error}
                  </div>
                )}

                {showForm && (
                  <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E2E8F0', padding:'14px', marginBottom:'12px', display:'flex', gap:'8px', alignItems:'flex-end' }}>
                    <div style={{ flex:1 }}>
                      <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>KONU ADI</label>
                      <input value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        placeholder="Ornek: Karekok" autoFocus
                        style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' as any }} />
                    </div>
                    <div style={{ width:'80px' }}>
                      <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px' }}>SIRA</label>
                      <input type="number" value={orderNo} onChange={e => setOrderNo(parseInt(e.target.value)||1)}
                        style={{ width:'100%', padding:'9px 8px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', boxSizing:'border-box' as any }} />
                    </div>
                    <button onClick={handleSave} disabled={saving}
                      style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {saving ? '...' : 'Kaydet'}
                    </button>
                    <button onClick={() => { setShowForm(false); setError('') }}
                      style={{ padding:'9px 12px', borderRadius:'8px', background:'#F0F4F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      Iptal
                    </button>
                  </div>
                )}

                {topics.length === 0 ? (
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'32px', textAlign:'center' }}>
                    <div style={{ fontSize:'13px', color:'#94A3B8' }}>Bu ders icin henuz konu eklenmemis</div>
                  </div>
                ) : (
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                    {topics.map((t, i) => (
                      <div key={t.id} style={{ padding:'10px 16px', borderBottom:i<topics.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                          {t.order_no}
                        </div>
                        <span style={{ flex:1, fontSize:'13px', color:'#1B3A6B' }}>{t.name}</span>
                        <button onClick={() => handleDelete(t.id, t.name)} disabled={deleting === t.id}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                          {deleting === t.id ? '...' : 'Sil'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
