'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AccessibilityWidget from '@/components/AccessibilityWidget'

const Icons: Record<string, () => JSX.Element> = {
  dashboard:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  students:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  teachers:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  parents:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  link:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  books:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  assign:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>,
  calendar:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  conflict:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  refresh:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  pencil:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  checklist:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  target:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  chart:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  award:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  alert:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plan:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
  support:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  report:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  user:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  exam:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  analytics:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  building:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cpu:           () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  layers:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  compass:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  message:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  download:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  bell:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  settings:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  accessibility: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M12 7c-3 0-5 1.5-5 4l1 6h2l1-4h2l1 4h2l1-6c0-2.5-2-4-5-4z"/></svg>,
}

const navGroups = [
  { section: 'Genel', links: [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  ]},
  { section: 'Tanımlar', links: [
    { href: '/students',     label: 'Öğrenciler',        icon: 'students' },
    { href: '/teachers',     label: 'Öğretmenler',       icon: 'teachers' },
    { href: '/parents',      label: 'Veliler',           icon: 'parents' },
    { href: '/parent-match', label: 'Veli Eşleştirme',   icon: 'link' },
    { href: '/books',        label: 'Kitap Kütüphanesi', icon: 'books' },
    { href: '/books/assign', label: 'Ödev Ata',          icon: 'assign' },
  ]},
  { section: 'Planlama', links: [
    { href: '/scheduler', label: 'Haftalık Planlama', icon: 'calendar' },
    { href: '/conflicts',  label: 'Çakışma Merkezi',  icon: 'conflict' },
    { href: '/makeup',     label: 'Telafi Dersleri',  icon: 'refresh' },
  ]},
  { section: 'Akademik', links: [
    { href: '/questions',       label: 'Soru Bankası',       icon: 'pencil' },
    { href: '/daily-tasks',     label: 'Günlük Görevler',    icon: 'checklist' },
    { href: '/goals',           label: 'Hedef Takibi',       icon: 'target' },
    { href: '/performance',     label: 'Hakimiyet Haritası', icon: 'chart' },
    { href: '/outcomes',        label: 'Kazanım Yönetimi',   icon: 'award' },
    { href: '/risk',            label: 'Risk Analizi',       icon: 'alert' },
    { href: '/studyplan',       label: 'Çalışma Planı',      icon: 'plan' },
    { href: '/teacherdecision', label: 'Öğretmen Destek',    icon: 'support' },
    { href: '/parentreport',    label: 'Veli Raporu',        icon: 'report' },
    { href: '/profile',         label: 'Gelişim Profili',    icon: 'user' },
  ]},
  { section: 'Raporlar', links: [
    { href: '/exams',          label: 'Deneme Sınavları',     icon: 'exam' },
    { href: '/exam-analytics', label: 'Sınav Analizi',        icon: 'analytics' },
    { href: '/institution',    label: 'Kurum Zekası',         icon: 'building' },
    { href: '/prediction',     label: 'Tahmin Motoru',        icon: 'cpu' },
    { href: '/scenario',       label: 'Senaryo Motoru',       icon: 'layers' },
    { href: '/coordinator',    label: 'Akademik Koordinatör', icon: 'compass' },
    { href: '/guidance',       label: 'Rehberlik',            icon: 'message' },
    { href: '/reports',        label: 'Raporlar ve Export',   icon: 'download' },
    { href: '/notifications',  label: 'Bildirimler',          icon: 'bell' },
  ]},
  { section: 'Sistem', links: [
    { href: '/accessibility', label: 'Erişilebilirlik', icon: 'accessibility' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, tenant_id, tenants(name, logo_url)')
        .eq('user_id', user.id)
        .single()
      setCurrentUser(profile)
    }
    loadUser()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isSuperAdmin  = currentUser?.role === 'superadmin'
  const tenantName    = (currentUser?.tenants as any)?.name ?? 'DershaneOPS'
  const logoUrl       = (currentUser?.tenants as any)?.logo_url ?? null
  const userInitials  = currentUser?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? 'AD'
  const activeLabel   = navGroups.flatMap(g => g.links).find(l => l.href === pathname)?.label
    ?? (pathname === '/superadmin' ? 'Süper Admin' : 'Yönetim Paneli')

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const isActive = pathname === href
    const IconComp = Icons[icon]
    return (
      <Link
        href={href}
        onClick={() => setMenuOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'7px', marginBottom:'1px', fontSize:'12.5px', fontWeight:isActive?600:400, color:isActive?'#1B3A6B':'#475569', textDecoration:'none', background:isActive?'#EEF3FB':'transparent', borderLeft:isActive?'2px solid #1B3A6B':'2px solid transparent' }}
      >
        <span style={{ color:isActive?'#1B3A6B':'#94A3B8', display:'flex', flexShrink:0 }}>
          {IconComp ? <IconComp /> : null}
        </span>
        {label}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Logo / Kurum */}
      <div style={{ padding:'18px 16px', borderBottom:'1px solid #E8EEF5', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
        {logoUrl ? (
          <img src={logoUrl} alt={tenantName} style={{ width:'34px', height:'34px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }} />
        ) : (
          <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
            </svg>
          </div>
        )}
        <div>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{tenantName}</div>
          <div style={{ fontSize:'10px', color:'#94A3B8' }}>Yönetim Paneli</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px', overflowY:'auto' }} aria-label="Ana navigasyon">

        {/* Normal menü grupları */}
        {navGroups.map(group => (
          <div key={group.section}>
            <div style={{ fontSize:'9.5px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#94A3B8', padding:'12px 8px 4px' }}>
              {group.section}
            </div>
            {group.links.map(link => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>
        ))}

        {/* Sadece Süper Admin görür */}
        {isSuperAdmin && (
          <div>
            <div style={{ fontSize:'9.5px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#94A3B8', padding:'12px 8px 4px' }}>
              Yönetim
            </div>
            <NavLink href="/superadmin" label="Süper Admin" icon="settings" />
          </div>
        )}

      </nav>

      {/* Footer */}
      <div style={{ padding:'8px', borderTop:'1px solid #E8EEF5', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', background:'#F8FAFC', marginBottom:'6px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#1B3A6B', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#fff' }}>
            {userInitials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'11.5px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {currentUser?.full_name ?? 'Yükleniyor...'}
            </div>
            <div style={{ fontSize:'10px', color:'#94A3B8' }}>
              {isSuperAdmin ? 'Süper Admin' : 'Admin'}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Çıkış yap"
          style={{ display:'flex', width:'100%', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px', borderRadius:'7px', fontSize:'12px', color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', cursor:'pointer', fontWeight:600 }}
        >
          <Icons.logout />
          Çıkış Yap
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

      {/* Desktop Sidebar */}
      <aside className="desk-sidebar" style={{ width:'220px', background:'#fff', borderRight:'1px solid #E8EEF5', flexShrink:0, overflow:'hidden' }} aria-label="Yönetim menüsü">
        <SidebarContent />
      </aside>

      {/* Mobil overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} aria-hidden="true"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200 }} />
      )}

      {/* Mobil Drawer */}
      <aside className="mob-drawer" aria-label="Yönetim menüsü" aria-hidden={!menuOpen}
        style={{ position:'fixed', top:0, left:0, bottom:0, width:'260px', background:'#fff', zIndex:300, transform:menuOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.25s ease', boxShadow:'4px 0 24px rgba(0,0,0,0.15)' }}>
        <SidebarContent />
      </aside>

      {/* Sağ taraf */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Mobil Header */}
        <div className="mob-header" style={{ background:'#1B3A6B', padding:'0 16px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={() => setMenuOpen(true)} aria-label="Menüyü aç" aria-expanded={menuOpen}
              style={{ width:'34px', height:'34px', borderRadius:'7px', background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', lineHeight:1.2 }}>{tenantName}</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', lineHeight:1.2 }}>{activeLabel}</div>
            </div>
          </div>
          <Link href="/dashboard" style={{ fontSize:'11px', padding:'5px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.12)', color:'#fff', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
            Ana Panel
          </Link>
        </div>

        {/* İçerik */}
        <main id="main-content" style={{ flex:1, overflowY:'auto', overflowX:'hidden' }} tabIndex={-1}>
          {children}
        </main>
      </div>

      <AccessibilityWidget />

      <style>{`
        @media (min-width: 768px) {
          .desk-sidebar { display: flex !important; flex-direction: column; }
          .mob-drawer   { display: none !important; }
          .mob-header   { display: none !important; }
        }
        @media (max-width: 767px) {
          .desk-sidebar { display: none !important; }
          .mob-drawer   { display: flex !important; flex-direction: column; }
          .mob-header   { display: flex !important; }
        }
      `}</style>
    </div>
  )
}