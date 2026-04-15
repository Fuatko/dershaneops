import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*, chapters(*, tests(*, answer_keys(*)))')
    .eq('id', params.id)
    .single()

  if (!book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#C0392B', marginBottom: '12px' }}>Kitap bulunamadı</div>
        <Link href="/books" style={{ color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>← Kitaplara Dön</Link>
      </div>
    )
  }

  const totalTests = book.chapters?.reduce((s: number, c: any) => s + (c.tests?.length ?? 0), 0) ?? 0
  const totalQuestions = book.chapters?.reduce((s: number, c: any) =>
    s + (c.tests?.reduce((ts: number, t: any) => ts + (t.question_count ?? 0), 0) ?? 0), 0) ?? 0

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/books" style={{ fontSize: '12.5px', color: '#7A8FA8', textDecoration: 'none' }}>← Kitap Kütüphanesi</Link>
        <span style={{ color: '#D5DFF0' }}>/</span>
        <span style={{ fontSize: '12.5px', color: '#1B3A6B', fontWeight: 600 }}>{book.name}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '60px', borderRadius: '8px', background: book.color ?? '#1B3A6B', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '0 0 4px' }}>{book.name}</h1>
            <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>{book.subject} • {book.publisher ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Bölüm', value: book.chapters?.length ?? 0 },
              { label: 'Test', value: totalTests },
              { label: 'Soru', value: totalQuestions },
            ].map(m => (
              <div key={m.label} style={{ background: '#F0F4F9', borderRadius: '8px', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1B3A6B' }}>{m.value}</div>
                <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(book.chapters ?? []).map((chapter: any) => (
          <div key={chapter.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#F5F8FF', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{chapter.name}</span>
              <span style={{ fontSize: '12px', color: '#7A8FA8' }}>{chapter.tests?.length ?? 0} test</span>
            </div>
            {(chapter.tests ?? []).map((test: any, i: number) => (
              <div key={test.id} style={{ padding: '11px 18px', borderBottom: i < chapter.tests.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{test.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{test.question_count} soru</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '10px', background: test.answer_keys?.length > 0 ? '#EAF4EE' : '#FDF4E7', color: test.answer_keys?.length > 0 ? '#2E7D52' : '#B45309' }}>
                  {test.answer_keys?.length > 0 ? 'Cevap Anahtarı Var' : 'Cevap Anahtarı Yok'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}