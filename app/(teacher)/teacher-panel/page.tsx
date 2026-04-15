'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function TeacherPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    const [books, setBooks] = useState<any[]>([])
    const [bookChapters, setBookChapters] = useState<any[]>([])
    const [selectedBook, setSelectedBook] = useState('')
    const [selectedAssignStudent, setSelectedAssignStudent] = useState('')
    const [selectedTests, setSelectedTests] = useState<string[]>([])
    const [assignDeadline, setAssignDeadline] = useState('')
    const [assigning, setAssigning] = useState(false)
    const [assignSuccess, setAssignSuccess] = useState(false)
    student_id: '', subject_id: '', topic_id: '',
    attempt_date: new Date().toISOString().slice(0, 10),
    correct_count: 0, wrong_count: 0, blank_count: 0,
    difficulty_level: 'medium', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (form.subject_id) loadTopics(form.subject_id)
    else setTopics([])
  }, [form.subject_id])
  useEffect(() => {
    if (selectedBook) loadBookChapters(selectedBook)
    else setBookChapters([])
  }, [selectedBook])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    const { data: l } = await supabase
      .from('lessons')
      .select('*, profiles!lessons_student_id_fkey(full_name)')
      .eq('teacher_id', p.id)
      .order('scheduled_at', { ascending: false })

    const studentIds = [...new Set((l ?? []).map((x: any) => x.student_id))]
    let studentsData: any[] = []
    if (studentIds.length > 0) {
      const { data: s } = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
      studentsData = s ?? []
    }

    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    const { data: ra } = await supabase
      .from('student_question_attempts')
      .select('*, profiles!student_question_attempts_student_id_fkey(full_name), topics(name), subjects(name)')
      .eq('teacher_id', p.id)
      .order('created_at', { ascending: false })
      .limit(15)

    setLessons(l ?? [])
    setStudents(studentsData)
    setSubjects(sub ?? [])
    const { data: bks } = await supabase.from('books').select('id, name, subject, color').order('name')
setBooks(bks ?? [])
    setRecentAttempts(ra ?? [])
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

    const total = form.correct_count + form.wrong_count + form.blank_count

    await supabase.from('student_question_attempts').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: form.student_id,
      teacher_id: profile.id,
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      attempt_date: form.attempt_date,
      total_questions: total,
      correct_count: form.correct_count,
      wrong_count: form.wrong_count,
      blank_count: form.blank_count,
      difficulty_level: form.difficulty_level,
      source_type: 'manual',
      notes: form.notes || null,
    })

    // Hakimiyet skorunu güncelle
    const query = supabase.from('student_question_attempts').select('total_questions, correct_count, wrong_count, blank_count, attempt_date').eq('student_id', form.student_id).eq('subject_id', form.subject_id)
    const { data: attempts } = form.topic_id ? await query.eq('topic_id', form.topic_id) : await query
    if (attempts && attempts.length > 0) {
      const tQ = attempts.reduce((s, a) => s + a.total_questions, 0)
      const tC = attempts.reduce((s, a) => s + a.correct_count, 0)
      const tW = attempts.reduce((s, a) => s + a.wrong_count, 0)
      const tB = attempts.reduce((s, a) => s + a.blank_count, 0)
      const acc = tQ > 0 ? Math.round(tC / tQ * 100 * 100) / 100 : 0
      const mastery = Math.round((acc * 0.70 + Math.min(attempts.length, 10) * 3.0) * 100) / 100
      await supabase.from('student_topic_performance').upsert({
        tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
        student_id: form.student_id,
        subject_id: form.subject_id,
        topic_id: form.topic_id || null,
        total_questions: tQ, correct_count: tC, wrong_count: tW, blank_count: tB,
        accuracy_rate: acc, mastery_score: mastery,
        last_attempt_date: attempts[0].attempt_date,
        attempt_count: attempts.length, trend_direction: 'stable',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,subject_id,topic_id' })
    }

    setSuccess(true)
    setForm(p => ({ ...p, correct_count: 0, wrong_count: 0, blank_count: 0, notes: '', topic_id: '' }))
    await load()
    setSaving(false)
  }

  async function loadBookChapters(bookId: string) {
    const { data } = await supabase
      .from('books')
      .select('*, chapters(*, tests(*))')
      .eq('id', bookId)
      .single()
    setBookChapters(data?.chapters ?? [])
    setSelectedTests([])
  }
  
  function toggleAssignTest(testId: string) {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    )
  }
  
  function toggleAssignChapter(chapter: any) {
    const testIds = chapter.tests?.map((t: any) => t.id) ?? []
    const allSelected = testIds.every((id: string) => selectedTests.includes(id))
    if (allSelected) {
      setSelectedTests(prev => prev.filter(id => !testIds.includes(id)))
    } else {
      setSelectedTests(prev => [...new Set([...prev, ...testIds])])
    }
  }
  
  async function handleAssign() {
    if (!selectedAssignStudent || selectedTests.length === 0) { alert('Öğrenci ve test seçin!'); return }
    setAssigning(true)
    setAssignSuccess(false)
    const inserts = selectedTests.map(testId => ({
      student_id: selectedAssignStudent,
      test_id: testId,
      deadline: assignDeadline || null,
      status: 'pending',
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
    }))
    const { error } = await supabase.from('homework_assignments').insert(inserts)
    if (error) { alert('Hata: ' + error.message); setAssigning(false); return }
    setAssignSuccess(true)
    setSelectedTests([])
    setSelectedAssignStudent('')
    setAssignDeadline('')
    setAssigning(false)
  }
  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const today = new Date()
  const upcomingLessons = lessons.filter(l => new Date(l.scheduled_at) >= today && l.status === 'scheduled').slice(0, 5)
  const total = form.correct_count + form.wrong_count + form.blank_count
  const accuracy = total > 0 ? Math.round(form.correct_count / total * 100) : 0

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  const TABS = [
    { id: 'assign', label: 'Ödev Ata' },
    { id: 'dashboard', label: 'Ana Sayfa' },
    { id: 'questions', label: 'Soru Girişi' },
    { id: 'students', label: 'Öğrencilerim' },
    { id: 'lessons', label: 'Derslerim' },
  ]

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#2E7D52', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Öğretmen Paneli</div>
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
              {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{profile.full_name}</div>
              <div style={{ fontSize: '10px', color: '#2E7D52', fontWeight: 600 }}>Öğretmen</div>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 500, color: activeTab === tab.id ? '#1B3A6B' : '#4A6080', background: activeTab === tab.id ? '#E2EAF8' : 'transparent', borderLeft: activeTab === tab.id ? '3px solid #1B3A6B' : '3px solid transparent', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
          <button onClick={signOut} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#C0392B', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Merhaba, {profile?.full_name?.split(' ')[0]}!</h1>
              <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Öğrenci', value: students.length, color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Yaklaşan Ders', value: upcomingLessons.length, color: '#2E7D52', bg: '#EAF4EE' },
                { label: 'Toplam Ders', value: lessons.length, color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Giriş Yapılan', value: recentAttempts.length, color: '#B45309', bg: '#FDF4E7' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Yaklaşan Dersler</div>
                {upcomingLessons.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Planlanmış ders yok</div>
                ) : upcomingLessons.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1B3A6B', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{l.subject}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{l.profiles?.full_name}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Son Soru Girişleri</div>
                {recentAttempts.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Henüz giriş yok</div>
                ) : recentAttempts.slice(0, 5).map((a, i) => {
                  const rate = a.total_questions > 0 ? Math.round(a.correct_count / a.total_questions * 100) : 0
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < 4 ? '1px solid #F0F4F9' : 'none' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: rate >= 70 ? '#EAF4EE' : rate >= 50 ? '#FDF4E7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: rate >= 70 ? '#2E7D52' : rate >= 50 ? '#B45309' : '#C0392B', flexShrink: 0 }}>
                        %{rate}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1B3A6B' }}>{a.profiles?.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{a.subjects?.name} {a.topics?.name ? '— ' + a.topics.name : ''}</div>
                      </div>
                    </div>
                  )
                })}
                <button onClick={() => setActiveTab('questions')} style={{ marginTop: '10px', fontSize: '12px', color: '#1B3A6B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Yeni giriş yap →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SORU GİRİŞİ */}
        {activeTab === 'questions' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Soru Çözüm Girişi</h1>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
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

                <div style={{ background: '#F8FAFF', borderRadius: '10px', padding: '16px', marginBottom: '14px', border: '1px solid #E2EAF8' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Soru Sonuçları</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '10px' }}>
                    {[
                      { label: 'Doğru', key: 'correct_count', color: '#2E7D52', bg: '#EAF4EE' },
                      { label: 'Yanlış', key: 'wrong_count', color: '#C0392B', bg: '#FEF2F2' },
                      { label: 'Boş', key: 'blank_count', color: '#7A8FA8', bg: '#F0F4F9' },
                    ].map(f => (
                      <div key={f.key} style={{ background: f.bg, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: f.color, fontWeight: 600, marginBottom: '6px' }}>{f.label}</div>
                        <input type="number" min={0} value={form[f.key as keyof typeof form] as number} onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '18px', fontWeight: 700, color: f.color, textAlign: 'center', background: 'rgba(255,255,255,0.8)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7A8FA8' }}>Toplam: <strong>{total} soru</strong></span>
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
                  <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Gözlem veya not..." style={inp} />
                </div>

                {success && (
                  <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>
                    Kayıt başarıyla eklendi!
                  </div>
                )}

                <button type="submit" disabled={saving || total === 0} style={{ width: '100%', padding: '12px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet ve Skoru Güncelle'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ÖĞRENCİLERİM */}
        {activeTab === 'students' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Öğrencilerim</h1>
            {students.length === 0 ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#B45309' }}>Henüz öğrenci atanmamış</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {students.map(s => {
                  const sLessons = lessons.filter(l => l.student_id === s.id)
                  const sAttempts = recentAttempts.filter(a => a.student_id === s.id)
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                          {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{s.full_name}</div>
                          <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>Öğrenci</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                        {[
                          { label: 'Toplam Ders', value: sLessons.length, color: '#1B3A6B' },
                          { label: 'Soru Girişi', value: sAttempts.length, color: '#B45309' },
                        ].map(m => (
                          <div key={m.label} style={{ background: '#F5F8FF', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: m.color }}>{m.value}</div>
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
        )}

        {/* DERSLERİM */}
        {activeTab === 'lessons' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Tüm Derslerim ({lessons.length})</h1>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              {lessons.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Ders kaydı yok</div>
              ) : lessons.map((l, i) => {
                const STATUS: any = {
                  completed: { bg: '#EAF4EE', color: '#2E7D52', label: 'Tamamlandı' },
                  scheduled: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Planlandı' },
                  cancelled: { bg: '#FEF2F2', color: '#C0392B', label: 'İptal' },
                }
                const st = STATUS[l.status] ?? STATUS.scheduled
                return (
                  <div key={l.id} style={{ padding: '13px 18px', borderBottom: i < lessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{l.profiles?.full_name} — {new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
{activeTab === 'assign' && (
    <div style={{ maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Ödev Ata</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        <div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Kitap Seç</label>
            <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff' }}>
              <option value="">Kitap seçin...</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.name} — {b.subject}</option>)}
            </select>
          </div>
  
          {bookChapters.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bookChapters.map(chapter => {
                const testIds = chapter.tests?.map((t: any) => t.id) ?? []
                const allSelected = testIds.length > 0 && testIds.every((id: string) => selectedTests.includes(id))
                return (
                  <div key={chapter.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                    <div onClick={() => toggleAssignChapter(chapter)} style={{ padding: '11px 16px', background: '#F5F8FF', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: allSelected ? '#1B3A6B' : '#D5DFF0', background: allSelected ? '#1B3A6B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {allSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', flex: 1 }}>{chapter.name}</span>
                      <span style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{chapter.tests?.length ?? 0} test</span>
                    </div>
                    {(chapter.tests ?? []).map((test: any, i: number) => {
                      const isSelected = selectedTests.includes(test.id)
                      return (
                        <div key={test.id} onClick={() => toggleAssignTest(test.id)} style={{ padding: '10px 16px', borderBottom: i < chapter.tests.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: isSelected ? '#F0F4FF' : '#fff' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: isSelected ? '#1B3A6B' : '#D5DFF0', background: isSelected ? '#1B3A6B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
  
        <div style={{ alignSelf: 'flex-start', position: 'sticky', top: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Ödev Ayarları</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Öğrenci *</label>
              <select value={selectedAssignStudent} onChange={e => setSelectedAssignStudent(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff' }}>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Son Teslim</label>
              <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: '#F0F4F9', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '12px', color: '#4A6080' }}>
              {selectedTests.length} test seçildi
            </div>
            {assignSuccess && (
              <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '9px 12px', marginBottom: '10px', fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>
                Ödev atandı!
              </div>
            )}
            <button onClick={handleAssign} disabled={assigning || selectedTests.length === 0 || !selectedAssignStudent} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: selectedTests.length > 0 && selectedAssignStudent ? '#1B3A6B' : '#D5DFF0', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {assigning ? 'Atanıyor...' : 'Ödev Ata'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}