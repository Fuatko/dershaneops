'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BranchReportPage({ params }: { params: { branchId: string } }) {
  const [branch, setBranch] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [allBranchStats, setAllBranchStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [params.branchId])

  async function load() {
    // Sube bilgisi
    const { data: b } = await supabase.from('branches').select('*, tenants(name)').eq('id', params.branchId).single()
    setBranch(b)

    // Bu subedeki ogrenciler ve sonuclari
    const { data: studs } = await supabase
      .from('profiles')
      .select('id, full_name, grade_level, school_id')
      .eq('branch_id', params.branchId)
      .eq('role', 'student')
      .order('full_name')

    // Her ogrenci icin exam sonuclari
    const studentsWithScores = []
    for (const s of studs ?? []) {
      const { data: exams } = await supabase
        .from('exam_results')
        .select('score, correct_count, wrong_count, net')
        .eq('student_id', s.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const avgScore = exams?.length ? Math.round(exams.reduce((a,e) => a + (e.score??0), 0) / exams.length) : 0
      const avgNet = exams?.length ? Math.round(exams.reduce((a,e) => a + (e.net??0), 0) / exams.length * 10) / 10 : 0
      studentsWithScores.push({ ...s, avgScore, avgNet, examCount: exams?.length ?? 0 })
    }
    setStudents(studentsWithScores)

    // Tum tenant ortalamalari
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
      if (prof?.tenant_id) {
        const { data: allStudents } = await supabase
          .from('profiles')
          .select('id')
          .eq('tenant_id', prof.tenant_id)
          .eq('role', 'student')

        if (allStudents?.length) {
          const { data: allExams } = await supabase
            .from('exam_results')
            .select('score, net')
            .in('student_id', allStudents.map(s => s.id))

          const tenantAvgScore = allExams?.length ? Math.round(allExams.reduce((a,e) => a + (e.score??0), 0) / allExams.length) : 0
          const tenantAvgNet = allExams?.length ? Math.round(allExams.reduce((a,e) => a + (e.net??0), 0) / allExams.length * 10) / 10 : 0

          const branchAvgScore = studentsWithScores.length ? Math.round(studentsWithScores.reduce((a,s) => a + s.avgScore, 0) / studentsWithScores.length) : 0

          setAllBranchStats({ tenantAvgScore, tenantAvgNet, branchAvgScore, totalStudents: allStudents.length })
        }
      }
    }

    setLoading(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>
  if (!branch) return null

  const branchAvg = students.length ? Math.round(students.reduce((a,s) => a + s.avgScore, 0) / students.length) : 0

  return (
    <div style={{ padding:'24px 20px', maxWidth:'1000px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ marginBottom:'20px' }}>
        <a href="/branches" style={{ fontSize:'12px', color:'#94A3B8', textDecoration:'none' }}>← Subeler</a>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:'6px 0 2px' }}>{branch.name} — Sube Raporu</h1>
        <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>{branch.tenants?.name}</p>
      </div>

      {/* Karsilastirma Kartlari */}
      {allBranchStats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
          <div style={{ background:'#EEF3FB', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', color:'#7A8FA8', marginBottom:'6px', fontWeight:600 }}>BU SUBE ORTALAMASI</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#1B3A6B' }}>{branchAvg}</div>
            <div style={{ fontSize:'11px', color:'#7A8FA8' }}>puan</div>
          </div>
          <div style={{ background:'#DCFCE7', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', color:'#2E7D52', marginBottom:'6px', fontWeight:600 }}>KURUM GENEL ORTALAMASI</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#2E7D52' }}>{allBranchStats.tenantAvgScore}</div>
            <div style={{ fontSize:'11px', color:'#2E7D52' }}>puan</div>
          </div>
          <div style={{ background: branchAvg >= allBranchStats.tenantAvgScore ? '#DCFCE7' : '#FEF2F2', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', marginBottom:'6px', fontWeight:600, color: branchAvg >= allBranchStats.tenantAvgScore ? '#2E7D52' : '#DC2626' }}>FARK</div>
            <div style={{ fontSize:'28px', fontWeight:800, color: branchAvg >= allBranchStats.tenantAvgScore ? '#2E7D52' : '#DC2626' }}>
              {branchAvg >= allBranchStats.tenantAvgScore ? '+' : ''}{branchAvg - allBranchStats.tenantAvgScore}
            </div>
            <div style={{ fontSize:'11px', color:'#94A3B8' }}>genel ortalamayla fark</div>
          </div>
        </div>
      )}

      {/* Ogrenci Listesi */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
          Ogrenciler ({students.length})
        </div>
        {students.length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Bu subede henuz ogrenci yok</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Ogrenci','Sinif','Sinav Sayisi','Sube Ortalamasi','Kurum Ortalamasi','Durum'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#475569', fontSize:'11px', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const diff = s.avgScore - branchAvg
                const tenantDiff = s.avgScore - (allBranchStats?.tenantAvgScore ?? 0)
                return (
                  <tr key={s.id} style={{ borderBottom:'1px solid #F8FAFC', background:i%2===0?'#fff':'#FAFBFC' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'#1B3A6B', fontSize:'13px' }}>{s.full_name}</td>
                    <td style={{ padding:'10px 14px', color:'#475569', fontSize:'12px' }}>{s.grade_level ? s.grade_level+'. Sinif' : '-'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569', fontSize:'12px' }}>{s.examCount}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>{s.avgScore}</span>
                        <span style={{ fontSize:'11px', color: diff >= 0 ? '#2E7D52' : '#DC2626', fontWeight:600 }}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:'11px', color: tenantDiff >= 0 ? '#2E7D52' : '#DC2626', fontWeight:600 }}>
                        {tenantDiff >= 0 ? '+' : ''}{tenantDiff}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:700,
                        background: s.avgScore >= 70 ? '#DCFCE7' : s.avgScore >= 40 ? '#FEF3C7' : '#FEF2F2',
                        color: s.avgScore >= 70 ? '#2E7D52' : s.avgScore >= 40 ? '#B45309' : '#DC2626' }}>
                        {s.avgScore >= 70 ? 'Iyi' : s.avgScore >= 40 ? 'Orta' : 'Dusuk'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
