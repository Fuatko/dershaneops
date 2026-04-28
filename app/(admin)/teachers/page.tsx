'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('role', 'teacher')
      .order('full_name')
    setTeachers(data ?? [])
    setLoading(false)
  }

  async function deleteTeacher(id: string, name: string) {
    if (!confirm('"' + name + '" ogretmeni silinsin mi? Bu islem geri alinamaz.')) return
    setDeleting(id)
    await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: id })
    })
    await load()
    setDeleting(null)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Öğretmenler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Toplam {teachers.length} öğretmen</p>
        </div>
        <a href="/teachers/new" style={{ padding: '9px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          + Öğretmen Ekle
        </a>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'Telefon', 'Kayıt Tarihi', 'Durum', 'İşlem'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>
                  Henüz öğretmen eklenmemiş
                </td>
              </tr>
            ) : teachers.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < teachers.length - 1 ? '1px solid #F0F4F9' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {t.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{t.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>{t.phone ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>
                  {new Date(t.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52' }}>Aktif</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <button
                  <a href={`/teachers/${t.id}`} style={{ padding:"6px 12px", borderRadius:"7px", border:"1px solid #BFDBFE", background:"#EFF6FF", color:"#1E40AF", fontSize:"12px", fontWeight:600, textDecoration:"none", marginRight:"6px" }}>Duzenle</a>
                    onClick={() => deleteTeacher(t.id, t.full_name)}
                    disabled={deleting === t.id}
                    style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {deleting === t.id ? '...' : 'Sil'}
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