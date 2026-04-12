import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, year, month, conflict, lesson } = body

    let prompt = ''

    if (type === 'holidays') {
      prompt = `Türkiye'de ${year} yılı ${month}. ayındaki resmi tatiller ve okul tatillerini kısaca listele. Sadece o aya ait olanları yaz. Maksimum 2 cümle.`
    }

    if (type === 'conflict_resolve') {
      prompt = `Bir dershane programında çakışma var. ${conflict.type === 'teacher' ? 'Öğretmen' : 'Öğrenci'} çakışması: ${conflict.person} için ${conflict.lesson_a.subject} dersi (${new Date(conflict.lesson_a.time).toLocaleString('tr-TR')}) ve ${conflict.lesson_b.subject} dersi (${new Date(conflict.lesson_b.time).toLocaleString('tr-TR')}) aynı saatte planlanmış. Kısa ve net 1-2 cümle çözüm öner.`
    }

    if (type === 'makeup_suggest') {
      prompt = `Bir dershane öğrencisi ${lesson.subject} dersini kaçırdı. Öğrenci: ${lesson.student}, Öğretmen: ${lesson.teacher}, Kaçırılan tarih: ${new Date(lesson.missed_at).toLocaleDateString('tr-TR')}. Telafi dersi için en uygun zaman dilimi ve kısa öneri yaz. 2 cümle maksimum.`
    }

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })

    const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
