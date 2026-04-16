import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
const client = new Anthropic()
export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, avg_net, risk_score, weak_subjects, target_exam, target_score, current_score, extra_lessons, extra_study_hours, focus_subject, months } = await req.json()
    const prompt = `Sen bir eğitim danışmanısın. Bir öğrenci için "ya şöyle olsaydı?" senaryo analizi yap.

ÖĞRENCİ: ${student_name}
MEVCUT DURUM:
- Genel Başarı: %${overall_rate}
- Ortalama Net: ${avg_net}
- Risk Skoru: ${risk_score}/100
- Zayıf Dersler: ${weak_subjects}
- Hedef: ${target_exam} ${target_score} puan (Mevcut: ${current_score})

SENARYO (${months} aylık):
- Ek Haftalık Ders: ${extra_lessons}
- Günlük Ek Çalışma: ${extra_study_hours} saat
- Odak Ders: ${focus_subject}

Bu senaryoda ne olabileceğini değerlendir:

BEKLENEN GELİŞİM
(Somut rakamlarla tahmini değişim)

HEDEFE ETKİSİ
(Hedef puana ulaşma olasılığı nasıl değişir?)

DERS BAZLI ETKİ
(Hangi dersler en çok gelişir?)

UYARI VE RİSKLER
(Dikkat edilmesi gerekenler)

TAVSİYE
(Bu senaryo uygulanmalı mı? Neden?)

Gerçekçi, somut rakamlara dayalı, motive edici bir dil kullan. Maksimum 400 kelime.`
    const msg = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
    const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
