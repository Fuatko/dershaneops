'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DailyTasksPage() {
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    topic_id: '',
    task_date: new Date().toISOString().slice(0, 10),
    description: '',
    question_count: 20,
    target_duration_minutes: 30,
    difficulty_level: 'medium',
    task_type: 'question',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (form.subject_id) loadTopics(form.subject_id)
    else setTopics([])
  }, [form.subject_id])

  async function load() {
    const [{ data: s }, { data: sub }, { data: t }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('daily_tasks')
        .select('*, profiles!daily_tasks_student_id_fkey(full_name), subjects(name), topics(name)')
        .order('task_date', { ascending: false })
        .limit(30),
    ])
    setStudents(s ?? [])
    setSubjects(sub ?? [])
    setAllTasks(t ?? [])
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setTopics(data ?? [])
    setForm(p => ({ ...p, topic_id: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id || !form.subject_id) { alert('Öğrenci ve ders seçin!'); return }
    setSaving(true)
    setSuccess(false)
    const { error } = await supabase.from('daily_tasks').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: form.student_id,
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      task_date: form.task_date,
      task_type: form.task_type,
      description: form.description || null,
      question_count: form.question_count,
      target_duration_minutes: form.target_duration_minutes,
      difficulty_level: form.difficulty_level,
      status: 'pending',
    })
    if (!error) {
      setSuccess(true)
      setForm(p => ({ ...p, topic_id: '', description: '' }))
      await load()
    }
    setSaving(false)
  }

  async function deleteTask(id: string) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return
    await supabase.from('daily_tasks').delete().eq('id', id)
    await load()
  }

  async function assignToAll() {
    if (!form.subject_id) { alert('Ders seçin!'); return }
    if (!confirm(students.length + ' öğrenciye aynı görevi atamak istediğinizden emin misiniz?')) return
    setSaving(true)
    const inserts = students.map(s => ({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: s.id,
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      task_date: form.task_date,
      task_type: form.task_type,
      description: form.description || null,
      question_count: form.question_count,
      target_duration_minutes: form.target_duration_minutes,
      difficulty_level: form.difficulty_level,
      status: 'pending',
    }))
    await supabase.from('daily_tasks').insert(inserts)
    setSuccess(true)
    await load()
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = allTasks.filter(t => t.task_date === today)
  const completedToday = todayTasks.filter(t => t.status === 'completed').length

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Günlük Görev Yönetimi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Öğrencilere günlük görev ata ve takip et</p>
      </div>

      {/* Bugün özeti */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Bugün Atanan', value: todayTasks.length, color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Tamamlanan', value: completedToday, color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Bekleyen', value: todayTasks.filter(t => t.status === 'pending').length, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Tamamlanma', value: todayTasks.length > 0 ? '%' + Math.round(completedToday / todayTasks.length * 100) : '%0', color: '#6B4FC8', bg: '#F0ECFB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>

        {/* Görev Atama Formu */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Yeni Görev Ata</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Öğrenci *</label>
              <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={inp}>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Ders *</label>
                <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} style={inp}>
                  <option value="">Ders seçin...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Konu</label>
                <select value={form.topic_id} onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))} style={inp} disabled={topics.length === 0}>
                  <option value="">Seçin...</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Tarih</label>
                <input type="date" value={form.task_date} onChange={e => setForm(p => ({ ...p, task_date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Tür</label>
                <select value={form.task_type} onChange={e => setForm(p => ({ ...p, task_type: e.target.value }))} style={inp}>
                  <option value="question">Soru Çözümü</option>
                  <option value="review">Tekrar</option>
                  <option value="exam">Sınav Hazırlık</option>
                  <option value="reading">Konu Okuma</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Soru</label>
                <input type="number" value={form.question_count} onChange={e => setForm(p => ({ ...p, question_count: parseInt(e.target.value) || 20 }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Süre (dk)</label>
                <input type="number" value={form.target_duration_minutes} onChange={e => setForm(p => ({ ...p, target_duration_minutes: parseInt(e.target.value) || 30 }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Zorluk</label>
                <select value={form.difficulty_level} onChange={e => setForm(p => ({ ...p, difficulty_level: e.target.value }))} style={inp}>
                  <option value="easy">Kolay</option>
                  <option value="medium">Orta</option>
                  <option value="hard">Zor</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Açıklama (opsiyonel)</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Öğrenciye gösterilecek açıklama..." style={inp} />
            </div>

            {success && (
              <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>
                Görev başarıyla atandı!
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {saving ? '...' : 'Görev Ata'}
              </button>
              <button type="button" onClick={assignToAll} disabled={saving} style={{ padding: '10px 14px', borderRadius: '8px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, border: '1px solid #BFDBFE', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Herkese Ata
              </button>
            </div>
          </form>
        </div>

        {/* Görev Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Son Görevler ({allTasks.length})
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {allTasks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz görev yok</div>
            ) : allTasks.map((t, i) => {
              const isDone = t.status === 'completed'
              const isToday = t.task_date === today
              return (
                <div key={t.id} style={{ padding: '12px 18px', borderBottom: i < allTasks.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? '#2E7D52' : isToday ? '#B45309' : '#D5DFF0', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>
                      {t.profiles?.full_name} — {t.subjects?.name}
                      {t.topics?.name && <span style={{ color: '#7A8FA8', fontWeight: 400 }}> / {t.topics.name}</span>}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                      {t.task_date} • {t.question_count} soru • {t.target_duration_minutes}dk
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: isDone ? '#EAF4EE' : isToday ? '#FDF4E7' : '#F0F4F9', color: isDone ? '#2E7D52' : isToday ? '#B45309' : '#7A8FA8', flexShrink: 0 }}>
                    {isDone ? 'Tamam' : isToday ? 'Bugün' : 'Bekliyor'}
                  </span>
                  <button onClick={() => deleteTask(t.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                    Sil
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}