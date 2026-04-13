'use client'
export const dynamic = 'force-dynamic'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterTenant, setFilterTenant] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: u } = await supabase
      .from('profiles')
      .select('*, tenants(name)')
      .order('created_at', { ascending: false })
    const { data: t } = await supabase.from('tenants').select('id, name').order('name')
    setUsers(u ?? [])
    setTenants(t ?? [])
    setLoading(false)
  }

  async function updateUser(id: string, updates: any) {
    setSaving(true)
    await supabase.from('profiles').update(updates).eq('id', id)
    await load()
    setSelected((prev: any) => prev ? { ...prev, ...updates } : null)
    setSaving(false)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchTenant = filterTenant === 'all' || u.tenant_id === filterTenant
    return matchSearch && matchRole && matchTenant
  })

  const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    admin: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Admin' },
    teacher: { bg: '#EAF4EE', color: '#2E7D52', label: 'Ogretmen' },
    student: { bg: '#FDF4E7', color: '#B45309', label: 'Ogrenci' },
    parent: { bg: '#F0ECFB', color: '#6B4FC8', label: 'Veli' },
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Tum Kullanicilar</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>{users.length} kullanici kayitli</p>
      </div>

      {/* Filtreler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 200px', gap: '10px', marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad veya telefon ara..." style={inp} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={inp}>
          <option value="all">Tum Roller</option>
          <option value="admin">Admin</option>
          <option value="teacher">Ogretmen</option>
          <option value="student">Ogrenci</option>
          <option value="parent">Veli</option>
        </select>
        <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)} style={inp}>
          <option value="all">Tum Kurumlar</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Ozet */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {Object.entries(ROLE_STYLE).map(([role, style]) => (
          <div key={role} style={{ padding: '6px 12px', borderRadius: '20px', background: style.bg, fontSize: '11.5px', fontWeight: 600, color: style.color }}>
            {style.label}: {users.filter(u => u.role === role).length}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '16px' }}>

        {/* Liste */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12px', color: '#7A8FA8' }}>
            {filtered.length} sonuc
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Kullanici bulunamadi</div>
          ) : filtered.map((u, i) => {
            const rs = ROLE_STYLE[u.role] ?? { bg: '#F0F4F9', color: '#4A6080', label: u.role }
            return (
              <div
                key={u.id}
                onClick={() => setSelected(selected?.id === u.id ? null : u)}
                style={{ padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: selected?.id === u.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === u.id ? '3px solid #1B3A6B' : '3px solid transparent' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: selected?.id === u.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: selected?.id === u.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{u.full_name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: rs.bg, color: rs.color }}>{rs.label}</span>
                    {u.is_super_admin && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: '#F0ECFB', color: '#6B4FC8' }}>SUPER ADMIN</span>}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                    {(u.tenants as any)?.name ?? 'Kurumsuz'} {u.phone ? '• ' + u.phone : ''}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {new Date(u.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Detay */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', alignSelf: 'flex-start', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Kullanici Detayi</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#7A8FA8' }}>x</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: '#F5F8FF', borderRadius: '10px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {selected.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{selected.full_name}</div>
                <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{(selected.tenants as any)?.name ?? 'Kurumsuz'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Rol Degistir</label>
              <select
                value={selected.role}
                onChange={e => updateUser(selected.id, { role: e.target.value })}
                style={inp}
                disabled={saving}
              >
                <option value="admin">Admin</option>
                <option value="teacher">Ogretmen</option>
                <option value="student">Ogrenci</option>
                <option value="parent">Veli</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Kurum Degistir</label>
              <select
                value={selected.tenant_id ?? ''}
                onChange={e => updateUser(selected.id, { tenant_id: e.target.value || null })}
                style={inp}
                disabled={saving}
              >
                <option value="">Kurumsuz</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '8px' }}>Ozel Yetkiler</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#1B3A6B' }}>
                <input
                  type="checkbox"
                  checked={selected.is_super_admin ?? false}
                  onChange={e => updateUser(selected.id, { is_super_admin: e.target.checked })}
                  style={{ accentColor: '#6B4FC8' }}
                />
                Super Admin Yetkisi
              </label>
            </div>

            {[
              { label: 'Kayit Tarihi', value: new Date(selected.created_at).toLocaleDateString('tr-TR') },
              { label: 'Kullanici ID', value: selected.id.slice(0, 8) + '...' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #F0F4F9', fontSize: '12px' }}>
                <span style={{ color: '#7A8FA8' }}>{row.label}</span>
                <span style={{ color: '#1B3A6B', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
