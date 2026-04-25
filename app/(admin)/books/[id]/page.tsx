'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [editKeys, setEditKeys] = useState<Record<number,string>>({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('books')
      .select('*, chapters(*, tests(*, answer_keys(*)))')
      .eq('id', params.id).single()
    setBook(data)
    setLoading(false)
  }

  function openTest(test: any) {
    setSelectedTest(test)
    setSaveSuccess(false)
    const keys: Record<number,string> = {}
    for (const k of test.answer_keys ?? []) keys[k.question_no] = k.correct_answer
    setEditKeys(keys)
  }

  async function saveKeys() {
    if (!selectedTest) return
    setSaving(true); setSaveSuccess(false)

    // Mevcut cevapları sil
    await supabase.from('answer_keys').delete().eq('test_id', selectedTest.id)

    // Yeni cevapları ekle
    const inserts = Object.entries(editKeys)
      .filter(([_, v]) => v && v.trim())
      .map(([q, ans]) => ({
        test_id: selectedTest.id,
        question_no: parseInt(q),
        correct_answer: ans.toUpperCase().trim(),
      }))

    if (inserts.length > 0) {
      await supabase.from('answer_keys').insert(inserts)
    }

    await load()
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  async function deleteTest(testId: string) {
    if (!confirm('Bu testi silmek istiyor musunuz? Tüm cevap anahtarları da silinecek.')) return
    await supabase.from('answer_keys').delete().eq('test_id', testId)
    await supabase.from('homework_assignments').delete().eq('test_id', testId)
    await supabase.from('tests').delete().eq('id', testId)
    if (selectedTest?.id === testId) setSelectedTest(null)
    await load()
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>
  if (!book) return (
    <div style={{ padding:'40px', textAlign:'center' }}>
      <div style={{ fontSize:'14px', color:'#C0392B', marginBottom:'12px' }}>Kitap bulunamadı</div>
      <Link href="/books" style={{ color:'#1B3A6B', fontWeight:600, textDecoration:'none' }}>← Kitaplara Dön</Link>
    </div>
  )

  const totalTests = book.chapters?.reduce((s:number,c:any)=>s+(c.tests?.length??0),0)??0
  const totalQuestions = book.chapters?.reduce((s:number,c:any)=>s+(c.tests?.reduce((ts:number,t:any)=>ts+(t.question_count??0),0)??0),0)??0
  const OPTIONS = ['A','B','C','D','E']

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        <Link href="/books" style={{ fontSize:'12px', color:'#7A8FA8', textDecoration:'none' }}>← Kitap Kütüphanesi</Link>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12px', color:'#1B3A6B', fontWeight:600 }}>{book.name}</span>
      </div>

      {/* Kitap başlık */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
          <div style={{ width:'42px', height:'54px', borderRadius:'7px', background:book.color??'#1B3A6B', flexShrink:0 }} />
          <div style={{ flex:1, minWidth:'140px' }}>
            <h1 style={{ fontSize:'17px', fontWeight:700, color:'#1B3A6B', margin:'0 0 4px' }}>{book.name}</h1>
            <div style={{ fontSize:'12px', color:'#7A8FA8' }}>{book.subject} · {book.publisher??'—'}</div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {[
              { label:'Bölüm', value:book.chapters?.length??0 },
              { label:'Test', value:totalTests },
              { label:'Soru', value:totalQuestions },
            ].map(m => (
              <div key={m.label} style={{ background:'#F1F5F9', borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B' }}>{m.value}</div>
                <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selectedTest?'1fr 1fr':'1fr', gap:'16px' }}>

        {/* Sol: Bölüm/Test listesi */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {(book.chapters??[]).map((chapter:any) => (
            <div key={chapter.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{chapter.name}</span>
                <span style={{ fontSize:'12px', color:'#7A8FA8' }}>{chapter.tests?.length??0} test</span>
              </div>
              {(chapter.tests??[]).map((test:any, i:number) => (
                <div key={test.id} style={{ padding:'10px 16px', borderBottom:i<chapter.tests.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', background:selectedTest?.id===test.id?'#EEF3FB':'#fff', cursor:'pointer' }}
                  onClick={() => openTest(test)}>
                  <div style={{ flex:1, minWidth:'120px' }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{test.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{test.question_count} soru</div>
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 9px', borderRadius:'10px', background:test.answer_keys?.length>0?'#DCFCE7':'#FEF3C7', color:test.answer_keys?.length>0?'#14532D':'#92400E', flexShrink:0 }}>
                    {test.answer_keys?.length>0?'Cevap Var':'Cevap Yok'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); deleteTest(test.id) }}
                    style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                    Sil
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Sağ: Cevap düzenleme */}
        {selectedTest && (
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', alignSelf:'start', position:'sticky', top:'20px' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{selectedTest.name}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>{selectedTest.question_count} soru · Cevap Anahtarı</div>
              </div>
              <button onClick={() => setSelectedTest(null)}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'6px', color:'#fff', padding:'4px 10px', fontSize:'12px', cursor:'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding:'14px', maxHeight:'500px', overflowY:'auto' }}>
              {Array.from({ length: selectedTest.question_count }, (_, i) => {
                const q = i + 1
                return (
                  <div key={q} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                      {q}
                    </div>
                    <div style={{ display:'flex', gap:'5px', flex:1 }}>
                      {OPTIONS.map(opt => (
                        <button key={opt} onClick={() => setEditKeys(p => ({ ...p, [q]: p[q] === opt ? '' : opt }))}
                          style={{ flex:1, padding:'6px 0', borderRadius:'7px', border:'1.5px solid', borderColor:editKeys[q]===opt?'#1B3A6B':'#E2E8F0', background:editKeys[q]===opt?'#1B3A6B':'#fff', color:editKeys[q]===opt?'#fff':'#475569', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                          {opt}
                        </button>
                      ))}
                      {editKeys[q] && (
                        <button onClick={() => setEditKeys(p => { const n={...p}; delete n[q]; return n })}
                          style={{ padding:'6px 8px', borderRadius:'7px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', cursor:'pointer', flexShrink:0 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding:'12px 14px', borderTop:'1px solid #E2E8F0', display:'flex', gap:'8px', alignItems:'center' }}>
              <button onClick={saveKeys} disabled={saving}
                style={{ flex:1, padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Cevapları Kaydet'}
              </button>
              {saveSuccess && (
                <span style={{ fontSize:'12px', color:'#14532D', fontWeight:600 }}>✓ Kaydedildi!</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}