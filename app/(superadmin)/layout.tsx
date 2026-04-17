'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/superadmin', label: 'Genel Bakis' },
    { href: '/superadmin/tenants', label: 'Kurumlar' },
    { href: '/superadmin/users', label: 'Tum Kullanicilar' },
    { href: '/superadmin/billing', label: 'Plan Yonetimi' },
    { href: '/superadmin/backup', label: 'Yedekleme' },
    { href: '/superadmin/kvkk', label: 'KVKK & Guvenlik' },
    { href: '/superadmin/modules', label: 'Modul Yonetimi' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9' }}>
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: '#6B4FC8', fontWeight: 700 }}>SUPER ADMIN</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
              fontSize: '13px', fontWeight: pathname === item.href ? 600 : 500,
              color: pathname === item.href ? '#1B3A6B' : '#4A6080',
              background: pathname === item.href ? '#E2EAF8' : 'transparent',
              borderLeft: pathname === item.href ? '3px solid #1B3A6B' : '3px solid transparent',
              textDecoration: 'none'
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#fff', background: '#1B3A6B', textDecoration: 'none', textAlign: 'center', justifyContent: 'center' }}>
  ← Admin Paneli
</a>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  )
}