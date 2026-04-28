'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_CFG: Record<string, { label:string, color:string, bg:string }> = {
  new:        { label:'Yeni',      color:'#1B3A6B', bg:'#EEF3FB' },
  contacted:  { label:'Iletisimde', color:'#B45309', bg:'#FEF3C7' },
  interested: { label:'Ilgili',    color:'#6B4FC8', bg:'#EDE9FE' },
  enrolled:   { label:'Kayitli',   color:'#2E7D52', bg:'#DCFCE7' },
  lost:       { label:'Kaybedildi',color:'#DC2626', bg:'#FEF2F2' },
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState<string|null>(null)
  const [filter, setFilter] = useState('all')
  const [tenantId, setTenantId] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data } = await supabase.from('candidates').select('*')
      .eq('tenant_id', prof.tenant_id)
      .order('created_at', { ascending: false })
    setCandidates(data ?? [])
    setLoading(false)
  }

  async function scoreCandidate(candidate: any) {
    setScoring(candidate.id)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candidate_score',
          candidate_name: candidate.full_name,
          grade_level: candidate.grade_level,
          target_exam: candidate.target_exam,
          source: candidate.source,
          current_school: candidate.current_school,
          has_parent_contact: !!candidate.parent_phone,
          has_email: !!candidate.email,
        })
      })
      const d = await res.json()
      if (d.score !== undefined) {
        await supabase.from('candidates').update({
          ai_score: d.score,
          ai_notes: d.notes,
        }).eq('id', candidate.id)
        await load()
      }
    } catch (e) { console.error(e) }
    setScoring(null)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('candidates').update({ status }).eq('id', id)
    await load()
  }

  async function deleteCandidate(id: string, name: string) {
    if (!confirm('"' + name + '" silinsin mi?')) return
    await supabase.from('candidates').delete().eq('id', id)
    await load()
  }

  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.status === filter)
  const scoreColor = (s: number) => s >= 70 ? '#2E7D52' : s >= 40 ? '#B45309' : '#DC2626'
  const scoreBg = (s: number) => s >= 70 ? '#DCFCE7' : s >= 40 ? '#FEF3C7' : '#FEF2F2'

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Aday Yonetimi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>AI destekli kayit olma olasiligi skoru</p>
        </div>
        <a href={'/apply?tenant=' + tenantId} target="_blank"
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#10B981', color:'#fff', fontSize:'13px', fontWeight:600, textDecoration:'none' }}>
          Basvuru Formunu Ac
        </a>
      </div>

      {/* Metrikler */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', marginBottom:'16px' }}>
        {[
          { label:'Toplam', value:candidates.length, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Yeni', value:candidates.filter(c=>c.status==='new').length, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Ilgili', value:candidates.filter(c=>c.status==='interested').length, color:'#6B4FC8', bg:'#EDE9FE' },
          { label:'Kayitli', value:candidates.filter(c=>c.status==='enrolled').length, color:'#2E7D52', bg:'#DCFCE7' },
          { label:'Kaybedildi', value:candidates.filter(c=>c.status==='lost').length, color:'#DC2626', bg:'#FEF2F2' },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:800, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:'10px', color:m.color, opacity:0.7 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
        {[{id:'all',label:'Tumu'}, ...Object.entries(STATUS_CFG).map(([id,v])=>({id, label:v.label}))].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'5px 14px', borderRadius:'20px', border:'1.5px solid', borderColor:filter===f.id?'#1B3A6B':'#E2E8F0', background:filter===f.id?'#1B3A6B':'#fff', color:filter===f.id?'#fff':'#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>Aday yok</div>
          <div style={{ fontSize:'14px', color:'#94A3B8' }}>Basvuru formu linkini paylasin</div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12.5px' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Ad Soyad','Sinif','Hedef Sinav','Kaynak','AI Skoru','Durum','Islemler'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#475569', fontSize:'11px', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.new
                return (
                  <tr key={c.id} style={{ borderBottom:'1px solid #F8FAFC', background:i%2===0?'#fff':'#FAFBFC' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, color:'#1B3A6B' }}>{c.full_name}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{c.email} {c.phone ? '· '+c.phone : ''}</div>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{c.grade_level ? c.grade_level+'. Sinif' : '-'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{c.target_exam || '-'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{c.source || 'web'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      {c.ai_score > 0 ? (
                        <div>
                          <span style={{ fontSize:'14px', fontWeight:800, padding:'3px 10px', borderRadius:'20px', background:scoreBg(c.ai_score), color:scoreColor(c.ai_score) }}>
                            {c.ai_score}
                          </span>
                          {c.ai_notes && <div style={{ fontSize:'10px', color:'#94A3B8', marginTop:'3px', maxWidth:'120px' }}>{c.ai_notes?.slice(0,50)}...</div>}
                        </div>
                      ) : (
                        <button onClick={() => scoreCandidate(c)} disabled={scoring === c.id}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1E40AF', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                          {scoring === c.id ? 'Skorlaniyor...' : 'AI Skorla'}
                        </button>
                      )}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                        style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid '+cfg.color, background:cfg.bg, color:cfg.color, fontSize:'11px', fontWeight:600, outline:'none', cursor:'pointer' }}>
                        {Object.entries(STATUS_CFG).map(([id, v]) => (
                          <option key={id} value={id}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={() => deleteCandidate(c.id, c.full_name)}
                        style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                        Sil
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
