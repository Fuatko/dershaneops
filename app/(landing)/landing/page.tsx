'use client'

import { useState } from 'react'

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dershane')

  const features = [
    { icon: '📅', title: 'Akıllı Planlama', desc: 'Ders programı, çakışma tespiti ve otomatik takvim yönetimi' },
    { icon: '📊', title: 'Sınav & Ölçme', desc: 'Sınav oluşturma, net hesaplama ve kazanım bazlı analiz' },
    { icon: '🤖', title: 'AI Akademik Rehber', desc: 'Yapay zeka destekli çalışma planı, risk analizi ve öneriler' },
    { icon: '📈', title: 'Performans Analizi', desc: 'Konu hakimiyet haritası, SWOT analizi ve gelişim profili' },
    { icon: '🧭', title: 'Rehberlik Modülü', desc: 'Risk paneli, devamsızlık takibi ve AI rehberlik raporları' },
    { icon: '🎯', title: 'Öğrenci Motivasyon', desc: 'Görev sistemi, streak, rozet ve kutlama animasyonları' },
    { icon: '📄', title: 'Akıllı Raporlama', desc: 'PDF veli raporları, Excel export ve kurum analizleri' },
    { icon: '🏢', title: 'Kurum Zekası', desc: 'Öğretmen etkinliği, şube karşılaştırması ve trend analizi' },
    { icon: '📱', title: 'Mobil Uygulama', desc: 'PWA desteği — iPhone ve Android\'e app olarak kurulabilir' },
  ]

  const packages = [
    {
      key: 'starter', name: 'Başlangıç', price: '2.500', period: 'ay',
      desc: 'Küçük kurumlar için temel planlama',
      color: '#7A8FA8', bg: '#F0F4F9', border: '#D5DFF0',
      features: ['Ders programı yönetimi', 'Öğrenci & öğretmen takibi', 'Temel raporlama', '0–100 öğrenci'],
      icon: '🥉'
    },
    {
      key: 'growth', name: 'Gelişim', price: '5.500', period: 'ay',
      desc: 'Analiz ve sınav modülleri dahil',
      color: '#2E7D52', bg: '#EAF4EE', border: '#A7D9B8',
      features: ['Sınav & ölçme modülü', 'Konu analizi & SWOT', 'PDF & Excel raporlar', 'MEB uyumlu kazanım', '0–100 öğrenci'],
      icon: '🥈',
      popular: true
    },
    {
      key: 'premium', name: 'Akıllı Yönetim', price: '9.500', period: 'ay',
      desc: 'AI + öğrenci app + tüm modüller',
      color: '#6B4FC8', bg: '#F0ECFB', border: '#C4B5FD',
      features: ['AI akademik rehber', 'Öğrenci motivasyon app', 'Rehberlik modülü', 'Tahmin & senaryo motoru', 'Veli & kurum raporları', '0–100 öğrenci'],
      icon: '🥇'
    },
    {
      key: 'enterprise', name: 'Kurumsal', price: '15.000+', period: 'ay',
      desc: 'Büyük okul ve zincirler için',
      color: '#B45309', bg: '#FDF4E7', border: '#FED7AA',
      features: ['Tüm modüller dahil', 'Kurum zekası modülü', 'Çoklu şube yönetimi', 'Özel entegrasyonlar', 'Öncelikli destek', '500+ öğrenci'],
      icon: '🏆'
    },
  ]

  const testimonials = [
    { name: 'Ahmet Y.', role: 'Dershane Sahibi, İstanbul', text: 'Öğrenci takibi artık çok daha kolay. AI önerileri gerçekten işe yarıyor.' },
    { name: 'Fatma K.', role: 'Akademik Koordinatör, Ankara', text: 'Veli raporları PDF olarak hazırlanıyor, velilerden çok olumlu geri dönüş aldık.' },
    { name: 'Murat T.', role: 'Öğretmen, İzmir', text: 'Soru girişi ve ödev takibi artık dakikalar alıyor. Mobil uygulama harika.' },
  ]

  const dershanePkg = ['Planlama', 'Öğrenci app', 'AI rehber', 'Sınav analizi']
  const okulPkg = ['Kazanım analizi', 'Rehberlik', 'Raporlama', 'Sınav & ölçme']

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fff', color: '#1B3A6B' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E2EAF8', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff' }}>D</div>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>DershaneOPS</span>
          </div>
          <div style={{ display: 'none', gap: '28px' }} className="desktop-nav">
            {['Özellikler', 'Fiyatlar', 'Paketler', 'İletişim'].map(item => (
              <a key={item} href={'#' + item.toLowerCase()} style={{ fontSize: '14px', color: '#4A6080', textDecoration: 'none', fontWeight: 500 }}>{item}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a href="/login" style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#1B3A6B', textDecoration: 'none', border: '1.5px solid #D5DFF0' }}>Giriş Yap</a>
            <a href="/login" style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#1B3A6B' }}>Ücretsiz Dene</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2563EB 60%, #1B3A6B 100%)', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px' }}>🇹🇷</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>KVKK Uyumlu • Türkiye Sunucuları</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: '20px', margin: '0 0 20px' }}>
            Dershane ve Okul Yönetimini<br />
            <span style={{ color: '#93C5FD' }}>Yapay Zeka ile Dönüştürün</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px' }}>
            Planlama, sınav analizi, öğrenci takibi ve AI destekli rehberlik — hepsi tek platformda. Dershane ve okullar için tasarlandı.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/login" style={{ padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, color: '#1B3A6B', textDecoration: 'none', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              14 Gün Ücretsiz Dene →
            </a>
            <a href="#ozellikler" style={{ padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              Özellikleri İncele
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
            {[
              { label: 'Kurulum', value: 'Hemen' },
              { label: 'Öğrenci (Deneme)', value: '20 ücretsiz' },
              { label: 'AI Özellikler', value: 'Açık' },
              { label: 'Destek', value: '7/24' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOSYAL KANIT */}
      <section style={{ background: '#F8FAFF', padding: '24px', borderBottom: '1px solid #E2EAF8' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#7A8FA8', fontWeight: 600 }}>Güvenilen platform:</span>
          {['Dershaneler', 'Özel Okullar', 'Etüt Merkezleri', 'Eğitim Koçları'].map(item => (
            <span key={item} style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', padding: '4px 12px', borderRadius: '20px', background: '#EEF3FB' }}>✓ {item}</span>
          ))}
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section id="ozellikler" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', background: '#F0ECFB', padding: '4px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
              9 GÜÇLÜ MODÜL
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#1B3A6B', margin: '0 0 12px' }}>Her ihtiyacınız için bir modül</h2>
            <p style={{ fontSize: '16px', color: '#7A8FA8', maxWidth: '500px', margin: '0 auto' }}>İhtiyacınıza göre modülleri seçin, yalnızca kullandığınız için ödeyin</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #E2EAF8', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '14px' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '8px', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#7A8FA8', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SATIŞ PAKETLERİ */}
      <section id="paketler" style={{ padding: '72px 24px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D52', background: '#EAF4EE', padding: '4px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
              HİBRİT FİYATLANDIRMA
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#1B3A6B', margin: '0 0 12px' }}>Size uygun paketi seçin</h2>
            <p style={{ fontSize: '16px', color: '#7A8FA8' }}>Temel paket + ihtiyacınıza göre modüller + öğrenci sayısı</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {packages.map(pkg => (
              <div key={pkg.key} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', border: '2px solid', borderColor: pkg.popular ? pkg.border : '#E2EAF8', boxShadow: pkg.popular ? '0 8px 32px rgba(46,125,82,0.15)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '14px', right: '14px', background: '#2E7D52', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>EN POPÜLER</div>
                )}
                <div style={{ background: pkg.bg, padding: '22px 20px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{pkg.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: pkg.color, marginBottom: '4px' }}>{pkg.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', marginBottom: '14px' }}>{pkg.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: pkg.color }}>{pkg.price}</span>
                    <span style={{ fontSize: '12px', color: '#7A8FA8' }}>₺/{pkg.period}</span>
                  </div>
                </div>
                <div style={{ padding: '18px 20px' }}>
                  {pkg.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', fontSize: '12.5px', color: '#374151' }}>
                      <span style={{ color: pkg.color, fontSize: '14px', flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  <a href="/login" style={{ display: 'block', marginTop: '16px', padding: '10px', borderRadius: '10px', background: pkg.color, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                    Hemen Başla
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Öğrenci Çarpanı */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px 24px', border: '1px solid #E2EAF8' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>👥 Öğrenci Sayısı Çarpanı</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                { range: '0–100 öğrenci', extra: 'Dahil', color: '#2E7D52', bg: '#EAF4EE' },
                { range: '101–250 öğrenci', extra: '+1.500 ₺/ay', color: '#1B3A6B', bg: '#EEF3FB' },
                { range: '251–500 öğrenci', extra: '+3.000 ₺/ay', color: '#B45309', bg: '#FDF4E7' },
                { range: '500+ öğrenci', extra: 'Özel Fiyat', color: '#6B4FC8', bg: '#F0ECFB' },
              ].map(t => (
                <div key={t.range} style={{ background: t.bg, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>{t.range}</span>
                  <strong style={{ fontSize: '13px', color: t.color }}>{t.extra}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DERSHANE vs OKUL */}
      <section id="fiyatlar" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#1B3A6B', margin: '0 0 12px' }}>Kim için?</h2>
            <p style={{ fontSize: '16px', color: '#7A8FA8' }}>Dershane ve okullar için özel paket kombinasyonları</p>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: '#F0F4F9', borderRadius: '12px', padding: '4px', marginBottom: '28px', maxWidth: '360px', margin: '0 auto 28px' }}>
            {[{ id: 'dershane', label: '🏫 Dershane' }, { id: 'okul', label: '🏢 Okul' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#1B3A6B' : '#7A8FA8', fontSize: '13px', fontWeight: activeTab === t.id ? 700 : 500, boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'dershane' ? (
            <div style={{ background: '#EEF3FB', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1B3A6B', marginBottom: '8px' }}>Dershane Paketi</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8', marginBottom: '20px' }}>Küçük ve orta ölçekli dershaneler için ideal başlangıç</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {dershanePkg.map(f => (
                  <div key={f} style={{ background: '#fff', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>
                    <span style={{ color: '#1B3A6B' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1B3A6B' }}>~11.000 ₺<span style={{ fontSize: '14px', fontWeight: 500, color: '#7A8FA8' }}>/ay</span></div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>150 öğrenci • Gelişim paket + AI + Öğrenci app</div>
                </div>
                <a href="/login" style={{ padding: '12px 24px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                  Ücretsiz Başla →
                </a>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FDF4E7', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#B45309', marginBottom: '8px' }}>Okul Paketi</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8', marginBottom: '20px' }}>MEB uyumlu kazanım sistemi ve rehberlik modülleri</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {okulPkg.map(f => (
                  <div key={f} style={{ background: '#fff', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#B45309' }}>
                    <span>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#B45309' }}>~23.000 ₺<span style={{ fontSize: '14px', fontWeight: 500, color: '#7A8FA8' }}>/ay</span></div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>400 öğrenci • Kurumsal + Sınav + Rehberlik + AI</div>
                </div>
                <a href="/login" style={{ padding: '12px 24px', borderRadius: '10px', background: '#B45309', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                  Demo İste →
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* REFERANSLAR */}
      <section style={{ padding: '72px 24px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#1B3A6B', marginBottom: '36px' }}>Kullanıcılarımız ne diyor?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #E2EAF8' }}>
                <div style={{ fontSize: '24px', color: '#F59E0B', marginBottom: '12px' }}>★★★★★</div>
                <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="iletisim" style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: '#fff', marginBottom: '16px' }}>
            14 gün ücretsiz deneyin
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px', lineHeight: 1.6 }}>
            Kredi kartı gerekmez. 20 öğrenciye kadar tüm AI özellikleri açık. Kurulum 5 dakika.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/login" style={{ padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, color: '#1B3A6B', textDecoration: 'none', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              Hemen Başla — Ücretsiz
            </a>
            <a href="mailto:info@dershaneops.com" style={{ padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              Demo İste
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F2244', padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '28px', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#1B3A6B' }}>D</div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>DershaneOPS</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Türkiye'nin eğitim kurumlarına özel AI destekli yönetim platformu.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '12px', letterSpacing: '0.5px' }}>ÜRÜN</div>
              {['Özellikler', 'Fiyatlar', 'Paketler', 'Güvenlik'].map(item => (
                <div key={item} style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{item}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '12px', letterSpacing: '0.5px' }}>DESTEK</div>
              {['Dokümantasyon', 'Demo İste', 'SSS', 'İletişim'].map(item => (
                <div key={item} style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{item}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '12px', letterSpacing: '0.5px' }}>YASAL</div>
              {['KVKK Uyum', 'Gizlilik Politikası', 'Kullanım Şartları'].map(item => (
                <div key={item} style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{item}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>© 2026 DershaneOPS. Tüm hakları saklıdır.</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 SSL Güvenli</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>🇹🇷 KVKK Uyumlu</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>⚡ Vercel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}