import { createClient } from '@/lib/supabase/server'

export default async function StudentsPage() {
  const supabase = createClient()
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name')

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Öğrenciler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
            Toplam {students?.length ?? 0} öğrenci kayıtlı
          </p>
        </div>
        <a href="/students/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', borderRadius: '8px',
          background: '#1B3A6B', color: '#fff',
          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Öğrenci Ekle
        </a>
      </div>

      {/* Tablo */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'E-posta', 'Telefon', 'Kayıt Tarihi', 'Durum'].map((h) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4A6080', letterSpacing: '.3px', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students && students.length > 0 ? students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #EEF2F9' : 'none' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>
                  {s.user_id ? '—' : '—'}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>
                  {s.phone ?? '—'}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '12px', color: '#7A8FA8' }}>
                  {new Date(s.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52' }}>
                    Aktif
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>Henüz öğrenci eklenmemiş</div>
                  <a href="/students/new" style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>
                    + İlk öğrenciyi ekle
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
