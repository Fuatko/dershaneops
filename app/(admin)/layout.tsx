'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navGroups = [
  { section: 'Genel', links: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]},
  { section: 'Tanımlar', links: [
    { href: '/students', label: 'Öğrenciler', icon: '👨‍🎓' },
    { href: '/teachers', label: 'Öğretmenler', icon: '👨‍🏫' },
    { href: '/parents', label: 'Veliler', icon: '👨‍👩‍👧' },
    { href: '/parent-match', label: 'Veli Eşleştirme', icon: '🔗' },
    { href: '/books', label: 'Kitap Kütüphanesi', icon: '📚' },
    { href: '/books/assign', label: 'Ödev Ata', icon: '📋' },
  ]},
  { section: 'Planlama', links: [
    { href: '/scheduler', label: 'Haftalık Planlama', icon: '📅' },
    { href: '/conflicts', label: 'Çakışma Merkezi', icon: '⚠️' },
    { href: '/makeup', label: 'Telafi Dersleri', icon: '🔄' },
  ]},
  { section: 'Akademik', links: [
    { href: '/questions', label: 'Soru Girişi', icon: '✏️' },
    { href: '/daily-tasks', label: 'Günlük Görevler', icon: '✅' },
    { href: '/goals', label: 'Hedef Takibi', icon: '🎯' },
    { href: '/performance', label: 'Hakimiyet Haritası', icon: '📈' },
    { href: '/outcomes', label: 'Kazanım Yönetimi', icon: '🏫' },
    { href: '/risk', label: 'Risk Analizi', icon: '🚨' },
    { href: '/studyplan', label: 'Çalışma Planı', icon: '📖' },
    { href: '/teacherdecision', label: 'Öğretmen Destek', icon: '🤝' },
    { href: '/parentreport', label: 'Veli Raporu', icon: '📄' },
    { href: '/profile', label: 'Gelişim Profili', icon: '👤' },
  ]},
  { section: 'Raporlar', links: [
    { href: '/exams', label: 'Deneme Sınavları', icon: '📝' },
    { href: '/exam-analytics', label: 'Sınav Analizi', icon: '📊' },
    { href: '/institution', label: 'Kurum Zekası', icon: '🏢' },
    { href: '/prediction', label: 'Tahmin Motoru', icon: '🔮' },
    { href: '/scenario', label: 'Senaryo Motoru', icon: '🎭' },
    { href: '/coordinator', label: 'Akademik Koordinatör', icon: '🧭' },
    { href: '/guidance', label: 'Rehberlik', icon: '💬' },
    { href: '/reports', label: 'Raporlar ve Export', icon: '📤' },
    { href: '/notifications', label: 'Bildirimler', icon: '🔔' },
    { href: '/superadmin', label: '⚙ Süper Admin', icon: '⚙️' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Aktif sayfa adını bul
  const activeLabel = navGroups.flatMap(g => g.links).find(l => l.href === pathname)?.label ?? 'Yönetim Paneli'

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding:'20px 16px', borderBottom:'1px solid #D5DFF0', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:'13.5px', fontWeight:700, color:'#1B3A6B' }}>DershaneOPS</div>
          <div style={{ fontSize:'10.5px', color:'#7A8FA8', marginTop:'1px' }}>Yönetim Paneli</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        {navGroups.map(group => (
          <div key={group.section}>
            <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#A0B0C8', padding:'14px 8px 5px' }}>
              {group.section}
            </div>
            {group.links.map(link => {
              const isActive = pathname === link.href
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', borderRadius:'8px', marginBottom:'2px', fontSize:'13px', fontWeight:isActive?600:500, color:isActive?'#1B3A6B':'#4A6080', textDecoration:'none', background:isActive?'#E2EAF8':'transparent', borderLeft:isActive?'3px solid #1B3A6B':'3px solid transparent' }}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'8px', borderTop:'1px solid #D5DFF0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 12px', borderRadius:'8px', background:'#F0F4F9', marginBottom:'6px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#1B3A6B', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff' }}>FK</div>
          <div>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#1B3A6B' }}>Fuat Kocabıçak</div>
            <div style={{ fontSize:'10.5px', color:'#7A8FA8' }}>Admin</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ display:'flex', width:'100%', alignItems:'center', justifyContent:'center', gap:'7px', padding:'8px 12px', borderRadius:'8px', fontSize:'12.5px', color:'#C0392B', background:'#FEF2F2', border:'1px solid #FECACA', cursor:'pointer', fontWeight:600 }}>
          Çıkış Yap
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F0F4F9' }}>

      {/* Desktop Sidebar */}
      <aside style={{ width:'220px', background:'#fff', borderRight:'1px solid #D5DFF0', display:'flex', flexDirection:'column', flexShrink:0 }}
        className="admin-sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:200 }} />
      )}

      {/* Mobile Drawer */}
      <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:'280px', background:'#fff', display:'flex', flexDirection:'column', zIndex:300, transform:menuOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.25s ease', boxShadow:'4px 0 20px rgba(0,0,0,0.15)' }}
        className="admin-sidebar-mobile">
        <SidebarContent />
      </aside>

      {/* Sağ taraf */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Mobile Header */}
        <div style={{ background:'#1B3A6B', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}
          className="admin-mobile-header">
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={() => setMenuOpen(true)}
              style={{ width:'36px', height:'36px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'4px' }}>
              <div style={{ width:'16px', height:'2px', background:'#fff', borderRadius:'1px' }} />
              <div style={{ width:'16px', height:'2px', background:'#fff', borderRadius:'1px' }} />
              <div style={{ width:'16px', height:'2px', background:'#fff', borderRadius:'1px' }} />
            </button>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>DershaneOPS</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>{activeLabel}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Link href="/dashboard" style={{ fontSize:'11px', padding:'5px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.15)', color:'#fff', textDecoration:'none', fontWeight:600 }}>
              Ana Panel
            </Link>
          </div>
        </div>

        {/* İçerik */}
        <main style={{ flex:1, overflowY:'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar-desktop { display: flex !important; }
          .admin-sidebar-mobile { display: none !important; }
          .admin-mobile-header { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-sidebar-mobile { display: flex !important; }
          .admin-mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}