'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function markAllRead() {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function sendTest() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return
    await supabase.from('notifications').insert({
      to_profile_id: profile.id,
      title: 'Test Bildirimi',
      body: 'Bu bir test bildirimidir. Sistem calisiyor.',
      type: 'system',
      is_read: false,
    })
    load()
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    const hour = Math.floor(diff / 3600000)
    const day = Math.floor(diff / 86400000)
    if (min < 1) return 'Az once'
    if (min < 60) return min + ' dakika once'
    if (hour < 24) return hour + ' saat once'
    return day + ' gun once'
  }

  const COLORS: Record<string, string> = {
    homework_completed: '#2E7D52',
    homework_assigned: '#1B3A6B',
    lesson_cancelled: '#C0392B',
    lesson_scheduled: '#2E7D52',
    makeup_scheduled: '#B45309',
    conflict_detected: '#C0392B',
    system: '#6B4FC8',
  }

  const LABELS: Record<string, string> = {
    homework_completed: 'Odev Tamamlandi',
    homework_assigned: 'Odev Atandi',
    lesson_cancelled: 'Ders Iptal',
    lesson_scheduled: 'Ders Planli',
    makeup_scheduled: 'Telafi Planli',
    conflict_detected: 'Cakisma',
    system: 'Sistem',
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  return (
    <div style={{ padding: '28px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Bildirimler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
            {unreadCount > 0 ? unreadCount + ' okunmamis bildirim' : 'Tum bildirimler okundu'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', cursor: 'pointer' }}>
              Tumunu Okundu Isaretle
            </button>
          )}
          <button onClick={sendTest} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
            + Test Bildirimi
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            border: '1px solid', cursor: 'pointer',
            background: filter === f ? '#1B3A6B' : '#fff',
            color: filter === f ? '#fff' : '#4A6080',
            borderColor: filter === f ? '#1B3A6B' : '#D5DFF0',
          }}>
            {f === 'all' ? 'Tumü' : 'Okunmamis'}{f === 'unread' && unreadCount > 0 ? ' (' + unreadCount + ')' : ''}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>Bildirim yok</div>
            <button onClick={sendTest} style={{ padding: '8px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Test Bildirimi Gonder
            </button>
          </div>
        ) : filtered.map((n, i) => {
          const color = COLORS[n.type] ?? '#6B4FC8'
          const label = LABELS[n.type] ?? 'Bildirim'
          return (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F0F4F9' : 'none', background: n.is_read ? '#fff' : '#F8FAFF', cursor: n.is_read ? 'default' : 'pointer' }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.is_read ? '#D5DFF0' : color, flexShrink: 0, marginTop: '5px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: color + '18', color }}>
                    {label}
                  </span>
                  {!n.is_read && <span style={{ fontSize: '10px', fontWeight: 700, color: '#1B3A6B' }}>YENI</span>}
                </div>
                <div style={{ fontSize: '13px', fontWeight: n.is_read ? 400 : 600, color: '#1B3A6B', marginBottom: '3px' }}>{n.title}</div>
                {n.body && <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '4px' }}>{n.body}</div>}
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo(n.sent_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
