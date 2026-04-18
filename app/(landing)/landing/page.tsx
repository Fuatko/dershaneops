'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const BRAND = 'DershaneOPS' // 👈 Marka ismi değişince sadece bunu güncelle

function AnimatedNumber({ target, suffix = '' }: { target: number, suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1500
        const steps = 40
        const increment = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, duration / steps)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <div ref={ref}>{count}{suffix}</div>
}

function DashboardMockup() {
  return (
    <div style={{ background: '#F0F4F9', borderRadius: '16px', padding: '16px', fontFamily: '-apple-system, sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid #E2EAF8' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: '#1B3A6B', borderRadius: '10px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff' }}>D</div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{BRAND}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Dashboard', 'Öğrenciler', 'Sınavlar', 'Analiz'].map(item => (
            <div key={item} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '5px', background: item === 'Dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: item === 'Dashboard' ? 700 : 400 }}>{item}</div>
          ))}
        </div>
      </div>
      {/* Metrik Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
        {[
          { label: 'Toplam Öğrenci', value: '128', icon: '👨‍🎓', color: '#1B3A6B', bg: '#EEF3FB', trend: '+12%' },
          { label: 'Ortalama Başarı', value: '%78', icon: '📈', color: '#2E7D52', bg: '#EAF4EE', trend: '+5%' },
          { label: 'Aktif Ders', value: '24', icon: '📅', color: '#B45309', bg: '#FDF4E7', trend: 'Bu hafta' },
          { label: 'Riskli Öğrenci', value: '14', icon: '⚠️', color: '#C0392B', bg: '#FEF2F2', trend: 'Dikkat!' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '8px', padding: '10px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <span style={{ fontSize: '8px', color: '#7A8FA8', fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontSize: '11px' }}>{m.icon}</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '8px', color: '#2E7D52', fontWeight: 600, marginTop: '2px' }}>{m.trend}</div>
          </div>
        ))}
      </div>
      {/* Chart + Liste */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Trend Chart */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#1B3A6B', marginBottom: '8px' }}>Başarı Trendi</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px' }}>
            {[55, 62, 58, 70, 68, 75, 78].map((v, i) => (
              <div key={i} style={{ flex: 1, background: i === 6 ? '#1B3A6B' : '#EEF3FB', borderRadius: '3px 3px 0 0', height: (v / 78 * 100) + '%', transition: 'height 0.5s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'].map(m => (
              <div key={m} style={{ fontSize: '7px', color: '#9CA3AF' }}>{m}</div>
            ))}
          </div>
        </div>
        {/* Risk Listesi */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#C0392B', marginBottom: '8px' }}>🚨 Risk Uyarıları</div>
          {[
            { name: 'Emre Ş.', score: 70, color: '#C0392B' },
            { name: 'Ayşe K.', score: 45, color: '#B45309' },
            { name: 'Ali D.', score: 25, color: '#B45309' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>{s.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', fontWeight: 600, color: '#1B3A6B' }}>{s.name}</div>
                <div style={{ height: '3px', background: '#F0F4F9', borderRadius: '2px', marginTop: '2px' }}>
                  <div style={{ height: '100%', width: s.score + '%', background: s.color, borderRadius: '2px' }} />
                </div>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: s.color }}>{s.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StudentAppMockup() {
  return (
    <div style={{ background: '#1B3A6B', borderRadius: '28px', padding: '12px', width: '200px', margin: '0 auto', boxShadow: '0 20px 60px rgba(27,58,107,0.4)', border: '3px solid #2A4A8A' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 8px', fontSize: '8px', color: 'rgba(255,255,255,0.6)' }}>
        <span>9:41</span>
        <span>●●●</span>
      </div>
      <div style={{ background: '#F0F4F9', borderRadius: '20px', padding: '12px', minHeight: '360px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B, #2563EB)', borderRadius: '12px', padding: '12px', marginBottom: '10px', color: '#fff' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>Merhaba, Ayşe! 👋</div>
          <div style={{ fontSize: '9px', opacity: 0.7 }}>Bugün 3 görev var</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>67%</div>
              <div style={{ fontSize: '7px', opacity: 0.7 }}>Bugün</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>🔥 7</div>
              <div style={{ fontSize: '7px', opacity: 0.7 }}>Gün serisi</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>240</div>
              <div style={{ fontSize: '7px', opacity: 0.7 }}>Puan</div>
            </div>
          </div>
        </div>
        {/* Görevler */}
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>📋 Günlük Görevler</div>
        {[
          { subject: 'Matematik', topic: 'Türevler', done: true, score: 92 },
          { subject: 'Fizik', topic: 'Kuvvet', done: false },
          { subject: 'Kimya', topic: 'Bağlar', done: false },
        ].map((task, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '8px', marginBottom: '5px', background: task.done ? '#F0FFF8' : '#fff', border: '1px solid', borderColor: task.done ? '#D1FAE5' : '#E2EAF8' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: task.done ? '#2E7D52' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: task.done ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
              {task.done ? '✓' : '○'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#1B3A6B', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}>{task.subject}</div>
              <div style={{ fontSize: '7px', color: '#9CA3AF' }}>{task.topic}</div>
            </div>
            {task.done ? (
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#2E7D52' }}>{task.score}</div>
            ) : (
              <div style={{ fontSize: '7.5px', padding: '2px 6px', borderRadius: '6px', background: '#1B3A6B', color: '#fff', fontWeight: 700 }}>Yap</div>
            )}
          </div>
        ))}
        {/* Rozet */}
        <div style={{ background: '#FDF4E7', borderRadius: '8px', padding: '8px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>🏅</span>
          <div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#B45309' }}>Yeni Rozet Kazandın!</div>
            <div style={{ fontSize: '7px', color: '#9CA3AF' }}>7 günlük seri</div>
          </div>
        </div>
      </div>
      {/* Bottom Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px', background: '#fff', borderRadius: '0 0 16px 16px', marginTop: '6px' }}>
        {['📅', '📊', '📚', '🎯'].map((icon, i) => (
          <div key={i} style={{ fontSize: '14px', opacity: i === 0 ? 1 : 0.4 }}>{icon}</div>
        ))}
      </div>
    </div>
  )
}

function ExamMockup() {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.10)', border: '1px solid #E2EAF8' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📊 Sınav Analiz Raporu</div>
      {/* Net */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'Doğru', value: '62', color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Yanlış', value: '18', color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Boş', value: '10', color: '#7A8FA8', bg: '#F0F4F9' },
          { label: 'Net', value: '56.7', color: '#1B3A6B', bg: '#EEF3FB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '8px', color: '#9CA3AF', marginTop: '2px' }}>{m.label}</div>
          </div>
        ))}
      </div>
      {/* Konu Bazlı */}
      <div style={{ fontSize: '9px', fontWeight: 700, color: '#1B3A6B', marginBottom: '8px' }}>Konu Bazlı Performans</div>
      {[
        { topic: 'Matematik', rate: 82, color: '#2E7D52' },
        { topic: 'Fizik', rate: 65, color: '#B45309' },
        { topic: 'Kimya', rate: 45, color: '#C0392B' },
        { topic: 'Biyoloji', rate: 78, color: '#2E7D52' },
      ].map(t => (
        <div key={t.topic} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '40px', fontSize: '8px', color: '#374151', flexShrink: 0 }}>{t.topic}</div>
          <div style={{ flex: 1, height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: t.rate + '%', background: t.color, borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '9px', fontWeight: 800, color: t.color, width: '24px', textAlign: 'right' }}>%{t.rate}</div>
        </div>
      ))}
      {/* AI Yorum */}
      <div style={{ background: '#EEF3FB', borderRadius: '8px', padding: '10px', marginTop: '10px', display: 'flex', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🤖</span>
        <div style={{ fontSize: '8.5px', color: '#1B3A6B', lineHeight: 1.6 }}>
          Kimya konusunda kritik eksiklik tespit edildi. Kimyasal bağlar konusuna odaklanmanızı öneririm.
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const problems = [
    { icon: '⏰', text: 'Ders programları saatler alıyor, hâlâ çakışmalar oluyor' },
    { icon: '📋', text: 'Öğrenci performansı Excel\'de, takip edilemiyor' },
    { icon: '😤', text: 'Velilere anlamlı rapor sunulamıyor' },
    { icon: '🔍', text: 'Riskli öğrenciler geç fark ediliyor' },
  ]

  const solutions = [
    {
      icon: '📅', title: 'Planlayın', color: '#1B3A6B', bg: '#EEF3FB',
      items: ['Uygunluklara göre otomatik program', 'Çakışma ve telafi yönetimi', 'Takvim bazlı kontrol'],
    },
    {
      icon: '📊', title: 'Analiz Edin', color: '#2E7D52', bg: '#EAF4EE',
      items: ['Sınav sonuçları & net hesaplama', 'Konu & kazanım bazlı performans', 'Gelişim trendleri'],
    },
    {
      icon: '🧠', title: 'Yönlendirin', color: '#6B4FC8', bg: '#F0ECFB',
      items: ['AI destekli akademik öneriler', 'Otomatik çalışma planı', 'Risk altındaki öğrencileri tespit'],
    },
  ]

  const audiences = [
    { icon: '🏫', title: 'Dershaneler', desc: 'Planlama, öğrenci takibi ve AI analiz' },
    { icon: '🏢', title: 'Özel Okullar', desc: 'MEB uyumlu kazanım ve rehberlik' },
    { icon: '📚', title: 'Etüt Merkezleri', desc: 'Ödev takibi ve gelişim raporları' },
    { icon: '👨‍🏫', title: 'Eğitim Koçları', desc: 'Birebir takip ve veli iletişimi' },
  ]

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif', background: '#fff', color: '#1B3A6B', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #F0F0F0', padding: '0 clamp(20px, 5vw, 80px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', letterSpacing: '-0.3px' }}>{BRAND}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#cozum" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none', fontWeight: 500, display: 'none' }}>Özellikler</a>
          <a href="mailto:fuat@servispro.com.tr?subject=Demo Talebi" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#1B3A6B', textDecoration: 'none', border: '1.5px solid #D5DFF0', whiteSpace: 'nowrap' }}>
            Demo Talep Et
          </a>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', textDecoration: 'none', background: '#1B3A6B', whiteSpace: 'nowrap' }}>
            Giriş Yap
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: '120px', paddingBottom: '80px', background: '#FAFBFF', padding: 'clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '100px', background: '#EEF2FF', fontSize: '12px', fontWeight: 600, color: '#3730A3', marginBottom: '24px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }}/>
              AI Destekli Eğitim Yönetim Platformu
            </div>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, color: '#0F172A', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1px' }}>
              Eğitim Süreçlerinizi<br />
              <span style={{ color: '#1B3A6B' }}>Tek Platformda</span><br />
              <span style={{ color: '#2563EB' }}>Yönetin</span>
            </h1>
            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#475569', margin: '0 0 14px', lineHeight: 1.8, maxWidth: '480px' }}>
              Ders planlamadan sınav analizine, öğrenci gelişiminden yapay zeka destekli yönlendirmeye kadar tüm süreci tek sistemde birleştirin.
            </p>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 32px', lineHeight: 1.7, maxWidth: '460px' }}>
              Saatler süren manuel işlemleri dakikalara indirin. Veriye dayalı kararlar alın. Öğrenci başarısını ölçülebilir hale getirin.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <a href="mailto:fuat@servispro.com.tr?subject=Demo Talebi" style={{ padding: '13px 28px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(27,58,107,0.25)' }}>
                Ücretsiz Demo Talep Et
              </a>
              <Link href="/login" style={{ padding: '13px 24px', borderRadius: '10px', background: '#fff', color: '#1B3A6B', fontSize: '14px', fontWeight: 600, textDecoration: 'none', border: '1.5px solid #E2E8F0' }}>
                14 Gün Ücretsiz Dene
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {['✔ Kurulum kolay', '✔ Hızlı kullanım', '✔ Kurumunuza özel yapı'].map(item => (
                <span key={item} style={{ fontSize: '12.5px', color: '#2E7D52', fontWeight: 600 }}>{item}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* SAYILAR */}
      <section style={{ background: '#1B3A6B', padding: 'clamp(36px, 6vw, 60px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {[
            { target: 12, suffix: '+', label: 'Güçlü Modül' },
            { target: 4, suffix: '', label: 'Kullanıcı Rolü' },
            { target: 14, suffix: ' gün', label: 'Ücretsiz Deneme' },
            { target: 100, suffix: '%', label: 'KVKK Uyumlu' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                <AnimatedNumber target={m.target} suffix={m.suffix} />
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Sorun</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', margin: '0 0 20px', lineHeight: 1.2 }}>
              Eğitim yönetimi hâlâ karmaşık mı?
            </h2>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, margin: '0 0 24px' }}>
              Çoğu eğitim kurumunda ders planlaması Excel ile, öğrenci takibi defterde, veli iletişimi WhatsApp'ta yürütülüyor.
            </p>
            <p style={{ fontSize: '15px', color: '#1B3A6B', fontWeight: 700, lineHeight: 1.6 }}>
              Artık bu süreçleri manuel yönetmek zorunda değilsiniz.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {problems.map(p => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÇÖZÜM */}
      <section id="cozum" style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#FAFBFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Çözüm</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>
              Tüm süreci tek sistemde yönetin
            </h2>
            <p style={{ fontSize: '16px', color: '#94A3B8', maxWidth: '480px', margin: '0 auto' }}>
              Planlayın, analiz edin, yönlendirin — hepsi bir arada
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {solutions.map(s => (
              <div key={s.title} style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: s.color, marginBottom: '14px', margin: '0 0 14px' }}>{s.title}</h3>
                {s.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F0F4F9', fontSize: '14px', color: '#374151' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4.5l2 2 4-4" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD EKRANI */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Ürün</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>
              Tek bakışta tüm veriler
            </h2>
            <p style={{ fontSize: '16px', color: '#94A3B8' }}>Admin, öğretmen, öğrenci ve veli — herkes için özel panel</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(24px, 4vw, 48px)', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px', margin: '0 0 12px' }}>Admin Dashboard</h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, marginBottom: '20px' }}>
                Tüm kurumu tek ekranda görün. Anlık metrikler, risk uyarıları ve trend grafikleri ile her zaman kontrolde olun.
              </p>
              {['128 öğrenci tek ekranda', 'Anlık risk uyarıları', 'Aylık trend grafikleri', 'Sınıf bazlı filtreleme'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                  <span style={{ color: '#1B3A6B', fontSize: '14px' }}>✓</span> {item}
                </div>
              ))}
            </div>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ÖĞRENCİ APP */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#F8FAFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
          <div style={{ order: 1 }}>
            <StudentAppMockup />
          </div>
          <div style={{ order: 2 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Öğrenci Deneyimi</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', margin: '0 0 16px', lineHeight: 1.2 }}>
              Öğrencileriniz sistemi kullanmak ister
            </h2>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, marginBottom: '20px' }}>
              Mobil uyumlu öğrenci paneli ile günlük görevler, streak sistemi ve rozetler sayesinde motivasyon sürekli yüksek kalır.
            </p>
            {[
              { icon: '📋', text: 'Günlük görev sistemi — ne çalışacağını bilir' },
              { icon: '🔥', text: 'Streak & seri sistemi — düzenli çalışma alışkanlığı' },
              { icon: '🏅', text: 'Rozet & ödül sistemi — başarı görünür olur' },
              { icon: '📊', text: 'SWOT analizi — güçlü ve zayıf yanlarını görür' },
              { icon: '📱', text: 'PWA — iPhone ve Android\'e app olarak kurulur' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginTop: '16px', padding: '12px 16px', background: '#EEF3FB', borderRadius: '10px' }}>
              👉 Öğrenci sistemi kullanır, siz sonucu görürsünüz.
            </p>
          </div>
        </div>
      </section>

      {/* SINAV ANALİZ */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Sınav & Analiz</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', margin: '0 0 16px', lineHeight: 1.2 }}>
              Her sınavı tek sistemde yönetin
            </h2>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, marginBottom: '20px' }}>
              Sınav sonuçlarını girin, sistem otomatik analiz etsin. D/Y/B, net hesaplama, konu bazlı başarı ve MEB uyumlu kazanım analizi.
            </p>
            {[
              'Tüm sınav sonuçları kayıt altında',
              'Genel ortalama vs son sınav karşılaştırması',
              'Konu & kazanım bazlı analiz',
              'AI yorumlu gelişim raporu',
              'Sınıf bazlı şube karşılaştırması',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13.5px', color: '#374151' }}>
                <span style={{ color: '#2E7D52', fontSize: '14px' }}>✓</span> {item}
              </div>
            ))}
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D52', marginTop: '16px', padding: '12px 16px', background: '#EAF4EE', borderRadius: '10px' }}>
              👉 Öğrencinin sadece bugünü değil, sürecini görürsünüz.
            </p>
          </div>
          <ExamMockup />
        </div>
      </section>

      {/* FARK */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#1B3A6B' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Fark</div>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
            Sadece takip etmeyin, yönetin
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'rgba(255,255,255,0.7)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.8 }}>
            Platform, verileri sadece göstermez. Analiz eder, yorumlar ve aksiyon önerir. Bu sayede doğru zamanda doğru müdahaleyi yaparsınız.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { icon: '🤖', text: 'AI destekli akademik öneriler' },
              { icon: '📈', text: 'Öğrenci bazlı gelişim analizi' },
              { icon: '📋', text: 'Otomatik çalışma planları' },
              { icon: '🚨', text: 'Performans düşüşü uyarıları' },
            ].map(item => (
              <div key={item.text} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
                <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KİMLER İÇİN */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#FAFBFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 52px)' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>Kimler kullanıyor?</h2>
            <p style={{ fontSize: '16px', color: '#94A3B8' }}>Her ölçekten eğitim kurumu için tasarlandı</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {audiences.map(a => (
              <div key={a.title} style={{ background: '#fff', borderRadius: '14px', padding: '24px 18px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{a.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>{a.title}</div>
                <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.6 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FİYATLANDIRMA */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Fiyatlandırma</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>İhtiyacınıza uygun plan</h2>
          <p style={{ fontSize: '16px', color: '#94A3B8', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Hibrit fiyatlandırma modelimiz: Temel Paket + Seçilen Modüller + Öğrenci Sayısı. Kurumunuza özel teklif için bizimle iletişime geçin.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '36px' }}>
            {[
              { icon: '🥉', name: 'Başlangıç', desc: 'Küçük kurumlar için', color: '#7A8FA8', bg: '#F8FAFF' },
              { icon: '🥈', name: 'Gelişim', desc: 'En çok tercih edilen', color: '#2E7D52', bg: '#EAF4EE', popular: true },
              { icon: '🥇', name: 'Akıllı Yönetim', desc: 'AI + tüm modüller', color: '#6B4FC8', bg: '#F0ECFB' },
              { icon: '🏆', name: 'Kurumsal', desc: 'Büyük kurumlar için', color: '#B45309', bg: '#FDF4E7' },
            ].map(pkg => (
              <div key={pkg.name} style={{ background: pkg.bg, borderRadius: '14px', padding: '20px 14px', textAlign: 'center', border: '2px solid', borderColor: pkg.popular ? '#A7D9B8' : 'transparent', position: 'relative' }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#2E7D52', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>EN POPÜLER</div>
                )}
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{pkg.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: pkg.color, marginBottom: '4px' }}>{pkg.name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>{pkg.desc}</div>
              </div>
            ))}
          </div>
          <a href="mailto:fuat@servispro.com.tr?subject=Fiyat Teklifi Talebi" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(27,58,107,0.25)' }}>
            Fiyat Teklifi Alın →
          </a>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#94A3B8' }}>
            veya{' '}
            <Link href="/login" style={{ color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>14 gün ücretsiz deneyin</Link>
            {' '}— kredi kartı gerekmez
          </div>
        </div>
      </section>

      {/* SON CTA */}
      <section style={{ padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 80px)', background: '#FAFBFF', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, color: '#0F172A', margin: '0 0 16px', lineHeight: 1.2 }}>
            Eğitim süreçlerinizi yeniden tanımlayın
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#64748B', margin: '0 auto 36px', lineHeight: 1.8, maxWidth: '480px' }}>
            Planlayın, analiz edin ve yönetin — tüm eğitim operasyonunuzu tek platformda birleştirin.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            <a href="mailto:fuat@servispro.com.tr?subject=Demo Talebi" style={{ padding: 'clamp(12px, 2vw, 15px) clamp(20px, 4vw, 32px)', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: 'clamp(14px, 2vw, 15px)', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(27,58,107,0.25)' }}>
              Demo Talep Et
            </a>
            <Link href="/login" style={{ padding: 'clamp(12px, 2vw, 15px) clamp(20px, 4vw, 32px)', borderRadius: '10px', background: '#fff', color: '#1B3A6B', fontSize: 'clamp(14px, 2vw, 15px)', fontWeight: 600, textDecoration: 'none', border: '1.5px solid #E2E8F0' }}>
              Ücretsiz Dene
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 4vw, 40px)', flexWrap: 'wrap' }}>
            {['🔒 KVKK Uyumlu', '🇹🇷 Türkiye Sunucuları', '⚡ Hızlı Kurulum', '🤝 7/24 Destek'].map(item => (
              <span key={item} style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F2244', padding: 'clamp(32px, 5vw, 56px) clamp(20px, 5vw, 80px) 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '28px', marginBottom: '36px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="4" height="4" rx="1" fill="#1B3A6B"/>
                    <rect x="7" y="1" width="4" height="4" rx="1" fill="#1B3A6B" opacity=".4"/>
                    <rect x="1" y="7" width="4" height="4" rx="1" fill="#1B3A6B" opacity=".4"/>
                    <rect x="7" y="7" width="4" height="4" rx="1" fill="#1B3A6B"/>
                  </svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{BRAND}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, margin: 0 }}>
                AI destekli eğitim yönetim platformu.
              </p>
            </div>
            {[
              { title: 'ÜRÜN', links: [{ label: 'Özellikler', href: '#ozellikler' }, { label: 'Modüller', href: '#' }, { label: 'Güvenlik', href: '#' }, { label: 'Fiyatlandırma', href: '#' }] },
              { title: 'DESTEK', links: [{ label: 'Demo Talep Et', href: 'mailto:fuat@servispro.com.tr?subject=Demo Talebi' }, { label: 'SSS', href: '#' }, { label: 'İletişim', href: 'mailto:fuat@servispro.com.tr' }] },
              { title: 'YASAL', links: [{ label: 'KVKK Uyum', href: '#' }, { label: 'Gizlilik', href: '#' }, { label: 'Kullanım Şartları', href: '#' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: '12px', letterSpacing: '1px' }}>{col.title}</div>
                {col.links.map(link => (
                  <div key={link.label} style={{ marginBottom: '8px' }}>
                    <a href={link.href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 400 }}>{link.label}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>© 2026 {BRAND} — MFK Danışmanlık. Tüm hakları saklıdır.</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              {['🔒 SSL', '🇹🇷 KVKK', '⚡ Vercel'].map(item => (
                <span key={item} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}