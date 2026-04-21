'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PACKAGES: any = {
  starter: { name:'Starter', price:990, students:30 },
  growth: { name:'Growth', price:1990, students:100 },
  pro: { name:'Pro', price:3490, students:300 },
  enterprise: { name:'Enterprise', price:5990, students:999 },
}

export default function BillingPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [tenantSubs, setTenantSubs] = useState<any[]>([])
  const [tenantInvoices, setTenantInvoices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: t } = await supabase.from('tenants').select('*').order('name')
    // Süresi dolmak üzere abonelikleri bul
    const expiringSoon: any[] = []
    for (const tenant of t??[]) {
      if (tenant.subscription_end) {
        const daysLeft = Math.round((new Date(tenant.subscription_end).getTime()-Date.now())/(1000*60*60*24))
        if (daysLeft<=30) expiringSoon.push({ ...tenant, daysLeft })
      }
    }
    setTenants(t??[]); setAlerts(expiringSoon); setLoading(false)
  }

  async function selectTenant(t: any) {
    setSelectedTenant(t)
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('tenant_id', t.id).order('created_at', { ascending:false }).catch(()=>({ data:[] }))
    const { data: invs } = await supabase.from('invoices').select('*').eq('tenant_id', t.id).order('created_at', { ascending:false }).catch(()=>({ data:[] }))
    setTenantSubs(subs??[]); setTenantInvoices(invs??[])
  }

  const totalMRR = tenants.filter(t=>t.is_active).reduce((sum,t)=>{
    const pkg = PACKAGES[t.plan] ?? PACKAGES.starter
    return sum + pkg.price
  }, 0)

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Fatura & Abonelik</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Platform geneli gelir ve abonelik yönetimi</p>
      </div>

      {alerts.length>0 && (
        <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'10px', padding:'12px 14px', marginBottom:'14px' }}>
          <div style={{ fontSize:'12.5px', fontWeight:700, color:'#92400E', marginBottom:'6px' }}>⚠ Süresi Dolmak Üzere ({alerts.length})</div>
          {alerts.map(a=>(
            <div key={a.id} style={{ fontSize:'12px', color:'#92400E', padding:'2px 0' }}>
              {a.name} — {a.daysLeft} gün kaldı ({new Date(a.subscription_end).toLocaleDateString('tr-TR')})
            </div>
          ))}
        </div>
      )}

      <div className="metrics-row">
        {[
          { label:'Tahmini MRR', value:'₺'+totalMRR.toLocaleString('tr-TR'), color:'#14532D', bg:'#DCFCE7' },
          { label:'Aktif Kurum', value:tenants.filter(t=>t.is_active).length, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Basic', value:tenants.filter(t=>t.plan==='basic').length, color:'#475569', bg:'#F1F5F9' },
          { label:'Pro+', value:tenants.filter(t=>t.plan!=='basic').length, color:'#4C1D95', bg:'#EDE9FE' },
        ].map(m=>(
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
            <div style={{ fontSize:'20px', fontWeight:800, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'14px', background:'#F1F5F9', borderRadius:'10px', padding:'4px' }}>
        {[{ id:'overview', label:'Genel Bakış' }, { id:'detail', label:'Kurum Detay' }].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, padding:'8px', borderRadius:'7px', border:'none', cursor:'pointer', background:activeTab===tab.id?'#fff':'transparent', color:activeTab===tab.id?'#1B3A6B':'#7A8FA8', fontSize:'12.5px', fontWeight:activeTab===tab.id?700:500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
            Tüm Kurumlar — Abonelik Durumu
          </div>
          {tenants.map((t,i)=>{
            const pkg = PACKAGES[t.plan]??PACKAGES.starter
            return (
              <div key={t.id} style={{ padding:'11px 16px', borderBottom:i<tenants.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:'120px' }}>
                  <div style={{ fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>{t.name}</div>
                  <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{t.slug}</div>
                </div>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'8px', background:'#EEF3FB', color:'#1B3A6B', flexShrink:0 }}>{pkg.name}</span>
                <span style={{ fontSize:'13px', fontWeight:800, color:'#14532D', flexShrink:0 }}>₺{pkg.price.toLocaleString('tr-TR')}/ay</span>
                <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'7px', background:t.is_active?'#DCFCE7':'#FEF2F2', color:t.is_active?'#14532D':'#7F1D1D', flexShrink:0 }}>
                  {t.is_active?'Aktif':'Pasif'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'detail' && (
        <div>
          <div className="sidebar-dropdown">
            <select value={selectedTenant?.id??''} onChange={e=>{ const t=tenants.find(x=>x.id===e.target.value); if(t) selectTenant(t) }}>
              <option value="">Kurum seçin...</option>
              {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="sidebar-layout">
            <div className="sidebar-list">
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Kurumlar</div>
                {tenants.map(t=>(
                  <div key={t.id} onClick={()=>selectTenant(t)} style={{ padding:'9px 14px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', background:selectedTenant?.id===t.id?'#F5F8FF':'#fff', borderLeft:selectedTenant?.id===t.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{t.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{PACKAGES[t.plan]?.name} · ₺{PACKAGES[t.plan]?.price?.toLocaleString('tr-TR')}/ay</div>
                  </div>
                ))}
              </div>
            </div>

            {!selectedTenant ? (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Kurum seçin</div>
              </div>
            ) : (
              <div>
                <div style={{ background:'#1B3A6B', borderRadius:'12px', padding:'14px 16px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'15px', fontWeight:800, color:'#fff' }}>{selectedTenant.name}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>{PACKAGES[selectedTenant.plan]?.name} Plan · ₺{PACKAGES[selectedTenant.plan]?.price?.toLocaleString('tr-TR')}/ay</div>
                </div>

                {tenantSubs.length>0 && (
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Abonelikler</div>
                    {tenantSubs.map((s,i)=>(
                      <div key={s.id} style={{ padding:'8px 0', borderBottom:i<tenantSubs.length-1?'1px solid #F8FAFC':'none', fontSize:'12px', color:'#374151' }}>
                        {s.package_key} · {new Date(s.start_date).toLocaleDateString('tr-TR')} → {s.end_date?new Date(s.end_date).toLocaleDateString('tr-TR'):'Devam ediyor'}
                      </div>
                    ))}
                  </div>
                )}

                {tenantInvoices.length>0 && (
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Faturalar</div>
                    {tenantInvoices.map((inv,i)=>(
                      <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<tenantInvoices.length-1?'1px solid #F8FAFC':'none', fontSize:'12px' }}>
                        <span style={{ color:'#374151' }}>{new Date(inv.created_at).toLocaleDateString('tr-TR')}</span>
                        <span style={{ fontWeight:700, color:'#14532D' }}>₺{inv.amount?.toLocaleString('tr-TR')}</span>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'6px', background:inv.status==='paid'?'#DCFCE7':'#FEF3C7', color:inv.status==='paid'?'#14532D':'#92400E' }}>
                          {inv.status==='paid'?'Ödendi':'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {tenantSubs.length===0&&tenantInvoices.length===0 && (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'32px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>
                    Bu kurum için kayıt yok
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}