'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MODULE_DEFINITIONS = [
  {
    key: 'planning',
    name: 'Planlama Modülü',
    description: 'Ders programı, öğretmen uygunluk yönetimi, takvim ve çakışma tespiti',
    icon: '📅',
    color: '#1B3A6B',
    bg: '#EEF3FB',
    package: 'starter',
    price: 0,
  },
  {
    key: 'exam',
    name: 'Sınav & Ölçme',
    description: 'Sınav oluşturma, sonuç girişi, net hesaplama ve kazanım analizi',
    icon: '📊',
    color: '#2E7D52',
    bg: '#EAF4EE',
    package: 'growth',
    price: 1500,
  },
  {
    key: 'analytics',
    name: 'Analiz & Gelişim',
    description: 'Konu hakimiyet haritası, SWOT analizi ve gelişim profili',
    icon: '📈',
    color: '#B45309',
    bg: '#FDF4E7',
    package: 'growth',
    price: 1000,
  },
  {
    key: 'ai',
    name: 'AI Akademik Rehber',
    description: 'AI yorumlar, çalışma planı, risk analizi ve senaryo motoru',
    icon: '🤖',
    color: '#6B4FC8',
    bg: '#F0ECFB',
    package: 'premium',
    price: 2500,
  },
  {
    key: 'guidance',
    name: 'Rehberlik Paneli',
    description: 'Risk analizi, devamsızlık takibi ve öğrenci profil yönetimi',
    icon: '🧭',
    color: '#0369A1',
    bg: '#F0F9FF',
    package: 'premium',
    price: 1500,
  },
  {
    key: 'student_app',
    name: 'Öğrenci Motivasyon App',
    description: 'Görev sistemi, streak, rozet, kutlama animasyonları',
    icon: '🎯',
    color: '#C0392B',
    bg: '#FEF2F2',
    package: 'premium',
    price: 1500,
  },
  {
    key: 'reporting',
    name: 'Raporlama & Export',
    description: 'PDF raporlar, Excel export, veli raporları ve sınıf raporları',
    icon: '📄',
    color: '#2E7D52',
    bg: '#EAF4EE',
    package: 'growth',
    price: 750,
  },
  {
    key: 'institution',
    name: 'Kurum Zekası',
    description: 'Kurum geneli analiz, öğretmen etkinliği ve şube karşılaştırması',
    icon: '🏢',
    color: '#1B3A6B',
    bg: '#EEF3FB',
    package: 'enterprise',
    price: 2000,
  },
]

const PACKAGES = [
  { key: 'starter', name: 'Başlangıç', price: 2500, color: '#7A8FA8', bg: '#F0F4F9', modules: ['planning'] },
  { key: 'growth', name: 'Gelişim', price: 5500, color: '#2E7D52', bg: '#EAF4EE', modules: ['planning', 'exam', 'analytics', 'reporting'] },
  { key: 'premium', name: 'Akıllı Yönetim', price: 9500, color: '#6B4FC8', bg: '#F0ECFB', modules: ['planning', 'exam', 'analytics', 'reporting', 'ai', 'guidance', 'student_app'] },
  { key: 'enterprise', name: 'Kurumsal', price: 15000, color: '#B45309', bg: '#FDF4E7', modules: ['planning', 'exam', 'analytics', 'reporting', 'ai', 'guidance', 'student_app', 'institution'] },
]

export default function ModulesPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [tenantModules, setTenantModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('tenants')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: t } = await supabase.from('tenants').select('*').order('name')
    setTenants(t ?? [])
    setLoading(false)
  }

  async function selectTenant(t: any) {
    setSelectedTenant(t)
    const { data: tm } = await supabase.from('tenant_modules').select('*').eq('tenant_id', t.id)
    setTenantModules(tm ?? [])
  }

  async function toggleModule(moduleKey: string) {
    if (!selectedTenant) return
    setSaving(true)
    const existing = tenantModules.find(m => m.module_key === moduleKey)
    if (existing) {
      await supabase.from('tenant_modules').update({ is_active: !existing.is_active }).eq('id', existing.id)
    } else {
      await supabase.from('tenant_modules').insert({
        tenant_id: selectedTenant.id,
        module_key: moduleKey,
        is_active: true,
      })
    }
    const { data: tm } = await supabase.from('tenant_modules').select('*').eq('tenant_id', selectedTenant.id)
    setTenantModules(tm ?? [])
    setSaving(false)
  }

  async function applyPackage(packageKey: string) {
    if (!selectedTenant) return
    const pkg = PACKAGES.find(p => p.key === packageKey)
    if (!pkg) return
    if (!confirm(pkg.name + ' paketini uygulamak istiyor musunuz?')) return
    setSaving(true)
    for (const moduleKey of MODULE_DEFINITIONS.map(m => m.key)) {
      const isInPackage = pkg.modules.includes(moduleKey)
      const existing = tenantModules.find(m => m.module_key === moduleKey)
      if (existing) {
        await supabase.from('tenant_modules').update({ is_active: isInPackage }).eq('id', existing.id)
      } else {
        await supabase.from('tenant_modules').insert({
          tenant_id: selectedTenant.id,
          module_key: moduleKey,
          is_active: isInPackage,
        })
      }
    }
    const { data: tm } = await supabase.from('tenant_modules').select('*').eq('tenant_id', selectedTenant.id)
    setTenantModules(tm ?? [])
    setSaving(false)
  }

  function isModuleActive(moduleKey: string) {
    const m = tenantModules.find(m => m.module_key === moduleKey)
    return m?.is_active ?? false
  }

  function getActiveModulePrice() {
    return tenantModules
      .filter(m => m.is_active)
      .reduce((sum, m) => {
        const def = MODULE_DEFINITIONS.find(d => d.key === m.module_key)
        return sum + (def?.price ?? 0)
      }, 0)
  }

  function detectPackage() {
    const active = tenantModules.filter(m => m.is_active).map(m => m.module_key).sort().join(',')
    for (const pkg of [...PACKAGES].reverse()) {
      const pkgModules = pkg.modules.sort().join(',')
      if (active === pkgModules) return pkg.name
    }
    return 'Özel'
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Modül & Paket Yönetimi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Kurum bazlı modül aktivasyonu ve paket yönetimi</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'tenants', label: '🏢 Kurum Yönetimi' },
          { id: 'packages', label: '📦 Paketler' },
          { id: 'pricing', label: '💰 Fiyatlandırma' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* KURUM YÖNETİMİ */}
      {activeTab === 'tenants' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>
              Kurumlar ({tenants.length})
            </div>
            {tenants.map(t => (
              <div key={t.id} onClick={() => selectTenant(t)} style={{ padding: '13px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selectedTenant?.id === t.id ? '#F5F8FF' : '#fff', borderLeft: selectedTenant?.id === t.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: selectedTenant?.id === t.id ? '#1B3A6B' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: selectedTenant?.id === t.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {t.name?.[0] ?? 'K'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.type ?? 'Dershane'}</div>
                </div>
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
              {/* Özet */}
              <div style={{ background: '#1B3A6B', borderRadius: '12px', padding: '18px 22px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{selectedTenant.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>Aktif Paket: {detectPackage()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{tenantModules.filter(m => m.is_active).length}/{MODULE_DEFINITIONS.length}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Aktif Modül</div>
                </div>
              </div>

              {/* Hızlı Paket Uygula */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Hızlı Paket Uygula</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {PACKAGES.map(pkg => (
                    <button key={pkg.key} onClick={() => applyPackage(pkg.key)} disabled={saving} style={{ padding: '10px 8px', borderRadius: '9px', background: pkg.bg, color: pkg.color, fontSize: '12px', fontWeight: 700, border: '2px solid transparent', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}</div>
                      <div>{pkg.name}</div>
                      <div style={{ fontSize: '10.5px', opacity: 0.8, marginTop: '2px' }}>{pkg.price.toLocaleString('tr-TR')} ₺/ay</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modül Listesi */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Modül Kontrol Paneli</div>
                  <div style={{ fontSize: '12px', color: '#6B4FC8', fontWeight: 700 }}>
                    Tahmini: {(2500 + getActiveModulePrice()).toLocaleString('tr-TR')} ₺/ay
                  </div>
                </div>
                {MODULE_DEFINITIONS.map((mod, i) => {
                  const active = isModuleActive(mod.key)
                  return (
                    <div key={mod.key} style={{ padding: '14px 18px', borderBottom: i < MODULE_DEFINITIONS.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: active ? mod.bg : '#F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {mod.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: active ? '#1B3A6B' : '#9CA3AF' }}>{mod.name}</div>
                          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: mod.package === 'starter' ? '#F0F4F9' : mod.package === 'growth' ? '#EAF4EE' : mod.package === 'premium' ? '#F0ECFB' : '#FDF4E7', color: mod.package === 'starter' ? '#7A8FA8' : mod.package === 'growth' ? '#2E7D52' : mod.package === 'premium' ? '#6B4FC8' : '#B45309', fontWeight: 600 }}>
                            {mod.package === 'starter' ? 'Başlangıç' : mod.package === 'growth' ? 'Gelişim' : mod.package === 'premium' ? 'Premium' : 'Kurumsal'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{mod.description}</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B4FC8', width: '80px', textAlign: 'right', flexShrink: 0 }}>
                        {mod.price > 0 ? '+' + mod.price.toLocaleString('tr-TR') + ' ₺' : 'Dahil'}
                      </div>
                      <button onClick={() => toggleModule(mod.key)} disabled={saving} style={{ width: '52px', height: '28px', borderRadius: '14px', background: active ? '#2E7D52' : '#D5DFF0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px', transition: 'all 0.2s', flexShrink: 0, position: 'relative' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transform: active ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAKETLER */}
      {activeTab === 'packages' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.key} style={{ background: '#fff', borderRadius: '14px', border: '2px solid', borderColor: pkg.bg, overflow: 'hidden' }}>
                <div style={{ background: pkg.bg, padding: '20px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: pkg.color }}>{pkg.name}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: pkg.color, marginTop: '6px' }}>
                    {pkg.price.toLocaleString('tr-TR')} ₺
                  </div>
                  <div style={{ fontSize: '11px', color: pkg.color, opacity: 0.7 }}>aylık</div>
                </div>
                <div style={{ padding: '16px' }}>
                  {MODULE_DEFINITIONS.map(mod => (
                    <div key={mod.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12px' }}>
                      <span style={{ fontSize: '14px' }}>{pkg.modules.includes(mod.key) ? '✓' : '○'}</span>
                      <span style={{ color: pkg.modules.includes(mod.key) ? '#374151' : '#D5DFF0', fontWeight: pkg.modules.includes(mod.key) ? 600 : 400 }}>
                        {mod.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FİYATLANDIRMA */}
      {activeTab === 'pricing' && (
        <div style={{ maxWidth: '700px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Temel Paket Fiyatları
            </div>
            {PACKAGES.map((pkg, i) => (
              <div key={pkg.key} style={{ padding: '14px 18px', borderBottom: i < PACKAGES.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: pkg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{pkg.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{pkg.modules.length} modül • 0-100 öğrenci dahil</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: pkg.color }}>{pkg.price.toLocaleString('tr-TR')} ₺</div>
                  <div style={{ fontSize: '10px', color: '#7A8FA8' }}>/ ay</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Ek Modül Fiyatları
            </div>
            {MODULE_DEFINITIONS.filter(m => m.price > 0).map((mod, i) => (
              <div key={mod.key} style={{ padding: '12px 18px', borderBottom: i < MODULE_DEFINITIONS.filter(m => m.price > 0).length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{mod.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{mod.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{mod.description}</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#6B4FC8', flexShrink: 0 }}>
                  +{mod.price.toLocaleString('tr-TR')} ₺/ay
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Öğrenci Sayısı Çarpanı
            </div>
            {[
              { range: '0–100 öğrenci', extra: 'Dahil', color: '#2E7D52' },
              { range: '101–250 öğrenci', extra: '+1.500 ₺/ay', color: '#1B3A6B' },
              { range: '251–500 öğrenci', extra: '+3.000 ₺/ay', color: '#B45309' },
              { range: '500+ öğrenci', extra: 'Özel Fiyat', color: '#6B4FC8' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < 3 ? '1px solid #F0F4F9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#374151' }}>{r.range}</span>
                <strong style={{ fontSize: '13px', color: r.color }}>{r.extra}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}