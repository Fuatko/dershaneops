import { NextRequest, NextResponse } from 'next/server'

async function callClaude(systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Claude API hatası')
  return data.content?.[0]?.text ?? ''
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body

  try {
    if (type === 'coach') {
      const { student_name, overall_rate, streak, weak_topics, strong_topics, pending_homework, daily_score, user_message } = body
      const text = await callClaude(
        `Sen DershaneOPS'un kişisel AI koçusun. Öğrencinin adını kullan, samimi ve motive edici ol. Emojiler kullanabilirsin. Türkçe yaz. Kısa ve etkili cevap ver (max 150 kelime).`,
        `Öğrenci: ${student_name}
Genel başarı: %${overall_rate}
Streak: ${streak} gün
Günlük skor: ${daily_score}/100
Zayıf konular: ${weak_topics || 'Yok'}
Güçlü konular: ${strong_topics || 'Yok'}
Bekleyen ödev: ${pending_homework}
Mesaj: "${user_message}"`
      )
      return NextResponse.json({ response: text })
    }

    if (type === 'insight') {
      const { student_name, overall_rate, weak_topics, strong_topics, total_questions } = body
      const text = await callClaude(
        'Sen DershaneOPS akademik risk analiz yapay zekasısın. Türkçe, somut 3 öneri ver.',
        `Öğrenci: ${student_name}, Başarı: %${overall_rate}, Soru: ${total_questions}
Zayıf: ${weak_topics || 'Yok'}, Güçlü: ${strong_topics || 'Yok'}
Kısa risk değerlendirmesi ve 3 somut öneri yaz.`
      )
      return NextResponse.json({ insight: text })
    }

    if (type === 'studyplan') {
      const { student_name, weak_topics, medium_topics, strong_topics } = body
      const text = await callClaude(
        `Sen DershaneOPS çalışma planı yapay zekasısın. Sadece JSON döndür, başka hiçbir şey yazma.
Format: [{"day":1,"subject":"...","topic":"...","task_type":"weak_area","description":"...","question_count":20,"duration_minutes":45,"difficulty":"medium","priority":"high"}]`,
        `Öğrenci: ${student_name}
Zayıf: ${JSON.stringify(weak_topics)}
Orta: ${JSON.stringify(medium_topics)}
Güçlü: ${JSON.stringify(strong_topics)}
7 günlük plan oluştur. Her gün 2-3 görev.`
      )
      try {
        const plan = JSON.parse(text.replace(/```json|```/g, '').trim())
        return NextResponse.json({ plan })
      } catch {
        return NextResponse.json({ plan: [], raw: text })
      }
    }

    if (type === 'teacheradvice') {
      const { teacher_name, students } = body
      const text = await callClaude(
        'Sen DershaneOPS öğretmen destek yapay zekasısın. Türkçe, profesyonel 5 madde öneri ver.',
        `Öğretmen: ${teacher_name}
${students.map((s: any) => `- ${s.name}: Risk ${s.risk}/100, Başarı %${s.rate}, Zayıf: ${s.weak || 'Yok'}`).join('\n')}
Somut pedagojik öneriler yaz.`
      )
      return NextResponse.json({ advice: text })
    }

    if (type === 'parentreport') {
      const { student_name, overall_rate, weak_topics, strong_topics, streak, homework_done, homework_total } = body
      const text = await callClaude(
        'Sen DershaneOPS veli raporu yapay zekasısın. Veliye yönelik sıcak Türkçe yaz.',
        `Öğrenci: ${student_name}, Başarı: %${overall_rate}, Seri: ${streak} gün
Ödev: ${homework_done}/${homework_total}
Güçlü: ${strong_topics || 'Yok'}, Gelişim: ${weak_topics || 'Yok'}
Veliye kısa rapor yaz.`
      )
      return NextResponse.json({ report: text })
    }

    if (type === 'institution') {
      const { total_students, avg_success, risk_count, top_subjects, weak_subjects } = body
      const text = await callClaude(
        'Sen DershaneOPS kurum analiz yapay zekasısın. Stratejik Türkçe öneriler ver.',
        `Toplam öğrenci: ${total_students}, Ortalama başarı: %${avg_success}
Riskli: ${risk_count}, Güçlü dersler: ${top_subjects}, Zayıf dersler: ${weak_subjects}
Stratejik analiz ve 3 aksiyon önerisi yaz.`
      )
      return NextResponse.json({ analysis: text })
    }

    return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })

  } catch (err: any) {
    console.error('AI API Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}