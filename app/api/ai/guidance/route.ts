import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, hw_rate, streak, absent_count, weak_topics, goals } = await req.json()

    const prompt = `Sen bir okul rehberlik uzmanisin. Bir ogrencinin durumunu degerlendirip rehberlik onerileri sun.

OGRENCI: ${student_name}
AKADEMIK DURUM:
- Genel Basari: %${overall_rate}
- Risk Skoru: ${risk_score}/100
- Odev Tamamlama: %${hw_rate}
- Gun Serisi: ${streak} gun
- Devamsizlik: ${absent_count} ders
- Zayif Konular: ${weak_topics}
- Hedefler: ${goals}

Turkce olarak rehberlik raporu hazirla:

AKADEMIK DEGERLENDIRME
(Ogrencinin genel akademik durumu)

PSIKOSOSYAL DEGERLENDIRME
(Motivasyon, devamsizlik, calisma aliskanliklar)

ACIL MUDAHALE GEREKTIREN ALANLAR
(Varsa kritik riskler)

REHBERLIK ONERILERI
(Ogrenciye, aileye ve ogretmene yonelik 3-4 somut oneri)

HEDEFLERI DESTEKLEYECEK EYLEM PLANI
(Kisa ve orta vadeli adimlar)

Empatik, destekleyici ve cozum odakli bir dil kullan. Maksimum 400 kelime.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    const guidance = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, guidance })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}