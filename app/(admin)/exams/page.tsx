'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const [newExam, setNewExam] = useState({
    name: '', exam_date: new Date().toISOString().slice(0, 10),
    exam_type: 'deneme', duration_minutes: 180,
  })
  const [examSubjects, setExamSubjects] = useState<{ subject_id: string; question_count: number }[]>([])

  const [resultForm, setResultForm] = useState<{
    student_id: string;
    results: { subject_id: string; correct: number; wrong: number; blank: number }[]
  }>({ student_id: '', results: [] })


  // Tenant ID'yi otomatik al
  const [currentTenantId, setCurrentTenantId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {

    // Tenant ID'yi yükle
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
      if (prof?.tenant_id) setCurrentTenantId(prof.tenant_id)
    }

    const [{ data: e }, { data: s }, { data: st }] = await Promise.all([
      supabase.from('exams').select('*, exam_subjects(*, subjects(name))').order('exam_date', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
    ])
    setExams(e ?? [])
    setSubjects(s ?? [])
    setStudents(st ?? [])
    setLoading(false)
  }

  async function loadResults(exam: any) {
    setSelectedExam(exam)
    const { data } = await supabase
      .from('exam_results')
      .select('*, profiles!exam_results_student_id_fkey(full_name), subjects(name, color)')
      .eq('exam_id', exam.id)
      .order('score', { ascending: false })
    setResults(data ?? [])
    setActiveTab('results')
    setResultForm({
      student_id: '',
      results: exam.exam_subjects?.map((es: any) => ({
        subject_id: es.subject_id,
        correct: 0, wrong: 0, blank: 0
      })) ?? []
    })
  }

  function addSubjectToExam() {
    setExamSubjects(prev => [...prev, { subject_id: '', question_count: 40 }])
  }

  function removeSubjectFromExam(i: number) {
    setExamSubjects(prev => prev.filter((_, idx) => idx !== i))
  }

  async function createExam() {
    if (!newExam.name) { alert('Sinav adi gerekli!'); return }
    setSaving(true)
    const { data: exam, error } = await supabase.from('exams').insert({
      tenant_id: currentTenantId,
      ...newExam,
    }).select().single()
    if (error || !exam) { alert('Hata: ' + error?.message); setSaving(false); return }
    for (let i = 0; i < examSubjects.length; i++) {
      if (!examSubjects[i].subject_id) continue
      await supabase.from('exam_subjects').insert({
        exam_id: exam.id,
        subject_id: examSubjects[i].subject_id,
        question_count: examSubjects[i].question_count,
        order_no: i,
      })
    }
    setNewExam({ name: '', exam_date: new Date().toISOString().slice(0, 10), exam_type: 'deneme', duration_minutes: 180 })
    setExamSubjects([])
    await load()
    setActiveTab('list')
    setSaving(false)
  }

  async function saveResult() {
    if (!resultForm.student_id) { alert('Öğrenci seçin!'); return }
    setSaving(true)
    let totalCorrect = 0, totalWrong = 0, totalNet = 0
    for (const r of resultForm.results) {
      if (!r.subject_id) continue
      const net = Math.round((r.correct - r.wrong / 4) * 100) / 100
      const subjectTotal = selectedExam.exam_subjects?.find((es: any) => es.subject_id === r.subject_id)?.question_count ?? 40
      const score = Math.round((net / subjectTotal) * 100 * 100) / 100
      await supabase.from('exam_results').upsert({
        tenant_id: currentTenantId,
        exam_id: selectedExam.id,
        student_id: resultForm.student_id,
        subject_id: r.subject_id,
        correct_count: r.correct,
        wrong_count: r.wrong,
        blank_count: r.blank,
        net, score,
      }, { onConflict: 'exam_id,student_id,subject_id' })

      // Konu performansını güncelle
      await supabase.from('student_question_attempts').insert({
        tenant_id: currentTenantId,
        student_id: resultForm.student_id,
        subject_id: r.subject_id,
        attempt_date: selectedExam.exam_date,
        total_questions: r.correct + r.wrong + r.blank,
        correct_count: r.correct,
        wrong_count: r.wrong,
        blank_count: r.blank,
        difficulty_level: 'medium',
        source_type: 'exam',
      })

      totalCorrect += r.correct
      totalWrong += r.wrong
      totalNet += net
    }

    await loadResults(selectedExam)
    setResultForm(prev => ({ ...prev, student_id: '' }))
    setSaving(false)
  }

  async function deleteExam(id: string) {
    if (!confirm('Bu sınavı silmek istediğinizden emin misiniz?')) return
    await supabase.from('exams').delete().eq('id', id)
    await load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  // Sıralama — her öğrenci için toplam net
  const ranking = Object.values(
    results.reduce((acc: any, r: any) => {
      if (!acc[r.student_id]) acc[r.student_id] = { name: r.profiles?.full_name, totalNet: 0, subjects: {} }
      acc[r.student_id].totalNet += r.net
      acc[r.student_id].subjects[r.subjects?.name] = r.net
      return acc
    }, {})
  ).sort((a: any, b: any) => b.totalNet - a.totalNet)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Deneme Sınavları</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Sınav tanımlama, sonuç girişi ve sıralama</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'list', label: 'Sınavlar' },
          { id: 'new', label: 'Yeni Sınav' },
          { id: 'results', label: selectedExam ? selectedExam.name + ' — Sonuçlar' : 'Sonuçlar' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SINAV LİSTESİ */}
      {activeTab === 'list' && (
        <div>
          {exams.length === 0 ? (
            <div style={{ background: '#F8FAFF', border: '1px solid #D5DFF0', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#7A8FA8', marginBottom: '12px' }}>Henüz sınav eklenmemiş</div>
              <button onClick={() => setActiveTab('new')} style={{ padding: '10px 20px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                İlk Sınavı Ekle
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exams.map(exam => (
                <div key={exam.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round"/>
                      <path d="M13 2v5h5M8 12h6M8 15h4" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>{exam.name}</div>
                    <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
                      {new Date(exam.exam_date).toLocaleDateString('tr-TR')} •
                      {exam.exam_type.toUpperCase()} •
                      {exam.exam_subjects?.length ?? 0} ders •
                      {exam.duration_minutes} dk
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {exam.exam_subjects?.map((es: any) => (
                        <span key={es.id} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>
                          {es.subjects?.name} ({es.question_count}s)
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => loadResults(exam)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                      Sonuçlar
                    </button>
                    <button onClick={() => deleteExam(exam.id)} style={{ padding: '8px 12px', borderRadius: '8px', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, border: '1px solid #FECACA', cursor: 'pointer' }}>
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* YENİ SINAV */}
      {activeTab === 'new' && (
        <div style={{ maxWidth: '700px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Sınav Bilgileri</div>

            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Sınav Adı *</label>
              <input value={newExam.name} onChange={e => setNewExam(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Kasım Ayı Deneme 1" style={inp} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>Tarih</label>
                <input type="date" value={newExam.exam_date} onChange={e => setNewExam(p => ({ ...p, exam_date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Tür</label>
                <select value={newExam.exam_type} onChange={e => setNewExam(p => ({ ...p, exam_type: e.target.value }))} style={inp}>
                  <option value="deneme">Deneme</option>
                  <option value="tyt">TYT</option>
                  <option value="ayt">AYT</option>
                  <option value="lgs">LGS</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Süre (dk)</label>
                <input type="number" value={newExam.duration_minutes} onChange={e => setNewExam(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 180 }))} style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ ...lbl, margin: 0 }}>Dersler (Opsiyonel)</label>
                <button onClick={addSubjectToExam} style={{ padding: '5px 12px', borderRadius: '7px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  + Ders Ekle
                </button>
              </div>
              {examSubjects.length === 0 ? (
                <div style={{ padding: '16px', background: '#F8FAFF', borderRadius: '8px', border: '1px dashed #D5DFF0', textAlign: 'center', fontSize: '12.5px', color: '#7A8FA8' }}>
                  Sinav sonuclarini girerken ders bazli analiz icin ders ekleyebilirsiniz
                </div>
              ) : examSubjects.map((es, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select value={es.subject_id} onChange={e => setExamSubjects(prev => prev.map((x, idx) => idx === i ? { ...x, subject_id: e.target.value } : x))} style={inp}>
                    <option value="">Ders seçin...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="number" value={es.question_count} onChange={e => setExamSubjects(prev => prev.map((x, idx) => idx === i ? { ...x, question_count: parseInt(e.target.value) || 40 } : x))} placeholder="Soru sayısı" style={inp} />
                  <button onClick={() => removeSubjectFromExam(i)} style={{ padding: '8px 10px', borderRadius: '7px', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', border: '1px solid #FECACA', cursor: 'pointer' }}>Sil</button>
                </div>
              ))}
            </div>

            <button onClick={createExam} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Sınav Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* SONUÇLAR */}
      {activeTab === 'results' && selectedExam && (
        <div>
          {/* Sonuç Giriş Formu */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Sonuç Girişi</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Öğrenci *</label>
              <select value={resultForm.student_id} onChange={e => setResultForm(p => ({ ...p, student_id: e.target.value }))} style={{ ...inp, maxWidth: '300px' }}>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {selectedExam.exam_subjects?.map((es: any, i: number) => {
                const rf = resultForm.results[i] ?? { correct: 0, wrong: 0, blank: 0 }
                const net = Math.round((rf.correct - rf.wrong / 4) * 100) / 100
                return (
                  <div key={es.id} style={{ background: '#F8FAFF', borderRadius: '10px', padding: '14px', border: '1px solid #E2EAF8' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>
                      {es.subjects?.name}
                      <span style={{ fontSize: '10px', color: '#7A8FA8', fontWeight: 400, marginLeft: '6px' }}>{es.question_count} soru</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                      {[
                        { label: 'D', key: 'correct', color: '#2E7D52' },
                        { label: 'Y', key: 'wrong', color: '#C0392B' },
                        { label: 'B', key: 'blank', color: '#7A8FA8' },
                      ].map(f => (
                        <div key={f.key} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: f.color, fontWeight: 600, marginBottom: '3px' }}>{f.label}</div>
                          <input
                            type="number" min={0} max={es.question_count}
                            value={resultForm.results[i]?.[f.key as 'correct' | 'wrong' | 'blank'] ?? 0}
                            onChange={e => setResultForm(prev => ({
                              ...prev,
                              results: prev.results.map((r, idx) => idx === i ? { ...r, [f.key]: parseInt(e.target.value) || 0 } : r)
                            }))}
                            style={{ width: '100%', padding: '4px', borderRadius: '5px', border: '1px solid #D5DFF0', fontSize: '14px', fontWeight: 700, color: f.color, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', fontWeight: 700, color: net >= 0 ? '#1B3A6B' : '#C0392B' }}>
                      Net: {net}
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={saveResult} disabled={saving || !resultForm.student_id} style={{ padding: '10px 24px', borderRadius: '8px', background: resultForm.student_id ? '#1B3A6B' : '#D5DFF0', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Sonucu Kaydet'}
            </button>
          </div>

          {/* Sıralama Tablosu */}
          {ranking.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                Sıralama — {ranking.length} öğrenci
              </div>
              {(ranking as any[]).map((r: any, i: number) => (
                <div key={i} style={{ padding: '13px 18px', borderBottom: i < ranking.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? '#FDF4E7' : i === 1 ? '#F0F4F9' : i === 2 ? '#FEF2F2' : '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: i === 0 ? '#B45309' : i === 1 ? '#4A6080' : i === 2 ? '#C0392B' : '#9CA3AF', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '3px' }}>{r.name}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(r.subjects).map(([subject, net]: any) => (
                        <span key={subject} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>
                          {subject}: {net}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#1B3A6B' }}>{Math.round(r.totalNet * 100) / 100}</div>
                    <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Toplam Net</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}