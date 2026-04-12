export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FamilyDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [childData, setChildData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!p) { setLoading(false); return }
      setProfile(p)

      const { data: ps } = await supabase
        .from('parent_students')
        .select('student_id, profiles!parent_students_student_id_fkey(id, full_name, phone)')
        .eq('parent_id', p.id)

      const childList = (ps ?? []).map((x: any) => x.profiles).filter(Boolean)
      setChildren(childList)

      if (childList.length > 0) {
        setSelectedChild(childList[0])
        await loadChildData(childList[0].id)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function loadChildData(childId: string) {
    const [
      { data: lessons },
      { data: homework },
      { data: answers },
    ] = await Promise.all([
      supabase.from('lessons').select('*').eq('student_id', childId).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('homework_assignments').select('*, tests(name, question_count, chapters(name, books(name, subject, color)))').eq('student_id', childId).order('created_at', { ascending: false }),
      supabase.from('student_answers').select('*'),
    ])

    const completedHw = (homework ?? []).filter((h: any) => h.status === 'completed')
    const pendingHw = (homework ?? []).filter((h: any) => h.status !== 'completed')
    const totalLessons = lessons?.length ?? 0
    const completedLessons = (lessons ?? []).filter((l: any) => l.status === 'completed').length

    setChildData({ lessons, homework, completedHw, pendingHw, totalLessons, completedLessons })
  }

  async function switchChild(child: any) {
    setSelectedChild(child)
    setChildData(null)
    await loadChildData(child.id)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '960px' }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Veli Paneli</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
          {profile?.full_name} — Cocuklarinizin durumunu buradan takip edebilirsiniz
        </p>
      </div>

      {children.length === 0 ? (
        <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#B45309', marginBottom: '8px' }}>
            Kayitli cocuk bulunamadi
          </div>
          <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
            Admin panelinden veli-ogrenci eslestirmesi yapilmasi gerekiyor.
          </div>
        </div>
      ) : (
        <>
          {children.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {children.map((child: any) => (
                <button
                  key={child.id}
                  onClick={() => switchChild(child)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    border: '1px solid', cursor: 'pointer',
                    background: selectedChild?.id === child.id ? '#1B3A6B' : '#fff',
                    color: selectedChild?.id === child.id ? '#fff' : '#4A6080',
                    borderColor: selectedChild?.id === child.id ? '#1B3A6B' : '#D5DFF0',
                  }}
                >
                  {child.full_name}
                </button>
              ))}
            </div>
          )}

          {selectedChild && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                  {selectedChild.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B' }}>{selectedChild.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Ogrenci</div>
                </div>
              </div>

              {!childData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7A8FA8' }}>Yukleniyor...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
                    {[
                      { label: 'Toplam Ders', value: childData.totalLessons, color: '#1B3A6B', bg: '#EEF3FB' },
                      { label: 'Tamamlanan Ders', value: childData.completedLessons, color: '#2E7D52', bg: '#EAF4EE' },
                      { label: 'Bekleyen Odev', value: childData.pendingHw.length, color: '#B45309', bg: '#FDF4E7' },
                      { label: 'Tamamlanan Odev', value: childData.completedHw.length, color: '#6B4FC8', bg: '#F0ECFB' },
                    ].map(m => (
                      <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                        <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Son Dersler</div>
                      {(childData.lessons ?? []).length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '16px' }}>Henuz ders kaydi yok</div>
                      ) : (childData.lessons ?? []).slice(0, 6).map((l: any) => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F4F9' }}>
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{l.subject}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FA8' }}>
                              {new Date(l.scheduled_at).toLocaleDateString('tr-TR')} {new Date(l.scheduled_at).getHours()}:00
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
                            background: l.status === 'completed' ? '#EAF4EE' : l.status === 'cancelled' ? '#FEF2F2' : '#EEF3FB',
                            color: l.status === 'completed' ? '#2E7D52' : l.status === 'cancelled' ? '#C0392B' : '#1B3A6B',
                          }}>
                            {l.status === 'completed' ? 'Tamamlandi' : l.status === 'cancelled' ? 'Iptal' : 'Planli'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Odev Durumu</div>
                      {(childData.homework ?? []).length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '16px' }}>Henuz odev atanmamis</div>
                      ) : (childData.homework ?? []).slice(0, 6).map((h: any) => {
                        const isDone = h.status === 'completed'
                        const color = h.tests?.chapters?.books?.color ?? '#1B3A6B'
                        return (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #F0F4F9' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDone ? '#2E7D52' : '#B45309', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>
                                {h.tests?.name} — {h.tests?.chapters?.books?.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.subject}</div>
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                              background: isDone ? '#EAF4EE' : '#FDF4E7',
                              color: isDone ? '#2E7D52' : '#B45309',
                            }}>
                              {isDone ? 'Tamam' : 'Bekliyor'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {childData.completedHw.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginTop: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Basari Ozeti</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ background: '#EAF4EE', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2E7D52' }}>{childData.completedHw.length}</div>
                          <div style={{ fontSize: '11px', color: '#3B7A57' }}>Tamamlanan Odev</div>
                        </div>
                        <div style={{ background: '#FDF4E7', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: '#B45309' }}>{childData.pendingHw.length}</div>
                          <div style={{ fontSize: '11px', color: '#92400E' }}>Bekleyen Odev</div>
                        </div>
                        <div style={{ background: '#EEF3FB', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1B3A6B' }}>
                            {childData.completedHw.length + childData.pendingHw.length > 0
                              ? `%${Math.round(childData.completedHw.length / (childData.completedHw.length + childData.pendingHw.length) * 100)}`
                              : '%0'
                            }
                          </div>
                          <div style={{ fontSize: '11px', color: '#1B3A6B' }}>Tamamlama Orani</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
