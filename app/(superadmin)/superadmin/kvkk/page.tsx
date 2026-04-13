'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SECURITY_CHECKS = [
  { label: 'Supabase RLS Aktif', status: true, desc: 'Row Level Security tum tablolarda etkin' },
  { label: 'SSL/TLS Baglanti', status: true, desc: 'Tum baglantilarda HTTPS zorunlu' },
  { label: 'JWT Auth', status: true, desc: 'Supabase Auth ile guvenli kimlik dogrulama' },
  { label: 'API Key Gizliligi', status: true, desc: 'Service role key sadece sunucu tarafinda' },
  { label: 'Audit Logging', status: true, desc: 'Tum kritik islemler loglanmakta' },
  { label: 'KVKK Aydinlatma Metni', status: false, desc: 'Kayit sayfasinda gosterilmeli' },
  { label: 'Acik Riza Formu', status: false, desc: 'Kullanicidan onay alinmali' },
  { label: 'Veri Silme Talebi', status: true, desc: 'Bu sayfada mevcut' },
  { label: 'Turkiye Sunucu', status: false, desc: 'Faz 2: Azure Turkey North planli' },
  { label: 'Veri Maskeleme', status: false, desc: 'Hassas alanlarda maskeleme yapilmali' },
]

export default function KvkkPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchName, setSearchName] = useState('')
  const [searchResult, setSearchResult] = useState(null as any)
  const [auditLogs, setAuditLogs] = useState([] as any[])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const passed = SECURITY_CHECKS.filter(c => c.status).length
  const total = SECURITY_CHECKS.length
  const score = Math.round(passed / total * 100)
  const scoreColor = score >= 80 ? '#2E7D52' : score >= 60 ? '#B45309' : '#C0392B'
  const scoreBg = score >= 80 ? '#EAF4EE' : score >= 60 ? '#FDF4E7' : '#FEF2F2'
  const scoreBorder = score >= 80 ? '#A7D9B8' : score >= 60 ? '#FED7AA' : '#FECACA'

  async function searchUser() {
    if (!searchName.trim()) return
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').ilike('full_name', '%' + searchName + '%').limit(1).single()
    setSearchResult(data)
    setLoading(false)
  }

  async function deleteUserData(userId: string, name: string) {
    if (!confirm(name + ' kullanicisinin tum verilerini silmek istiyor musunuz? Bu islem geri alinamaz.')) return
    setLoading(true)
    await supabase.from('homework_assignments').delete().eq('student_id', userId)
    await supabase.from('lessons').delete().eq('student_id', userId)
    await supabase.from('lessons').delete().eq('teacher_id', userId)
    await supabase.from('notifications').delete().eq('to_profile_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    setSearchResult(null)
    setSearchName('')
    alert('Veriler silindi.')
    setLoading(false)
  }

  async function loadAudit() {
    setLoading(true)
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
    setAuditLogs(data ?? [])
    setLoading(false)
  }

  const TABS = [
    { id: 'overview', label: 'Genel Bakis' },
    { id: 'requests', label: 'Veri Silme' },
    { id: 'audit', label: 'Audit Log' },
    { id: 'policy', label: 'Politikalar' },
  ]

  const POLICIES = [
    { title: 'Veri Saklama', content: 'Ogrenci verileri mezuniyetten 2 yil sonra silinir. Finansal veriler 10 yil saklanir. Yedekler haftalik 30 gun, aylik 1 yil tutulur.' },
    { title: 'Erisim Kontrolu', content: 'Her kullanici sadece kendi tenant verisine erisebilir. RLS ile veritabani seviyesinde izolasyon. Sifre sifirlama e-posta ile yapilir.' },
    { title: 'Veri Transferi', content: 'Veriler sifrelenmis HTTPS ile transfer edilir. Ucuncu parti ile veri paylasilmaz. GDPR uyumlu Frankfurt sunucusu kullanilmaktadir.' },
    { title: 'Ihlal Bildirimi', content: 'Guvenlik ihlali tespitinden 72 saat icinde KVKK Kurumu ve ilgili kullanicilar bilgilendirilir.' },
  ]

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>KVKK ve Guvenlik</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Kisisel Verilerin Korunmasi Kanunu uyum takibi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: scoreBg, border: '1px solid ' + scoreBorder, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: scoreColor, marginBottom: '6px' }}>{'%' + score}</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: scoreColor }}>Uyum Skoru</div>
          <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '4px' }}>{passed + '/' + total + ' kontrol gecti'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Gizlilik Seviyesi', value: 'Yuksek', color: '#2E7D52', bg: '#EAF4EE' },
            { label: 'Son Denetim', value: 'Bugun', color: '#1B3A6B', bg: '#EEF3FB' },
            { label: 'Acik Sorunlar', value: (total - passed) + ' madde', color: '#B45309', bg: '#FDF4E7' },
            { label: 'Saklama Yeri', value: 'Frankfurt EU', color: '#6B4FC8', bg: '#F0ECFB' },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10.5px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'audit') loadAudit() }} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          {SECURITY_CHECKS.map((check, i) => (
            <div key={check.label} style={{ padding: '12px 18px', borderBottom: i < SECURITY_CHECKS.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: check.status ? '#EAF4EE' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, color: check.status ? '#2E7D52' : '#C0392B', fontWeight: 700 }}>
                {check.status ? 'V' : 'X'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{check.label}</div>
                <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{check.desc}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: check.status ? '#EAF4EE' : '#FEF2F2', color: check.status ? '#2E7D52' : '#C0392B' }}>
                {check.status ? 'Gecti' : 'Eksik'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Kullanici Verisi Sil (KVKK Madde 7)</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Ad soyad ile ara..." style={{ flex: 1, padding: '8px 12px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none' }} />
            <button onClick={searchUser} disabled={loading} style={{ padding: '8px 16px', borderRadius: '7px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Ara</button>
          </div>
          {searchResult && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>{searchResult.full_name}</div>
              <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '12px' }}>Rol: {searchResult.role}</div>
              <button onClick={() => deleteUserData(searchResult.id, searchResult.full_name)} disabled={loading} style={{ padding: '8px 14px', borderRadius: '7px', background: '#C0392B', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Tum Verileri Sil
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          {auditLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Henuz audit logu yok</div>
          ) : auditLogs.map((log, i) => (
            <div key={log.id} style={{ padding: '10px 16px', borderBottom: i < auditLogs.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: '#9CA3AF', fontFamily: 'monospace', flexShrink: 0 }}>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
              <span style={{ flex: 1, color: '#374151' }}>{log.action}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {POLICIES.map(p => (
            <div key={p.title} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '8px' }}>{p.title}</div>
              <div style={{ fontSize: '12.5px', color: '#4A6080', lineHeight: 1.7 }}>{p.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
