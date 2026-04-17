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
      .select('*, classrooms(name)')
      .eq('role', 'student')
      .eq('tenant_id', '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f')
      .order('grade_level', { ascending: true })
    setStudents(data ?? [])
    setLoading(false)
  }

  async function deleteStudent(id: string, name: string) {
    if (!confirm(`"${name}" öğrencisini silmek istediğinizden emin misiniz?`)) return
    setDeleting(id)
    await supabase.from('student_topic_performance').delete().eq('student_id', id)
    await supabase.from('student_question_attempts').delete().eq('student_id', id)
    await supabase.from('homework_assignments').delete().eq('student_id', id)
    await supabase.from('lessons').delete().eq('student_id', id)
    await supabase.from('notifications').delete().eq('to_profile_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    await load()
    setDeleting(null)
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
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Öğrenci Ekle
        </a>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'Telefon', 'Kayıt Tarihi', 'Durum', 'İşlem'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4A6080', letterSpacing: '.3px', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>Henüz öğrenci eklenmemiş</div>
                  <a href="/students/new" style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>+ İlk öğrenciyi ekle</a>
                </td>
              </tr>
            ) : students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #EEF2F9' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
{s.grade_level && (
  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px', marginLeft: '6px', background: s.grade_level <= 4 ? '#EAF4EE' : s.grade_level <= 8 ? '#EEF3FB' : '#F0ECFB', color: s.grade_level <= 4 ? '#2E7D52' : s.grade_level <= 8 ? '#1B3A6B' : '#6B4FC8' }}>
    {s.grade_level}. Sınıf {(s.classrooms as any)?.name ? '· ' + (s.classrooms as any).name : ''}
  </span>
)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
  {s.grade_level && (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '6px', background: s.grade_level <= 4 ? '#EAF4EE' : s.grade_level <= 8 ? '#EEF3FB' : '#F0ECFB', color: s.grade_level <= 4 ? '#2E7D52' : s.grade_level <= 8 ? '#1B3A6B' : '#6B4FC8' }}>
      {s.grade_level}. Sınıf
    </span>
  )}
  {(s.classrooms as any)?.name && (
    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '6px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
      {(s.classrooms as any).name}
    </span>
  )}
</div>
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
                  <button
                    onClick={() => deleteStudent(s.id, s.full_name)}
                    disabled={deleting === s.id}
                    style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {deleting === s.id ? '...' : 'Sil'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}