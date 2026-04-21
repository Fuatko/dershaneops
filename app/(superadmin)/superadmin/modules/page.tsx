'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SECURITY_CHECKS = [
  { label:'Supabase RLS Aktif', status:true, desc:'Row Level Security tüm tablolarda etkin' },
  { label:'SSL/TLS Bağlantı', status:true, desc:'Tüm bağlantılarda HTTPS zorunlu' },
  { label:'JWT Auth', status:true, desc:'Supabase Auth ile güvenli kimlik doğrulama' },
  { label:'API Key Gizliliği', status:true, desc:'Service role key sadece sunucu tarafında' },
  { label:'Audit Logging', status:true, desc:'Tüm kritik işlemler loglanmakta' },
  { label:'KVKK Aydınlatma Metni', status:false, desc:'Kayıt sayfasında gösterilmeli' },
  { label:'Açık Rıza Formu', status:false, desc:'Kullanıcıdan onay alınmalı' },
  { label:'Veri Silme Talebi', status:true, desc:'Bu sayfada mevcut' },
  { label:'Türkiye Sunucu', status:false, desc:'Faz 2: Azure Turkey North planlı' },
  { label:'Veri Maskeleme', status:false, desc:'Hassas alanlarda maskeleme yapılmalı' },
]

export default function KvkkPage() {
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState('')
  const [exportEmail, setExportEmail] = useState('')
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  const passed = SECURITY_CHECKS.filter(c=>c.status).length
  const score = Math.round(passed/SECURITY_CHECKS.length*100)

  async function handleDeleteRequest() {
    if (!deleteEmail) { alert('E-posta girin!'); return }
    if (!confirm(`${deleteEmail} adresine ait tüm veriler silinecek. Devam edilsin mi?`)) return
    setDeleting(true); setDeleteResult('')
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', deleteEmail).single()
    if (!profile) { setDeleteResult('Bu e-posta ile kayıtlı kullanıcı bulunamadı.'); setDeleting(false); return }
    const tables = ['student_topic_performance','student_question_attempts','homework_assignments','lessons','student_streaks','student_goals','attendance','notifications']
    for (const t of tables) {
      await supabase.from(t).delete().eq('student_id', profile.id)
    }
    await supabase.from('profiles').delete().eq('id', profile.id)
    setDeleteResult(`${deleteEmail} kullanıcısının tüm verileri silindi. ✓`); setDeleteEmail(''); setDeleting(false)
  }

  async function handleExportRequest() {
    if (!exportEmail) { alert('E-posta girin!'); return }
    setExporting(true)
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', exportEmail).single()
    if (!profile) { alert('Kullanıcı bulunamadı.'); setExporting(false); return }
    const userData: any = { profile }
    const tables = ['student_topic_performance','homework_assignments','lessons','student_streaks','student_goals','attendance']
    for (const t of tables) {
      const { data } = await supabase.from(t).select('*').eq('student_id', profile.id)
      userData[t] = data??[]
    }
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `kvkk_export_${exportEmail}_${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url); setExporting(false)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>KVKK & Güvenlik</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Kişisel veri koruma ve güvenlik denetimi</p>
      </div>

      {/* Skor */}
      <div style={{ background: score>=70?'#DCFCE7':'#FEF3C7', border:'1px solid '+(score>=70?'#86EFAC':'#FCD34D'), borderRadius:'12px', padding:'16px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:'20px', fontWeight:800, color:score>=70?'#14532D':'#92400E' }}>{score}</div>
        </div>
        <div>
          <div style={{ fontSize:'16px', fontWeight:800, color:score>=70?'#14532D':'#92400E' }}>Güvenlik Skoru: {score}/100</div>
          <div style={{ fontSize:'12px', color:score>=70?'#14532D':'#92400E', marginTop:'2px' }}>
            {passed}/{SECURITY_CHECKS.length} kontrol geçti · {SECURITY_CHECKS.length-passed} iyileştirme gerekli
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', marginBottom:'16px' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Güvenlik Kontrolleri</div>
        {SECURITY_CHECKS.map((c,i)=>(
          <div key={c.label} style={{ padding:'11px 16px', borderBottom:i<SECURITY_CHECKS.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:c.status?'#DCFCE7':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {c.status
                  ? <path d="M2 6l3 3 5-5" stroke="#14532D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M3 3l6 6M9 3l-6 6" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round"/>
                }
              </svg>
            </div>
            <div style={{ flex:1, minWidth:'120px' }}>
              <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{c.label}</div>
              <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{c.desc}</div>
            </div>
            <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'8px', background:c.status?'#DCFCE7':'#FEF2F2', color:c.status?'#14532D':'#7F1D1D', flexShrink:0 }}>
              {c.status?'✓ Geçti':'✗ Eksik'}
            </span>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Veri dışa aktarma */}
        <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Veri Dışa Aktarma (Madde 11)</div>
          <div style={{ fontSize:'12px', color:'#475569', marginBottom:'12px' }}>Kullanıcı kendi verilerini talep ettiğinde JSON formatında çıktı alın.</div>
          <input value={exportEmail} onChange={e=>setExportEmail(e.target.value)} placeholder="kullanici@email.com" style={inp} />
          <button onClick={handleExportRequest} disabled={exporting||!exportEmail} style={{ marginTop:'10px', width:'100%', padding:'9px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
            {exporting?'Aktarılıyor...':'Verileri İndir'}
          </button>
        </div>

        {/* Veri silme */}
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'12px', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#7F1D1D', marginBottom:'12px' }}>Veri Silme Talebi (Madde 7)</div>
          <div style={{ fontSize:'12px', color:'#475569', marginBottom:'12px' }}>Unutulma hakkı kapsamında kullanıcı verilerini tamamen silin.</div>
          <input value={deleteEmail} onChange={e=>setDeleteEmail(e.target.value)} placeholder="kullanici@email.com" style={inp} />
          <button onClick={handleDeleteRequest} disabled={deleting||!deleteEmail} style={{ marginTop:'10px', width:'100%', padding:'9px', borderRadius:'8px', background:'#C0392B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
            {deleting?'Siliniyor...':'Verileri Kalıcı Sil'}
          </button>
          {deleteResult && (
            <div style={{ marginTop:'10px', padding:'10px', borderRadius:'8px', background:'#DCFCE7', border:'1px solid #86EFAC', fontSize:'12px', color:'#14532D', fontWeight:600 }}>
              {deleteResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}