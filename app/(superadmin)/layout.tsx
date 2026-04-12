'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9' }}>
      <aside style={{ width: '220px', background: '#0F2444', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
          <div style={{ fontSize: '10px', color: '#C4B5FD', fontWeight: 600, marginTop: '2px' }}>SÜPER ADMİN PANELİ</div>
        </div>
        <nav style={{ flex: 1, padding: '8px' }}>
          {[
            { href: '/superadmin', label: 'Platform Genel Bakış' },
            { href: '/superadmin/tenants', label: 'Kurumlar' },
            { href: '/superadmin/users', label: 'Tüm Kullanıcılar' },
            { href: '/superadmin/billing', label: 'Faturalandırma' },
            { href: '/superadmin/backup', label: 'Yedekleme' },
            { href: '/superadmin/kvkk', label: 'KVKK & Güvenlik' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
              fontSize: '12.5px', fontWeight: pathname === item.href ? 600 : 400,
              color: pathname === item.href ? '#fff' : 'rgba(255,255,255,0.6)',
              background: pathname === item.href ? 'rgba(255,255,255,0.1)' : 'transparent',
              textDecoration: 'none'
            }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/dashboard" style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Admin Paneline Dön
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  )
}
