import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const [
    { count: studentCount },
    { count: teacherCount },
    { count: bookCount },
    { count: homeworkCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('homework_assignments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B2A4A', margin: 0, letterSpacing: '-.2px' }}>Dashboard</h1>
          <p style={{ fontSize: '12px', color: '#6B7A99', margin: '3px 0 0' }}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ label: 'Sistem Aktif', ok: true }, { label: 'DB Bağlı', ok: true }].map((p) => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#EAF4EE', border: '1px solid #86EFAC' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#15803D' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Öğrenci', value: studentCount ?? 0, accent: '#3B6FD4', bg: '#EEF3FB', icon: 'M9 11c2.5 0 4.5 2 4.5 4.5H4.5C4.5 13 6.5 11 9 11zm0-7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z' },
          { label: 'Öğretmen', value: teacherCount ?? 0, accent: '#2E7D52', bg: '#EAF4EE', icon: 'M9 10.5c2.8 0 5 2.2 5 5H4c0-2.8 2.2-5 5-5zm0-7a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 7.5l-1.5 3.5h3L9 11z' },
          { label: 'Kitap', value: bookCount ?? 0, accent: '#6B4FC8', bg: '#F0ECFB', icon: 'M3 2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3V2zm2.5 4h5M5.5 9h5M5.5 12h3' },
          { label: 'Bekleyen Ödev', value: homeworkCount ?? 0, accent: '#B45309', bg: '#FDF4E7', icon: 'M3 3h12v12H3V3zm2.5 4h7M5.5 9h5M5.5 12h3' },
        ].map((m) => (
          <div key={m.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5EAF3', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#1B3A6B', fontWeight: 700 }}>{m.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d={m.icon} stroke={m.accent} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Hızlı Erişim */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { title: 'Kitap Ekle', desc: 'Excel veya OCR ile kitap tanımla', href: '/books', accent: '#3B6FD4' },
          { title: 'Ders Planla', desc: 'Haftalık takvime ders ekle', href: '/scheduler', accent: '#2E7D52' },
          { title: 'Telafi Oluştur', desc: 'Kaçırılan dersler için telafi', href: '/makeup', accent: '#B45309' },
        ].map((q) => (
          <a key={q.title} href={q.href} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5EAF3', borderLeft: `3px solid ${q.accent}`, padding: '16px 18px', textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B2A4A', marginBottom: '4px' }}>{q.title}</div>
            <div style={{ fontSize: '11.5px', color: '#6B7A99' }}>{q.desc}</div>
          </a>
        ))}
      </div>

      {/* Alt */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Sistem */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5EAF3', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#3B6FD4" strokeWidth="1.3" fill="none"/><path d="M7 4.5v3l2 1.5" stroke="#3B6FD4" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B2A4A' }}>Sistem Durumu</span>
          </div>
          {[
            { label: 'Veritabanı (Supabase)', ok: true },
            { label: 'Kimlik Doğrulama', ok: true },
            { label: 'AI Modülü (Claude API)', ok: true },
            { label: 'WhatsApp Bildirimleri', ok: false },
            { label: 'PDF Üretimi', ok: true },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #F0F3F9' : 'none' }}>
              <span style={{ fontSize: '12.5px', color: '#374151' }}>{item.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', background: item.ok ? '#EAF4EE' : '#FDF4E7', color: item.ok ? '#2E7D52' : '#B45309' }}>
                {item.ok ? 'Aktif' : 'Yapılandırılmadı'}
              </span>
            </div>
          ))}
        </div>

        {/* Adımlar */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5EAF3', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h7M2 10h5" stroke="#2E7D52" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B2A4A' }}>Kurulum Adımları</span>
          </div>
          {[
            { step: 1, label: 'Öğretmen ekle', href: '/teachers', done: (teacherCount ?? 0) > 0 },
            { step: 2, label: 'Öğrenci ekle', href: '/students', done: (studentCount ?? 0) > 0 },
            { step: 3, label: 'Kitap tanımla', href: '/books', done: (bookCount ?? 0) > 0 },
            { step: 4, label: 'Haftalık ders planla', href: '/scheduler', done: false },
            { step: 5, label: 'İlk ödevi ata', href: '/books', done: false },
          ].map((item, i, arr) => (
            <a key={item.step} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #F0F3F9' : 'none', textDecoration: 'none' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, background: item.done ? '#EAF4EE' : '#EEF3FB', color: item.done ? '#2E7D52' : '#3B6FD4', border: `1.5px solid ${item.done ? '#86EFAC' : '#BFDBFE'}` }}>
                {item.done ? '✓' : item.step}
              </div>
              <span style={{ fontSize: '12.5px', flex: 1, color: item.done ? '#9CA3AF' : '#374151', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.label}
              </span>
              {!item.done && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>→</span>}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
