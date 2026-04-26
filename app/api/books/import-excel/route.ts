import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ ok: false, error: 'Dosya bulunamadi.' })

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)
    if (rows.length === 0) return NextResponse.json({ ok: false, error: 'Dosya bos.' })

    const supabase = createClient()

    // Giren kullanicinin tenant_id'sini al
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Yetkisiz erisim.' })
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    const tenantId = prof?.tenant_id
    if (!tenantId) return NextResponse.json({ ok: false, error: 'Tenant bulunamadi.' })

    let count = 0
    const testQuestionCounts: Record<string, number> = {}

    for (const row of rows) {
      const kitapAdi   = row['kitap_adi']?.toString().trim()
      const bolumAdi   = row['bolum_adi']?.toString().trim()
      const testAdi    = row['test_adi']?.toString().trim()
      const soruNo     = parseInt(row['soru_no'])
      const dogruCevap = row['dogru_cevap']?.toString().trim().toUpperCase()

      if (!kitapAdi || !bolumAdi || !testAdi || !soruNo || !dogruCevap) continue

      // Kitap upsert
      let { data: book } = await supabase.from('books').select('id')
        .eq('name', kitapAdi).eq('tenant_id', tenantId).single()
      if (!book) {
        const { data: newBook } = await supabase.from('books')
          .insert({ name: kitapAdi, subject: 'Genel', grade: 'Genel', tenant_id: tenantId })
          .select('id').single()
        book = newBook
      }
      if (!book) continue

      // Bolum upsert
      let { data: chapter } = await supabase.from('chapters').select('id')
        .eq('book_id', book.id).eq('name', bolumAdi).single()
      if (!chapter) {
        const { data: newChapter } = await supabase.from('chapters')
          .insert({ book_id: book.id, name: bolumAdi, order_no: 1, tenant_id: tenantId })
          .select('id').single()
        chapter = newChapter
      }
      if (!chapter) continue

      // Test upsert
      let { data: test } = await supabase.from('tests').select('id')
        .eq('chapter_id', chapter.id).eq('name', testAdi).single()
      if (!test) {
        const { data: newTest } = await supabase.from('tests')
          .insert({ chapter_id: chapter.id, name: testAdi, question_count: 0, tenant_id: tenantId })
          .select('id').single()
        test = newTest
      }
      if (!test) continue

      // Cevap anahtari upsert
      await supabase.from('answer_keys').upsert({
        test_id: test.id,
        question_no: soruNo,
        correct_answer: dogruCevap,
      }, { onConflict: 'test_id,question_no' })

      // question_count takibi
      if (!testQuestionCounts[test.id]) testQuestionCounts[test.id] = 0
      if (soruNo > testQuestionCounts[test.id]) testQuestionCounts[test.id] = soruNo

      count++
    }

    // Her test icin question_count guncelle
    for (const [testId, qCount] of Object.entries(testQuestionCounts)) {
      await supabase.from('tests').update({ question_count: qCount }).eq('id', testId)
    }

    return NextResponse.json({ ok: true, count })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
