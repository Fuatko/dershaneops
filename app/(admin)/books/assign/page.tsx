'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AssignHomeworkPage() {
  const [books, setBooks] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [selectedChapter, setSelectedChapter] = useState<any>(null)
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: b } = await supabase
        .from('books')
        .select('*, chapters(id, name, order_no, tests(id, name, question_count))')
        .order('name')

      const { data: s } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .order('full_name')

      setBooks(b ?? [])
      setStudents(s ?? [])
    }
    load()
  }, [])

  function toggleTest(testId: string) {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(t => t !== testId) : [...prev, testId]
    )
  }

  function toggleStudent(studentId: string) {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]
    )
  }

  function selectAllStudents() {
    setSelectedStudents(students.map(s => s.id))
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (selectedTests.length === 0) { setError('En az bir test secin.'); return }
    if (selectedStudents.length === 0) { setError('En az bir ogrenci secin.'); return }
    setLoading(true)
    setError('')

    const inserts = []
    for (const testId of selectedTests) {
      for (const studentId of selectedStudents) {
        inserts.push({
          test_id: testId,
          student_id: studentId,
          status: 'pending',
          deadline: deadline || null,
        })
      }
    }

    const { error: err } = await supabase
      .from('homework_assignments')
      .insert(inserts)

    if (err) {
      setError('Hata: ' + err.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/books'), 1500)
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '7px',
    border: '1px solid #D5DFF0', fontSize: '12.5px',
    color: '#1B3A6B', outline: 'none', background: '#fff',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/books" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>← Kitap Kutuphanesi</a>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '8px 0 2px' }}>Odev Ata</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: 0 }}>Kitap secin, test secin, ogrenci secin</p>
      </div>

      {success && (
        <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '10px', padding: '16px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#2E7D52', textAlign: 'center' }}>
          Odev basariyla atandi! Yonlendiriliyor...
        </div>
      )}

      <form onSubmit={handleAssign}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Sol: Kitap ve Test Secimi */}
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>
                1. Kitap Sec
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {books.map(book => (
                  <div
                    key={book.id}
                    onClick={() => { setSelectedBook(book); setSelectedChapter(null); setSelectedTests([]) }}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                      border: `1px solid ${selectedBook?.id === book.id ? book.color ?? '#1B3A6B' : '#D5DFF0'}`,
                      background: selectedBook?.id === book.id ? (book.color ?? '#1B3A6B') + '12' : '#fff',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: book.color ?? '#1B3A6B', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{book.name}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{book.subject} — {book.grade}</div>
                    </div>
                  </div>
                ))}
                {books.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '16px' }}>
                    Kitap bulunamadi. <a href="/books/new" style={{ color: '#1B3A6B' }}>Kitap ekle</a>
                  </div>
                )}
              </div>
            </div>

            {selectedBook && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>
                  2. Bolum ve Test Sec
                </div>
                {(selectedBook.chapters ?? []).map((ch: any) => (
                  <div key={ch.id} style={{ marginBottom: '10px' }}>
                    <div
                      onClick={() => setSelectedChapter(selectedChapter?.id === ch.id ? null : ch)}
                      style={{ fontSize: '12px', fontWeight: 700, color: '#4A6080', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', background: '#F5F8FF', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span>{ch.name}</span>
                      <span style={{ color: '#7A8FA8' }}>{selectedChapter?.id === ch.id ? '▲' : '▼'}</span>
                    </div>
                    {selectedChapter?.id === ch.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                        {(ch.tests ?? []).map((test: any) => (
                          <label key={test.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', border: `1px solid ${selectedTests.includes(test.id) ? '#1B3A6B' : '#D5DFF0'}`, background: selectedTests.includes(test.id) ? '#EEF3FB' : '#fff' }}>
                            <input
                              type="checkbox"
                              checked={selectedTests.includes(test.id)}
                              onChange={() => toggleTest(test.id)}
                              style={{ accentColor: '#1B3A6B' }}
                            />
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{test.name}</div>
                              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{test.question_count} soru</div>
                            </div>
                          </label>
                        ))}
                        {(ch.tests ?? []).length === 0 && (
                          <div style={{ fontSize: '12px', color: '#7A8FA8', padding: '8px' }}>Bu bolumde test yok</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedTests.length > 0 && (
              <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1B3A6B', marginBottom: '14px' }}>
                {selectedTests.length} test secildi
              </div>
            )}
          </div>

          {/* Sag: Ogrenci Secimi ve Son Tarih */}
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>3. Ogrenci Sec</div>
                <button type="button" onClick={selectAllStudents} style={{ fontSize: '11.5px', color: '#1B3A6B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                  Tumunu Sec
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '280px', overflowY: 'auto' }}>
                {students.map(student => (
                  <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', border: `1px solid ${selectedStudents.includes(student.id) ? '#1B3A6B' : '#D5DFF0'}`, background: selectedStudents.includes(student.id) ? '#EEF3FB' : '#fff' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      style={{ accentColor: '#1B3A6B' }}
                    />
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#1B3A6B' }}>{student.full_name}</span>
                  </label>
                ))}
                {students.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '16px' }}>
                    Ogrenci bulunamadi. <a href="/students/new" style={{ color: '#1B3A6B' }}>Ogrenci ekle</a>
                  </div>
                )}
              </div>
              {selectedStudents.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#1B3A6B', fontWeight: 600 }}>
                  {selectedStudents.length} ogrenci secildi
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>4. Son Tarih (Opsiyonel)</div>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={inp}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#C0392B', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || selectedTests.length === 0 || selectedStudents.length === 0}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                background: selectedTests.length > 0 && selectedStudents.length > 0 ? '#1B3A6B' : '#A0B0C8',
                color: '#fff', fontSize: '14px', fontWeight: 700,
                border: 'none', cursor: selectedTests.length > 0 && selectedStudents.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Ataniyor...' : `${selectedTests.length} Test — ${selectedStudents.length} Ogrenciye Ata`}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
