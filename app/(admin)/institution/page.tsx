'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InstitutionPage() {
  const [stats, setStats] = useState<any>(null)
  const [teacherStats, setTeacherStats] = useState<any[]>([])
  const [subjectStats, setSubjectStats] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: profiles }, { data: lessons }, { data: homework }, { data: attempts }, { data: topicPerf }, { data: exams }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').in('role', ['student','teacher','parent']),
      supabase.from('lessons').select('teacher_id, status, profiles!lessons_teacher_id_fkey(full_name)'),
      supabase.from('homework_assignments').select('status, student_id'),
      supabase.from('student_question_attempts').select('student_id, total_questions, correct_count'),
      supabase.from('student_topic_performance').select('student_id, subject_id, accuracy_rate, subjects(name, color)'),
      supabase.from('exams').select('id, name'),
    ])
    const students = (profiles??[]).filter(p=>p.role==='student')
    const teachers = (profiles??[]).filter(p=>p.role==='teacher')
    const totalQ = (attempts??[]).reduce((s,a)=>s+a.total_questions,0)
    const totalC = (attempts??[]).reduce((s,a)=>s+a.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const completedHw = (homework??[]).filter(h=>h.status==='completed').length
    const totalHw = (homework??[]).length
    setStats({ studentCount:students.length, teacherCount:teachers.length, lessonCount:(lessons??[]).length, completedLessons:(lessons??[]).filter(l=>l.status==='completed').length, overallRate, totalQ, hwRate:totalHw>0?Math.round(completedHw/totalHw*100):0, examCount:(exams??[]).length })

    const teacherMap: any = {}
    for (const l of lessons??[]) {
      if (!l.teacher_id) continue
      if (!teacherMap[l.teacher_id]) teacherMap[l.teacher_id] = { name:l.profiles?.full_name, total:0, completed:0 }
      teacherMap[l.teacher_id].total++
      if (l.status==='completed') teacherMap[l.teacher_id].completed++
    }
    const teacherPerf = Object.values(teacherMap).map((t:any) => ({ ...t, rate:t.total>0?Math.round(t.completed/t.total*100):0 })).sort((a:any,b:any)=>b.completed-a.completed)
    setTeacherStats(teacherPerf)

    const subjectMap: any = {}
    for (const tp of topicPerf??[]) {
      const name = tp.subjects?.name??'Diğer', color = tp.subjects?.color??'#1B3A6B'
      if (!subjectMap[name]) subjectMap[name] = { rates:[], color }
      subjectMap[name].rates.push(tp.accuracy_rate)
    }
    const subjectPerf = Object.entries(subjectMap).map(([name,data]:any) => ({ name, color:data.color, avg:Math.round(data.rates.reduce((a:number,b:number)=>a+b,0)/data.rates.length), count:data.rates.length })).sort((a,b)=>a.avg-b.avg)
    setSubjectStats(subjectPerf)

    const riskList = []
    for (const s of students.slice(0,10)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id:s.id })
      if ((risk??0)>=45) riskList.push({ ...s, risk_score:risk??0 })
    }
    riskList.sort((a,b)=>b.risk_score-a.risk_score); setRiskStudents(riskList)

    const studentPerf = students.map(s => {
      const sA = (attempts??[]).filter(a=>a.student_id===s.id)
      const sQ = sA.reduce((sum,a)=>sum+a.total_questions,0)
      const sC = sA.reduce((sum,a)=>sum+a.correct_count,0)
      return { ...s, rate:sQ>0?Math.round(sC/sQ*100):0, total_questions:sQ }
    }).filter(s=>s.total_questions>0).sort((a,b)=>b.rate-a.rate).slice(0,5)
    setTopStudents(studentPerf)
    setLoading(false)
  }

  async function getAiInsight() {
    if (!stats) return
    setAiLoading(true); setAiInsight('')
    try {
      const res = await fetch('/api/ai/institution', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_count:stats.studentCount, teacher_count:stats.teacherCount, overall_rate:stats.overallRate, hw_rate:stats.hwRate, risk_count:riskStudents.length, weak_subjects:subjectStats.slice(0,2).map(s=>s.name+'(%'+s.avg+')').join(', '), strong_subjects:subjectStats.slice(-2).map(s=>s.name+'(%'+s.avg+')').join(', ') }) })
      const d = await res.json(); setAiInsight(d.insight??'')
    } catch { setAiInsight('AI analizi alınamadı.') }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Kurum verileri yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1>Kurum Zekası</h1>
          <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Kurum geneli performans ve risk analizi</p>
        </div>
        <button onClick={getAiInsight} disabled={aiLoading} style={{ padding:'9px 16px', borderRadius:'9px', background:'#6B4FC8', color:'#fff', fontSize:'12.5px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
          {aiLoading?'AI Analiz...':'AI Kurum Analizi'}
        </button>
      </div>

      {aiInsight && (
        <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'12px', padding:'16px', marginBottom:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#4C1D95', marginBottom:'8px' }}>AI Kurum Değerlendirmesi</div>
          <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiInsight}</div>
        </div>
      )}

      {stats && (
        <div className="metrics-row">
          {[
            { label:'Toplam Öğrenci', value:stats.studentCount, color:'#1B3A6B', bg:'#EEF3FB' },
            { label:'Genel Başarı', value:'%'+stats.overallRate, color:stats.overallRate>=70?'#14532D':stats.overallRate>=50?'#92400E':'#7F1D1D', bg:stats.overallRate>=70?'#DCFCE7':'#FEF3C7' },
            { label:'Ödev Tamamlama', value:'%'+stats.hwRate, color:'#4C1D95', bg:'#EDE9FE' },
            { label:'Risk Altındaki', value:riskStudents.length, color:'#7F1D1D', bg:'#FEF2F2' },
          ].map(m => (
            <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
              <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
              <div style={{ fontSize:'26px', fontWeight:700, color:m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="two-col" style={{ marginBottom:'16px' }}>
        {/* Ders bazlı */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Ders Bazlı Kurum Ortalaması</div>
          {subjectStats.length===0 ? <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Veri yok</div>
          : subjectStats.map(s => (
            <div key={s.name} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <div style={{ minWidth:'70px', fontSize:'12px', fontWeight:600, color:'#1B3A6B', flexShrink:0 }}>{s.name}</div>
              <div style={{ flex:1, height:'7px', background:'#F1F5F9', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:s.avg+'%', background:s.avg>=70?'#2E7D52':s.avg>=50?'#B45309':'#C0392B', borderRadius:'4px' }} />
              </div>
              <span style={{ fontSize:'12px', fontWeight:700, color:s.avg>=70?'#14532D':s.avg>=50?'#92400E':'#7F1D1D', width:'36px', textAlign:'right', flexShrink:0 }}>%{s.avg}</span>
            </div>
          ))}
        </div>

        {/* Öğretmen */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Öğretmen Ders Takibi</div>
          {teacherStats.length===0 ? <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Veri yok</div>
          : teacherStats.map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:i<teacherStats.length-1?'1px solid #F8FAFC':'none' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#14532D', flexShrink:0 }}>
                {t.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'12px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{t.completed}/{t.total} tamamlandı</div>
              </div>
              <span style={{ fontSize:'13px', fontWeight:700, color:t.rate>=80?'#14532D':t.rate>=60?'#92400E':'#7F1D1D', flexShrink:0 }}>%{t.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {/* Risk */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #FEE2E2', background:'#FEF2F2', fontSize:'13px', fontWeight:700, color:'#7F1D1D' }}>Risk Altındaki Öğrenciler</div>
          {riskStudents.length===0 ? (
            <div style={{ padding:'24px', textAlign:'center', fontSize:'13px', color:'#14532D' }}>Kritik risk yok!</div>
          ) : riskStudents.map((s,i) => {
            const rl = s.risk_score>=70 ? { color:'#7F1D1D', bg:'#FEF2F2', label:'Kritik' } : { color:'#92400E', bg:'#FEF3C7', label:'Yüksek' }
            return (
              <div key={s.id} style={{ padding:'11px 16px', borderBottom:i<riskStudents.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                  {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <span style={{ flex:1, fontSize:'12px', fontWeight:600, color:'#1B3A6B', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.full_name}</span>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:'16px', fontWeight:800, color:rl.color }}>{Math.round(s.risk_score)}</div>
                  <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 5px', borderRadius:'6px', background:rl.bg, color:rl.color }}>{rl.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top öğrenciler */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#14532D' }}>En Başarılı Öğrenciler</div>
          {topStudents.length===0 ? (
            <div style={{ padding:'24px', textAlign:'center', fontSize:'13px', color:'#7A8FA8' }}>Veri yok</div>
          ) : topStudents.map((s,i) => (
            <div key={s.id} style={{ padding:'11px 16px', borderBottom:i<topStudents.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'20px', fontSize:'13px', fontWeight:800, color:i===0?'#92400E':i===1?'#475569':'#9CA3AF', flexShrink:0, textAlign:'center' }}>{i+1}</div>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#14532D', flexShrink:0 }}>
                {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <span style={{ flex:1, fontSize:'12px', fontWeight:600, color:'#1B3A6B', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.full_name}</span>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:'16px', fontWeight:800, color:'#14532D' }}>%{s.rate}</div>
                <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{s.total_questions} soru</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}