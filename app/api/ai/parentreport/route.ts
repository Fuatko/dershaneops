import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, strong_topics, weak_topics, total_questions, completed_homework, total_homework, completed_lessons, total_lessons } = await req.json()

    const prompt = `Sen bir egitim danismanisin. Bir ogrencinin velisine sunulmak uzere profesyonel bir gelisim raporu yaz.

Ogrenci: ${student_name}
Genel Basari: %${overall_rate}
Risk Skoru: ${risk_score}/100
Guclu Konular: ${strong_topics}
Gelisim Gerektiren Konular: ${weak_topics}
Cozulen Toplam Soru: ${total_questions}
Tamamlanan Odev: ${completed_homework}/${total_homework}
Tamamlanan Ders: ${completed_lessons}/${total_lessons}

Lutfen asagidaki bolumlerle Turkce rapor yaz:

GENEL DEGERLENDIRME
(2-3 cumle ozet)

AKADEMIK PERFORMANS
(Guclu ve gelisime acik alanlar)

CALISMA ALISKANLIKLARI
(Odev ve ders katilimi hakkinda)

GELISIM ONERILERI
(3-4 somut oneri)

VELI ICIN NOTLAR
(Evde desteklenebilecek alanlar)

Profesyonel, sicak, umut verici ve somut bir dil kullan. Akademik jargondan kacin. Maksimum 500 kelime.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    const report = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, report })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
