import { createClient } from '@/lib/supabase/server'

export default async function TeachersPage() {
  const supabase = createClient()

  const { data: teachers, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, created_at')
    .eq('role', 'teacher')
    .order('full_name')

  if (error) {
    console.error(error)
  }

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Öğretmenler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
            Toplam {teachers?.length ?? 0} öğretmen
          </p>
        </div>
        <a href="/teachers/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', borderRadius: '8px',
          background: '#1B3A6B', color: '#fff',
          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        }}>
          + Öğretmen Ekle
        </a>
      </div>

      {/* Tablo */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'Telefon', 'Kayıt Tarihi', 'Durum'].map((h) => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '11.5px', fontWeight: 700,
                  color: '#4A6080', letterSpacing: '.3px',
                  textTransform: 'uppercase'
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers && teachers.length > 0 ? (
              teachers.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < teachers.length - 1 ? '1px solid #EEF2F9' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: '#E2EAF8', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#1B3A6B'
                      }}>
                        {t.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>
                        {t.full_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>
                    {t.phone ?? '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#7A8FA8' }}>
                    {new Date(t.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: '11.5px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                      background: '#EAF4EE', color: '#2E7D52'
                    }}>
                      Aktif
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>
                    Henüz öğretmen eklenmemiş
                  </div>
                  <a href="/teachers/new" style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>
                    + İlk öğretmeni ekle
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
