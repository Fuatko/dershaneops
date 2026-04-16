import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, weak_topics, strong_topics, total_questions } = await req.json()

    const prompt = `Bir dershane ogrencisinin akademik performans analizi yap.

Ogrenci: ${student_name}
Toplam Cozulen Soru: ${total_questions}
Genel Basari Orani: %${overall_rate}
Guclu Konular: ${strong_topics}
Zayif Konular: ${weak_topics}

Lutfen asagidaki formatta Turkce analiz yaz:

1. GENEL DEGERLENDIRME (2-3 cumle)
2. GUCLU YONLER
3. GELISIME ACIK ALANLAR  
4. ONCELIKLI EYLEM ONERILERI (3-4 madde)
5. OGRETMEN ICIN NOT

Profesyonel, net ve motive edici bir dil kullan.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    const insight = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, insight })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
