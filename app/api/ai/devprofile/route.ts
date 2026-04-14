import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, strong_topics, weak_topics, total_questions, trend_up, trend_down, completed_homework, total_homework, completed_lessons, total_lessons } = await req.json()

    const prompt = `Sen uzman bir egitim analisti ve akademik danismanisin. Asagidaki veriye gore kapsamli bir akademik gelisim profili olustur.

OGRENCI: ${student_name}
GENEL BASARI: %${overall_rate}
RISK SKORU: ${risk_score}/100
GUCLU KONULAR: ${strong_topics}
GELISIM GEREKTIREN KONULAR: ${weak_topics}
TOPLAM COZULEN SORU: ${total_questions}
YUKSELIS TRENDI: ${trend_up} konu
DUSUS TRENDI: ${trend_down} konu
TAMAMLANAN ODEV: ${completed_homework}/${total_homework}
TAMAMLANAN DERS: ${completed_lessons}/${total_lessons}

Asagidaki bolumlerle TURKCE profil olustur:

AKADEMIK PROFIL OZETI
(3-4 cumle kapsamli degerlendirme)

GUCLU YONLER
(Somut veriye dayali)

GELISIME ACIK ALANLAR
(Oncelik sirasi ile)

CALISMA DAVRANISI ANALIZI
(Odev ve ders katilimi)

TREND ANALIZI
(Son doneme ait gelisim yonu)

ONCELIKLI EYLEM PLANI
(5 somut adim)

HEDEF VE BEKLENTI
(Gercekci hedefler)

Veri odakli, profesyonel ve motive edici bir dil kullan. Maksimum 600 kelime.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })

    const profile = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, profile })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
