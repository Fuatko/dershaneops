'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BookAssignPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: b } = await supabase.from('books').select('*, chapters(*, tests(*))').eq('id', bookId).single()
    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setBook(b); setChapters(b?.chapters??[]); setStudents(s??[]); setLoading(false)
  }

  function toggleTest(testId: string) {
    setSelectedTests(prev => prev.includes(testId) ? prev.filter(id=>id!==testId) : [...prev, testId])
  }
  function toggleChapter(chapter: any) {
    const testIds = chapter.tests?.map((t:any)=>t.id)??[]
    const allSelected = testIds.every((id:string)=>selectedTests.includes(id))
    if (allSelected) setSelectedTests(prev=>prev.filter(id=>!testIds.includes(id)))
    else setSelectedTests(prev=>[...new Set([...prev,...testIds])])
  }

  async function handleAssign() {
    if (!selectedStudent||selectedTests.length===0) { alert('Öğrenci ve en az bir test seçin!'); return }
    setSaving(true); setSuccess(false)
    const inserts = selectedTests.map(testId => ({ student_id:selectedStudent, test_id:testId, deadline:deadline||null, status:'pending', tenant_id:'61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f' }))
    const { error } = await supabase.from('homework_assignments').insert(inserts)
    if (error) { alert('Hata: '+error.message); setSaving(false); return }
    setSuccess(true); setSelectedTests([]); setSelectedStudent(''); setDeadline(''); setSaving(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' }

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        <a href="/books" style={{ fontSize:'12px', color:'#7A8FA8', textDecoration:'none' }}>← Kitap Kütüphanesi</a>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <a href={`/books/${bookId}`} style={{ fontSize:'12px', color:'#7A8FA8', textDecoration:'none' }}>{book?.name}</a>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12px', color:'#1B3A6B', fontWeight:600 }}>Ödev Ver</span>
      </div>

      {/* Mobil: ayarlar üstte */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>Ödev Ayarları</div>
        <div className="grid-2" style={{ marginBottom:'12px' }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.3px' }}>Öğrenci *</label>
            <select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} style={inp}>
              <option value="">Öğrenci seçin...</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.3px' }}>Son Teslim</label>
            <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={inp} />
          </div>
        </div>

        {selectedTests.length>0 && (
          <div style={{ background:'#EEF3FB', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #BFDBFE' }}>
            <span style={{ fontSize:'12px', fontWeight:600, color:'#1B3A6B' }}>{selectedTests.length} test seçildi</span>
            {selectedStudent && <span style={{ fontSize:'11px', color:'#475569' }}>{students.find(s=>s.id===selectedStudent)?.full_name}</span>}
          </div>
        )}

        {success && (
          <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', fontSize:'12.5px', color:'#14532D', fontWeight:600 }}>
            Ödev başarıyla atandı!
          </div>
        )}

        <button onClick={handleAssign} disabled={saving||selectedTests.length===0||!selectedStudent}
          style={{ width:'100%', padding:'11px', borderRadius:'9px', background:selectedTests.length>0&&selectedStudent?'#1B3A6B':'#E2E8F0', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
          {saving?'Atanıyor...':'Ödev Ata'}
        </button>
      </div>

      {/* Test seçimi */}
      <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>
        Test Seç ({selectedTests.length} seçildi)
      </div>
      {chapters.map(chapter => {
        const testIds = chapter.tests?.map((t:any)=>t.id)??[]
        const allSelected = testIds.length>0&&testIds.every((id:string)=>selectedTests.includes(id))
        return (
          <div key={chapter.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', marginBottom:'10px' }}>
            <div style={{ padding:'10px 14px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={()=>toggleChapter(chapter)}>
              <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:'2px solid', borderColor:allSelected?'#1B3A6B':'#E2E8F0', background:allSelected?'#1B3A6B':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {allSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', flex:1 }}>{chapter.name}</span>
              <span style={{ fontSize:'11px', color:'#7A8FA8' }}>{chapter.tests?.length??0} test</span>
            </div>
            {(chapter.tests??[]).map((test:any,i:number) => {
              const isSelected = selectedTests.includes(test.id)
              return (
                <div key={test.id} onClick={()=>toggleTest(test.id)} style={{ padding:'10px 14px', borderBottom:i<chapter.tests.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:isSelected?'#F0F4FF':'#fff' }}>
                  <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:'2px solid', borderColor:isSelected?'#1B3A6B':'#E2E8F0', background:isSelected?'#1B3A6B':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{test.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{test.question_count} soru</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}