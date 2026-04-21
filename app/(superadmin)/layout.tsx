'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href:'/superadmin',         label:'Genel Bakış' },
  { href:'/superadmin/tenants', label:'Kurumlar' },
  { href:'/superadmin/users',   label:'Tüm Kullanıcılar' },
  { href:'/superadmin/billing', label:'Fatura & Abonelik' },
  { href:'/superadmin/backup',  label:'Yedekleme' },
  { href:'/superadmin/kvkk',    label:'KVKK & Güvenlik' },
  { href:'/superadmin/modules', label:'Modül Yönetimi' },
]

const BG  = '#1B1464'
const DIV = '1px solid rgba(255,255,255,0.1)'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const [open, setOpen]     = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const active = NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Süper Admin'

  // ── Sidebar içeriği (hem desktop hem drawer) ──────────────
  const renderNav = (withClose: boolean) => (
    <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
      {NAV.map(item => {
        const isAct = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={withClose ? () => setOpen(false) : undefined}
            style={{
              display:'block', padding:'10px 14px', borderRadius:'8px', marginBottom:'3px',
              fontSize:'13px', fontWeight: isAct ? 600 : 400,
              color: isAct ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isAct ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: isAct ? '3px solid #C4B5FD' : '3px solid transparent',
              textDecoration:'none',
            }}
          >{item.label}</Link>
        )
      })}
    </nav>
  )

  const renderAdminBtn = () => (
    <div style={{ padding:'10px 8px', borderTop:DIV, flexShrink:0 }}>
      <a href="/dashboard" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:BG, background:'#fff', textDecoration:'none' }}>
        ← Admin Paneli
      </a>
    </div>
  )

  const renderLogo = () => (
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

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

      {/* ── Desktop sidebar ── */}
      {!mobile && (
        <aside style={{ width:'220px', background:BG, flexShrink:0, display:'flex', flexDirection:'column', height:'100vh' }}>
          <div style={{ padding:'16px 14px', borderBottom:DIV, flexShrink:0 }}>{renderLogo()}</div>
          {renderNav(false)}
          {renderAdminBtn()}
        </aside>
      )}

      {/* ── Mobil overlay ── */}
      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200 }}
        />
      )}

      {/* ── Mobil drawer — float, content'e dokunmaz ── */}
      {mobile && (
        <aside style={{
          position:'fixed', top:0, left:0, bottom:0, width:'240px',
          background:BG, zIndex:300,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition:'transform 0.25s ease',
          display:'flex', flexDirection:'column',
          boxShadow: open ? '6px 0 24px rgba(0,0,0,0.35)' : 'none',
        }}>
          <div style={{ padding:'13px 14px', borderBottom:DIV, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            {renderLogo()}
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
          {renderNav(true)}
          {renderAdminBtn()}
        </aside>
      )}

      {/* ── Ana içerik — drawer ne olursa olsun kayma yok ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Mobil header */}
        {mobile && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', height:'52px', background:BG, flexShrink:0 }}>
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
                <div style={{ fontSize:'10px', color:'#C4B5FD' }}>{active}</div>
              </div>
            </div>
            <a href="/dashboard" style={{ fontSize:'11px', padding:'5px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.12)', color:'#fff', textDecoration:'none', fontWeight:600 }}>
              Admin →
            </a>
          </div>
        )}

        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}