'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navGroups = [
  { section: 'Genel', links: [
    { href: '/dashboard', label: 'Dashboard' },
  ]},
  { section: 'Tanımlar', links: [
    { href: '/students', label: 'Öğrenciler' },
    { href: '/teachers', label: 'Öğretmenler' },
    { href: '/books', label: 'Kitap Kütüphanesi' },
    { href: '/books/assign', label: 'Ödev Ata' },
  ]},
  { section: 'Planlama', links: [
    { href: '/scheduler', label: 'Haftalık Planlama' },
    { href: '/conflicts', label: 'Çakışma Merkezi' },
    { href: '/makeup', label: 'Telafi Dersleri' },
  ]},
  {
    section: 'Öğrenci',
    links: [
      { href: '/homework', label: 'Ödev Modülü' },
      { href: '/swot', label: 'SWOT Analizi' },
      { href: '/veli', label: 'Veli Paneli' },
    ]
  },
  { section: 'Raporlar', links: [
    { href: '/reports', label: 'Raporlar' },
    { href: '/notifications', label: 'Bildirimler' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: '#FFFFFF',
        borderRight: '1px solid #D5DFF0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
            <div style={{ fontSize: '10.5px', color: '#7A8FA8', marginTop: '1px' }}>Yönetim Paneli</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0B0C8', padding: '14px 8px 5px' }}>
                {group.section}
              </div>
              {group.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#1B3A6B' : '#4A6080',
                    textDecoration: 'none',
                    background: isActive ? '#E2EAF8' : 'transparent',
                    borderLeft: isActive ? '3px solid #1B3A6B' : '3px solid transparent',
                  }}>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Kullanıcı */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: '#F0F4F9', marginBottom: '4px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1B3A6B', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>FK</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1B3A6B' }}>Fuat Kocabıçak</div>
              <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>Admin</div>
            </div>
          </div>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#7A8FA8', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 7h8M10 4.5l2.5 2.5L10 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            </svg>
            Çıkış Yap
          </Link>
        </div>
      </aside>

      {/* İçerik */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
