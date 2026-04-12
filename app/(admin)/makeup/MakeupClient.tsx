'use client'

import { useState } from 'react'

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} — ${String(d.getHours()).padStart(2,'0')}:00`
}

function daysDiff(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

interface Lesson {
  id: string
  teacher_id: string
  student_id: string
  subject: string
  scheduled_at: string
  duration_min: number
  status: string
}

interface Profile { id: string; full_name: string }

export default function MakeupClient({ cancelledLessons, teachers, students }: {
  cancelledLessons: Lesson[]
  teachers: Profile[]
  students: Profile[]
}) {
  const [scheduled, setScheduled] = useState<string[]>([])
  const [selected, setSelected] = useState<Lesson | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newHour, setNewHour] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'urgent' | 'scheduled'>('all')

  function getName(list: Profile[], id: string) {
    return list.find(x => x.id === id)?.full_name ?? '—'
  }

  const filtered = cancelledLessons.filter(l => {
    if (scheduled.includes(l.id) && filter !== 'scheduled') return false
    if (filter === 'urgent') return daysDiff(l.scheduled_at) > 7
    if (filter === 'scheduled') return scheduled.includes(l.id)
    return !scheduled.includes(l.id)
  })

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !newDate) return
    setLoading(true)
    setError('')

    const scheduledAt = new Date(`${newDate}T${newHour}:00`).toISOString()

    const res = await fetch('/api/scheduling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: selected.teacher_id,
        student_id: selected.student_id,
        subject: selected.subject,
        scheduled_at: scheduledAt,
        duration_min: selected.duration_min,
        is_makeup: true,
        makeup_for: selected.id,
      })
    })

    const d = await res.json()
    if (d.ok) {
      setScheduled(prev => [...prev, selected.id])
      setSelected(null)
      setNewDate('')
    } else {
      setError(d.error ?? 'Hata oluştu.')
    }
    setLoading(false)
  }

  async function getAiSuggestion(lesson: Lesson) {
    setLoadingAi(lesson.id)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'makeup_suggest',
          lesson: {
            subject: lesson.subject,
            teacher: getName(teachers, lesson.teacher_id),
            student: getName(students, lesson.student_id),
            missed_at: lesson.scheduled_at,
          }
        })
      })
      const d = await res.json()
      setAiSuggestion(prev => ({ ...prev, [lesson.id]: d.result ?? 'Öneri alınamadı.' }))
    } catch {
      setAiSuggestion(prev => ({ ...prev, [lesson.id]: 'Bağlanılamadı.' }))
    }
    setLoadingAi(null)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '7px',
    border: '1px solid #D5DFF0', fontSize: '12.5px',
    color: '#1B3A6B', outline: 'none', background: '#fff',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Telafi Dersleri</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>İptal edilen dersleri yeniden planla</p>
        </div>
      </div>

      {/* Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam İptal', value: cancelledLessons.length, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Bekleyen', value: cancelledLessons.filter(l => !scheduled.includes(l.id)).length, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Acil (7+ gün)', value: cancelledLessons.filter(l => !scheduled.includes(l.id) && daysDiff(l.scheduled_at) > 7).length, color: '#991B1B', bg: '#FEF2F2' },
          { label: 'Planlandı', value: scheduled.length, color: '#2E7D52', bg: '#EAF4EE' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {([['all','Bekleyenler'],['urgent','Acil'],['scheduled','Planlandı']] as const).map(([f,l]) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            border: '1px solid', cursor: 'pointer',
            background: filter === f ? '#1B3A6B' : '#fff',
            color: filter === f ? '#fff' : '#4A6080',
            borderColor: filter === f ? '#1B3A6B' : '#D5DFF0',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '16px' }}>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D52' }}>Bekleyen telafi dersi yok!</div>
            </div>
          ) : filtered.map(lesson => {
            const days = daysDiff(lesson.scheduled_at)
            const isUrgent = days > 7
            const isScheduled = scheduled.includes(lesson.id)

            return (
              <div key={lesson.id} style={{ background: '#fff', border: '1px solid', borderColor: isScheduled ? '#A7D9B8' : isUrgent ? '#FECACA' : '#D5DFF0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>
                      {lesson.subject} — {getName(students, lesson.student_id)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4A6080' }}>
                      Öğretmen: {getName(teachers, lesson.teacher_id)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8', marginTop: '3px' }}>
                      Kaçırılan: {formatDate(lesson.scheduled_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {isScheduled ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52', border: '1px solid #A7D9B8' }}>Planlandı ✓</span>
                    ) : isUrgent ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>Acil — {days} gün</span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#FDF4E7', color: '#B45309', border: '1px solid #FED7AA' }}>Bekliyor — {days} gün</span>
                    )}
                  </div>
                </div>

                {aiSuggestion[lesson.id] && (
                  <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px', fontSize: '12px', color: '#3B0764', lineHeight: 1.6 }}>
                    <strong>AI:</strong> {aiSuggestion[lesson.id]}
                  </div>
                )}

                {!isScheduled && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setSelected(lesson); setError('') }}
                      style={{ padding: '7px 14px', borderRadius: '7px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      Telafi Planla
                    </button>
                    <button
                      onClick={() => getAiSuggestion(lesson)}
                      disabled={loadingAi === lesson.id}
                      style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid #C4B5FD', background: '#F0ECFB', color: '#6B4FC8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {loadingAi === lesson.id ? 'Düşünüyor...' : 'AI Öneri'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Planlama Paneli */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', alignSelf: 'flex-start', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Telafi Planla</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#7A8FA8' }}>✕</button>
            </div>

            <div style={{ background: '#F5F8FF', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#4A6080', lineHeight: 1.6 }}>
              <strong style={{ color: '#1B3A6B' }}>{selected.subject}</strong><br />
              {getName(students, selected.student_id)} → {getName(teachers, selected.teacher_id)}<br />
              Kaçırılan: {formatDate(selected.scheduled_at)}
            </div>

            <form onSubmit={handleSchedule}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Yeni Tarih</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required style={inp} min={new Date().toISOString().slice(0,10)} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Saat</label>
                <select value={newHour} onChange={e => setNewHour(e.target.value)} style={inp}>
                  {HOURS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: '#B91C1C', marginBottom: '12px' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {loading ? 'Planlanıyor...' : 'Telafi Dersini Kaydet'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
