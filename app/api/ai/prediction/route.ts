import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
const client = new Anthropic()
export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, avg_net, expected_next, expected_3month, trend, goal_probabilities, subject_forecasts } = await req.json()
    const prompt = `Sen bir eğitim analisti ve akademik danışmanısın. Bir öğrencinin gelişim tahminini değerlendir.

ÖĞRENCİ: ${student_name}
MEVCUT DURUM:
- Genel Başarı: %${overall_rate}
- Risk Skoru: ${risk_score}/100
- Son 3 Sınav Ort Net: ${avg_net}
- Sonraki Sınav Tahmini: ${expected_next}
- 3 Ay Sonra Tahmini: ${expected_3month}
- Trend: ${trend}
HEDEF OLASILIĞI: ${goal_probabilities}
DERS TAHMİNLERİ: ${subject_forecasts}

Türkçe olarak değerlendir:

GENEL GELİŞİM TAHMİNİ
(Mevcut gidişatı yorumla)

HEDEF ANALİZİ
(Hedefe ulaşma ihtimali hakkında)

KRİTİK UYARILAR
(Varsa risk ve tehlike noktaları)

TAVSİYE EDİLEN AKSIYONLAR
(3-4 somut adım)

Net, gerçekçi ve motive edici bir dil kullan. Maksimum 350 kelime.`
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    const prediction = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, prediction })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
