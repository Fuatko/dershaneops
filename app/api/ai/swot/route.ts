import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
const client = new Anthropic()
export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, hw_rate, trend, strengths, improvements, opportunities, risks } = await req.json()
    const prompt = `Sen bir akademik danışman ve eğitim koçusun. Bir öğrencinin SWOT analizini yorumla.

ÖĞRENCİ: ${student_name}
VERİLER:
- Genel Başarı: %${overall_rate}
- Risk Skoru: ${risk_score}/100
- Ödev Tamamlama: %${hw_rate}
- Sınav Trendi: ${trend > 0 ? '+' + trend : trend} net

SWOT:
Güçlü Yönler: ${strengths}
Gelişim Alanları: ${improvements}
Fırsatlar: ${opportunities}
Riskler: ${risks}

Türkçe olarak kısa ve etkili bir akademik yorum yaz:

GENEL DEĞERLENDİRME
(2-3 cümle ile öğrencinin genel akademik durumu)

ÖNCELİKLİ AKSIYONLAR
(En kritik 3 adım, madde madde)

MOTİVASYON MESAJI
(Öğrenciyecak, motive edici ve gerçekçi bir dil kullan. Maksimum 250 kelime.`
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    const swot = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, swot })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
