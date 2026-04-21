'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

const WCAG_CHECKS = [
  { id:1, category:'Kontrast',        label:'Metin kontrast oranı ≥ 4.5:1',             level:'AA',  status:'pass' },
  { id:2, category:'Kontrast',        label:'Büyük metin kontrast oranı ≥ 3:1',          level:'AA',  status:'pass' },
  { id:3, category:'Klavye',          label:'Tüm işlevler klavyeyle erişilebilir',        level:'AA',  status:'pass' },
  { id:4, category:'Klavye',          label:'Odak (focus) görünür — focus-visible',       level:'AA',  status:'pass' },
  { id:5, category:'Klavye',          label:'Skip-to-content bağlantısı mevcut',          level:'A',   status:'pass' },
  { id:6, category:'Ekran Okuyucu',   label:'ARIA role etiketleri (role, aria-label)',    level:'AA',  status:'pass' },
  { id:7, category:'Ekran Okuyucu',   label:'Tüm görseller alt metin içeriyor',          level:'A',   status:'warn' },
  { id:8, category:'Ekran Okuyucu',   label:'Form etiketleri (label for)',                level:'A',   status:'pass' },
  { id:9, category:'Ekran Okuyucu',   label:'aria-live canlı bölgeler bildirim yapıyor', level:'AA',  status:'warn' },
  { id:10,category:'Sesli Okuma',     label:'Web Speech API — Türkçe TTS entegre',       level:'AAA', status:'pass' },
  { id:11,category:'Sesli Okuma',     label:'Hız ve ses kontrolü',                        level:'AAA', status:'pass' },
  { id:12,category:'Sesli Okuma',     label:'NVDA / JAWS uyumluluk (manuel test)',       level:'AAA', status:'manual' },
  { id:13,category:'Yüksek Kontrast', label:'Yüksek kontrast tema (filter: contrast)',   level:'AA',  status:'pass' },
  { id:14,category:'Yüksek Kontrast', label:'Sarı-siyah tema (görme bozukluğu)',         level:'AAA', status:'pass' },
  { id:15,category:'Metin Boyutu',    label:'Kullanıcı tanımlı font ölçekleme (%130)',   level:'AA',  status:'pass' },
  { id:16,category:'Metin Boyutu',    label:'rem/em birimleri — sabit px yok',           level:'AA',  status:'warn' },
  { id:17,category:'Hareket',         label:'prefers-reduced-motion — animasyon kapalı', level:'AA',  status:'pass' },
  { id:18,category:'Dil',             label:'lang="tr" HTML attribute',                  level:'A',   status:'pass' },
]

const STATUS_CFG: any = {
  pass:   { label:'Geçti',     bg:'#DCFCE7', tc:'#14532D', border:'#86EFAC' },
  warn:   { label:'Uyarı',     bg:'#FEF3C7', tc:'#78350F', border:'#FDE68A' },
  manual: { label:'Manuel',    bg:'#EDE9FE', tc:'#4C1D95', border:'#C4B5FD' },
  fail:   { label:'Başarısız', bg:'#FEF2F2', tc:'#7F1D1D', border:'#FECACA' },
}

const LEVEL_CFG: any = {
  A:   { bg:'#F1F5F9', tc:'#475569' },
  AA:  { bg:'#EEF3FB', tc:'#1B3A6B' },
  AAA: { bg:'#EDE9FE', tc:'#4C1D95' },
}

export default function AccessibilityPage() {
  const [filter, setFilter] = useState<'all'|'pass'|'warn'|'manual'>('all')
  const [category, setCategory] = useState('')

  const categories = [...new Set(WCAG_CHECKS.map(c => c.category))]

  const filtered = WCAG_CHECKS.filter(c =>
    (filter === 'all' || c.status === filter) &&
    (!category || c.category === category)
  )

  const pass   = WCAG_CHECKS.filter(c => c.status === 'pass').length
  const warn   = WCAG_CHECKS.filter(c => c.status === 'warn').length
  const manual = WCAG_CHECKS.filter(c => c.status === 'manual').length
  const fail   = WCAG_CHECKS.filter(c => c.status === 'fail').length
  const score  = Math.round(pass / WCAG_CHECKS.length * 100)

  return (
    <main id="main-content" style={{ padding:'24px', maxWidth:'960px', fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      {/* Başlık */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:0 }}>
          Erişilebilirlik — WCAG 2.1 Kontrol Paneli
        </h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>
          Faz 10 — Görme engelli öğrenciler için erişilebilirlik modülü
        </p>
      </div>

      {/* Skor */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:'12px', marginBottom:'20px' }}>
        <div style={{ background:'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', borderRadius:'12px', padding:'16px', color:'#fff', gridColumn:'span 1' }}>
          <div style={{ fontSize:'32px', fontWeight:800 }}>{score}%</div>
          <div style={{ fontSize:'12px', opacity:0.8, marginTop:'2px' }}>WCAG Skoru</div>
        </div>
        {[
          { label:'Geçti',  val:pass,   ...STATUS_CFG.pass   },
          { label:'Uyarı',  val:warn,   ...STATUS_CFG.warn   },
          { label:'Manuel', val:manual, ...STATUS_CFG.manual },
          { label:'Hata',   val:fail,   ...STATUS_CFG.fail   },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'14px 16px', border:`1px solid ${m.border}` }}>
            <div style={{ fontSize:'24px', fontWeight:700, color:m.tc }}>{m.val}</div>
            <div style={{ fontSize:'11px', color:m.tc, marginTop:'2px', opacity:0.8 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Özellikler */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        {[
          { icon:'🔊', title:'Sesli Okuma (TTS)',      desc:'Web Speech API · Türkçe · Hız & ses kontrolü',         color:'#1B3A6B', bg:'#EEF3FB' },
          { icon:'🎨', title:'Yüksek Kontrast',        desc:'Standart / Yüksek kontrast / Sarı-siyah tema',          color:'#4C1D95', bg:'#EDE9FE' },
          { icon:'⌨️', title:'Klavye Navigasyonu',     desc:'Tab, F1 kısayol · Skip link · Focus ring',              color:'#14532D', bg:'#DCFCE7' },
          { icon:'📐', title:'Font Ölçekleme',         desc:'%100 / %115 / %130 — rem/em birimleri',                 color:'#78350F', bg:'#FEF3C7' },
          { icon:'🏷️', title:'ARIA Etiketleri',        desc:'role · aria-label · aria-live · aria-expanded',         color:'#7F1D1D', bg:'#FEF2F2' },
          { icon:'🖥️', title:'Ekran Okuyucu Uyumu',   desc:'NVDA / JAWS · Semantic HTML · alt metinler',            color:'#0F6E56', bg:'#E1F5EE' },
        ].map(f => (
          <div key={f.title} style={{ background:f.bg, borderRadius:'10px', padding:'14px', border:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:'22px', marginBottom:'6px' }}>{f.icon}</div>
            <div style={{ fontSize:'13px', fontWeight:700, color:f.color, marginBottom:'3px' }}>{f.title}</div>
            <div style={{ fontSize:'11px', color:'#64748B', lineHeight:1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', borderRadius:'8px', padding:'3px' }}>
          {([['all','Tümü'],['pass','Geçti'],['warn','Uyarı'],['manual','Manuel']] as [typeof filter, string][]).map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding:'5px 12px', borderRadius:'5px', border:'none', background:filter===val?'#fff':'transparent', color:filter===val?'#1B3A6B':'#64748B', fontSize:'12px', fontWeight:filter===val?700:500, cursor:'pointer' }}>
              {lbl}
            </button>
          ))}
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'12px', color:'#1E293B', background:'#fff', outline:'none' }}>
          <option value="">Tüm Kategoriler</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Kontrol listesi */}
      <div role="list" aria-label="WCAG kontrol listesi" style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {filtered.map(check => (
          <div key={check.id} role="listitem" style={{ background:'#fff', borderRadius:'10px', padding:'12px 16px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'1px 7px', borderRadius:'4px', background:LEVEL_CFG[check.level].bg, color:LEVEL_CFG[check.level].tc }}>
                  {check.level}
                </span>
                <span style={{ fontSize:'11px', color:'#94A3B8', fontWeight:500 }}>{check.category}</span>
              </div>
              <div style={{ fontSize:'13px', color:'#1E293B', fontWeight:500 }}>{check.label}</div>
            </div>
            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', background:STATUS_CFG[check.status].bg, color:STATUS_CFG[check.status].tc, border:`1px solid ${STATUS_CFG[check.status].border}`, whiteSpace:'nowrap', flexShrink:0 }}>
              {STATUS_CFG[check.status].label}
            </span>
          </div>
        ))}
      </div>

      {/* Sonraki adımlar */}
      <div style={{ marginTop:'20px', background:'#F8FAFC', borderRadius:'12px', padding:'16px', border:'1px solid #E2E8F0' }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Sonraki Adımlar (Faz 10 Devam)</div>
        {[
          'axe-core tarama entegrasyonu — CI/CD pipeline',
          'NVDA ve JAWS ile manuel test oturumu',
          'Tüm admin sayfalarına aria-label eklenmesi',
          'Görsel olmayan tablo başlıkları (th scope)',
          'Tüm form input\'larına aria-describedby hatası bildirimi',
        ].map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#CBD5E1', flexShrink:0 }} />
            <div style={{ fontSize:'12px', color:'#475569' }}>{item}</div>
          </div>
        ))}
      </div>
    </main>
  )
}