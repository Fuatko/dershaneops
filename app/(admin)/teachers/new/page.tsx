'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SUBJECTS = ['Matematik','Fizik','Kimya','Biyoloji','Türkçe','İngilizce','Tarih','Coğrafya','Felsefe']

export default function NewTeacherPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('Matematik')
  const [maxWeekly, setMaxWeekly] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ full_name: fullName, phone, role: 'teacher' })
      .select()
  .single()

    if (profileError || !profile) {
      setError('Profil oluşturulamadı: ' + profileError?.message)
      setLoading(false)
      return
    }

    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({ profile_id: profile.id, subject, max_weekly_hours: maxWeekly })

    if (teacherError) {
      setError('Öğretmen kaydı oluşturulamadı: ' + teacherError.message)
      setLoading(false)
      return
    }

    router.push('/teachers')
  }

  return (
    <div style={{ padding: '28px', maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/teachers" style={{ fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>← Öğretmenler</a>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: '8px 0 0' }}>Yeni Öğretmen</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '24px' }}>
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Ad Soyad *</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Öğretmen adı soyadı" required
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="05xx xxx xxxx"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>Branş *</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#4A6080', marginBottom: '6px' }}>
              Haftalık Maks. Ders Saati: <span style={{ color: '#1B3A6B' }}>{maxWeekly} saat</span>
            </label>
            <input type="range" min="5" max="40" value={maxWeekly} onChange={e => setMaxWeekly(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A8FA8', marginTop: '3px' }}>
              <span>5 saat</span><span>40 saat</span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#B91C1C', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Kaydediliyor...' : 'Öğretmen Ekle'}
            </button>
            <a href="/teachers" style={{ padding: '10px 16px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              İptal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
