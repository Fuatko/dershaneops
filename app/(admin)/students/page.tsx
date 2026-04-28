'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('grade_level', { ascending: true })

    const { data: classroomData } = await supabase
      .from('classrooms')
      .select('id, name')

    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name

    const studentsWithClass = (data ?? []).map(s => ({
      ...s,
      classroom_name: s.classroom_id ? (classroomMap[s.classroom_id] ?? null) : null,
    }))

    setStudents(studentsWithClass)
    setLoading(false)
  }

  async function deleteStudent(id: string, name: string) {
    if (!confirm('"' + name + '" silinsin mi? Bu islem geri alinamaz.')) return
    setDeleting(id)
    await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: id })
    })
    await load()
    setDeleting(null)
  }

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color: '#2E7D52', bg: '#EAF4EE' }
    if (grade <= 8) return { color: '#1B3A6B', bg: '#EEF3FB' }
    return { color: '#6B4FC8', bg: '#F0ECFB' }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Öğrenciler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Toplam {students.length} öğrenci kayıtlı</p>
        </div>
        <a href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          + Öğrenci Ekle
        </a>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'Sınıf', 'Telefon', 'Kayıt Tarihi', 'Durum', 'İşlem'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4A6080', letterSpacing: '.3px', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>Henüz öğrenci eklenmemiş</div>
                  <a href="/students/new" style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>+ İlk öğrenciyi ekle</a>
                </td>
              </tr>
            ) : students.map((s, i) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              return (
                <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #EEF2F9' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: lv ? lv.bg : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: lv ? lv.color : '#1B3A6B', flexShrink: 0 }}>
                        {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {s.grade_level && lv ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: lv.bg, color: lv.color }}>
                          {s.grade_level}. Sınıf
                        </span>
                      ) : <span style={{ color: '#D5DFF0' }}>—</span>}
                      {s.classroom_name && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
                          {s.classroom_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>{s.phone ?? '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#7A8FA8' }}>
                    {new Date(s.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52' }}>Aktif</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <a href={'/students/' + s.id} style={{ padding:'6px 12px', borderRadius:'7px', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1E40AF', fontSize:'12px', fontWeight:600, textDecoration:'none', marginRight:'6px' }}>Duzenle</a>
                    <button onClick={() => deleteStudent(s.id, s.full_name)} disabled={deleting === s.id} style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      {deleting === s.id ? '...' : 'Sil'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}