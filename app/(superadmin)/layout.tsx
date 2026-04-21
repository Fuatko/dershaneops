'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  { href:'/superadmin',          label:'Genel Bakış' },
  { href:'/superadmin/tenants',  label:'Kurumlar' },
  { href:'/superadmin/users',    label:'Tüm Kullanıcılar' },
  { href:'/superadmin/billing',  label:'Fatura & Abonelik' },
  { href:'/superadmin/backup',   label:'Yedekleme' },
  { href:'/superadmin/kvkk',     label:'KVKK & Güvenlik' },
  { href:'/superadmin/modules',  label:'Modül Yönetimi' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sayfa değişince drawer'ı kapat
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Drawer açıkken body scroll'u kilitle
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const activeLabel = navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Süper Admin'

  const NavLinks = () => (
    <>
      {navItems.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'block',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '3px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #C4B5FD' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      <style>{`
        /* Desktop: sidebar görünür, mobil header gizli */
        @media (min-width: 768px) {
          .sa-sidebar-desktop { display: flex !important; }
          .sa-mobile-header   { display: none !important; }
          .sa-drawer          { display: none !important; }
          .sa-overlay         { display: none !important; }
        }
        /* Mobile: sidebar gizli, mobil header görünür */
        @media (max-width: 767px) {
          .sa-sidebar-desktop { display: none !important; }
          .sa-mobile-header   { display: flex !important; }
        }
      `}</style>

      <div style={{ display:'flex', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

        {/* ── DESKTOP SIDEBAR ── */}
        <aside
          className="sa-sidebar-desktop"
          style={{
            width: '220px',
            background: '#1B1464',
            flexShrink: 0,
            flexDirection: 'column',
            height: '100vh',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'7px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', lineHeight:1.2 }}>DershaneOPS</div>
                <div style={{ fontSize:'9.5px', color:'#C4B5FD', fontWeight:700, letterSpacing:'0.5px' }}>SÜPER ADMİN</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
            <NavLinks />
          </nav>

          {/* Alt buton */}
          <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
            
              href="/dashboard"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:'#1B1464', background:'#fff', textDecoration:'none' }}
            >
              ← Admin Paneli
            </a>
          </div>
        </aside>

        {/* ── MOBILE OVERLAY (drawer arkası) ── */}
        {drawerOpen && (
          <div
            className="sa-overlay"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 200,
            }}
          />
        )}

        {/* ── MOBILE DRAWER ── */}
        <aside
          className="sa-drawer"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '240px',
            background: '#1B1464',
            zIndex: 300,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: drawerOpen ? '6px 0 24px rgba(0,0,0,0.35)' : 'none',
          }}
        >
          {/* Logo + kapat */}
          <div style={{ padding:'14px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'6px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>DershaneOPS</div>
                <div style={{ fontSize:'9px', color:'#C4B5FD', fontWeight:700 }}>SÜPER ADMİN</div>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ width:'28px', height:'28px', borderRadius:'6px', background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
            <NavLinks />
          </nav>

          {/* Alt buton */}
          <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
            
              href="/dashboard"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:'#1B1464', background:'#fff', textDecoration:'none' }}
            >
              ← Admin Paneli
            </a>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

          {/* Mobil header — sadece mobilde görünür */}
          <div
            className="sa-mobile-header"
            style={{
              display: 'none', /* CSS ile override edilir */
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
              height: '52px',
              background: '#1B1464',
              flexShrink: 0,
            }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ width:'34px', height:'34px', borderRadius:'7px', background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', lineHeight:1.2 }}>Süper Admin</div>
                <div style={{ fontSize:'10px', color:'#C4B5FD' }}>{activeLabel}</div>
              </div>
            </div>
            
              href="/dashboard"
              style={{ fontSize:'11px', padding:'5px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.12)', color:'#fff', textDecoration:'none', fontWeight:600 }}
            >
              Admin →
            </a>
          </div>

          {/* Sayfa içeriği */}
          <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}