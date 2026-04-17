'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ModulesPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [tenantModules, setTenantModules] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [tiers, setTiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('tenants')
  const [editingPkg, setEditingPkg] = useState<any>(null)
  const [editingMod, setEditingMod] = useState<any>(null)
  const [editingTier, setEditingTier] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: t }, { data: p }, { data: m }, { data: ti }] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('pricing_packages').select('*').order('sort_order'),
      supabase.from('pricing_modules').select('*').order('sort_order'),
      supabase.from('pricing_tiers').select('*').order('sort_order'),
    ])
    setTenants(t ?? [])
    setPackages(p ?? [])
    setModules(m ?? [])
    setTiers(ti ?? [])
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
      await supabase.from('tenant_modules').insert({ tenant_id: selectedTenant.id, module_key: moduleKey, is_active: true })
    }
    const { data: tm } = await supabase.from('tenant_modules').select('*').eq('tenant_id', selectedTenant.id)
    setTenantModules(tm ?? [])
    setSaving(false)
  }

  async function applyPackage(pkgKey: string) {
    if (!selectedTenant) return
    const pkg = packages.find(p => p.key === pkgKey)
    if (!pkg) return
    if (!confirm(pkg.name + ' paketini uygulamak istiyor musunuz?')) return
    setSaving(true)
    const pkgModuleKeys = getPackageModules(pkgKey)
    for (const mod of modules) {
      const isInPackage = pkgModuleKeys.includes(mod.key)
      const existing = tenantModules.find(m => m.module_key === mod.key)
      if (existing) {
        await supabase.from('tenant_modules').update({ is_active: isInPackage }).eq('id', existing.id)
      } else {
        await supabase.from('tenant_modules').insert({ tenant_id: selectedTenant.id, module_key: mod.key, is_active: isInPackage })
      }
    }
    const { data: tm } = await supabase.from('tenant_modules').select('*').eq('tenant_id', selectedTenant.id)
    setTenantModules(tm ?? [])
    setSaving(false)
  }

  function getPackageModules(pkgKey: string): string[] {
    const levels: Record<string, string[]> = {
      starter: ['starter'],
      growth: ['starter', 'growth'],
      premium: ['starter', 'growth', 'premium'],
      enterprise: ['starter', 'growth', 'premium', 'enterprise'],
    }
    const allowed = levels[pkgKey] ?? []
    return modules.filter(m => allowed.includes(m.package_level)).map(m => m.key)
  }

  function isModuleActive(moduleKey: string) {
    return tenantModules.find(m => m.module_key === moduleKey)?.is_active ?? false
  }

  function detectPackage() {
    const active = tenantModules.filter(m => m.is_active).map(m => m.module_key).sort().join(',')
    for (const pkg of [...packages].reverse()) {
      const pkgMods = getPackageModules(pkg.key).sort().join(',')
      if (active === pkgMods) return pkg.name
    }
    return 'Özel'
  }

  function getActivePrice() {
    return tenantModules.filter(m => m.is_active).reduce((sum, tm) => {
      const mod = modules.find(m => m.key === tm.module_key)
      return sum + (mod?.price_monthly ?? 0)
    }, 0)
  }

  async function savePkg(pkg: any) {
    setSaving(true)
    if (pkg.id) {
      await supabase.from('pricing_packages').update({
        name: pkg.name, description: pkg.description,
        price_monthly: parseInt(pkg.price_monthly) || 0,
        price_yearly: parseInt(pkg.price_yearly) || 0,
        student_limit: parseInt(pkg.student_limit) || 100,
        is_featured: pkg.is_featured,
      }).eq('id', pkg.id)
    }
    setEditingPkg(null)
    await load()
    setSaving(false)
  }

  async function saveMod(mod: any) {
    setSaving(true)
    if (mod.id) {
      await supabase.from('pricing_modules').update({
        name: mod.name, description: mod.description,
        price_monthly: parseInt(mod.price_monthly) || 0,
        icon: mod.icon, package_level: mod.package_level,
      }).eq('id', mod.id)
    }
    setEditingMod(null)
    await load()
    setSaving(false)
  }

  async function saveTier(tier: any) {
    setSaving(true)
    if (tier.id) {
      await supabase.from('pricing_tiers').update({
        label: tier.label,
        extra_price: parseInt(tier.extra_price) || 0,
        min_students: parseInt(tier.min_students) || 0,
        max_students: tier.max_students ? parseInt(tier.max_students) : null,
      }).eq('id', tier.id)
    }
    setEditingTier(null)
    await load()
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#4A6080', marginBottom: '4px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Modül & Fiyatlandırma Yönetimi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Kurum modül aktivasyonu, paket ve fiyat düzenleme</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'tenants', label: '🏢 Kurum Modülleri' },
          { id: 'packages', label: '📦 Paket Fiyatları' },
          { id: 'modules', label: '🧩 Modül Fiyatları' },
          { id: 'tiers', label: '👥 Öğrenci Çarpanı' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* KURUM MODÜLLERİ */}
      {activeTab === 'tenants' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Kurumlar</div>
            {tenants.map(t => (
              <div key={t.id} onClick={() => selectTenant(t)} style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selectedTenant?.id === t.id ? '#F5F8FF' : '#fff', borderLeft: selectedTenant?.id === t.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: selectedTenant?.id === t.id ? '#1B3A6B' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: selectedTenant?.id === t.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {t.name?.[0] ?? 'K'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{tenantModules.filter(m => m.is_active).length} aktif modül</div>
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
              <div style={{ background: '#1B3A6B', borderRadius: '12px', padding: '16px 20px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{selectedTenant.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Aktif Paket: {detectPackage()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{getActivePrice().toLocaleString('tr-TR')} ₺</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>modül toplamı / ay</div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>Hızlı Paket Uygula</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {packages.map(pkg => (
                    <button key={pkg.key} onClick={() => applyPackage(pkg.key)} disabled={saving} style={{ padding: '10px 8px', borderRadius: '9px', background: '#F0F4F9', color: '#1B3A6B', fontSize: '11.5px', fontWeight: 700, border: '2px solid #E2EAF8', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', marginBottom: '3px' }}>
                        {pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}
                      </div>
                      <div>{pkg.name}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8', marginTop: '2px' }}>{pkg.price_monthly.toLocaleString('tr-TR')} ₺/ay</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Modül Kontrol Paneli</div>
                {modules.map((mod, i) => {
                  const active = isModuleActive(mod.key)
                  return (
                    <div key={mod.key} style={{ padding: '13px 18px', borderBottom: i < modules.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: active ? '#EEF3FB' : '#F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {mod.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: active ? '#1B3A6B' : '#9CA3AF' }}>{mod.name}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{mod.description}</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B4FC8', flexShrink: 0 }}>
                        {mod.price_monthly > 0 ? '+' + mod.price_monthly.toLocaleString('tr-TR') + ' ₺' : 'Dahil'}
                      </div>
                      <button onClick={() => toggleModule(mod.key)} disabled={saving} style={{ width: '50px', height: '26px', borderRadius: '13px', background: active ? '#2E7D52' : '#D5DFF0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 3px', transition: 'all 0.2s', flexShrink: 0 }}>
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

      {/* PAKET FİYATLARI */}
      {activeTab === 'packages' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{pkg.key === 'starter' ? '🥉' : pkg.key === 'growth' ? '🥈' : pkg.key === 'premium' ? '🥇' : '🏆'}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{pkg.name}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{pkg.description}</div>
                    </div>
                  </div>
                  <button onClick={() => setEditingPkg({ ...pkg })} style={{ padding: '6px 12px', borderRadius: '7px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    Düzenle
                  </button>
                </div>

                {editingPkg?.id === pkg.id ? (
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={lbl}>Paket Adı</label>
                        <input value={editingPkg.name} onChange={e => setEditingPkg((p: any) => ({ ...p, name: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Öğrenci Limiti</label>
                        <input type="number" value={editingPkg.student_limit} onChange={e => setEditingPkg((p: any) => ({ ...p, student_limit: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Aylık Fiyat (₺)</label>
                        <input type="number" value={editingPkg.price_monthly} onChange={e => setEditingPkg((p: any) => ({ ...p, price_monthly: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Yıllık Fiyat (₺)</label>
                        <input type="number" value={editingPkg.price_yearly} onChange={e => setEditingPkg((p: any) => ({ ...p, price_yearly: e.target.value }))} style={inp} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={lbl}>Açıklama</label>
                      <input value={editingPkg.description ?? ''} onChange={e => setEditingPkg((p: any) => ({ ...p, description: e.target.value }))} style={inp} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => savePkg(editingPkg)} disabled={saving} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button onClick={() => setEditingPkg(null)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ textAlign: 'center', background: '#F0F4F9', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1B3A6B' }}>{pkg.price_monthly.toLocaleString('tr-TR')} ₺</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Aylık</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#F0F4F9', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#2E7D52' }}>{pkg.price_yearly.toLocaleString('tr-TR')} ₺</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Yıllık</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#F0F4F9', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#6B4FC8' }}>{pkg.student_limit}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Öğrenci Limiti</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODÜL FİYATLARI */}
      {activeTab === 'modules' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Modül Fiyatları
          </div>
          {modules.map((mod, i) => (
            <div key={mod.id}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{mod.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{mod.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{mod.description}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#6B4FC8' }}>
                    {mod.price_monthly > 0 ? '+' + mod.price_monthly.toLocaleString('tr-TR') + ' ₺/ay' : 'Dahil'}
                  </div>
                  <div style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: mod.package_level === 'starter' ? '#F0F4F9' : mod.package_level === 'growth' ? '#EAF4EE' : mod.package_level === 'premium' ? '#F0ECFB' : '#FDF4E7', color: mod.package_level === 'starter' ? '#7A8FA8' : mod.package_level === 'growth' ? '#2E7D52' : mod.package_level === 'premium' ? '#6B4FC8' : '#B45309', display: 'inline-block', fontWeight: 600 }}>
                    {mod.package_level}
                  </div>
                </div>
                <button onClick={() => setEditingMod(editingMod?.id === mod.id ? null : { ...mod })} style={{ padding: '6px 12px', borderRadius: '7px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  {editingMod?.id === mod.id ? 'Kapat' : 'Düzenle'}
                </button>
              </div>
              {editingMod?.id === mod.id && (
                <div style={{ padding: '16px 18px', background: '#F8FAFF', borderBottom: '1px solid #D5DFF0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={lbl}>Modül Adı</label>
                      <input value={editingMod.name} onChange={e => setEditingMod((p: any) => ({ ...p, name: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>İkon (emoji)</label>
                      <input value={editingMod.icon} onChange={e => setEditingMod((p: any) => ({ ...p, icon: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Aylık Fiyat (₺)</label>
                      <input type="number" value={editingMod.price_monthly} onChange={e => setEditingMod((p: any) => ({ ...p, price_monthly: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Paket Seviyesi</label>
                      <select value={editingMod.package_level} onChange={e => setEditingMod((p: any) => ({ ...p, package_level: e.target.value }))} style={inp}>
                        <option value="starter">Başlangıç</option>
                        <option value="growth">Gelişim</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Kurumsal</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={lbl}>Açıklama</label>
                    <input value={editingMod.description ?? ''} onChange={e => setEditingMod((p: any) => ({ ...p, description: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saveMod(editingMod)} disabled={saving} style={{ padding: '8px 18px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button onClick={() => setEditingMod(null)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ÖĞRENCİ ÇARPANI */}
      {activeTab === 'tiers' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Öğrenci Sayısı Çarpanı
          </div>
          {tiers.map((tier, i) => (
            <div key={tier.id}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  👥
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{tier.label}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{tier.min_students} — {tier.max_students ?? '∞'} öğrenci</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: tier.extra_price > 0 ? '#6B4FC8' : '#2E7D52', flexShrink: 0, marginRight: '12px' }}>
                  {tier.extra_price > 0 ? '+' + tier.extra_price.toLocaleString('tr-TR') + ' ₺/ay' : 'Dahil'}
                </div>
                <button onClick={() => setEditingTier(editingTier?.id === tier.id ? null : { ...tier })} style={{ padding: '6px 12px', borderRadius: '7px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {editingTier?.id === tier.id ? 'Kapat' : 'Düzenle'}
                </button>
              </div>
              {editingTier?.id === tier.id && (
                <div style={{ padding: '16px 18px', background: '#F8FAFF', borderBottom: '1px solid #D5DFF0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={lbl}>Etiket</label>
                      <input value={editingTier.label} onChange={e => setEditingTier((p: any) => ({ ...p, label: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Min Öğrenci</label>
                      <input type="number" value={editingTier.min_students} onChange={e => setEditingTier((p: any) => ({ ...p, min_students: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Max Öğrenci</label>
                      <input type="number" value={editingTier.max_students ?? ''} onChange={e => setEditingTier((p: any) => ({ ...p, max_students: e.target.value || null }))} placeholder="Sınırsız" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Ek Fiyat (₺/ay)</label>
                      <input type="number" value={editingTier.extra_price} onChange={e => setEditingTier((p: any) => ({ ...p, extra_price: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saveTier(editingTier)} disabled={saving} style={{ padding: '8px 18px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button onClick={() => setEditingTier(null)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}