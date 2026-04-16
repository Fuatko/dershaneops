'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ExamAnalyticsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [examResults, setExamResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setStudents(data ?? [])
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    const { data } = await supabase
      .from('exam_results')
      .select('*, exams(name, exam_date, exam_type), subjects(name, color)')
      .eq('student_id', s.id)
      .order('created_at', { ascending: true })
    setExamResults(data ?? [])
  }

  // Sınav bazlı grupla
  const examGroups = examResults.reduce((acc: any, r: any) => {
    const key = r.exam_id
    if (!acc[key]) acc[key] = {
      exam: r.exams,
      exam_id: r.exam_id,
      subjects: [],
      totalNet: 0,
      date: r.exams?.exam_date
    }
    acc[key].subjects.push(r)
    acc[key].totalNet += r.net
    return acc
  }, {})

  const examList = Object.values(examGroups).sort((a: any, b: any) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) as any[]

  // İstatistikler
  const allNets = examList.map((e: any) => e.totalNet)
  const last5Nets = allNets.slice(-5)
  const last10Nets = allNets.slice(-10)
  const lastNet = allNets[allNets.length - 1] ?? 0

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100 : 0
  const overallAvg = avg(allNets)
  const last5Avg = avg(last5Nets)
  const last10Avg = avg(last10Nets)

  // Trend hesapla
  const trend = last5Avg > last10Avg ? 'up' : last5Avg < last10Avg ? 'down' : 'stable'
  const trendColor = trend === 'up' ? '#2E7D52' : trend === 'down' ? '#C0392B' : '#1B3A6B'
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  // Ders bazlı ortalama
  const subjectAvgs = examResults.reduce((acc: any, r: any) => {
    const name = r.subjects?.name ?? 'Diğer'
    if (!acc[name]) acc[name] = { nets: [], color: r.subjects?.color }
    acc[name].nets.push(r.net)
    return acc
  }, {})

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Sınav Analizi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Genel ortalama, son 5 ve son 10 sınav karşılaştırması</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>

        {/* Öğrenci */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Öğrenci Seç</div>
          {students.map(s => (
            <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
            </div>
          ))}
        </div>

        {!selected ? (
          <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Öğrenci seçin</div>
          </div>
        ) : examList.length === 0 ? (
          <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#B45309' }}>Henüz deneme sonucu yok</div>
          </div>
        ) : (
          <div>
            {/* Ana İstatistikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Genel Ortalama', value: overallAvg, count: examList.length + ' sınav', color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Son 10 Ortalama', value: last10Avg, count: Math.min(10, examList.length) + ' sınav', color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Son 5 Ortalama', value: last5Avg, count: Math.min(5, examList.length) + ' sınav', color: last5Avg >= overallAvg ? '#2E7D52' : '#C0392B', bg: last5Avg >= overallAvg ? '#EAF4EE' : '#FEF2F2' },
                { label: 'Son Sınav', value: Math.round(lastNet * 100) / 100, count: trend === 'up' ? trendIcon + ' Yükseliyor' : trend === 'down' ? trendIcon + ' Düşüyor' : trendIcon + ' Stabil', color: trendColor, bg: trend === 'up' ? '#EAF4EE' : trend === 'down' ? '#FEF2F2' : '#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10.5px', color: '#7A8FA8', marginTop: '2px' }}>{m.count}</div>
                </div>
              ))}
            </div>

            {/* Trend Grafiği (basit bar) */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Net Trendi</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
                {examList.map((e: any, i: number) => {
                  const maxNet = Math.max(...allNets)
                  const height = maxNet > 0 ? Math.round(e.totalNet / maxNet * 100) : 0
                  const isLast5 = i >= examList.length - 5
                  const isLatest = i === examList.length - 1
                  return (
                    <div key={e.exam_id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#7A8FA8', fontWeight: 600 }}>{Math.round(e.totalNet)}</div>
                      <div style={{ width: '100%', height: height + '%', minHeight: '4px', background: isLatest ? '#1B3A6B' : isLast5 ? '#6B4FC8' : '#D5DFF0', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                      <div style={{ fontSize: '8px', color: '#9CA3AF', textAlign: 'center', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {new Date(e.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center' }}>
                {[
                  { color: '#D5DFF0', label: 'Önceki sınavlar' },
                  { color: '#6B4FC8', label: 'Son 5' },
                  { color: '#1B3A6B', label: 'Son sınav' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#7A8FA8' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Ders Bazlı Analiz */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Ders Bazlı Ortalama Net</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(subjectAvgs).map(([name, data]: any) => {
                  const subAvg = avg(data.nets)
                  const lastSubNet = data.nets[data.nets.length - 1] ?? 0
                  const subTrend = data.nets.length >= 2 ? (lastSubNet > avg(data.nets.slice(0, -1)) ? 'up' : 'down') : 'stable'
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: '#F8FAFF', border: '1px solid #E2EAF8' }}>
                      <div style={{ width: '80px', flexShrink: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{name}</div>
                        <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{data.nets.length} sınav</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '6px', background: '#E2EAF8', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: Math.min((subAvg / 40) * 100, 100) + '%', background: data.color ?? '#1B3A6B', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div style={{ width: '120px', display: 'flex', gap: '12px', flexShrink: 0, fontSize: '12px' }}>
                        <span style={{ color: '#7A8FA8' }}>Ort: <strong style={{ color: '#1B3A6B' }}>{subAvg}</strong></span>
                        <span style={{ color: '#7A8FA8' }}>Son: <strong style={{ color: subTrend === 'up' ? '#2E7D52' : subTrend === 'down' ? '#C0392B' : '#1B3A6B' }}>{Math.round(lastSubNet * 100) / 100} {subTrend === 'up' ? '↑' : subTrend === 'down' ? '↓' : ''}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sınav Detay Listesi */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                Tüm Sınavlar ({examList.length})
              </div>
              {[...examList].reverse().map((e: any, i: number) => (
                <div key={e.exam_id} style={{ padding: '13px 18px', borderBottom: i < examList.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                    {examList.length - i}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '3px' }}>{e.exam?.name}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {e.subjects.map((s: any) => (
                        <span key={s.id} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>
                          {s.subjects?.name}: {Math.round(s.net * 100) / 100}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1B3A6B' }}>{Math.round(e.totalNet * 100) / 100}</div>
                    <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{new Date(e.date).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}