'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SUBJECTS = ['Matematik','Fizik','Kimya','Biyoloji','Türkçe','İngilizce','Tarih','Coğrafya','Felsefe']
const GRADES = ['9.Sınıf','10.Sınıf','11.Sınıf','12.Sınıf']
const COLORS = ['#1B3A6B','#2E7D52','#6B4FC8','#B45309','#C0392B','#0F7070']

export default function NewBookPage() {
  const [name, setName] = useState('')
  const [publisher, setPublisher] = useState('')
  const [isbn, setIsbn] = useState('')
  const [subject, setSubject] = useState('Matematik')
  const [grade, setGrade] = useState('10.Sınıf')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('books')
      .insert({ name, publisher, isbn, subject, grade, color })

    if (error) {
      setError('Kitap eklenemedi: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/books')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #D5DFF0', fontSize: '13px',
    color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' as const,
    background: '#fff'
  }

  return (
    <div style={{ padding: '28px', maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/books" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>← Kitap Kütüphanesi</a>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '8px 0 0' }}>Yeni Kitap</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Kitap Adı *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="örn. Konu Anlatımlı Matematik 10" required style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Yayınevi</label>
              <input type="text" value={publisher} onChange={e => setPublisher(e.target.value)}
                placeholder="Palme, Birey..." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>ISBN</label>
              <input type="text" value={isbn} onChange={e => setIsbn(e.target.value)}
                placeholder="978-xxx" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Ders *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Sınıf *</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '8px' }}>Renk Etiketi</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: c,
                  cursor: 'pointer', border: color === c ? '3px solid #1B3A6B' : '3px solid transparent',
                  outline: color === c ? '2px solid #93C5FD' : 'none',
                  transition: 'all .15s'
                }} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#B91C1C', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
              {loading ? 'Kaydediliyor...' : 'Kitap Ekle'}
            </button>
            <a href="/books" style={{ padding: '10px 16px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              İptal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
