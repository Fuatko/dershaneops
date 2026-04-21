'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href:'/superadmin', label:'Genel Bakış' },
  { href:'/superadmin/tenants', label:'Kurumlar' },
  { href:'/superadmin/users', label:'Tüm Kullanıcılar' },
  { href:'/superadmin/billing', label:'Fatura & Abonelik' },
  { href:'/superadmin/backup', label:'Yedekleme' },
  { href:'/superadmin/kvkk', label:'KVKK & Güvenlik' },
  { href:'/superadmin/modules', label:'Modül Yönetimi' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeLabel = navItems.find(n=>n.href===pathname)?.label ?? 'Süper Admin'

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'16px', borderBottom:'1px solid #2A1F6E', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'7px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:'12.5px', fontWeight:700, color:'#fff' }}>DershaneOPS</div>
            <div style={{ fontSize:'10px', color:'#C4B5FD', fontWeight:700 }}>SÜPER ADMİN</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:'8px', overflowY:'auto' }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} onClick={()=>setMenuOpen(false)}
            style={{ display:'block', padding:'9px 12px', borderRadius:'8px', marginBottom:'2px', fontSize:'13px', fontWeight:pathname===item.href?600:500, color:pathname===item.href?'#fff':'rgba(255,255,255,0.65)', background:pathname===item.href?'rgba(255,255,255,0.15)':'transparent', borderLeft:pathname===item.href?'3px solid #C4B5FD':'3px solid transparent', textDecoration:'none' }}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding:'8px', borderTop:'1px solid #2A1F6E', flexShrink:0 }}>
        <a href="/dashboard" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:'#1B3A6B', background:'#fff', textDecoration:'none' }}>
          ← Admin Paneli
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

      {/* Desktop sidebar */}
      <aside className="sa-desk" style={{ width:'220px', background:'#1B1464', flexShrink:0, overflow:'hidden' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={()=>setMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200 }} />
      )}

      {/* Mobile drawer */}
      <aside className="sa-mob" style={{ position:'fixed', top:0, left:0, bottom:0, width:'260px', background:'#1B1464', zIndex:300, transform:menuOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.25s ease', boxShadow:'4px 0 20px rgba(0,0,0,0.3)' }}>
        <SidebarContent />
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Mobile header */}
        <div className="sa-header" style={{ background:'#1B1464', padding:'0 16px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={()=>setMenuOpen(true)} style={{ width:'34px', height:'34px', borderRadius:'7px', background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>Süper Admin</div>
              <div style={{ fontSize:'10px', color:'#C4B5FD' }}>{activeLabel}</div>
            </div>
          </div>
          <a href="/dashboard" style={{ fontSize:'11px', padding:'5px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.12)', color:'#fff', textDecoration:'none', fontWeight:600 }}>Admin →</a>
        </div>

        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>{children}</main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sa-desk { display: flex !important; flex-direction: column; }
          .sa-mob { display: none !important; }
          .sa-header { display: none !important; }
        }
        @media (max-width: 767px) {
          .sa-desk { display: none !important; }
          .sa-mob { display: flex !important; flex-direction: column; }
          .sa-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}