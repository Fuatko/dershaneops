import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif', background: '#fff', color: '#1B3A6B' }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #F0F0F0', padding: '0 80px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/>
              <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity=".45"/>
              <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity=".45"/>
              <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#1B3A6B', letterSpacing: '-0.3px' }}>DershaneOPS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <a href="#features" style={{ fontSize: '14px', color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Özellikler</a>
          <a href="#target" style={{ fontSize: '14px', color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Kimler İçin</a>
          <a href="#usage" style={{ fontSize: '14px', color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Başlangıç</a>
          <a href="mailto:fuat@servispro.com.tr?subject=DershaneOPS Demo Talebi" style={{ padding: '9px 22px', borderRadius: '8px', background: 'transparent', color: '#1B3A6B', fontSize: '14px', fontWeight: 600, textDecoration: 'none', border: '1.5px solid #CBD5E1' }}>
            Demo Talep Et
          </a>
          <Link href="/login" style={{ padding: '9px 22px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Giriş Yap
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '148px', paddingBottom: '110px', background: '#FAFBFF', textAlign: 'center' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '100px', background: '#EEF2FF', fontSize: '13px', fontWeight: 600, color: '#3730A3', marginBottom: '32px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }}/>
            Eğitim Operasyon Platformu
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-1.5px' }}>
            Eğitim Operasyonunuzu ve<br />
            <span style={{ color: '#1B3A6B' }}>Öğrenci Gelişimini</span> Tek<br />
            Platformda Yönetin
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', margin: '0 auto 16px', lineHeight: 1.75, maxWidth: '580px' }}>
            Ders planlama, öğretmen yönetimi ve öğrenci performans analizini tek sistemde birleştiren entegre çözüm.
          </p>
          <p style={{ fontSize: '15px', color: '#94A3B8', margin: '0 auto 44px', lineHeight: 1.7, maxWidth: '560px' }}>
            Eğitim kurumlarının planlama, operasyon ve gelişim süreçlerini daha sistematik, ölçülebilir ve sürdürülebilir hale getirmek için tasarlanmıştır.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <a href="mailto:fuat@servispro.com.tr?subject=DershaneOPS Demo Talebi" style={{ padding: '15px 32px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(27,58,107,0.2)' }}>
              Demo Talep Et
            </a>
            <Link href="/login" style={{ padding: '15px 32px', borderRadius: '10px', background: '#fff', color: '#1B3A6B', fontSize: '15px', fontWeight: 700, textDecoration: 'none', border: '1.5px solid #E2E8F0' }}>
              Ücretsiz Deneyin
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ maxWidth: '720px', margin: '72px auto 0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          {[
            { value: '4', label: 'Kullanıcı Rolü' },
            { value: '15+', label: 'Modül' },
            { value: 'AI', label: 'Destekli Analiz' },
            { value: 'KVKK', label: 'Uyumlu' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '28px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#1B3A6B', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section style={{ padding: '100px 80px', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Şeffaflık ve Kontrol</div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              Eğitim Süreçlerinde Daha Fazla Kontrol ve Şeffaflık
            </h2>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, margin: 0 }}>
              Günlük operasyonlar, ders planlamaları ve öğrenci gelişim takibi çoğu kurumda farklı araçlar ve manuel süreçlerle yürütülmektedir.
            </p>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, margin: '16px 0 0' }}>
              Bu platform, tüm bu süreçleri tek merkezde toplayarak daha düzenli, izlenebilir ve yönetilebilir bir yapı sunar.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Ders programlarını uygunluklara göre oluşturur', ok: true },
              { label: 'Çakışmaları sistematik olarak engeller', ok: true },
              { label: 'Telafi süreçlerini düzenli hale getirir', ok: true },
              { label: 'Öğrenci gelişimini analiz edilebilir hale getirir', ok: true },
              { label: 'Tüm süreci merkezi bir panelden yönetmenizi sağlar', ok: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: '#F8FAFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-5" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px 80px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '60px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Temel Modüller</div>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>Tüm Süreci Kapsayan Modüller</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
            {[
              {
                title: 'Akıllı Ders Planlama',
                desc: 'Öğrenci ve öğretmen uygunluklarını dikkate alarak ders programlarını planlamayı kolaylaştırır ve daha verimli bir yapı sunar.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="3" width="18" height="16" rx="2" stroke="#1B3A6B" strokeWidth="1.6"/>
                    <path d="M7 1v4M15 1v4M2 8h18" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M7 13h4M7 16h2" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                title: 'Operasyon Yönetimi',
                desc: 'Ders değişiklikleri, planlamalar ve günlük süreçler tek merkezden kontrol edilebilir yapıda organize edilir.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="#1B3A6B" strokeWidth="1.6"/>
                    <path d="M11 6v5l3 3" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                title: 'Öğrenci Gelişim Analizi',
                desc: 'Her öğrencinin akademik gelişimi, güçlü yönleri ve gelişime açık alanları sistematik olarak analiz edilir.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 17l4-5 4 3 4-6 4 4" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 3v14h16" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                title: 'Akademik Performans Raporları',
                desc: 'Öğrenci ilerlemesini takip etmeyi kolaylaştıran detaylı ve anlaşılır raporlar sunar.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M13 2v5h5M8 12h6M8 15h4" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                title: 'PDF Program ve Veli Bilgilendirme',
                desc: 'Haftalık ders programları düzenli ve profesyonel formatta oluşturulabilir ve kolayca paylaşılabilir.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="2" width="18" height="18" rx="2" stroke="#1B3A6B" strokeWidth="1.6"/>
                    <path d="M7 7h8M7 11h8M7 15h5" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                title: 'Telafi ve Süreç Yönetimi',
                desc: 'İptal edilen derslerin yeniden planlanmasını ve süreç takibini sistematik biçimde kolaylaştırır.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11a7 7 0 017-7" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M18 11a7 7 0 01-7 7" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M4 7V4h3M18 15v3h-3" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )
              },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>{f.title}</div>
                <div style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value */}
      <section style={{ padding: '100px 80px', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Değer Önerisi</div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              Daha Verimli Bir Eğitim Operasyonu İçin Tasarlandı
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Planlama süreçlerinde zaman tasarrufu sağlar',
              'Operasyonel hataları azaltır',
              'Öğretmen ve ders dağılımını dengeler',
              'Öğrenci gelişimini görünür hale getirir',
              'Veli iletişimini daha düzenli hale getirir',
            ].map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span style={{ fontSize: '15px', color: '#334155', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section style={{ padding: '100px 80px', background: '#0F172A', textAlign: 'center' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Konumlandırma</div>
          <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', margin: '0 0 24px', lineHeight: 1.15, letterSpacing: '-1px' }}>
            Eğitim Kurumları İçin<br />Entegre Bir Yönetim Yaklaşımı
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto' }}>
            Bu platform yalnızca ders programı oluşturmak için değil, eğitim süreçlerinin bütününü daha sistematik bir yapıya kavuşturmak için geliştirilmiştir. Planlama, operasyon ve analiz süreçlerini tek bir yapı altında birleştirir.
          </p>
        </div>
      </section>

      {/* Target */}
      <section id="target" style={{ padding: '100px 80px', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Hedef Kitle</div>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>Kimler İçin Uygun</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px' }}>
            {[
              { label: 'Butik Dershaneler', icon: (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M3 21V10l10-6 10 6v11" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round"/>
                  <rect x="9" y="14" width="8" height="7" rx="1" stroke="#1B3A6B" strokeWidth="1.6"/>
                </svg>
              )},
              { label: 'Etüt Merkezleri', icon: (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <rect x="3" y="3" width="20" height="20" rx="3" stroke="#1B3A6B" strokeWidth="1.6"/>
                  <path d="M8 13h10M8 9h6M8 17h8" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )},
              { label: 'Özel Kurslar', icon: (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M13 3l2.5 5 5.5.8-4 3.9.9 5.5L13 15.5 8.1 18.2l.9-5.5L5 8.8l5.5-.8L13 3z" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              )},
              { label: 'Birebir Eğitim', icon: (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <circle cx="9" cy="9" r="4" stroke="#1B3A6B" strokeWidth="1.6"/>
                  <circle cx="19" cy="9" r="4" stroke="#1B3A6B" strokeWidth="1.6"/>
                  <path d="M3 23v-1a6 6 0 016-6h8a6 6 0 016 6v1" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )},
              { label: 'Eğitim Girişimleri', icon: (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M13 4l9 4-9 4-9-4 9-4z" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M4 12v5c0 2.5 4 4.5 9 4.5s9-2 9-4.5v-5" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )},
            ].map(item => (
              <div key={item.label} style={{ background: '#F8FAFF', borderRadius: '14px', padding: '28px 16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>{item.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: 1.4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Model */}
      <section id="usage" style={{ padding: '100px 80px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '56px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Başlangıç Modeli</div>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px', letterSpacing: '-0.5px' }}>Kurumunuza Uygun Şekilde Başlayın</h2>
            <p style={{ fontSize: '16px', color: '#64748B', margin: 0, lineHeight: 1.7 }}>
              Platform, kurum ihtiyaçlarına göre yapılandırılabilir bir model sunar.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[
              { step: '01', label: 'Demo ile Başlangıç', desc: 'Sistemi canlı olarak deneyimleyin' },
              { step: '02', label: 'Özel Yapılandırma', desc: 'Kurumunuza göre ayarlanır' },
              { step: '03', label: 'Sınırlı Süreli Deneme', desc: 'Risk almadan test edin' },
              { step: '04', label: 'Geçiş Desteği', desc: 'Süreç odaklı tam destek' },
            ].map(item => (
              <div key={item.step} style={{ background: '#fff', borderRadius: '16px', padding: '28px 22px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#CBD5E1', letterSpacing: '1px', marginBottom: '12px' }}>{item.step}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 80px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '44px', fontWeight: 800, color: '#0F172A', margin: '0 0 18px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Eğitim Süreçlerinizi Daha Sistematik Hale Getirin
          </h2>
          <p style={{ fontSize: '17px', color: '#64748B', margin: '0 0 44px', lineHeight: 1.75 }}>
            Planlama, operasyon ve öğrenci gelişimini tek platformda yönetin.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <a href="mailto:fuat@servispro.com.tr?subject=DershaneOPS Demo Talebi" style={{ padding: '16px 36px', borderRadius: '10px', background: '#1B3A6B', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(27,58,107,0.18)' }}>
              Demo Talep Et
            </a>
            <Link href="/login" style={{ padding: '16px 36px', borderRadius: '10px', background: '#fff', color: '#1B3A6B', fontSize: '15px', fontWeight: 700, textDecoration: 'none', border: '1.5px solid #E2E8F0' }}>
              Ücretsiz Deneyin
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 80px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".45"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".45"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
            <div style={{ fontSize: '11px', color: '#CBD5E1' }}>MFK Danışmanlık © 2025</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="mailto:fuat@servispro.com.tr" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>fuat@servispro.com.tr</a>
          <a href="https://servispro.com.tr" target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>servispro.com.tr</a>
          <span style={{ fontSize: '12px', color: '#CBD5E1' }}>KVKK Uyumlu</span>
        </div>
      </footer>
    </div>
  )
}