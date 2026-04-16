'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navGroups = [
  { section: 'Genel', links: [
    { href: '/dashboard', label: 'Dashboard' },
  ]},
  { section: 'Tanımlar', links: [
    { href: '/students', label: 'Öğrenciler' },
    { href: '/teachers', label: 'Öğretmenler' },
    { href: '/parents', label: 'Veliler' },
    { href: '/parent-match', label: 'Veli Eşleştirme' },
    { href: '/books', label: 'Kitap Kütüphanesi' },
    { href: '/books/assign', label: 'Ödev Ata' },
  ]},
  { section: 'Planlama', links: [
    { href: '/scheduler', label: 'Haftalık Planlama' },
    { href: '/conflicts', label: 'Çakışma Merkezi' },
    { href: '/makeup', label: 'Telafi Dersleri' },
  ]},
  { section: 'Akademik', links: [
    { href: '/questions', label: 'Soru Girişi' },
    { href: '/daily-tasks', label: 'Günlük Görevler' },
    { href: '/goals', label: 'Hedef Takibi' },
    { href: '/performance', label: 'Hakimiyet Haritası' },
    { href: '/risk', label: 'Risk Analizi' },
    { href: '/studyplan', label: 'Çalışma Planı' },
    { href: '/teacherdecision', label: 'Öğretmen Destek' },
    { href: '/parentreport', label: 'Veli Raporu' },
    { href: '/profile', label: 'Gelişim Profili' },
  ]},
  { section: 'Raporlar', links: [
    { href: '/exams', label: 'Deneme Sınavları' },
    { href: '/exam-analytics', label: 'Sınav Analizi' },
    { href: '/coordinator', label: 'Akademik Koordinatör' },
    { href: '/reports', label: 'Raporlar' },
    { href: '/notifications', label: 'Bildirimler' },
    { href: '/superadmin', label: '⚙ Süper Admin' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9' }}>
      <aside style={{ width: '220px', background: '#FFFFFF', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
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

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0B0C8', padding: '14px 8px 5px' }}>
                {group.section}
              </div>
              {group.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px', fontSize: '13px', fontWeight: isActive ? 600 : 500, color: isActive ? '#1B3A6B' : '#4A6080', textDecoration: 'none', background: isActive ? '#E2EAF8' : 'transparent', borderLeft: isActive ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', marginBottom: '6px' }}>
            Ana Panel
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: '#F0F4F9', marginBottom: '4px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1B3A6B', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>FK</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1B3A6B' }}>Fuat Kocabıçak</div>
              <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>Admin</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '7px', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#C0392B', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}