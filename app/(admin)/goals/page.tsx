'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoalsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    target_exam: 'TYT',
    target_score: 350,
    target_date: '',
    current_score: 0,
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: g }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
      supabase.from('student_goals')
        .select('*, profiles!student_goals_student_id_fkey(full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ])
    setStudents(s ?? [])
    setGoals(g ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id) { alert('Öğrenci seçin!'); return }
    setSaving(true)
    setSuccess(false)
    await supabase.from('student_goals').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: form.student_id,
      target_exam: form.target_exam,
      target_score: form.target_score,
      target_date: form.target_date || null,
      current_score: form.current_score,
      status: 'active',
    })
    setSuccess(true)
    setForm(p => ({ ...p, student_id: '', current_score: 0 }))
    await load()
    setSaving(false)
  }

  async function updateCurrentScore(id: string, score: number) {
    await supabase.from('student_goals').update({ current_score: score }).eq('id', id)
    await load()
  }

  async function deleteGoal(id: string) {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) return
    await supabase.from('student_goals').update({ status: 'completed' }).eq('id', id)
    await load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Hedef Takibi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Öğrenci hedeflerini belirle ve ilerlemeyi takip et</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', alignSelf: 'flex-start' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Yeni Hedef Ekle</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Öğrenci *</label>
              <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={inp} required>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Hedef Sınav</label>
                <select value={form.target_exam} onChange={e => setForm(p => ({ ...p, target_exam: e.target.value }))} style={inp}>
                  <option value="TYT">TYT</option>
                  <option value="AYT">AYT</option>
                  <option value="LGS">LGS</option>
                  <option value="YKS">YKS</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Hedef Puan</label>
                <input type="number" value={form.target_score} onChange={e => setForm(p => ({ ...p, target_score: parseInt(e.target.value) || 0 }))} style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={lbl}>Mevcut Puan</label>
                <input type="number" value={form.current_score} onChange={e => setForm(p => ({ ...p, current_score: parseInt(e.target.value) || 0 }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Hedef Tarih</label>
                <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} style={inp} />
              </div>
            </div>

            {success && (
              <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12.5px', fontWeight: 600, color: '#2E7D52' }}>
                Hedef başarıyla eklendi!
              </div>
            )}

            <button type="submit" disabled={saving} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Hedef Ekle'}
            </button>
          </form>
        </div>

        {/* Hedef Listesi */}
        <div>
          {goals.length === 0 ? (
            <div style={{ background: '#F8FAFF', border: '1px solid #D5DFF0', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Henüz hedef belirlenmemiş</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.map(g => {
                const progress = g.target_score > 0 ? Math.min(Math.round(g.current_score / g.target_score * 100), 100) : 0
                const remaining = g.target_score - g.current_score
                const progressColor = progress >= 80 ? '#2E7D52' : progress >= 50 ? '#B45309' : '#1B3A6B'
                return (
                  <div key={g.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        🎯
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{g.profiles?.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
                          {g.target_exam} • Hedef: {g.target_score} puan
                          {g.target_date && ` • ${new Date(g.target_date).toLocaleDateString('tr-TR')}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: progressColor }}>{progress}%</div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8' }}>tamamlandı</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '10px', background: '#F0F4F9', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ height: '100%', width: progress + '%', background: progressColor, borderRadius: '5px', transition: 'width 0.5s' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <span style={{ color: '#7A8FA8' }}>Mevcut: <strong style={{ color: '#1B3A6B' }}>{g.current_score}</strong></span>
                        <span style={{ color: '#7A8FA8' }}>Kalan: <strong style={{ color: remaining > 0 ? '#C0392B' : '#2E7D52' }}>{remaining > 0 ? '+' + remaining : 'Ulaşıldı!'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          defaultValue={g.current_score}
                          onBlur={e => updateCurrentScore(g.id, parseInt(e.target.value) || 0)}
                          placeholder="Puan güncelle"
                          style={{ width: '100px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #D5DFF0', fontSize: '12px', color: '#1B3A6B', outline: 'none' }}
                        />
                        <button onClick={() => deleteGoal(g.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '11px', cursor: 'pointer' }}>
                          Tamamlandı
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}