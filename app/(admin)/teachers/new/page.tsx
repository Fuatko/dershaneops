'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'

export default function NewTeacherPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email) { setError('Ad soyad ve e-posta zorunludur.'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'teacher' })
    })
    const d = await res.json()

    if (!d.ok) { setError(d.error); setSaving(false); return }

    setSuccess(true)
    setForm({ full_name: '', email: '', phone: '', subject: '' })
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  return (
    <div style={{ padding: '28px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/teachers" style={{ fontSize: '12.5px', color: '#7A8FA8', textDecoration: 'none' }}>← Öğretmenler</a>
        <span style={{ color: '#D5DFF0' }}>/</span>
        <span style={{ fontSize: '12.5px', color: '#1B3A6B', fontWeight: 600 }}>Yeni Öğretmen</span>
      </div>

      <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12.5px', color: '#1B3A6B', lineHeight: 1.6 }}>
          Öğretmen e-posta adresine <strong>davet maili</strong> gönderilecek. Öğretmen maildeki linke tıklayarak şifresini belirleyip giriş yapabilecek.
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Öğretmen Bilgileri</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Ad Soyad *</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Ali Demir" style={inp} required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>E-posta *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="ali@email.com" style={inp} required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Telefon</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="0532 xxx xx xx" style={inp} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Branş</label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Matematik" style={inp} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#C0392B' }}>{error}</div>
          )}
          {success && (
            <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#2E7D52', fontWeight: 600 }}>
              Davet maili gönderildi!{' '}
              <a href="/teachers" style={{ color: '#1B3A6B' }}>Listeye dön →</a>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Davet Gönderiliyor...' : 'Davet Gönder'}
            </button>
            <a href="/teachers" style={{ padding: '11px 18px', borderRadius: '9px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              İptal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}