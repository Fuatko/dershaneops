'use client'

import { useState } from 'react'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} — ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
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

interface Conflict {
  id: string
  type: 'teacher' | 'student'
  severity: string
  lesson_a: Lesson
  lesson_b: Lesson
  person: string
  description: string
}

interface Profile { id: string; full_name: string }

export default function ConflictsClient({ conflicts, lessons, teachers, students }: {
  conflicts: Conflict[]
  lessons: Lesson[]
  teachers: Profile[]
  students: Profile[]
}) {
  const [resolved, setResolved] = useState<string[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'teacher' | 'student'>('all')

  const active = conflicts.filter(c =>
    !resolved.includes(c.id) &&
    (filter === 'all' || c.type === filter)
  )

  function getTeacherName(id: string) {
    return teachers.find(t => t.id === id)?.full_name ?? '—'
  }

  function getStudentName(id: string) {
    return students.find(s => s.id === id)?.full_name ?? '—'
  }

  async function getAiSuggestion(conflict: Conflict) {
    setLoadingAi(conflict.id)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conflict_resolve',
          conflict: {
            type: conflict.type,
            person: conflict.person,
            lesson_a: { subject: conflict.lesson_a.subject, time: conflict.lesson_a.scheduled_at },
            lesson_b: { subject: conflict.lesson_b.subject, time: conflict.lesson_b.scheduled_at },
          }
        })
      })
      const d = await res.json()
      setAiSuggestion(prev => ({ ...prev, [conflict.id]: d.result ?? 'Öneri alınamadı.' }))
    } catch {
      setAiSuggestion(prev => ({ ...prev, [conflict.id]: 'Bağlanılamadı.' }))
    }
    setLoadingAi(null)
  }

  async function resolveConflict(conflictId: string, lessonId: string) {
    await fetch('/api/scheduling', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId })
    })
    setResolved(prev => [...prev, conflictId])
  }

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Çakışma Merkezi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Otomatik tespit edilen çakışmalar ve AI çözüm önerileri</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Çakışma', value: conflicts.length, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Öğretmen', value: conflicts.filter(c => c.type === 'teacher').length, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Öğrenci', value: conflicts.filter(c => c.type === 'student').length, color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Çözüldü', value: resolved.length, color: '#2E7D52', bg: '#EAF4EE' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['all', 'teacher', 'student'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            border: '1px solid', cursor: 'pointer',
            background: filter === f ? '#1B3A6B' : '#fff',
            color: filter === f ? '#fff' : '#4A6080',
            borderColor: filter === f ? '#1B3A6B' : '#D5DFF0',
          }}>
            {f === 'all' ? 'Tümü' : f === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
          </button>
        ))}
      </div>

      {active.length === 0 ? (
        <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D52', marginBottom: '4px' }}>Hiç çakışma yok!</div>
          <div style={{ fontSize: '12px', color: '#3B7A57' }}>Tüm dersler uyumlu şekilde planlanmış.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {active.map(conflict => (
            <div key={conflict.id} style={{ background: '#fff', border: '1px solid', borderColor: conflict.type === 'teacher' ? '#FECACA' : '#FED7AA', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: conflict.type === 'teacher' ? '#FEF2F2' : '#FDF4E7', borderBottom: '1px solid', borderColor: conflict.type === 'teacher' ? '#FECACA' : '#FED7AA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: conflict.type === 'teacher' ? '#C0392B' : '#B45309', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{conflict.description}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '2px' }}>
                    {conflict.type === 'teacher' ? 'Öğretmen Çakışması' : 'Öğrenci Çakışması'} — Yüksek Öncelik
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>Çözüm Gerekli</span>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {[conflict.lesson_a, conflict.lesson_b].map((lesson, i) => (
                    <div key={i} style={{ background: '#F5F8FF', borderRadius: '8px', padding: '12px', border: '1px solid #D5DFF0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>Ders {i + 1}</div>
                      <div style={{ fontSize: '12px', color: '#374151', marginBottom: '3px' }}>{lesson.subject}</div>
                      <div style={{ fontSize: '11.5px', color: '#4A6080', marginBottom: '3px' }}>{getTeacherName(lesson.teacher_id)}</div>
                      <div style={{ fontSize: '11.5px', color: '#4A6080', marginBottom: '6px' }}>{getStudentName(lesson.student_id)}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{formatDate(lesson.scheduled_at)}</div>
                    </div>
                  ))}
                </div>

                {aiSuggestion[conflict.id] && (
                  <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '12.5px', color: '#3B0764', lineHeight: 1.6 }}>
                    <strong>AI Önerisi:</strong> {aiSuggestion[conflict.id]}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => getAiSuggestion(conflict)} disabled={loadingAi === conflict.id} style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid #C4B5FD', background: '#F0ECFB', color: '#6B4FC8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {loadingAi === conflict.id ? 'Düşünüyor...' : 'AI Öneri Al'}
                  </button>
                  <button onClick={() => resolveConflict(conflict.id, conflict.lesson_b.id)} style={{ padding: '7px 12px', borderRadius: '7px', border: 'none', background: '#C0392B', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Ders 2'yi İptal Et
                  </button>
                  <a href="/scheduler" style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid #D5DFF0', background: '#fff', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Takvimde Düzenle
                  </a>
                  <button onClick={() => setResolved(prev => [...prev, conflict.id])} style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid #A7D9B8', background: '#EAF4EE', color: '#2E7D52', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Çözüldü
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
