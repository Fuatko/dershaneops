import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
const client = new Anthropic()
export async function POST(req: Request) {
  try {
    const { student_name, overall_rate, risk_score, hw_rate, streak, absent_count, weak_topics, goals } = await req.json()
    const prompt = `Sen bir okul rehberlik uzmanısın. Bir öğrencinin durumunu değerlendirip rehberlik önerileri sun.

ÖĞRENCİ: ${student_name}
AKADEMİK DURUM:
- Genel Başarı: %${overall_rate}
- Risk Skoru: ${risk_score}/100
- Ödev Tamamlama: %${hw_rate}
- Gün Serisi: ${streak} gün
- Devamsızlık: ${absent_count} ders
- Zayıf Konular: ${weak_topics}
- Hedefler: ${goals}

Türkçe olarak rehberlik raporu hazırla:

AKADEMİK DEĞERLENDİRME
(Öğrencinin genel akademik durumu)

PSİKOSOSYAL DEĞERLENDİRME
(Motivasyon, devamsızlık, çalışma alışkanlıkları)

ACİL MÜDAHALE GEREKTİREN ALANLAR
(Varsa kritik riskler)

REHBERLİK ÖNERİLERİ
(Öğrenciye, aileye ve öğretmene yönelik 3-4 somut öneri)

HEDEFLERİ DESTEKLEYECİ EYLEM PLANI
(Kısa ve orta vadeli adımlar)

Empatik, destekleyici ve çözüm odaklı bir dil kullan. Maksimum 400 kelime.`
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages:  msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ ok: true, guidance })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
