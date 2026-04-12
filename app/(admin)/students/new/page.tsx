'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const GRADES = ['1.Sınıf','2.Sınıf','3.Sınıf','4.Sınıf','5.Sınıf','6.Sınıf','7.Sınıf','8.Sınıf','9.Sınıf','10.Sınıf','11.Sınıf','12.Sınıf']

export default function NewStudentPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('10.Sınıf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('profiles')
      .insert({ full_name: fullName, phone, role: 'student' })

    if (error) {
      setError('Kayıt oluşturulamadı: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/students')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #D5DFF0', fontSize: '13px',
    color: '#1B3A6B', outline: 'none',
    boxSizing: 'border-box' as const, background: '#fff'
  }

  return (
    <div style={{ padding: '28px', maxWidth: '520px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/students" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>
          ← Öğrenciler
        </a>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '8px 0 0' }}>
          Yeni Öğrenci
        </h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>
              Ad Soyad *
            </label>
            <input
              type="text" value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Öğrenci adı soyadı"
              required style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>
              Telefon
            </label>
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05xx xxx xxxx"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>
              Sınıf
            </label>
            <select value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle}>
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#B91C1C', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit" disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
            >
              {loading ? 'Kaydediliyor...' : 'Öğrenci Ekle'}
            </button>
            <a href="/students" style={{ padding: '10px 16px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              İptal
            </a>
          </div>

        </form>
      </div>
    </div>
  )
}
