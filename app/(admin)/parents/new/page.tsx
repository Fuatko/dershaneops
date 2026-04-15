'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewParentPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) { setError('Ad, e-posta ve şifre zorunludur.'); return }
    setSaving(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    })

    if (authError) { setError(authError.message); setSaving(false); return }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        user_id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: 'parent',
        tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      })
    }

    setSuccess(true)
    setForm({ full_name: '', email: '', phone: '', password: '' })
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  return (
    <div style={{ padding: '28px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/parents" style={{ fontSize: '12.5px', color: '#7A8FA8', textDecoration: 'none' }}>← Veliler</a>
        <span style={{ color: '#D5DFF0' }}>/</span>
        <span style={{ fontSize: '12.5px', color: '#1B3A6B', fontWeight: 600 }}>Yeni Veli</span>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Veli Bilgileri</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Ad Soyad *</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Ahmet Yılmaz" style={inp} required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>E-posta *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="ahmet@email.com" style={inp} required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Telefon</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="0532 xxx xx xx" style={inp} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Şifre *</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="En az 6 karakter" style={inp} required minLength={6} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#C0392B' }}>{error}</div>
          )}
          {success && (
            <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#2E7D52', fontWeight: 600 }}>
              Veli başarıyla eklendi! <a href="/parents" style={{ color: '#1B3A6B' }}>Veli listesine dön →</a>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Veli Ekle'}
            </button>
            <a href="/parents" style={{ padding: '11px 18px', borderRadius: '9px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              İptal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}