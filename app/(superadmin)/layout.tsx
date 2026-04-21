'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/superadmin',         label: 'Genel Bakış' },
  { href: '/superadmin/tenants', label: 'Kurumlar' },
  { href: '/superadmin/users',   label: 'Tüm Kullanıcılar' },
  { href: '/superadmin/billing', label: 'Fatura & Abonelik' },
  { href: '/superadmin/backup',  label: 'Yedekleme' },
  { href: '/superadmin/kvkk',    label: 'KVKK & Güvenlik' },
  { href: '/superadmin/modules', label: 'Modül Yönetimi' },
]

const SIDEBAR_BG = '#1B1464'
const DIVIDER    = '1px solid rgba(255,255,255,0.1)'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const activeLabel = NAV_ITEMS.find(n =>
    pathname === n.href || pathname.startsWith(n.href + '/')
  )?.label ?? 'Süper Admin'

  const logoBlock = (
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
  )

  const navLinks = (
    <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '3px',
              fontSize: '13px',
              fontWeight: active ? 600 : 400,
              color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: active ? '3px solid #C4B5FD' : '3px solid transparent',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const adminBtn = (
    <div style={{ padding:'10px 8px', borderTop:DIVIDER, flexShrink:0 }}>
      
        href="/dashboard"
        style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:SIDEBAR_BG, background:'#fff', textDecoration:'none' }}
      >
        ← Admin Paneli
      </a>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

      {/* Desktop sidebar */}
      {!mobile && (
        <aside style={{ width:'220px', background:SIDEBAR_BG, flexShrink:0, display:'flex', flexDirection:'column', height:'100vh' }}>
          <div style={{ padding:'16px 14px', borderBottom:DIVIDER, flexShrink:0 }}>
            {logoBlock}
          </div>
          {navLinks}
          {adminBtn}
        </aside>
      )}

      {/* Mobil overlay */}
      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200 }}
        />
      )}

      {/* Mobil drawer */}
      {mobile && (
        <aside style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '240px',
          background: SIDEBAR_BG,
          zIndex: 300,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: open ? '6px 0 24px rgba(0,0,0,0.35)' : 'none',
        }}>
          <div style={{ padding:'13px 14px', borderBottom:DIVIDER, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            {logoBlock}
            <button
              onClick={() => setOpen(false)}
              style={{ width:'30px', height:'30px', borderRadius:'6px', background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {navLinks}
          {adminBtn}
        </aside>
      )}

      {/* Ana içerik */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Mobil header */}
        {mobile && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', height:'52px', background:SIDEBAR_BG, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <button
                onClick={() => setOpen(true)}
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
        )}

        {/* Sayfa içeriği — tam genişlik, kayma yok */}
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </main>

      </div>
    </div>
  )
}