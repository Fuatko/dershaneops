'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notifications')
  const supabase = createClient()

  useEffect(() => {
    load()
    // Gerçek zamanlı güncelleme
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_events' }, () => loadEvents())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function loadEvents() {
    const { data } = await supabase
      .from('student_events')
      .select('*, profiles!student_events_student_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setEvents(data ?? [])
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ status: 'sent' }).eq('id', id)
    await load()
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ status: 'sent' }).eq('status', 'pending')
    await load()
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    await load()
  }

  function getEventIcon(type: string) {
    const icons: Record<string, string> = {
      task_completed: '✅',
      high_performance: '🌟',
      risk_detected: '🚨',
      badge_earned: '🏅',
      streak_updated: '🔥',
      performance_drop: '📉',
    }
    return icons[type] ?? '📢'
  }

  function getNotifColor(title: string) {
    if (title?.includes('Risk') || title?.includes('🚨')) return { color: '#C0392B', bg: '#FEF2F2', border: '#FECACA' }
    if (title?.includes('🌟') || title?.includes('Yüksek')) return { color: '#B45309', bg: '#FDF4E7', border: '#FED7AA' }
    if (title?.includes('✅')) return { color: '#2E7D52', bg: '#EAF4EE', border: '#A7D9B8' }
    return { color: '#1B3A6B', bg: '#EEF3FB', border: '#BFDBFE' }
  }

  const unreadCount = notifications.filter(n => n.status === 'pending').length

  useEffect(() => { loadEvents() }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>
            Bildirimler & Olaylar
            {unreadCount > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: '#FEF2F2', color: '#C0392B' }}>
                {unreadCount} yeni
              </span>
            )}
          </h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Gerçek zamanlı öğrenci olayları ve sistem bildirimleri</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding: '8px 16px', borderRadius: '8px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12.5px', fontWeight: 600, border: '1px solid #BFDBFE', cursor: 'pointer' }}>
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'notifications', label: 'Bildirimler (' + notifications.length + ')' },
          { id: 'events', label: 'Olaylar (' + events.length + ')' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BİLDİRİMLER */}
      {activeTab === 'notifications' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Henüz bildirim yok</div>
            </div>
          ) : notifications.map((n, i) => {
            const nc = getNotifColor(n.title)
            const isUnread = n.status === 'pending'
            return (
              <div key={n.id} style={{ padding: '14px 18px', borderBottom: i < notifications.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px', background: isUnread ? '#FAFBFF' : '#fff' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: nc.bg, border: '1px solid ' + nc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {n.title?.includes('Risk') ? '🚨' : n.title?.includes('🌟') ? '🌟' : n.title?.includes('✅') ? '✅' : '📢'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ fontSize: '13px', fontWeight: isUnread ? 700 : 600, color: nc.color }}>{n.title}</div>
                    {isUnread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C0392B', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#4A6080', marginBottom: '4px' }}>{n.content}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    {new Date(n.created_at).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {isUnread && (
                    <button onClick={() => markRead(n.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EEF3FB', color: '#1B3A6B', fontSize: '11px', cursor: 'pointer' }}>
                      Okundu
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', cursor: 'pointer' }}>
                    Sil
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* OLAYLAR */}
      {activeTab === 'events' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          {events.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Henüz olay kaydı yok</div>
            </div>
          ) : events.map((e, i) => (
            <div key={e.id} style={{ padding: '12px 18px', borderBottom: i < events.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {getEventIcon(e.event_type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>
                  {e.profiles?.full_name} — <span style={{ color: '#7A8FA8', fontWeight: 400 }}>{e.event_type}</span>
                </div>
                {e.event_data?.message && (
                  <div style={{ fontSize: '11.5px', color: '#4A6080' }}>{e.event_data.message}</div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                {new Date(e.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}