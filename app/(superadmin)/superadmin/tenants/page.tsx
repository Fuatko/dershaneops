'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [tenantUsers, setTenantUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', plan: 'basic', contact_email: '', phone: '', address: '', max_students: 50, max_teachers: 10 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    setTenants(data ?? [])
    setLoading(false)
  }

  async function loadTenantUsers(tenantId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('tenant_id', tenantId)
      .order('role')
    setTenantUsers(data ?? [])
  }

  async function selectTenant(tenant: any) {
    setSelected(tenant)
    await loadTenantUsers(tenant.id)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('tenants').insert({ ...form, is_active: true })
    if (err) { setError(err.message); setSaving(false); return }
    setShowModal(false)
    setForm({ name: '', slug: '', plan: 'basic', contact_email: '', phone: '', address: '', max_students: 50, max_teachers: 10 })
    load()
    setSaving(false)
  }

  async function handleUpdate(id: string, updates: any) {
    await supabase.from('tenants').update(updates).eq('id', id)
    load()
    if (selected?.id === id) setSelected({ ...selected, ...updates })
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" kurumunu silmek istediginizden emin misiniz? Bu islem geri alinamaz.`)) return
    await supabase.from('tenants').delete().eq('id', id)
    setSelected(null)
    load()
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const PLAN_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    basic: { bg: '#F0F4F9', color: '#4A6080', label: 'Basic' },
    pro: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Pro' },
    enterprise: { bg: '#F0ECFB', color: '#6B4FC8', label: 'Enterprise' },
  }

  const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
    admin: { bg: '#EEF3FB', color: '#1B3A6B' },
    teacher: { bg: '#EAF4EE', color: '#2E7D52' },
    student: { bg: '#FDF4E7', color: '#B45309' },
    parent: { bg: '#F0ECFB', color: '#6B4FC8' },
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Kurumlar</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>{tenants.length} kurum kayitli</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '9px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          + Yeni Kurum
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '16px' }}>

        {/* Sol: Kurum Listesi */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kurum ara..."
              style={{ ...inp, padding: '9px 12px' }}
            />
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Kurum bulunamadi</div>
            ) : filtered.map((tenant, i) => {
              const ps = PLAN_STYLE[tenant.plan] ?? PLAN_STYLE.basic
              const isSelected = selected?.id === tenant.id
              return (
                <div
                  key={tenant.id}
                  onClick={() => selectTenant(tenant)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #F0F4F9' : 'none',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer',
                    background: isSelected ? '#F5F8FF' : '#fff',
                    borderLeft: isSelected ? '3px solid #1B3A6B' : '3px solid transparent',
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: isSelected ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: isSelected ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                    {tenant.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{tenant.name}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: ps.bg, color: ps.color }}>{ps.label}</span>
                      {!tenant.is_active && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: '#FEF2F2', color: '#C0392B' }}>PASiF</span>}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{tenant.contact_email} • {tenant.max_students} ogrenci</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    {new Date(tenant.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sag: Detay Paneli */}
        {selected && (
          <div style={{ alignSelf: 'flex-start', position: 'sticky', top: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '14px 16px', background: '#F5F8FF', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    {selected.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B3A6B' }}>{selected.name}</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{selected.slug}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#7A8FA8' }}>x</button>
              </div>

              <div style={{ padding: '14px 16px' }}>
                {[
                  { label: 'E-posta', value: selected.contact_email },
                  { label: 'Telefon', value: selected.phone || '-' },
                  { label: 'Adres', value: selected.address || '-' },
                  { label: 'Plan', value: (PLAN_STYLE[selected.plan] ?? PLAN_STYLE.basic).label },
                  { label: 'Maks Ogrenci', value: selected.max_students },
                  { label: 'Maks Ogretmen', value: selected.max_teachers },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12.5px' }}>
                    <span style={{ color: '#7A8FA8', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color: '#1B3A6B', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderTop: '1px solid #F0F4F9' }}>
                <button
                  onClick={() => handleUpdate(selected.id, { is_active: !selected.is_active })}
                  style={{ flex: 1, padding: '8px', borderRadius: '7px', border: '1px solid #D5DFF0', background: selected.is_active ? '#FDF4E7' : '#EAF4EE', color: selected.is_active ? '#B45309' : '#2E7D52', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {selected.is_active ? 'Pasife Al' : 'Aktive Et'}
                </button>
                <button
                  onClick={() => handleDelete(selected.id, selected.name)}
                  style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Sil
                </button>
              </div>
            </div>

            {/* Kullanicilar */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Kullanicilar ({tenantUsers.length})</span>
              </div>
              {tenantUsers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#7A8FA8' }}>Henuz kullanici yok</div>
              ) : tenantUsers.map((u, i) => {
                const rs = ROLE_STYLE[u.role] ?? { bg: '#F0F4F9', color: '#4A6080' }
                return (
                  <div key={u.id} style={{ padding: '10px 16px', borderBottom: i < tenantUsers.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ flex: 1, fontSize: '12.5px', color: '#1B3A6B', fontWeight: 500 }}>{u.full_name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: rs.bg, color: rs.color }}>{u.role}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Yeni Kurum Ekle</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#7A8FA8' }}>x</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div><label style={lbl}>Kurum Adi *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="ABC Dershane" style={inp} /></div>
                <div><label style={lbl}>Slug *</label><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} required placeholder="abc-dershane" style={inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div><label style={lbl}>E-posta</label><input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Telefon</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp} /></div>
              </div>
              <div style={{ marginBottom: '12px' }}><label style={lbl}>Adres</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={inp} /></div>
              <div style={{ marginBottom: '12px' }}><label style={lbl}>Plan</label>
                <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} style={inp}>
                  <option value="basic">Basic — 50 ogrenci</option>
                  <option value="pro">Pro — 200 ogrenci</option>
                  <option value="enterprise">Enterprise — Sinirsiz</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div><label style={lbl}>Maks Ogrenci</label><input type="number" value={form.max_students} onChange={e => setForm(p => ({ ...p, max_students: parseInt(e.target.value) }))} style={inp} /></div>
                <div><label style={lbl}>Maks Ogretmen</label><input type="number" value={form.max_teachers} onChange={e => setForm(p => ({ ...p, max_teachers: parseInt(e.target.value) }))} style={inp} /></div>
              </div>
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#C0392B', marginBottom: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {saving ? 'Olusturuluyor...' : 'Kurumu Olustur'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Iptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
