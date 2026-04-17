'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BillingPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [tenantSubs, setTenantSubs] = useState<any[]>([])
  const [tenantInvoices, setTenantInvoices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [newSub, setNewSub] = useState({
    package_key: 'growth', start_date: new Date().toISOString().slice(0, 10),
    billing_day: 1, student_count: 0, notes: ''
  })
  const [newInvoice, setNewInvoice] = useState({
    subscription_id: '', period_start: '', period_end: '',
    amount: 0, student_count: 0, due_date: '', notes: ''
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: t }, { data: s }, { data: inv }, { data: p }, { data: m }] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('subscriptions').select('*, tenants(name)').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*, tenants(name), subscriptions(package_key)').order('due_date', { ascending: true }),
      supabase.from('pricing_packages').select('*').order('sort_order'),
      supabase.from('pricing_modules').select('*').order('sort_order'),
    ])
    setTenants(t ?? [])
    setSubscriptions(s ?? [])
    setInvoices(inv ?? [])
    setPackages(p ?? [])
    setModules(m ?? [])

    // Uyarıları hesapla
    const today = new Date()
    const alertList: any[] = []
    for (const inv2 of inv ?? []) {
      if (inv2.status === 'paid') continue
      const due = new Date(inv2.due_date)
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 7 && diffDays >= 0) {
        alertList.push({ type: 'warning', tenant: inv2.tenants?.name, msg: `Fatura son ${diffDays} gün!`, amount: inv2.amount, due: inv2.due_date, inv_id: inv2.id })
      } else if (diffDays < 0) {
        alertList.push({ type: 'danger', tenant: inv2.tenants?.name, msg: `Fatura ${Math.abs(diffDays)} gün gecikti!`, amount: inv2.amount, due: inv2.due_date, inv_id: inv2.id })
      }
    }
    setAlerts(alertList)
    setLoading(false)
  }

  async function selectTenant(t: any) {
    setSelectedTenant(t)
    const [{ data: subs }, { data: invs }] = await Promise.all([
      supabase.from('subscriptions').select('*, subscription_modules(*)').eq('tenant_id', t.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('tenant_id', t.id).order('due_date', { ascending: false }),
    ])
    setTenantSubs(subs ?? [])
    setTenantInvoices(invs ?? [])
  }

  async function createSubscription() {
    if (!selectedTenant) return
    setSaving(true)
    const { data: sub, error } = await supabase.from('subscriptions').insert({
      tenant_id: selectedTenant.id,
      package_key: newSub.package_key,
      start_date: newSub.start_date,
      billing_day: newSub.billing_day,
      status: 'active',
      notes: newSub.notes || null,
    }).select().single()
    if (error) { alert('Hata: ' + error.message); setSaving(false); return }

    // Pakete dahil modülleri ekle
    const pkg = packages.find(p => p.key === newSub.package_key)
    if (pkg) {
      const pkgModules = getPackageModules(newSub.package_key)
      for (const modKey of pkgModules) {
        const mod = modules.find(m => m.key === modKey)
        await supabase.from('subscription_modules').insert({
          subscription_id: sub.id,
          module_key: modKey,
          price_monthly: mod?.price_monthly ?? 0,
        })
      }
    }

    // İlk faturayı oluştur
    const pkg2 = packages.find(p => p.key === newSub.package_key)
    const periodStart = new Date(newSub.start_date)
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    const dueDate = new Date(periodStart)
    dueDate.setDate(newSub.billing_day)

    const invNo = 'INV-' + new Date().getFullYear() + '-' + String(await getNextInvNo()).padStart(4, '0')
    await supabase.from('invoices').insert({
      tenant_id: selectedTenant.id,
      subscription_id: sub.id,
      invoice_no: invNo,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      amount: pkg2?.price_monthly ?? 0,
      student_count: parseInt(newSub.student_count.toString()) || 0,
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'pending',
    })

    await selectTenant(selectedTenant)
    await load()
    setNewSub({ package_key: 'growth', start_date: new Date().toISOString().slice(0, 10), billing_day: 1, student_count: 0, notes: '' })
    setSaving(false)
  }

  async function getNextInvNo() {
    const { data } = await supabase.from('invoices').select('invoice_no').order('created_at', { ascending: false }).limit(1)
    if (!data || data.length === 0) return 1000
    const last = data[0]?.invoice_no?.split('-')[2]
    return parseInt(last ?? '999') + 1
  }

  async function markPaid(invId: string) {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invId)
    if (selectedTenant) await selectTenant(selectedTenant)
    await load()
  }

  async function cancelSubscription(subId: string) {
    if (!confirm('Bu aboneliği iptal etmek istiyor musunuz?')) return
    await supabase.from('subscriptions').update({ status: 'cancelled', end_date: new Date().toISOString().slice(0, 10) }).eq('id', subId)
    if (selectedTenant) await selectTenant(selectedTenant)
    await load()
  }

  function getPackageModules(pkgKey: string): string[] {
    const levels: Record<string, string[]> = {
      starter: ['starter'], growth: ['starter', 'growth'],
      premium: ['starter', 'growth', 'premium'], enterprise: ['starter', 'growth', 'premium', 'enterprise'],
    }
    return modules.filter(m => (levels[pkgKey] ?? []).includes(m.package_level)).map(m => m.key)
  }

  function printBillingReport() {
    const win = window.open('', '_blank')
    if (!win) return
    const today = new Date()
    win.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Fatura Raporu</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans',Arial,sans-serif;background:#f0f4f9;color:#1B3A6B}
  @media print{body{background:#fff}.no-print{display:none}@page{margin:0;size:A4 landscape}{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:297mm;min-height:210mm;margin:0 auto;background:#fff}
  .header{background:#1B3A6B;padding:18px 28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:18px;font-weight:800;color:#fff}
  .header p{font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px}
  .content{padding:20px 28px}
  .sec-title{font-size:13px;font-weight:700;color:#1B3A6B;margin:16px 0 8px;padding-bottom:4px;border-bottom:2px solid #EEF3FB}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}
  th{background:#1B3A6B;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
  td{padding:7px 10px;border-bottom:1px solid #F0F4F9}
  tr:nth-child(even) td{background:#F8FAFF}
  .badge{display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700}
  .paid{background:#EAF4EE;color:#2E7D52}
  .pending{background:#FDF4E7;color:#B45309}
  .overdue{background:#FEF2F2;color:#C0392B}
  .footer{background:#1B3A6B;padding:10px 28px;display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6)}
  .no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px}
  .no-print button{padding:10px 18px;border:none;border-radius:8px;font-family:'Noto Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
  .metric{background:#F0F4F9;border-radius:8px;padding:12px;text-align:center}
  .metric .v{font-size:20px;font-weight:800;color:#1B3A6B}
  .metric .l{font-size:9px;color:#7A8FA8;margin-top:2px}
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()" style="background:#1B3A6B;color:#fff">🖨️ Yazdır / PDF</button>
  <button onclick="window.close()" style="background:#f0f4f9;color:#1B3A6B">✕ Kapat</button>
</div>
<div class="page">
  <div class="header">
    <div><h1>DershaneOPS — Fatura & Abonelik Raporu</h1><p>Süper Admin Finansal Rapor</p></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.6)">${today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="metrics">
      <div class="metric"><div class="v">${subscriptions.filter(s => s.status === 'active').length}</div><div class="l">Aktif Abonelik</div></div>
      <div class="metric"><div class="v">${invoices.filter(i => i.status === 'pending').length}</div><div class="l">Bekleyen Fatura</div></div>
      <div class="metric"><div class="v">${invoices.filter(i => i.status === 'overdue').length}</div><div class="l">Geciken Fatura</div></div>
      <div class="metric"><div class="v">${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString('tr-TR')} ₺</div><div class="l">Toplam Tahsilat</div></div>
    </div>

    <div class="sec-title">Aktif Abonelikler</div>
    <table>
      <thead><tr><th>Kurum</th><th>Paket</th><th>Başlangıç</th><th>Fatura Günü</th><th>Durum</th></tr></thead>
      <tbody>
        ${subscriptions.filter(s => s.status === 'active').map(s => `
        <tr>
          <td><strong>${s.tenants?.name}</strong></td>
          <td>${packages.find(p => p.key === s.package_key)?.name ?? s.package_key}</td>
          <td>${new Date(s.start_date).toLocaleDateString('tr-TR')}</td>
          <td>Her ayın ${s.billing_day}. günü</td>
          <td><span class="badge paid">Aktif</span></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sec-title">Tüm Faturalar</div>
    <table>
      <thead><tr><th>Fatura No</th><th>Kurum</th><th>Dönem</th><th>Tutar</th><th>Son Ödeme</th><th>Durum</th></tr></thead>
      <tbody>
        ${invoices.map(inv => `
        <tr>
          <td><strong>${inv.invoice_no}</strong></td>
          <td>${inv.tenants?.name}</td>
          <td>${new Date(inv.period_start).toLocaleDateString('tr-TR')} — ${new Date(inv.period_end).toLocaleDateString('tr-TR')}</td>
          <td><strong>${inv.amount.toLocaleString('tr-TR')} ₺</strong></td>
          <td>${new Date(inv.due_date).toLocaleDateString('tr-TR')}</td>
          <td><span class="badge ${inv.status === 'paid' ? 'paid' : inv.status === 'overdue' ? 'overdue' : 'pending'}">${inv.status === 'paid' ? 'Ödendi' : inv.status === 'overdue' ? 'Gecikti' : 'Bekliyor'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span>DershaneOPS Süper Admin | Gizli Finansal Rapor</span>
    <span>${today.toLocaleString('tr-TR')}</span>
  </div>
</div>
</body>
</html>`)
    win.document.close()
  }

  const totalMRR = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => {
    const pkg = packages.find(p => p.key === s.package_key)
    return sum + (pkg?.price_monthly ?? 0)
  }, 0)

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#4A6080', marginBottom: '4px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1300px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Fatura & Abonelik Yönetimi</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Kurum abonelikleri, fatura takibi ve ödeme yönetimi</p>
        </div>
        <button onClick={printBillingReport} style={{ padding: '9px 18px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          🖨️ Rapor PDF
        </button>
      </div>

      {/* Uyarılar */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ background: a.type === 'danger' ? '#FEF2F2' : '#FDF4E7', border: '1px solid ' + (a.type === 'danger' ? '#FECACA' : '#FED7AA'), borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: a.type === 'danger' ? '#C0392B' : '#B45309' }}>
                  {a.tenant} — {a.msg}
                </div>
                <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                  Son ödeme: {new Date(a.due).toLocaleDateString('tr-TR')} • {a.amount.toLocaleString('tr-TR')} ₺
                </div>
              </div>
              <button onClick={() => markPaid(a.inv_id)} style={{ padding: '6px 12px', borderRadius: '7px', background: '#2E7D52', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ödendi İşaretle
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Genel Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Aktif Abonelik', value: subscriptions.filter(s => s.status === 'active').length, color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Aylık Gelir (MRR)', value: totalMRR.toLocaleString('tr-TR') + ' ₺', color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Bekleyen Fatura', value: invoices.filter(i => i.status === 'pending').length, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Geciken Fatura', value: invoices.filter(i => i.status === 'overdue').length, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Toplam Tahsilat', value: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString('tr-TR') + ' ₺', color: '#6B4FC8', bg: '#F0ECFB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'overview', label: '📊 Genel Bakış' },
          { id: 'subscriptions', label: '🔄 Abonelikler' },
          { id: 'invoices', label: '🧾 Faturalar' },
          { id: 'tenant', label: '🏢 Kurum Detayı' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* GENEL BAKIŞ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Bu Ay Faturası Olan Kurumlar
            </div>
            {(() => {
              const today = new Date()
              const thisMonth = subscriptions.filter(s => s.status === 'active' && s.billing_day === today.getDate())
              const upcoming = subscriptions.filter(s => s.status === 'active' && s.billing_day > today.getDate() && s.billing_day <= today.getDate() + 7)
              const all = [...thisMonth.map(s => ({ ...s, isToday: true })), ...upcoming.map(s => ({ ...s, isToday: false }))]
              if (all.length === 0) return <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Bugün fatura yok</div>
              return all.map((s, i) => {
                const pkg = packages.find(p => p.key === s.package_key)
                return (
                  <div key={s.id} style={{ padding: '12px 18px', borderBottom: i < all.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: s.isToday ? '#FEF2F2' : '#FDF4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {s.isToday ? '🔔' : '⏰'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{s.tenants?.name}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{pkg?.name} • Her ayın {s.billing_day}. günü</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#6B4FC8' }}>
                      {pkg?.price_monthly.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Paket Dağılımı
            </div>
            {packages.map((pkg, i) => {
              const count = subscriptions.filter(s => s.status === 'active' && s.package_key === pkg.key).length
              const total = subscriptions.filter(s => s.status === 'active').length
              const pct = total > 0 ? Math.round(count / total * 100) : 0
              return (
                <div key={pkg.id} style={{ padding: '12px 18px', borderBottom: i < packages.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>{pkg.name}</div>
                    <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: '#1B3A6B', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>{count}</div>
                    <div style={{ fontSize: '10px', color: '#7A8FA8' }}>kurum</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ABONELİKLER */}
      {activeTab === 'subscriptions' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Tüm Abonelikler ({subscriptions.length})
          </div>
          {subscriptions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz abonelik yok</div>
          ) : subscriptions.map((s, i) => {
            const pkg = packages.find(p => p.key === s.package_key)
            const statusStyle: any = {
              active: { color: '#2E7D52', bg: '#EAF4EE', label: 'Aktif' },
              cancelled: { color: '#C0392B', bg: '#FEF2F2', label: 'İptal' },
              suspended: { color: '#B45309', bg: '#FDF4E7', label: 'Askıda' },
              trial: { color: '#6B4FC8', bg: '#F0ECFB', label: 'Deneme' },
            }
            const st = statusStyle[s.status] ?? statusStyle.active
            return (
              <div key={s.id} style={{ padding: '13px 18px', borderBottom: i < subscriptions.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '3px' }}>{s.tenants?.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                    {pkg?.name} • Başlangıç: {new Date(s.start_date).toLocaleDateString('tr-TR')} • Her ayın {s.billing_day}. günü
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>{pkg?.price_monthly.toLocaleString('tr-TR')} ₺/ay</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: st.bg, color: st.color, flexShrink: 0 }}>
                  {st.label}
                </span>
                {s.status === 'active' && (
                  <button onClick={() => cancelSubscription(s.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                    İptal
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FATURALAR */}
      {activeTab === 'invoices' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Tüm Faturalar ({invoices.length})</div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>Bekleyen: {invoices.filter(i => i.status === 'pending').length}</span>
              <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#FEF2F2', color: '#C0392B', fontWeight: 600 }}>Geciken: {invoices.filter(i => i.status === 'overdue').length}</span>
              <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>Ödenen: {invoices.filter(i => i.status === 'paid').length}</span>
            </div>
          </div>
          {invoices.map((inv, i) => {
            const today = new Date()
            const due = new Date(inv.due_date)
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            const isLate = inv.status !== 'paid' && diffDays < 0
            const isSoon = inv.status !== 'paid' && diffDays >= 0 && diffDays <= 7
            return (
              <div key={inv.id} style={{ padding: '13px 18px', borderBottom: i < invoices.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px', background: isLate ? '#FFF5F5' : isSoon ? '#FFFBF0' : '#fff' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{inv.tenants?.name}</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{inv.invoice_no}</div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                    {new Date(inv.period_start).toLocaleDateString('tr-TR')} — {new Date(inv.period_end).toLocaleDateString('tr-TR')}
                    {' '}• Son ödeme: {new Date(inv.due_date).toLocaleDateString('tr-TR')}
                    {isLate && <span style={{ color: '#C0392B', fontWeight: 700 }}> ({Math.abs(diffDays)} gün gecikti!)</span>}
                    {isSoon && <span style={{ color: '#B45309', fontWeight: 700 }}> ({diffDays} gün kaldı!)</span>}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1B3A6B', flexShrink: 0 }}>
                  {inv.amount.toLocaleString('tr-TR')} ₺
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: inv.status === 'paid' ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: inv.status === 'paid' ? '#2E7D52' : isLate ? '#C0392B' : '#B45309', flexShrink: 0 }}>
                  {inv.status === 'paid' ? 'Ödendi' : isLate ? 'Gecikti' : 'Bekliyor'}
                </span>
                {inv.status !== 'paid' && (
                  <button onClick={() => markPaid(inv.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #A7D9B8', background: '#EAF4EE', color: '#2E7D52', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Ödendi
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* KURUM DETAYI */}
      {activeTab === 'tenant' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Kurumlar</div>
            {tenants.map(t => (
              <div key={t.id} onClick={() => selectTenant(t)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selectedTenant?.id === t.id ? '#F5F8FF' : '#fff', borderLeft: selectedTenant?.id === t.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: selectedTenant?.id === t.id ? '#1B3A6B' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: selectedTenant?.id === t.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {t.name?.[0]}
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: selectedTenant?.id === t.id ? 700 : 500, color: '#1B3A6B' }}>{t.name}</span>
              </div>
            ))}
          </div>

          {!selectedTenant ? (
            <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏢</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Kurum seçin</div>
            </div>
          ) : (
            <div>
              {/* Yeni Abonelik */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>
                  {selectedTenant.name} — Yeni Abonelik Ekle
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={lbl}>Paket</label>
                    <select value={newSub.package_key} onChange={e => setNewSub(p => ({ ...p, package_key: e.target.value }))} style={inp}>
                      {packages.map(p => <option key={p.key} value={p.key}>{p.name} — {p.price_monthly.toLocaleString('tr-TR')} ₺</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Başlangıç Tarihi</label>
                    <input type="date" value={newSub.start_date} onChange={e => setNewSub(p => ({ ...p, start_date: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Fatura Günü (ayın)</label>
                    <select value={newSub.billing_day} onChange={e => setNewSub(p => ({ ...p, billing_day: parseInt(e.target.value) }))} style={inp}>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}. gün</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Öğrenci Sayısı</label>
                    <input type="number" value={newSub.student_count} onChange={e => setNewSub(p => ({ ...p, student_count: parseInt(e.target.value) || 0 }))} style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={lbl}>Not</label>
                  <input value={newSub.notes} onChange={e => setNewSub(p => ({ ...p, notes: e.target.value }))} placeholder="Opsiyonel not..." style={inp} />
                </div>
                <button onClick={createSubscription} disabled={saving} style={{ padding: '9px 20px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {saving ? 'Kaydediliyor...' : '+ Abonelik Oluştur & İlk Faturayı Kes'}
                </button>
              </div>

              {/* Mevcut Abonelikler */}
              {tenantSubs.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Abonelikler</div>
                  {tenantSubs.map((s, i) => {
                    const pkg = packages.find(p => p.key === s.package_key)
                    return (
                      <div key={s.id} style={{ padding: '12px 18px', borderBottom: i < tenantSubs.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{pkg?.name}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>
                            Başlangıç: {new Date(s.start_date).toLocaleDateString('tr-TR')} • Fatura: Her ayın {s.billing_day}. günü
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {s.subscription_modules?.map((sm: any) => (
                              <span key={sm.id} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: '#F0ECFB', color: '#6B4FC8', fontWeight: 600 }}>
                                {modules.find(m => m.key === sm.module_key)?.icon} {sm.module_key}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>{pkg?.price_monthly.toLocaleString('tr-TR')} ₺/ay</div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: s.status === 'active' ? '#EAF4EE' : '#FEF2F2', color: s.status === 'active' ? '#2E7D52' : '#C0392B' }}>
                          {s.status === 'active' ? 'Aktif' : 'İptal'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Faturalar */}
              {tenantInvoices.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Fatura Geçmişi</div>
                  {tenantInvoices.map((inv, i) => (
                    <div key={inv.id} style={{ padding: '12px 18px', borderBottom: i < tenantInvoices.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{inv.invoice_no}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>
                          {new Date(inv.period_start).toLocaleDateString('tr-TR')} — {new Date(inv.period_end).toLocaleDateString('tr-TR')} • Son: {new Date(inv.due_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>{inv.amount.toLocaleString('tr-TR')} ₺</div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: inv.status === 'paid' ? '#EAF4EE' : '#FDF4E7', color: inv.status === 'paid' ? '#2E7D52' : '#B45309' }}>
                        {inv.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                      {inv.status !== 'paid' && (
                        <button onClick={() => markPaid(inv.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #A7D9B8', background: '#EAF4EE', color: '#2E7D52', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          Ödendi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}