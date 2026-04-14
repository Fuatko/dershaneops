'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuestionsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    topic_id: '',
    attempt_date: new Date().toISOString().slice(0, 10),
    total_questions: 20,
    correct_count: 0,
    wrong_count: 0,
    blank_count: 0,
    difficulty_level: 'medium',
    source_type: 'manual',
    notes: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  useEffect(() => {
    const total = form.correct_count + form.wrong_count + form.blank_count
    if (total !== form.total_questions) {
      setForm(p => ({ ...p, total_questions: total }))
    }
  }, [form.correct_count, form.wrong_count, form.blank_count])

  useEffect(() => {
    if (form.subject_id) loadTopics(form.subject_id)
    else setTopics([])
  }, [form.subject_id])

  async function load() {
    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    const { data: recent } = await supabase
      .from('student_question_attempts')
      .select('*, profiles!student_question_attempts_student_id_fkey(full_name), topics(name), subjects(name)')
      .order('created_at', { ascending: false })
      .limit(10)
    setStudents(s ?? [])
    setSubjects(sub ?? [])
    setRecentAttempts(recent ?? [])
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_no')
    setTopics(data ?? [])
    setForm(p => ({ ...p, topic_id: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id || !form.subject_id) { alert('Öğrenci ve ders seçin!'); return }
    setSaving(true)
    setSuccess(false)

    const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()

    const { error } = await supabase.from('student_question_attempts').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: form.student_id,
      teacher_id: profile?.id,
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      attempt_date: form.attempt_date,
      total_questions: form.total_questions,
      correct_count: form.correct_count,
      wrong_count: form.wrong_count,
      blank_count: form.blank_count,
      difficulty_level: form.difficulty_level,
      source_type: form.source_type,
      notes: form.notes || null,
    })

    if (!error) {
      // Hakimiyet skorunu güncelle
      await updateTopicPerformance(form.student_id, form.subject_id, form.topic_id)
      setSuccess(true)
      setForm(p => ({ ...p, correct_count: 0, wrong_count: 0, blank_count: 0, notes: '', topic_id: '' }))
      load()
    }
    setSaving(false)
  }

  async function updateTopicPerformance(studentId: string, subjectId: string, topicId: string) {
    const query = supabase
      .from('student_question_attempts')
      .select('total_questions, correct_count, wrong_count, blank_count, attempt_date')
      .eq('student_id', studentId)
      .eq('subject_id', subjectId)
    if (topicId) query.eq('topic_id', topicId)

    const { data: attempts } = await query
    if (!attempts || attempts.length === 0) return

    const totalQ = attempts.reduce((s, a) => s + a.total_questions, 0)
    const totalC = attempts.reduce((s, a) => s + a.correct_count, 0)
    const totalW = attempts.reduce((s, a) => s + a.wrong_count, 0)
    const totalB = attempts.reduce((s, a) => s + a.blank_count, 0)
    const accuracy = totalQ > 0 ? Math.round(totalC / totalQ * 100 * 100) / 100 : 0
    const mastery = Math.round((accuracy * 0.70 + Math.min(attempts.length, 10) * 3.0) * 100) / 100
    const lastDate = attempts.sort((a, b) => new Date(b.attempt_date).getTime() - new Date(a.attempt_date).getTime())[0].attempt_date

    const existing = await supabase
      .from('student_topic_performance')
      .select('id, accuracy_rate')
      .eq('student_id', studentId)
      .eq('subject_id', subjectId)
      .eq('topic_id', topicId || null)
      .single()

    const trend = existing.data
      ? accuracy > existing.data.accuracy_rate ? 'up' : accuracy < existing.data.accuracy_rate ? 'down' : 'stable'
      : 'stable'

    await supabase.from('student_topic_performance').upsert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: studentId,
      subject_id: subjectId,
      topic_id: topicId || null,
      total_questions: totalQ,
      correct_count: totalC,
      wrong_count: totalW,
      blank_count: totalB,
      accuracy_rate: accuracy,
      mastery_score: mastery,
      last_attempt_date: lastDate,
      attempt_count: attempts.length,
      trend_direction: trend,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,subject_id,topic_id' })
  }

  async function deleteAttempt(id: string) {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return
    await supabase.from('student_question_attempts').delete().eq('id', id)
    load()
  }

  const accuracy = form.total_questions > 0 ? Math.round(form.correct_count / form.total_questions * 100) : 0

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '7px',
    border: '1px solid #D5DFF0', fontSize: '12.5px',
    color: '#1B3A6B', outline: 'none', background: '#fff',
    boxSizing: 'border-box'
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Soru Çözüm Girişi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Öğrenci konu bazlı soru sonuçlarını girin</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '18px' }}>Yeni Kayıt</div>
          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Öğrenci *</label>
              <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={inp} required>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Ders *</label>
                <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} style={inp} required>
                  <option value="">Ders seçin...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Konu</label>
                <select value={form.topic_id} onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))} style={inp} disabled={topics.length === 0}>
                  <option value="">Konu seçin...</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Tarih</label>
                <input type="date" value={form.attempt_date} onChange={e => setForm(p => ({ ...p, attempt_date: e.target.value }))} style={inp} />
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

            {/* D/Y/B Giriş */}
            <div style={{ background: '#F8FAFF', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #E2EAF8' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Soru Sonuçları</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '10px' }}>
                {[
                  { label: 'Doğru', key: 'correct_count', color: '#2E7D52', bg: '#EAF4EE' },
                  { label: 'Yanlış', key: 'wrong_count', color: '#C0392B', bg: '#FEF2F2' },
                  { label: 'Boş', key: 'blank_count', color: '#7A8FA8', bg: '#F0F4F9' },
                ].map(f => (
                  <div key={f.key} style={{ background: f.bg, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: f.color, fontWeight: 600, marginBottom: '6px' }}>{f.label}</div>
                    <input
                      type="number"
                      min={0}
                      value={form[f.key as keyof typeof form] as number}
                      onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '18px', fontWeight: 700, color: f.color, textAlign: 'center', background: 'rgba(255,255,255,0.8)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#7A8FA8' }}>Toplam: <strong>{form.total_questions} soru</strong></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ height: '6px', width: '80px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: accuracy + '%', background: accuracy >= 70 ? '#2E7D52' : accuracy >= 50 ? '#B45309' : '#C0392B', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: accuracy >= 70 ? '#2E7D52' : accuracy >= 50 ? '#B45309' : '#C0392B' }}>%{accuracy}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Not (opsiyonel)</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ders notu veya gözlem..." style={inp} />
            </div>

            {success && (
              <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>
                ✓ Kayıt başarıyla eklendi! Hakimiyet skoru güncellendi.
              </div>
            )}

            <button type="submit" disabled={saving || form.total_questions === 0} style={{ width: '100%', padding: '11px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Kaydı Ekle ve Skoru Güncelle'}
            </button>
          </form>
        </div>

        {/* Son Kayıtlar */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Son Girişler ({recentAttempts.length})
          </div>
          {recentAttempts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Henüz kayıt yok</div>
          ) : recentAttempts.map((a, i) => {
            const rate = a.total_questions > 0 ? Math.round(a.correct_count / a.total_questions * 100) : 0
            return (
              <div key={a.id} style={{ padding: '12px 18px', borderBottom: i < recentAttempts.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: rate >= 70 ? '#EAF4EE' : rate >= 50 ? '#FDF4E7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: rate >= 70 ? '#2E7D52' : rate >= 50 ? '#B45309' : '#C0392B', flexShrink: 0 }}>
                  %{rate}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>
                    {a.profiles?.full_name} — {a.subjects?.name}
                    {a.topics?.name && <span style={{ color: '#7A8FA8', fontWeight: 400 }}> / {a.topics.name}</span>}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                    D:{a.correct_count} Y:{a.wrong_count} B:{a.blank_count} • {new Date(a.attempt_date).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <button onClick={() => deleteAttempt(a.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Sil
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}