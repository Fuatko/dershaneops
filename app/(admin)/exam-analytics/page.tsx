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
    setStudents(data??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    const { data } = await supabase.from('exam_results').select('*, exams(name, exam_date, exam_type), subjects(name, color)').eq('student_id', s.id).order('created_at', { ascending:true })
    setExamResults(data??[])
  }

  const examGroups = examResults.reduce((acc:any, r:any) => {
    const key = r.exam_id
    if (!acc[key]) acc[key] = { exam:r.exams, exam_id:r.exam_id, subjects:[], totalNet:0, date:r.exams?.exam_date }
    acc[key].subjects.push(r); acc[key].totalNet += r.net; return acc
  }, {})

  const examList = Object.values(examGroups).sort((a:any,b:any) => new Date(a.date).getTime()-new Date(b.date).getTime()) as any[]
  const allNets = examList.map((e:any)=>e.totalNet)
  const last5Nets = allNets.slice(-5), last10Nets = allNets.slice(-10)
  const avg = (arr:number[]) => arr.length>0 ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*100)/100 : 0
  const overallAvg = avg(allNets), last5Avg = avg(last5Nets), last10Avg = avg(last10Nets)
  const lastNet = allNets[allNets.length-1]??0
  const trend = last5Avg>last10Avg?'up':last5Avg<last10Avg?'down':'stable'
  const trendColor = trend==='up'?'#14532D':trend==='down'?'#7F1D1D':'#1B3A6B'
  const trendIcon = trend==='up'?'↑':trend==='down'?'↓':'→'

  const subjectAvgs = examResults.reduce((acc:any, r:any) => {
    const name = r.subjects?.name??'Diğer'
    if (!acc[name]) acc[name] = { nets:[], color:r.subjects?.color }
    acc[name].nets.push(r.net); return acc
  }, {})

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Sınav Analizi</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Genel ortalama, son 5 ve son 10 sınav karşılaştırması</p>
      </div>

      <div className="sidebar-dropdown">
        <select value={selected?.id??''} onChange={e => { const s=students.find(x=>x.id===e.target.value); if(s) selectStudent(s) }}>
          <option value="">Öğrenci seçin...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="sidebar-layout">
        <div className="sidebar-list">
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğrenci Seç</div>
            <div style={{ maxHeight:'360px', overflowY:'auto' }}>
              {students.map(s => (
                <div key={s.id} onClick={() => selectStudent(s)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <span style={{ fontSize:'12.5px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!selected ? (
          <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
          </div>
        ) : examList.length===0 ? (
          <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#92400E' }}>Henüz deneme sonucu yok</div>
          </div>
        ) : (
          <div>
            <div className="metrics-row">
              {[
                { label:'Genel Ortalama', value:overallAvg, count:examList.length+' sınav', color:'#1B3A6B', bg:'#EEF3FB' },
                { label:'Son 10 Ortalama', value:last10Avg, count:Math.min(10,examList.length)+' sınav', color:'#4C1D95', bg:'#EDE9FE' },
                { label:'Son 5 Ortalama', value:last5Avg, count:Math.min(5,examList.length)+' sınav', color:last5Avg>=overallAvg?'#14532D':'#7F1D1D', bg:last5Avg>=overallAvg?'#DCFCE7':'#FEF2F2' },
                { label:'Son Sınav', value:Math.round(lastNet*100)/100, count:trendIcon+' '+(trend==='up'?'Yükseliyor':trend==='down'?'Düşüyor':'Stabil'), color:trendColor, bg:trend==='up'?'#DCFCE7':trend==='down'?'#FEF2F2':'#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                  <div style={{ fontSize:'24px', fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px', color:'#7A8FA8', marginTop:'2px' }}>{m.count}</div>
                </div>
              ))}
            </div>

            {/* Trend Grafiği */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Net Trendi</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'100px' }}>
                {examList.map((e:any,i:number) => {
                  const maxNet = Math.max(...allNets)
                  const height = maxNet>0 ? Math.round(e.totalNet/maxNet*100) : 0
                  const isLast5 = i>=examList.length-5
                  const isLatest = i===examList.length-1
                  return (
                    <div key={e.exam_id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                      <div style={{ fontSize:'8px', color:'#7A8FA8' }}>{Math.round(e.totalNet)}</div>
                      <div style={{ width:'100%', height:height+'%', minHeight:'4px', background:isLatest?'#1B3A6B':isLast5?'#6B4FC8':'#D5DFF0', borderRadius:'3px 3px 0 0' }} />
                      <div style={{ fontSize:'7px', color:'#9CA3AF', textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {new Date(e.date).toLocaleDateString('tr-TR', { month:'short', day:'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ders bazlı */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Ders Bazlı Ortalama Net</div>
              {Object.entries(subjectAvgs).map(([name,data]:any) => {
                const subAvg = avg(data.nets)
                const lastSubNet = data.nets[data.nets.length-1]??0
                const subTrend = data.nets.length>=2 ? (lastSubNet>avg(data.nets.slice(0,-1))?'up':'down') : 'stable'
                return (
                  <div key={name} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', background:'#F8FAFC', border:'1px solid #E2E8F0', marginBottom:'6px' }}>
                    <div style={{ minWidth:'70px', flexShrink:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B' }}>{name}</div>
                      <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{data.nets.length} sınav</div>
                    </div>
                    <div style={{ flex:1, height:'5px', background:'#E2E8F0', borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:Math.min((subAvg/40)*100,100)+'%', background:data.color??'#1B3A6B', borderRadius:'3px' }} />
                    </div>
                    <div style={{ fontSize:'12px', color:'#7A8FA8', flexShrink:0 }}>
                      <strong style={{ color:'#1B3A6B' }}>{subAvg}</strong>
                      <span style={{ marginLeft:'6px', color:subTrend==='up'?'#14532D':subTrend==='down'?'#7F1D1D':'#1B3A6B' }}>
                        Son:{Math.round(lastSubNet*100)/100} {subTrend==='up'?'↑':subTrend==='down'?'↓':''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sınav listesi */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
                Tüm Sınavlar ({examList.length})
              </div>
              {[...examList].reverse().map((e:any,i:number) => (
                <div key={e.exam_id} style={{ padding:'12px 16px', borderBottom:i<examList.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                    {examList.length-i}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', marginBottom:'3px' }}>{e.exam?.name}</div>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                      {e.subjects.map((s:any) => (
                        <span key={s.id} style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'6px', background:'#F1F5F9', color:'#475569' }}>
                          {s.subjects?.name}: {Math.round(s.net*100)/100}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'18px', fontWeight:800, color:'#1B3A6B' }}>{Math.round(e.totalNet*100)/100}</div>
                    <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{new Date(e.date).toLocaleDateString('tr-TR')}</div>
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