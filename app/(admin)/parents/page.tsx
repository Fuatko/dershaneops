'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentsPage() {
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .order('full_name')
    setParents(data ?? [])
    setLoading(false)
  }

  async function deleteParent(id: string, name: string) {
    if (!confirm('"' + name + '" velisi silinsin mi? Bu islem geri alinamaz.')) return
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
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Veliler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Toplam {parents.length} veli kayıtlı</p>
        </div>
        <a href="/parents/new" style={{ padding: '9px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          + Veli Ekle
        </a>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F8FF', borderBottom: '1px solid #D5DFF0' }}>
              {['Ad Soyad', 'E-posta', 'Telefon', 'Kayıt Tarihi', 'İşlem'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '.3px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>
                  Henüz veli eklenmemiş
                </td>
              </tr>
            ) : parents.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < parents.length - 1 ? '1px solid #EEF2F9' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0ECFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#6B4FC8', flexShrink: 0 }}>
                      {p.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{p.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>{p.email ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4A6080' }}>{p.phone ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '12px', color: '#7A8FA8' }}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                <td style={{ padding: '13px 16px' }}>
                  <a href={`/parents/${p.id}`} style={{ padding:"6px 12px", borderRadius:"7px", border:"1px solid #BFDBFE", background:"#EFF6FF", color:"#1E40AF", fontSize:"12px", fontWeight:600, textDecoration:"none", marginRight:"6px" }}>Duzenle</a>
                  <button onClick={() => deleteParent(p.id, p.full_name)} disabled={deleting === p.id} style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {deleting === p.id ? '...' : 'Sil'}
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