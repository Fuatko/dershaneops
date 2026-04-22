'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentMatchPage() {
  const [parents, setParents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: s }, { data: m }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'parent').order('full_name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
      supabase.from('parent_students').select('*, parent:profiles!parent_students_parent_id_fkey(full_name), student:profiles!parent_students_student_id_fkey(full_name)'),
    ])
    setParents(p ?? [])
    setStudents(s ?? [])
    setMatches(m ?? [])
    setLoading(false)
  }

  async function addMatch() {
    if (!selectedParent || !selectedStudent) { alert('Veli ve öğrenci seçin!'); return }
    const exists = matches.find(m => m.parent_id === selectedParent && m.student_id === selectedStudent)
    if (exists) { alert('Bu eşleştirme zaten mevcut!'); return }
    setSaving(true)
    await supabase.from('parent_students').insert({ parent_id: selectedParent, student_id: selectedStudent })
    setSelectedParent('')
    setSelectedStudent('')
    await load()
    setSaving(false)
  }

  async function removeMatch(id: string) {
    if (!confirm('Bu eşleştirmeyi silmek istiyor musunuz?')) return
    await supabase.from('parent_students').delete().eq('id', id)
    await load()
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '13px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Veli-Öğrenci Eşleştirme</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Velileri öğrencileriyle eşleştirin</p>
      </div>

      {/* Eşleştirme Formu */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>Yeni Eşleştirme</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Veli</label>
            <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} style={inp}>
              <option value="">Veli seçin...</option>
              {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Öğrenci</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={inp}>
              <option value="">Öğrenci seçin...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <button onClick={addMatch} disabled={saving} style={{ padding: '9px 20px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {saving ? '...' : 'Eşleştir'}
          </button>
        </div>

        {parents.length === 0 && (
          <div style={{ marginTop: '14px', background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px', color: '#B45309' }}>
            Sistemde kayıtlı veli bulunamadı. Veli rolünde kullanıcı ekleyin.
          </div>
        )}
      </div>

      {/* Mevcut Eşleştirmeler */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Mevcut Eşleştirmeler</span>
          <span style={{ fontSize: '12px', color: '#7A8FA8' }}>{matches.length} eşleştirme</span>
        </div>
        {matches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>
            Henüz eşleştirme yapılmamış
          </div>
        ) : matches.map((m, i) => (
          <div key={m.id} style={{ padding: '13px 18px', borderBottom: i < matches.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#7A8FA8', marginBottom: '2px' }}>VELİ</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8' }}>{m.parent?.full_name}</div>
              </div>
              <div style={{ fontSize: '18px', color: '#D5DFF0' }}>↔</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#7A8FA8', marginBottom: '2px' }}>ÖĞRENCİ</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{m.student?.full_name}</div>
              </div>
            </div>
            <button onClick={() => removeMatch(m.id)} style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#C0392B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}