'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const supabase = createClient()

  async function sendOtp() {
    if (!email) { setError('E-posta adresi gerekli.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      }
    })
    if (err) {
      setError('E-posta gönderilemedi: ' + err.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp) { setError('Doğrulama kodu gerekli.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'magiclink'
    })
    if (err) {
      setError('Geçersiz veya süresi dolmuş kod.')
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  async function signInWithPassword() {
    if (!email || !password) { setError('E-posta ve şifre gerekli.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Giriş başarısız: ' + err.message)
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F0F4F9 0%, #EEF3FB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="1" width="9" height="9" rx="2" fill="white" opacity=".9"/>
              <rect x="14" y="1" width="9" height="9" rx="2" fill="white" opacity=".5"/>
              <rect x="1" y="14" width="9" height="9" rx="2" fill="white" opacity=".5"/>
              <rect x="14" y="14" width="9" height="9" rx="2" fill="white" opacity=".9"/>
            </svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1B3A6B', letterSpacing: '-0.5px' }}>DershaneOPS</div>
          <div style={{ fontSize: '13px', color: '#7A8FA8', marginTop: '4px' }}>Eğitim Operasyon Platformu</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(27,58,107,0.08)', border: '1px solid #E2EAF8' }}>

          {/* Şifre ile giriş */}
          {usePassword ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>Şifre ile Giriş</div>
                <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>E-posta ve şifrenizi girin</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #D5DFF0', fontSize: '13.5px', color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Şifrenizi girin"
                  onKeyDown={e => e.key === 'Enter' && signInWithPassword()}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #D5DFF0', fontSize: '13.5px', color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#C0392B' }}>
                  {error}
                </div>
              )}

              <button onClick={signInWithPassword} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>

              <button onClick={() => { setUsePassword(false); setStep('email'); setError('') }} style={{ width: '100%', padding: '10px', borderRadius: '9px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                E-posta Kodu ile Giriş
              </button>
            </>
          ) : step === 'email' ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>Güvenli Giriş</div>
                <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>E-postanıza doğrulama kodu gönderilecek</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>E-posta Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #D5DFF0', fontSize: '13.5px', color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#C0392B' }}>
                  {error}
                </div>
              )}

              <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
                {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
              </button>

              <button onClick={() => { setUsePassword(true); setError('') }} style={{ width: '100%', padding: '10px', borderRadius: '9px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Şifre ile Giriş Yap
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '4px' }}>Kodu Girin</div>
                <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>
                  <span style={{ color: '#1B3A6B', fontWeight: 600 }}>{email}</span> adresine gönderilen kodu girin
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Doğrulama Kodu</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  maxLength={8}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  style={{ width: '100%', padding: '14px', borderRadius: '9px', border: '1.5px solid #D5DFF0', fontSize: '22px', fontWeight: 700, color: '#1B3A6B', outline: 'none', textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#C0392B' }}>
                  {error}
                </div>
              )}

              <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: otp.length === 6 ? 'pointer' : 'default', marginBottom: '12px' }}>
                {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
              </button>

              <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ width: '100%', padding: '10px', borderRadius: '9px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Farklı e-posta kullan
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button onClick={sendOtp} disabled={loading} style={{ fontSize: '12px', color: '#7A8FA8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Kodu tekrar gönder
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#9CA3AF' }}>
          KVKK Uyumlu • Güvenli Bağlantı
        </div>
      </div>
    </div>
  )
}