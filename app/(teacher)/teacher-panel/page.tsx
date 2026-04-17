'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TeacherPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [bookChapters, setBookChapters] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedAssignStudent, setSelectedAssignStudent] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [assignDeadline, setAssignDeadline] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    student_id: '', subject_id: '', topic_id: '',
    attempt_date: new Date().toISOString().slice(0, 10),
    correct_count: 0, wrong_count: 0, blank_count: 0,
    difficulty_level: 'medium', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => { if (form.subject_id) loadTopics(form.subject_id); else setTopics([]) }, [form.subject_id])
  useEffect(() => { if (selectedBook) loadBookChapters(selectedBook); else setBookChapters([]) }, [selectedBook])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    const { data: l } = await supabase.from('lessons').select('*, profiles!lessons_student_id_fkey(full_name)').eq('teacher_id', p.id).order('scheduled_at', { ascending: false })
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    const { data: bks } = await supabase.from('books').select('id, name, subject, color').order('name')
    const { data: s } = await supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level', { ascending: true })
    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name
    const studentsData = (s ?? []).map(st => ({ ...st, classroom_name: st.classroom_id ? (classroomMap[st.classroom_id] ?? null) : null }))
    const studentIds = studentsData.map((x: any) => x.id)
    let hw: any[] = []
    if (studentIds.length > 0) {
      const { data: hwData } = await supabase.from('homework_assignments').select('*, profiles!homework_assignments_student_id_fkey(full_name), tests(name, chapters(name, books(name)))').in('student_id', studentIds).order('created_at', { ascending: false })
      hw = hwData ?? []
    }
    setLessons(l ?? [])
    setStudents(studentsData)
    setSubjects(sub ?? [])
    setBooks(bks ?? [])
    setHomework(hw)
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setTopics(data ?? [])
    setForm(p => ({ ...p, topic_id: '' }))
  }

  async function loadBookChapters(bookId: string) {
    const { data } = await supabase.from('books').select('*, chapters(*, tests(*))').eq('id', bookId).single()
    setBookChapters(data?.chapters ?? [])
    setSelectedTests([])
  }

  function toggleAssignTest(testId: string) {
    setSelectedTests(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId])
  }

  function toggleAssignChapter(chapter: any) {
    const testIds = chapter.tests?.map((t: any) => t.id) ?? []
    const allSelected = testIds.every((id: string) => selectedTests.includes(id))
    if (allSelected) setSelectedTests(prev => prev.filter(id => !testIds.includes(id)))
    else setSelectedTests(prev => [...new Set([...prev, ...testIds])])
  }

  async function handleAssign() {
    if (!selectedAssignStudent || selectedTests.length === 0) { alert('Öğrenci ve test seçin!'); return }
    setAssigning(true)
    setAssignSuccess(false)
    const inserts = selectedTests.map(testId => ({ student_id: selectedAssignStudent, test_id: testId, deadline: assignDeadline || null, status: 'pending', tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f' }))
    const { error } = await supabase.from('homework_assignments').insert(inserts)
    if (error) { alert('Hata: ' + error.message); setAssigning(false); return }
    setAssignSuccess(true)
    setSelectedTests([])
    setSelectedAssignStudent('')
    setAssignDeadline('')
    await load()
    setAssigning(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id || !form.subject_id) { alert('Öğrenci ve ders seçin!'); return }
    setSaving(true)
    setSuccess(false)
    const total = form.correct_count + form.wrong_count + form.blank_count
    await supabase.from('student_question_attempts').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: form.student_id, teacher_id: profile.id,
      subject_id: form.subject_id, topic_id: form.topic_id || null,
      attempt_date: form.attempt_date, total_questions: total,
      correct_count: form.correct_count, wrong_count: form.wrong_count,
      blank_count: form.blank_count, difficulty_level: form.difficulty_level,
      source_type: 'manual', notes: form.notes || null,
    })
    const query = supabase.from('student_question_attempts').select('total_questions, correct_count, wrong_count, blank_count, attempt_date').eq('student_id', form.student_id).eq('subject_id', form.subject_id)
    const { data: attempts } = form.topic_id ? await query.eq('topic_id', form.topic_id) : await query
    if (attempts && attempts.length > 0) {
      const tQ = attempts.reduce((s, a) => s + a.total_questions, 0)
      const tC = attempts.reduce((s, a) => s + a.correct_count, 0)
      const tW = attempts.reduce((s, a) => s + a.wrong_count, 0)
      const tB = attempts.reduce((s, a) => s + a.blank_count, 0)
      const acc = tQ > 0 ? Math.round(tC / tQ * 100 * 100) / 100 : 0
      await supabase.from('student_topic_performance').upsert({
        tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
        student_id: form.student_id, subject_id: form.subject_id,
        topic_id: form.topic_id || null, total_questions: tQ,
        correct_count: tC, wrong_count: tW, blank_count: tB,
        accuracy_rate: acc, mastery_score: Math.round((acc * 0.70 + Math.min(attempts.length, 10) * 3.0) * 100) / 100,
        last_attempt_date: attempts[0].attempt_date, attempt_count: attempts.length,
        trend_direction: 'stable', updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,subject_id,topic_id' })
    }
    setSuccess(true)
    setForm(p => ({ ...p, correct_count: 0, wrong_count: 0, blank_count: 0, notes: '', topic_id: '' }))
    await load()
    setSaving(false)
  }

  async function resetHomework(id: string) {
    if (!confirm('Bu ödevi sıfırlamak istediğinizden emin misiniz?')) return
    await supabase.from('student_answers').delete().eq('assignment_id', id)
    await supabase.from('homework_assignments').update({ status: 'pending' }).eq('id', id)
    await load()
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color: '#2E7D52', bg: '#EAF4EE' }
    if (grade <= 8) return { color: '#1B3A6B', bg: '#EEF3FB' }
    return { color: '#6B4FC8', bg: '#F0ECFB' }
  }

  const today = new Date()
  const upcomingLessons = lessons.filter(l => new Date(l.scheduled_at) >= today && l.status === 'scheduled').slice(0, 5)
  const total = form.correct_count + form.wrong_count + form.blank_count
  const accuracy = total > 0 ? Math.round(form.correct_count / total * 100) : 0

  const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  const TABS = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'questions', label: 'Soru Girişi', icon: '✏️' },
    { id: 'assign', label: 'Ödev Ata', icon: '📋' },
    { id: 'homework', label: 'Ödev Takibi', icon: '📚' },
    { id: 'students', label: 'Öğrenciler', icon: '👨‍🎓' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F0F4F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👨‍🏫</div>
        <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Mobil Header */}
      <div style={{ background: '#2E7D52', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👨‍🏫</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Öğretmen — {profile?.full_name?.split(' ')[0]}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}>{students.length} öğrenci</span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}>{homework.filter(h => h.status !== 'completed').length} bekliyor</span>
          </div>
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Çıkış
          </button>
        </div>
      </div>

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2EAF8', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#2E7D52' : '#9CA3AF' }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2E7D52' }} />}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div style={{ padding: '16px 16px 80px' }}>

        {/* ANA SAYFA */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #2E7D52 0%, #10B981 100%)', borderRadius: '16px', padding: '18px', marginBottom: '14px', color: '#fff' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>Merhaba, {profile?.full_name?.split(' ')[0]}! 👋</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Toplam Öğrenci', value: students.length, icon: '👨‍🎓', color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Yaklaşan Ders', value: upcomingLessons.length, icon: '📅', color: '#2E7D52', bg: '#EAF4EE' },
                { label: 'Bekleyen Ödev', value: homework.filter(h => h.status !== 'completed').length, icon: '⏳', color: '#B45309', bg: '#FDF4E7' },
                { label: 'Tamamlanan Ödev', value: homework.filter(h => h.status === 'completed').length, icon: '✅', color: '#6B4FC8', bg: '#F0ECFB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {upcomingLessons.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>📅 Yaklaşan Dersler</div>
                {upcomingLessons.map((l, i) => (
                  <div key={l.id} style={{ padding: '12px 16px', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#EAF4EE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#2E7D52' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric' })}</div>
                      <div style={{ fontSize: '9px', color: '#2E7D52' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{l.subject}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{l.profiles?.full_name}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}

            {homework.slice(0, 5).length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>📚 Son Ödevler</div>
                {homework.slice(0, 5).map((h, i) => (
                  <div key={h.id} style={{ padding: '11px 16px', borderBottom: i < 4 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.status === 'completed' ? '#2E7D52' : '#B45309', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{h.profiles?.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.tests?.name}</div>
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', background: h.status === 'completed' ? '#EAF4EE' : '#FDF4E7', color: h.status === 'completed' ? '#2E7D52' : '#B45309' }}>
                      {h.status === 'completed' ? 'Tamam' : 'Bekliyor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SORU GİRİŞİ */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>✏️ Soru Çözüm Girişi</div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={lbl}>Öğrenci *</label>
                  <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={inp} required>
                    <option value="">Öğrenci seçin...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}{s.grade_level ? ' — ' + s.grade_level + '. Sınıf' : ''}{s.classroom_name ? ' (' + s.classroom_name + ')' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
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

                <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1px solid #E2EAF8' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>Soru Sonuçları</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
                    {[
                      { label: 'Doğru', key: 'correct_count', color: '#2E7D52', bg: '#EAF4EE' },
                      { label: 'Yanlış', key: 'wrong_count', color: '#C0392B', bg: '#FEF2F2' },
                      { label: 'Boş', key: 'blank_count', color: '#7A8FA8', bg: '#F0F4F9' },
                    ].map(f => (
                      <div key={f.key} style={{ background: f.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: f.color, fontWeight: 600, marginBottom: '6px' }}>{f.label}</div>
                        <input type="number" min={0} value={form[f.key as keyof typeof form] as number} onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '22px', fontWeight: 800, color: f.color, textAlign: 'center', background: 'rgba(255,255,255,0.8)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7A8FA8' }}>Toplam: <strong>{total}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ height: '6px', width: '80px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: accuracy + '%', background: accuracy >= 70 ? '#2E7D52' : accuracy >= 50 ? '#B45309' : '#C0392B', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: accuracy >= 70 ? '#2E7D52' : accuracy >= 50 ? '#B45309' : '#C0392B' }}>%{accuracy}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
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

                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Not</label>
                  <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Gözlem veya not..." style={inp} />
                </div>

                {success && <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>✓ Kayıt eklendi!</div>}
                <button type="submit" disabled={saving || total === 0} style={{ width: '100%', padding: '13px', borderRadius: '10px', background: '#2E7D52', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet ve Skoru Güncelle'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ÖDEV ATA */}
        {activeTab === 'assign' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📋 Ödev Ata</div>

            {/* Öğrenci ve Tarih */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={lbl}>Öğrenci *</label>
                  <select value={selectedAssignStudent} onChange={e => setSelectedAssignStudent(e.target.value)} style={inp}>
                    <option value="">Öğrenci seçin...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}{s.grade_level ? ' — ' + s.grade_level + '. Sınıf' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Son Teslim</label>
                  <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Kitap Seç</label>
                <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} style={inp}>
                  <option value="">Kitap seçin...</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name} — {b.subject}</option>)}
                </select>
              </div>
              {selectedTests.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#EEF3FB', borderRadius: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{selectedTests.length} test seçildi</span>
                  {assignSuccess && <span style={{ fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>✓ Atandı!</span>}
                </div>
              )}
              <button onClick={handleAssign} disabled={assigning || selectedTests.length === 0 || !selectedAssignStudent} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: selectedTests.length > 0 && selectedAssignStudent ? '#2E7D52' : '#D5DFF0', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {assigning ? 'Atanıyor...' : 'Ödev Ata'}
              </button>
            </div>

            {/* Test Listesi */}
            {bookChapters.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bookChapters.map(chapter => {
                  const testIds = chapter.tests?.map((t: any) => t.id) ?? []
                  const allSelected = testIds.length > 0 && testIds.every((id: string) => selectedTests.includes(id))
                  return (
                    <div key={chapter.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div onClick={() => toggleAssignChapter(chapter)} style={{ padding: '12px 14px', background: '#F5F8FF', borderBottom: '1px solid #E2EAF8', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid', borderColor: allSelected ? '#2E7D52' : '#D5DFF0', background: allSelected ? '#2E7D52' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {allSelected && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', flex: 1 }}>{chapter.name}</span>
                        <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{chapter.tests?.length ?? 0} test</span>
                      </div>
                      {(chapter.tests ?? []).map((test: any, i: number) => {
                        const isSelected = selectedTests.includes(test.id)
                        return (
                          <div key={test.id} onClick={() => toggleAssignTest(test.id)} style={{ padding: '11px 14px', borderBottom: i < chapter.tests.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: isSelected ? '#F0FFF8' : '#fff' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid', borderColor: isSelected ? '#2E7D52' : '#D5DFF0', background: isSelected ? '#2E7D52' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{test.name}</div>
                              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{test.question_count} soru</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ÖDEV TAKİBİ */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>📚 Ödev Takibi</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>{homework.filter(h => h.status !== 'completed').length} bekliyor</span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>{homework.filter(h => h.status === 'completed').length} tamam</span>
              </div>
            </div>
            {homework.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev atanmamış</div>
            ) : homework.map((h, i) => {
              const isDone = h.status === 'completed'
              const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
              const student = students.find(s => s.id === h.student_id)
              const lv = student?.grade_level ? getLevelStyle(student.grade_level) : null
              return (
                <div key={h.id} style={{ padding: '13px 14px', marginBottom: '8px', borderRadius: '14px', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#E2EAF8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                    {isDone ? '✓' : '—'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{h.tests?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.profiles?.full_name}</span>
                      {lv && student?.grade_level && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', background: lv.bg, color: lv.color }}>{student.grade_level}. Sınıf</span>
                      )}
                      {student?.classroom_name && (
                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>{student.classroom_name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309' }}>
                      {isDone ? 'Tamam' : isLate ? 'Gecikti' : 'Bekliyor'}
                    </span>
                    {isDone && (
                      <button onClick={() => resetHomework(h.id)} style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EEF3FB', color: '#1B3A6B', fontSize: '10px', cursor: 'pointer' }}>
                        Sıfırla
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ÖĞRENCİLER */}
        {activeTab === 'students' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>👨‍🎓 Öğrencilerim ({students.length})</div>
            {students.length === 0 ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#B45309' }}>Henüz öğrenci yok</div>
            ) : students.map(s => {
              const sHw = homework.filter(h => h.student_id === s.id)
              const sLessons = lessons.filter(l => l.student_id === s.id)
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              return (
                <div key={s.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: lv ? lv.bg : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: lv ? lv.color : '#1B3A6B', flexShrink: 0 }}>
                      {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '3px' }}>{s.full_name}</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {lv && s.grade_level && (
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px', background: lv.bg, color: lv.color }}>{s.grade_level}. Sınıf</span>
                        )}
                        {s.classroom_name && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>{s.classroom_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                    {[
                      { label: 'Ders', value: sLessons.length, color: '#1B3A6B' },
                      { label: 'Ödev', value: sHw.length, color: '#B45309' },
                      { label: 'Tamam', value: sHw.filter(h => h.status === 'completed').length, color: '#2E7D52' },
                    ].map(m => (
                      <div key={m.label} style={{ background: '#F5F8FF', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}