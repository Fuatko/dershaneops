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
      const { student_name, overall_rate, streak, weak_topics, strong_topics, pending_homework, daily_score, user_message,
              last_exam_net, exam_trend, days_to_exam, exam_type, grade_level, recent_wrong_subjects } = body
      const text = await callClaude(
        `Sen DershaneOPS'un kisisel AI kocusun. Ogrencinin adini kullan, samimi ve motive edici ol. Emojiler kullanabilirsin. Turkce yaz. Kisa ve etkili cevap ver (max 150 kelime). Her zaman ogrenciye ozgu, veriye dayali cevap ver. Genel laflar etme.`,
        `Ogrenci: ${student_name} (${grade_level ? grade_level+'. sinif' : ''})
Hedef sinav: ${exam_type || 'YKS'} ${days_to_exam ? '(' + days_to_exam + ' gun kaldi)' : ''}
Son sinav neti: ${last_exam_net || 'bilinmiyor'}
Sinav trendi: ${exam_trend || 'bilinmiyor'}
Genel basari: %${overall_rate}
Streak: ${streak} gun
Gunluk skor: ${daily_score}/100
Zayif konular: ${weak_topics || 'Yok'}
Guclu konular: ${strong_topics || 'Yok'}
Son yanlis yapilan dersler: ${recent_wrong_subjects || 'Yok'}
Bekleyen odev: ${pending_homework}
Ogrenci mesaji: "${user_message}"

Yukaridaki verilere gore kisisel, somut ve motive edici bir yanit ver.`
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
      const { student_name, weak_topics, medium_topics, strong_topics, exam_type, days_to_exam, last_exam_net, exam_trend } = body
      const urgency = days_to_exam < 30 ? 'ACIL - sinava az kaldi, zayif konulara odaklan' : days_to_exam < 90 ? 'ORTA - dengeli calis' : 'NORMAL - kapsamli calis'
      const text = await callClaude(
        `Sen DershaneOPS calisma plani yapay zekasisin. Sadece JSON dondur, baska hicbir sey yazma.
Format: [{"day":1,"subject":"...","topic":"...","task_type":"weak_area","description":"...","question_count":20,"duration_minutes":45,"difficulty":"medium","priority":"high"}]
task_type: weak_area, review, new_topic, exam_practice
priority: high, medium, low`,
        `Ogrenci: ${student_name}
Hedef sinav: ${exam_type || 'YKS'} - ${days_to_exam || '?'} gun kaldi
Son sinav neti: ${last_exam_net || 'bilinmiyor'}
Sinav trendi: ${exam_trend || 'stabil'}
Strateji: ${urgency}
Zayif konular: ${JSON.stringify(weak_topics)}
Orta konular: ${JSON.stringify(medium_topics)}
Guclu konular: ${JSON.stringify(strong_topics)}
7 gunluk, her gun 2-3 gorev, sinav stratejisine uygun plan olustur.`
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

    if (type === 'candidate_score') {
      const { candidate_name, grade_level, target_exam, source, current_school, has_parent_contact, has_email } = body
      const text = await callClaude(
        'Sen bir dershane kayit analisti yapay zekasisin. Adayin kayit olma olasiligini 0-100 arasinda skorkla. Sadece JSON don: {"score": 75, "notes": "kisa aciklama"}',
        `Aday: ${candidate_name}, Sinif: ${grade_level}, Hedef: ${target_exam}, Kaynak: ${source}, Okul: ${current_school || 'belirtilmedi'}, Veli telefonu: ${has_parent_contact ? 'var' : 'yok'}, Email: ${has_email ? 'var' : 'yok'}. Kayit olasiligi skoru ver.`
      )
      try {
        const d = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim())
        return NextResponse.json(d)
      } catch { return NextResponse.json({ score: 50, notes: 'Ortalama olasilik' }) }
    }

    return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })

  } catch (err: any) {
    console.error('AI API Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}