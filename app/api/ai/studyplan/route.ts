import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { student_name, weak_topics, medium_topics, strong_topics } = await req.json()

    const prompt = `Sen bir egitim danismanisin. Asagidaki ogrenci icin 1 haftalik calisma plani olustur.

Ogrenci: ${student_name}
Zayif Konular (oncelikli): ${JSON.stringify(weak_topics)}
Gelisim Gerektiren Konular: ${JSON.stringify(medium_topics)}
Guclu Konular: ${JSON.stringify(strong_topics)}

Haftanin 5 gunu (Pazartesi=1, Sali=2, Carsamba=3, Persembe=4, Cuma=5) icin plan olustur.
Her gun 2-3 gorev olsun.
Zayif konulara daha fazla yer ver.

SADECE asagidaki JSON formatinda cevap ver, baska hicbir sey yazma:
[
  {
    "day": 1,
    "subject": "Matematik",
    "topic": "Cebir",
    "task_type": "weak_area",
    "description": "Denklem cozme teknikleri uzerinde calis",
    "question_count": 20,
    "duration_minutes": 45,
    "difficulty": "medium",
    "priority": "high"
  }
]

task_type degerlerinden birini kullan: weak_area, review, new_topic, exam_practice`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const plan = JSON.parse(clean)
    return NextResponse.json({ ok: true, plan })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
