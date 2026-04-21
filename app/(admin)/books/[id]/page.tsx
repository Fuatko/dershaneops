import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: book } = await supabase.from('books').select('*, chapters(*, tests(*, answer_keys(*)))').eq('id', params.id).single()

  if (!book) return (
    <div style={{ padding:'40px', textAlign:'center' }}>
      <div style={{ fontSize:'14px', color:'#C0392B', marginBottom:'12px' }}>Kitap bulunamadı</div>
      <Link href="/books" style={{ color:'#1B3A6B', fontWeight:600, textDecoration:'none' }}>← Kitaplara Dön</Link>
    </div>
  )

  const totalTests = book.chapters?.reduce((s:number,c:any)=>s+(c.tests?.length??0),0)??0
  const totalQuestions = book.chapters?.reduce((s:number,c:any)=>s+(c.tests?.reduce((ts:number,t:any)=>ts+(t.question_count??0),0)??0),0)??0

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        <Link href="/books" style={{ fontSize:'12px', color:'#7A8FA8', textDecoration:'none' }}>← Kitap Kütüphanesi</Link>
        <span style={{ color:'#D5DFF0' }}>/</span>
        <span style={{ fontSize:'12px', color:'#1B3A6B', fontWeight:600 }}>{book.name}</span>
      </div>

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

      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {(book.chapters??[]).map((chapter:any) => (
          <div key={chapter.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'11px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{chapter.name}</span>
              <span style={{ fontSize:'12px', color:'#7A8FA8' }}>{chapter.tests?.length??0} test</span>
            </div>
            {(chapter.tests??[]).map((test:any,i:number) => (
              <div key={test.id} style={{ padding:'10px 16px', borderBottom:i<chapter.tests.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:'120px' }}>
                  <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{test.name}</div>
                  <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{test.question_count} soru</div>
                </div>
                <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 9px', borderRadius:'10px', background:test.answer_keys?.length>0?'#DCFCE7':'#FEF3C7', color:test.answer_keys?.length>0?'#14532D':'#92400E', flexShrink:0 }}>
                  {test.answer_keys?.length>0?'Cevap Var':'Cevap Yok'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}