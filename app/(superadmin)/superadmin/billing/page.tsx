'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  { id: 'basic', label: 'Basic', students: 50, teachers: 10 },
  { id: 'pro', label: 'Pro', students: 200, teachers: 30 },
  { id: 'enterprise', label: 'Enterprise', students: -1, teachers: -1 },
]

export default function BillingPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    setTenants(data ?? [])
    setLoading(false)
  }

  async function changePlan(id: string, plan: string) {
    const p = PLANS.find(x => x.id === plan)
    await supabase.from('tenants').update({
      plan,
      max_students: p?.students === -1 ? 99999 : p?.students,
      max_teachers: p?.teachers === -1 ? 9999 : p?.teachers,
    }).eq('id', id)
    load()
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>
  }

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Plan Yonetimi</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Aktif', value: tenants.filter(t => t.is_active).length, color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Pasif', value: tenants.filter(t => !t.is_active).length, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Toplam', value: tenants.length, color: '#1B3A6B', bg: '#EEF3FB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>Fiyat Bilgisi</div>
        <div style={{ fontSize: '12px', color: '#4A6080' }}>
          Ozel teklif icin{' '}
          <a href="mailto:fuat@servispro.com.tr" style={{ color: '#1B3A6B', fontWeight: 700 }}>
            fuat@servispro.com.tr
          </a>
          {' '}adresine yazin.
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
          Kurum Planlari
        </div>
        {tenants.map((t, i) => (
          <div key={t.id} style={{ padding: '12px 18px', borderBottom: i < tenants.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
              {t.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{t.name}</div>
              <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{t.contact_email}</div>
            </div>
            <select
              value={t.plan}
              onChange={e => changePlan(t.id, e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', background: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              {PLANS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}