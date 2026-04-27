'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const OPTIONS = ['A', 'B', 'C', 'D', 'E', 'BK']

interface PageProps { params: { testId: string } }

export default function TestSolvePage({ params }: PageProps) {
  const [assignment, setAssignment] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase
        .from('homework_assignments')
        .select(`
          *,
          tests (
            id, name, question_count,
            chapters ( name, books ( id, name, subject, color, tenant_id ) ),
            answer_keys ( question_no, correct_answer )
          )
        `)
        .eq('id', params.testId)
        .single()

      if (!a) { router.push('/homework'); return }

      if (a.status === 'completed') {
        const { data: existingAnswers } = await supabase
          .from('student_answers')
          .select('*')
          .eq('assignment_id', a.id)

        const ansMap: Record<number, string> = {}
        for (const ans of existingAnswers ?? []) {
          ansMap[ans.question_no] = ans.given_answer?.trim()
        }
        console.log('DEBUG answer_keys:', a.tests?.answer_keys)
        console.log('DEBUG ansMap:', ansMap)
        setAnswers(ansMap)
        setSubmitted(true)
        calcResults(a, ansMap)
      }

      setAssignment(a)
      setLoading(false)
    }
    load()
  }, [params.testId])

  function calcResults(a: any, ans: Record<number, string>) {
    const keys = a.tests?.answer_keys ?? []
    let correct = 0, wrong = 0, bk = 0, empty = 0
    for (let i = 1; i <= a.tests?.question_count; i++) {
      const given = ans[i]
      const key = keys.find((k: any) => k.question_no === i)?.correct_answer
      if (!given) { empty++; continue }
      if (given === 'BK') { bk++; continue }
      if (key && given === key) correct++
      else wrong++
    }
    setResults({ correct, wrong, bk, empty, total: a.tests?.question_count ?? 0 })
  }

  function selectAnswer(q: number, opt: string) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [q]: opt }))
  }

  async function handleSubmit() {
    const total = assignment?.tests?.question_count ?? 0
    const missing: number[] = []
    for (let i = 1; i <= total; i++) {
      if (!answers[i]) missing.push(i)
    }

    if (missing.length > 0) {
      setSubmitError(`${missing.length} soru cevaplanmadı: Soru ${missing.join(', ')}. Bilmiyorsan BK seçeneğini işaretle.`)
      return
    }

    setSubmitError('')
    setLoading(true)

    for (const [qNo, ans] of Object.entries(answers)) {
      await supabase.from('student_answers').upsert({
        assignment_id: params.testId,
        question_no: parseInt(qNo),
        given_answer: ans.trim(),
      }, { onConflict: 'assignment_id,question_no' })
    }

    await supabase
      .from('homework_assignments')
      .update({ status: 'completed' })
      .eq('id', params.testId)

      // Konu performansını güncelle
try {
  const bookSubject = test?.chapters?.books?.subject
  if (bookSubject) {
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .ilike('name', '%' + bookSubject + '%')
      .maybeSingle()

    const correct = Object.entries(answers).filter(([q, ans]) => {
      const key = keys.find((k: any) => k.question_no === parseInt(q))?.correct_answer
      return key && ans === key
    }).length
    const wrong = Object.entries(answers).filter(([q, ans]) => {
      const key = keys.find((k: any) => k.question_no === parseInt(q))?.correct_answer
      return key && ans !== key && ans !== 'BK'
    }).length
    const blank = Object.values(answers).filter(ans => ans === 'BK').length
    const totalQ = test?.question_count ?? 0

    await supabase.from('student_question_attempts').insert({
      tenant_id: assignment.tests?.chapters?.books?.tenant_id ?? null,
      student_id: assignment.student_id,
      subject_id: subjectData?.id ?? null,
      attempt_date: new Date().toISOString().slice(0, 10),
      total_questions: totalQ,
      correct_count: correct,
      wrong_count: wrong,
      blank_count: blank,
      difficulty_level: 'medium',
      source_type: 'homework',
    })

    if (subjectData?.id) {
      const { data: existing } = await supabase
        .from('student_topic_performance')
        .select('id, accuracy_rate')
        .eq('student_id', assignment.student_id)
        .eq('subject_id', subjectData.id)
        .is('topic_id', null)
        .single()

      const acc = totalQ > 0 ? Math.round(correct / totalQ * 100 * 100) / 100 : 0
      const mastery = Math.round((acc * 0.70 + 3.0) * 100) / 100
      const trend = existing ? (acc > existing.accuracy_rate ? 'up' : acc < existing.accuracy_rate ? 'down' : 'stable') : 'stable'

      await supabase.from('student_topic_performance').upsert({
        tenant_id: assignment.tests?.chapters?.books?.tenant_id ?? null,
        student_id: assignment.student_id,
        subject_id: subjectData.id,
        topic_id: null,
        total_questions: totalQ,
        correct_count: correct,
        wrong_count: wrong,
        blank_count: blank,
        accuracy_rate: acc,
        mastery_score: mastery,
        last_attempt_date: new Date().toISOString().slice(0, 10),
        attempt_count: 1,
        trend_direction: trend,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,subject_id,topic_id' })
    }
  }
} catch (err) {
  console.error('Performans güncelleme hatası:', err)
}
    setSubmitted(true)
    calcResults(assignment, answers)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>
  if (!assignment) return null

  const test = assignment.tests
  const keys = test?.answer_keys ?? []
  const total = test?.question_count ?? 0
  const answered = Object.keys(answers).length
  const pct = Math.round(answered / total * 100)
  const bookColor = test?.chapters?.books?.color ?? '#1B3A6B'

  return (
    <div style={{ padding: '24px', maxWidth: '780px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <a href="/homework" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>← Ödevlerim</a>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1B3A6B', margin: '6px 0 2px' }}>
          {test?.name} — {test?.chapters?.name}
        </h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: 0 }}>{test?.chapters?.books?.name} • {test?.chapters?.books?.subject}</p>
      </div>

      {/* Tamamlandı Banner */}
      {submitted && results && (
        <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#2E7D52', marginBottom: '12px' }}>Ödev Tamamlandı!</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {[
              { label: 'Doğru', value: results.correct, color: '#2E7D52', bg: '#C6E8D0' },
              { label: 'Yanlış', value: results.wrong, color: '#C0392B', bg: '#FECACA' },
              { label: 'BK', value: results.bk, color: '#B45309', bg: '#FED7AA' },
              { label: 'Puan', value: `%${Math.round(results.correct / results.total * 100)}`, color: '#1B3A6B', bg: '#BFDBFE' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: m.color, margin: '0 auto 4px' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: '#7A8FA8', fontWeight: 600 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <a href="/swot" style={{ display: 'inline-block', marginTop: '12px', padding: '7px 16px', borderRadius: '8px', background: '#F0ECFB', color: '#6B4FC8', fontSize: '12px', fontWeight: 600, textDecoration: 'none', border: '1px solid #C4B5FD' }}>
            SWOT Analizimi Gör →
          </a>
        </div>
      )}

      {/* İlerleme */}
      {!submitted && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #D5DFF0', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4A6080', marginBottom: '8px' }}>
            <span>{answered}/{total} soru cevaplandı</span>
            <span style={{ fontWeight: 600, color: '#1B3A6B' }}>%{pct}</span>
          </div>
          <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: bookColor, borderRadius: '3px', transition: 'width .2s' }} />
          </div>
          <div style={{ marginTop: '8px', padding: '8px 10px', background: '#E6F1FB', borderRadius: '7px', fontSize: '11.5px', color: '#1B3A6B' }}>
            Tüm soruları cevapla. Bilmiyorsan <strong>BK</strong> (Bilgim Yok) seçeneğini işaretle.
          </div>
        </div>
      )}

      {/* Sorular */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {Array.from({ length: total }, (_, i) => {
          const q = i + 1
          const given = answers[q]
          const key = keys.find((k: any) => k.question_no === q)?.correct_answer
          const isCorrect = submitted && key && given === key
          const isWrong = submitted && given && given !== 'BK' && given !== key
          const isBK = given === 'BK'

          return (
            <div key={q} style={{ background: submitted ? (isCorrect ? '#F0FFF4' : isWrong ? '#FFF5F5' : '#FFFBF0') : '#fff', border: `1px solid ${submitted ? (isCorrect ? '#A7D9B8' : isWrong ? '#FECACA' : '#FED7AA') : '#D5DFF0'}`, borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                  {q}
                </div>
                <div style={{ display: 'flex', gap: '5px', flex: 1, flexWrap: 'wrap' }}>
                  {OPTIONS.map(opt => {
                    const isSelected = given === opt
                    const isAnswer = submitted && key === opt && opt !== 'BK'
                    let bg = '#F5F8FF'
                    let color = '#4A6080'
                    let border = '#D5DFF0'
                    if (isSelected && !submitted) { bg = '#1B3A6B'; color = '#fff'; border = '#1B3A6B' }
                    if (isSelected && submitted && isCorrect) { bg = '#2E7D52'; color = '#fff'; border = '#2E7D52' }
                    if (isSelected && submitted && isWrong) { bg = '#C0392B'; color = '#fff'; border = '#C0392B' }
                    if (isSelected && submitted && isBK) { bg = '#B45309'; color = '#fff'; border = '#B45309' }
                    if (isAnswer && !isSelected) { bg = '#EAF4EE'; color = '#2E7D52'; border = '#2E7D52' }

                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(q, opt)}
                        disabled={submitted}
                        style={{ width: opt === 'BK' ? '40px' : '34px', height: '34px', borderRadius: '7px', border: `1.5px solid ${border}`, background: bg, color, fontSize: opt === 'BK' ? '9px' : '12px', fontWeight: 700, cursor: submitted ? 'default' : 'pointer', transition: 'all .1s' }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isCorrect ? '#2E7D52' : isWrong ? '#C0392B' : '#B45309', flexShrink: 0, width: '60px', textAlign: 'right' }}>
                    {isCorrect ? '✓ Doğru' : isWrong ? `✗ (${key})` : isBK ? 'BK' : '—'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <div>
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12.5px', color: '#C0392B' }}>
              ⚠️ {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Kaydediliyor...' : 'Ödevi Tamamla'}
          </button>
        </div>
      )}
    </div>
  )
}
