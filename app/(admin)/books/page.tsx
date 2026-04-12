import { createClient } from '@/lib/supabase/server'

export default async function BooksPage() {
  const supabase = createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*, chapters(id, tests(id))')
    .order('name')

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Kitap Kütüphanesi</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
            {books?.length ?? 0} kitap tanımlı
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/books/import" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', background: '#EAF4EE', color: '#2E7D52', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #A7D9B8' }}>
            Excel / OCR
          </a>
          <a href="/books/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Kitap Ekle
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
        {books && books.length > 0 ? books.map((book) => {
          const chapterCount = book.chapters?.length ?? 0
          const testCount = book.chapters?.reduce((a: number, c: any) => a + (c.tests?.length ?? 0), 0) ?? 0
          const colors = ['#1B3A6B','#2E7D52','#6B4FC8','#B45309','#C0392B','#0F7070']
          const color = book.color ?? colors[0]
          return (
            <div key={book.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              <div style={{ height: '5px', background: color }} />
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '50px', borderRadius: '5px', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="1" width="10" height="14" rx="2" stroke={color} strokeWidth="1.3" fill="none"/>
                      <path d="M5 5h5M5 8h5M5 11h3" stroke={color} strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', lineHeight: 1.3, marginBottom: '3px' }}>{book.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{book.publisher} • {book.grade}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '20px', background: '#F0F4F9', color: '#4A6080', fontWeight: 500 }}>{book.subject}</span>
                  <span style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '20px', background: '#F0F4F9', color: '#4A6080', fontWeight: 500 }}>{chapterCount} bölüm</span>
                  <span style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '20px', background: '#F0F4F9', color: '#4A6080', fontWeight: 500 }}>{testCount} test</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a href={`/books/${book.id}`} style={{ flex: 1, padding: '7px', borderRadius: '7px', background: '#F0F4F9', color: '#1B3A6B', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center', border: '1px solid #D5DFF0' }}>
                    Detay
                  </a>
                  <a href={`/books/${book.id}/assign`} style={{ flex: 1, padding: '7px', borderRadius: '7px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                    Ödev Ver
                  </a>
                </div>
              </div>
            </div>
          )
        }) : (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '13px', color: '#7A8FA8', marginBottom: '12px' }}>Henüz kitap eklenmemiş</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <a href="/books/import" style={{ fontSize: '13px', color: '#2E7D52', fontWeight: 600, textDecoration: 'none' }}>Excel ile Yükle</a>
              <span style={{ color: '#7A8FA8' }}>veya</span>
              <a href="/books/new" style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>Manuel Ekle</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
