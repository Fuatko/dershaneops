'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SwotPage() {
  const [profile, setProfile] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!p) { setLoading(false); return }
      setProfile(p)

      const { data: assignments } = await supabase
        .from('homework_assignments')
        .select('id, tests(name, question_count, chapters(name, books(subject)), answer_keys(question_no, correct_answer))')
        .eq('student_id', p.id)
        .eq('status', 'completed')

      const { data: allAnswers } = await supabase
        .from('student_answers')
        .select('*')
        .in('assignment_id', (assignments ?? []).map((a: any) => a.id))

      const topicStats: Record<string, { correct: number; total: number; subject: string }> = {}

      for (const a of (assignments ?? [])) {
        const keys = (a as any).tests?.answer_keys ?? []
        const myAnswers = (allAnswers ?? []).filter((ans: any) => ans.assignment_id === a.id)
        const topic = (a as any).tests?.chapters?.name ?? 'Genel'
        const subject = (a as any).tests?.chapters?.books?.subject ?? 'Diger'
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, subject }
        for (const key of keys) {
          const myAns = myAnswers.find((ans: any) => ans.question_no === key.question_no)
          topicStats[topic].total++
          if (myAns?.given_answer === key.correct_answer) topicStats[topic].correct++
        }
      }

      const t = Object.entries(topicStats).map(([name, stats]) => ({
        name,
        subject: stats.subject,
        pct: stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0,
        correct: stats.correct,
        total: stats.total,
      })).sort((a, b) => b.pct - a.pct)

      setTopics(t)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  const strengths = topics.filter(t => t.pct >= 70)
  const weaknesses = topics.filter(t => t.pct < 50)
  const opportunities = topics.filter(t => t.pct >= 50 && t.pct < 70)
  const overallPct = topics.length > 0 ? Math.round(topics.reduce((s, t) => s + t.pct, 0) / topics.length) : 0

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <a href="/homework" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>Odevlerim</a>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '6px 0 2px' }}>SWOT Analizi</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: 0 }}>{profile?.full_name}</p>
        </div>
        <div style={{ textAlign: 'center', background: '#EEF3FB', borderRadius: '12px', padding: '12px 18px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1B3A6B' }}>%{overallPct}</div>
          <div style={{ fontSize: '11px', color: '#4A6080', fontWeight: 600 }}>Genel Basari</div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#B45309', marginBottom: '8px' }}>Henuz tamamlanmis odev yok</div>
          <div style={{ fontSize: '12px', color: '#7A8FA8', marginBottom: '16px' }}>Odevleri tamamladikca SWOT analizi burada olusur.</div>
          <a href="/homework" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none' }}>Odevlere Git</a>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D52', marginBottom: '10px' }}>Guclu Yonler</div>
              {strengths.length === 0 ? <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Henuz yok</div>
                : strengths.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '12px', color: '#2E7D52' }}>{t.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D52' }}>%{t.pct}</span>
                  </div>
                ))}
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B', marginBottom: '10px' }}>Zayif Yonler</div>
              {weaknesses.length === 0 ? <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Henuz yok</div>
                : weaknesses.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '12px', color: '#C0392B' }}>{t.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B' }}>%{t.pct}</span>
                  </div>
                ))}
            </div>

            <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309', marginBottom: '10px' }}>Gelisim Firsatlari</div>
              {opportunities.length === 0 ? <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Henuz yok</div>
                : opportunities.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '12px', color: '#B45309' }}>{t.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#B45309' }}>%{t.pct}</span>
                  </div>
                ))}
            </div>

            <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', marginBottom: '10px' }}>Oneriler</div>
              {weaknesses.length === 0
                ? <div style={{ fontSize: '12px', color: '#6B4FC8' }}>Harika! Kritik zayiflik yok.</div>
                : weaknesses.slice(0, 3).map(t => (
                  <div key={t.name} style={{ fontSize: '12px', color: '#3B0764', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', lineHeight: 1.5 }}>
                    {t.name} konusunda ek calisma yapilmali (%{t.pct})
                  </div>
                ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Konu Bazli Detay</div>
            {topics.map((t, i) => (
              <div key={t.name} style={{ marginBottom: i < topics.length - 1 ? '10px' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t.name} — {t.subject}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: t.pct >= 70 ? '#2E7D52' : t.pct >= 50 ? '#B45309' : '#C0392B' }}>%{t.pct}</span>
                </div>
                <div style={{ height: '7px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.pct}%`, background: t.pct >= 70 ? '#2E7D52' : t.pct >= 50 ? '#B45309' : '#C0392B', borderRadius: '4px' }} />
                </div>
                <div style={{ fontSize: '10px', color: '#7A8FA8', marginTop: '2px' }}>{t.correct}/{t.total} dogru</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
