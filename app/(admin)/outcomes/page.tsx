'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OutcomesPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [activeTab, setActiveTab] = useState('outcomes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [classroomAnalysis, setClassroomAnalysis] = useState<any[]>([])
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [form, setForm] = useState({
    subject_id: '', topic_id: '', code: '', description: '',
    grade_level: 10, difficulty_level: 'medium', order_no: 0
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => { if (form.subject_id) loadTopics(form.subject_id) }, [form.subject_id])
  useEffect(() => { if (selectedSubject) loadOutcomes(selectedSubject) }, [selectedSubject])

  async function load() {
    const [{ data: s }, { data: c }, { data: st }] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('classrooms').select('*').order('grade_level'),
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
    ])
    setSubjects(s ?? [])
    setClassrooms(c ?? [])
    setStudents(st ?? [])
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setTopics(data ?? [])
  }

  async function loadOutcomes(subjectId: string) {
    const { data } = await supabase.from('learning_outcomes')
      .select('*, subjects(name), topics(name)')
      .eq('subject_id', subjectId)
      .order('order_no')
    setOutcomes(data ?? [])
  }

  async function saveOutcome(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject_id || !form.description) { alert('Ders ve kazanım açıklaması zorunlu!'); return }
    setSaving(true)
    setSuccess(false)
    await supabase.from('learning_outcomes').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      code: form.code || null,
      description: form.description,
      grade_level: form.grade_level,
      difficulty_level: form.difficulty_level,
      order_no: form.order_no,
    })
    setSuccess(true)
    setForm(p => ({ ...p, code: '', description: '' }))
    if (selectedSubject === form.subject_id) await loadOutcomes(selectedSubject)
    setSaving(false)
  }

  async function deleteOutcome(id: string) {
    if (!confirm('Bu kazanımı silmek istiyor musunuz?')) return
    await supabase.from('learning_outcomes').delete().eq('id', id)
    await loadOutcomes(selectedSubject)
  }

  async function analyzeClassroom() {
    if (!selectedClassroom) { alert('Sınıf seçin!'); return }
    setAnalysisLoading(true)
    setClassroomAnalysis([])

    const { data: csData } = await supabase
      .from('classroom_students')
      .select('student_id')
      .eq('classroom_id', selectedClassroom)

    if (!csData || csData.length === 0) {
      alert('Bu sınıfta öğrenci yok!')
      setAnalysisLoading(false)
      return
    }

    const studentIds = csData.map(cs => cs.student_id)
    const { data: tp } = await supabase
      .from('student_topic_performance')
      .select('*, subjects(name), topics(name), profiles!student_topic_performance_student_id_fkey(full_name)')
      .in('student_id', studentIds)

    const subjectMap: any = {}
    for (const t of tp ?? []) {
      const key = t.subject_id + '_' + (t.topic_id ?? 'general')
      if (!subjectMap[key]) subjectMap[key] = { subject: t.subjects?.name, topic: t.topics?.name ?? 'Genel', rates: [], students: [] }
      subjectMap[key].rates.push(t.accuracy_rate)
      subjectMap[key].students.push({ name: t.profiles?.full_name, rate: t.accuracy_rate })
    }

    const analysis = Object.values(subjectMap).map((s: any) => ({
      subject: s.subject,
      topic: s.topic,
      avg: Math.round(s.rates.reduce((a: number, b: number) => a + b, 0) / s.rates.length),
      student_count: s.rates.length,
      weak_students: s.students.filter((st: any) => st.rate < 50).length,
      students: s.students.sort((a: any, b: any) => a.rate - b.rate),
    })).sort((a: any, b: any) => a.avg - b.avg)

    setClassroomAnalysis(analysis)
    setAnalysisLoading(false)
  }

  async function assignStudentToClass() {
    if (!selectedClassroom || !selectedStudent) { alert('Sınıf ve öğrenci seçin!'); return }
    const { error } = await supabase.from('classroom_students').insert({
      classroom_id: selectedClassroom,
      student_id: selectedStudent,
    })
    if (error) { alert('Hata: ' + error.message); return }
    alert('Öğrenci sınıfa eklendi!')
    setSelectedStudent('')
  }

  const [selectedStudent, setSelectedStudent] = useState('')

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Kazanım & Sınıf Yönetimi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>MEB uyumlu kazanım haritası, sınıf analizi ve şube karşılaştırması</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'outcomes', label: '📚 Kazanım Yönetimi' },
          { id: 'classrooms', label: '🏫 Sınıf & Şube' },
          { id: 'analysis', label: '📊 Sınıf Analizi' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* KAZANIM YÖNETİMİ */}
      {activeTab === 'outcomes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', alignSelf: 'flex-start' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Yeni Kazanım Ekle</div>
            <form onSubmit={saveOutcome}>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Ders *</label>
                <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} style={inp} required>
                  <option value="">Ders seçin...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Konu</label>
                <select value={form.topic_id} onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))} style={inp} disabled={topics.length === 0}>
                  <option value="">Konu seçin...</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={lbl}>Kazanım Kodu</label>
                  <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="M.10.2.3" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Sınıf Seviyesi</label>
                  <select value={form.grade_level} onChange={e => setForm(p => ({ ...p, grade_level: parseInt(e.target.value) }))} style={inp}>
                    {[9,10,11,12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Kazanım Açıklaması *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Öğrenci fonksiyon grafiğini yorumlar..." rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Zorluk</label>
                  <select value={form.difficulty_level} onChange={e => setForm(p => ({ ...p, difficulty_level: e.target.value }))} style={inp}>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Sıra No</label>
                  <input type="number" value={form.order_no} onChange={e => setForm(p => ({ ...p, order_no: parseInt(e.target.value) || 0 }))} style={inp} />
                </div>
              </div>
              {success && <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>Kazanım eklendi!</div>}
              <button type="submit" disabled={saving} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kazanım Ekle'}
              </button>
            </form>
          </div>

          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Derse Göre Filtrele</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ ...inp, maxWidth: '300px' }}>
                <option value="">Ders seçin...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {outcomes.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📚</div>
                <div style={{ fontSize: '13px', color: '#7A8FA8' }}>Ders seçin veya kazanım ekleyin</div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  {outcomes.length} Kazanım
                </div>
                {outcomes.map((o, i) => (
                  <div key={o.id} style={{ padding: '12px 18px', borderBottom: i < outcomes.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flexShrink: 0 }}>
                      {o.code && <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B4FC8', background: '#F0ECFB', padding: '2px 8px', borderRadius: '6px', marginBottom: '4px' }}>{o.code}</div>}
                      <div style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: o.difficulty_level === 'hard' ? '#FEF2F2' : o.difficulty_level === 'easy' ? '#EAF4EE' : '#EEF3FB', color: o.difficulty_level === 'hard' ? '#C0392B' : o.difficulty_level === 'easy' ? '#2E7D52' : '#1B3A6B', fontWeight: 600 }}>
                        {o.difficulty_level === 'hard' ? 'Zor' : o.difficulty_level === 'easy' ? 'Kolay' : 'Orta'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '3px' }}>{o.description}</div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                        {o.subjects?.name}{o.topics?.name ? ' → ' + o.topics.name : ''} • {o.grade_level}. Sınıf
                      </div>
                    </div>
                    <button onClick={() => deleteOutcome(o.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINIF & ŞUBE */}
      {activeTab === 'classrooms' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Sınıflar ({classrooms.length})
            </div>
            {classrooms.map((c, i) => (
              <div key={c.id} onClick={() => setSelectedClassroom(c.id)} style={{ padding: '13px 18px', borderBottom: i < classrooms.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: selectedClassroom === c.id ? '#F5F8FF' : '#fff', borderLeft: selectedClassroom === c.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: selectedClassroom === c.id ? '#1B3A6B' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: selectedClassroom === c.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {c.name}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{c.name} Şubesi</div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{c.grade_level}. Sınıf • {c.academic_year}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            {selectedClassroom && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Öğrenci Ekle</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ ...inp, flex: 1 }}>
                    <option value="">Öğrenci seçin...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <button onClick={assignStudentToClass} style={{ padding: '8px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Ekle
                  </button>
                </div>
                <div style={{ marginTop: '16px', background: '#EEF3FB', borderRadius: '8px', padding: '12px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '12px', color: '#1B3A6B' }}>
                    Sınıfa öğrenci ekledikten sonra <strong>Sınıf Analizi</strong> sekmesinden o sınıfın konu performansını görebilirsiniz.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINIF ANALİZİ */}
      {activeTab === 'analysis' && (
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Sınıf Seç</label>
                <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)} style={inp}>
                  <option value="">Sınıf seçin...</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.grade_level}. Sınıf</option>)}
                </select>
              </div>
              <button onClick={analyzeClassroom} disabled={analysisLoading || !selectedClassroom} style={{ padding: '9px 20px', borderRadius: '8px', background: selectedClassroom ? '#1B3A6B' : '#D5DFF0', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {analysisLoading ? 'Analiz Yapılıyor...' : 'Sınıfı Analiz Et'}
              </button>
            </div>
          </div>

          {classroomAnalysis.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Analiz Edilen Konu', value: classroomAnalysis.length, color: '#1B3A6B', bg: '#EEF3FB' },
                  { label: 'Kritik Zayıf Konu', value: classroomAnalysis.filter(a => a.avg < 50).length, color: '#C0392B', bg: '#FEF2F2' },
                  { label: 'Güçlü Konu', value: classroomAnalysis.filter(a => a.avg >= 70).length, color: '#2E7D52', bg: '#EAF4EE' },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  Konu Bazlı Sınıf Performansı (Zayıftan Güçlüye)
                </div>
                {classroomAnalysis.map((a, i) => (
                  <div key={i} style={{ padding: '12px 18px', borderBottom: i < classroomAnalysis.length - 1 ? '1px solid #F0F4F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <div style={{ width: '160px', flexShrink: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{a.topic}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{a.subject}</div>
                      </div>
                      <div style={{ flex: 1, height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: a.avg + '%', background: a.avg >= 70 ? '#2E7D52' : a.avg >= 50 ? '#B45309' : '#C0392B', borderRadius: '4px' }} />
                      </div>
                      <div style={{ width: '80px', display: 'flex', gap: '8px', flexShrink: 0, fontSize: '12px' }}>
                        <span style={{ fontWeight: 800, color: a.avg >= 70 ? '#2E7D52' : a.avg >= 50 ? '#B45309' : '#C0392B' }}>%{a.avg}</span>
                        {a.weak_students > 0 && <span style={{ color: '#C0392B', fontSize: '11px' }}>{a.weak_students} zayıf</span>}
                      </div>
                    </div>
                    {a.avg < 50 && (
                      <div style={{ marginLeft: '172px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {a.students.filter((s: any) => s.rate < 50).map((s: any, si: number) => (
                          <span key={si} style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', background: '#FEF2F2', color: '#C0392B', fontWeight: 600 }}>
                            {s.name}: %{Math.round(s.rate)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}