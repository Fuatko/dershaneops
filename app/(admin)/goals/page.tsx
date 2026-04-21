'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function GoalsPage() {
  const [students, setStudents]   = useState<any[]>([])
  const [goals, setGoals]         = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [studentGoals, setStudentGoals] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    target_exam: '', target_score: '', current_score: '',
    target_date: '', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: s } = await supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level')
    const { data: classrooms } = await supabase.from('classrooms').select('id, name')
    const classMap: Record<string,string> = {}
    for (const c of classrooms ?? []) classMap[c.id] = c.name
    const studentsWithClass = (s ?? []).map((st: any) => ({ ...st, classroom_name: st.classroom_id ? classMap[st.classroom_id] : null }))
    setStudents(studentsWithClass)

    const { data: g } = await supabase.from('student_goals').select('*, profiles!student_goals_student_id_fkey(full_name, grade_level)').order('created_at', { ascending:false })
    setGoals(g ?? [])
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setShowForm(false); setSuccess('')
    const { data } = await supabase.from('student_goals').select('*').eq('student_id', s.id).order('created_at', { ascending:false })
    setStudentGoals(data ?? [])
  }

  async function handleSave() {
    if (!selected || !form.target_exam || !form.target_score) { alert('Hedef sınav ve puan zorunludur!'); return }
    setSaving(true); setSuccess('')
    await supabase.from('student_goals').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: selected.id,
      target_exam: form.target_exam,
      target_score: parseFloat(form.target_score),
      current_score: parseFloat(form.current_score) || 0,
      target_date: form.target_date || null,
      notes: form.notes || null,
      status: 'active',
    })
    setSuccess('Hedef eklendi!')
    setForm({ target_exam:'', target_score:'', current_score:'', target_date:'', notes:'' })
    setShowForm(false)
    await selectStudent(selected)
    await load()
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'completed' : 'active'
    await supabase.from('student_goals').update({ status: next }).eq('id', id)
    if (selected) await selectStudent(selected)
    await load()
  }

  async function deleteGoal(id: string) {
    if (!confirm('Bu hedefi silmek istiyor musunuz?')) return
    await supabase.from('student_goals').delete().eq('id', id)
    if (selected) await selectStudent(selected)
    await load()
  }

  const grades = [...new Set(students.filter(s => s.grade_level).map(s => s.grade_level))].sort()
  const filteredStudents = students.filter(s => !filterClass || String(s.grade_level) === filterClass)

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1E293B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px' }

  const activeGoals    = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1100px', fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Hedef Takibi</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Öğrenci sınav hedefleri ve ilerleme takibi</p>
      </div>

      {/* Metrikler */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Toplam Hedef',    value:goals.length,    color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Aktif Hedef',     value:activeGoals,     color:'#78350F', bg:'#FEF3C7' },
          { label:'Tamamlanan',      value:completedGoals,  color:'#14532D', bg:'#DCFCE7' },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'26px', fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:'11px', color:m.color, opacity:0.75, marginTop:'3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="goals-layout">

        {/* Sol — Öğrenci listesi */}
        <div>
          {/* Sınıf filtresi */}
          <div style={{ background:'#fff', borderRadius:'10px', padding:'12px', marginBottom:'10px', border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:'10px', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px' }}>Sınıf</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              <button onClick={() => setFilterClass('')}
                style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:filterClass===''?'#1B3A6B':'#E2E8F0', background:filterClass===''?'#1B3A6B':'#fff', color:filterClass===''?'#fff':'#475569', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                Tümü
              </button>
              {grades.map(g => (
                <button key={g} onClick={() => setFilterClass(String(g))}
                  style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:filterClass===String(g)?'#1B3A6B':'#E2E8F0', background:filterClass===String(g)?'#1B3A6B':'#fff', color:filterClass===String(g)?'#fff':'#475569', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                  {g}. Sınıf
                </button>
              ))}
            </div>
          </div>

          {/* Mobil dropdown */}
          <div className="goals-mob" style={{ marginBottom:'10px' }}>
            <select value={selected?.id ?? ''} onChange={e => { const s = students.find(x => x.id === e.target.value); if (s) selectStudent(s) }}
              style={{ ...inp }}>
              <option value="">Öğrenci seçin...</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.grade_level}. Sınıf</option>)}
            </select>
          </div>

          {/* Desktop liste */}
          <div className="goals-desk" style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E2E8F0', overflow:'hidden', maxHeight:'520px', overflowY:'auto' }}>
            {filteredStudents.map((s, i) => {
              const sGoals = goals.filter(g => g.student_id === s.id)
              return (
                <div key={s.id} onClick={() => selectStudent(s)}
                  style={{ padding:'10px 14px', borderBottom: i < filteredStudents.length-1 ? '1px solid #F8FAFC' : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background: selected?.id === s.id ? '#1B3A6B' : '#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string) => n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.full_name}</div>
                    <div style={{ fontSize:'10px', color:'#94A3B8' }}>{s.grade_level}. Sınıf · {sGoals.length} hedef</div>
                  </div>
                  {sGoals.filter(g=>g.status==='active').length > 0 && (
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'10px', background:'#FEF3C7', color:'#78350F' }}>
                      {sGoals.filter(g=>g.status==='active').length} aktif
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sağ panel */}
        {!selected ? (
          <div className="goals-desk" style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'60px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#94A3B8' }}>Hedef eklemek için öğrenci seçin</div>
          </div>
        ) : (
          <div>
            {/* Başlık */}
            <div style={{ background:'#fff', borderRadius:'10px', padding:'12px 16px', marginBottom:'12px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#1B3A6B' }}>
                  {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name}</div>
                  <div style={{ fontSize:'11px', color:'#94A3B8' }}>{selected.grade_level}. Sınıf {selected.classroom_name ? '· '+selected.classroom_name : ''}</div>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:showForm?'#F1F5F9':'#1B3A6B', color:showForm?'#475569':'#fff', fontSize:'12px', fontWeight:600, border:'1px solid '+(showForm?'#E2E8F0':'#1B3A6B'), cursor:'pointer' }}>
                {showForm ? 'İptal' : '+ Hedef Ekle'}
              </button>
            </div>

            {/* Hedef ekleme formu */}
            {showForm && (
              <div style={{ background:'#EEF3FB', borderRadius:'10px', padding:'14px', marginBottom:'12px', border:'1px solid #BFDBFE' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Yeni Hedef</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                  <div>
                    <label style={lbl}>Hedef Sınav *</label>
                    <input value={form.target_exam} onChange={e => setForm(p=>({...p,target_exam:e.target.value}))} placeholder="örn. TYT, AYT, LGS" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Hedef Puan *</label>
                    <input type="number" value={form.target_score} onChange={e => setForm(p=>({...p,target_score:e.target.value}))} placeholder="örn. 400" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Mevcut Puan</label>
                    <input type="number" value={form.current_score} onChange={e => setForm(p=>({...p,current_score:e.target.value}))} placeholder="örn. 280" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Hedef Tarih</label>
                    <input type="date" value={form.target_date} onChange={e => setForm(p=>({...p,target_date:e.target.value}))} style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom:'10px' }}>
                  <label style={lbl}>Not</label>
                  <input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Hedefle ilgili not..." style={inp} />
                </div>
                {success && (
                  <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'7px', padding:'8px 12px', marginBottom:'10px', fontSize:'12px', color:'#14532D', fontWeight:600 }}>
                    {success}
                  </div>
                )}
                <button onClick={handleSave} disabled={saving}
                  style={{ width:'100%', padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  {saving ? 'Kaydediliyor...' : 'Hedefi Kaydet'}
                </button>
              </div>
            )}

            {/* Hedef listesi */}
            {studentGoals.length === 0 ? (
              <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'32px', textAlign:'center', border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:'13px', color:'#94A3B8', marginBottom:'10px' }}>Henüz hedef eklenmemiş</div>
                <button onClick={() => setShowForm(true)} style={{ padding:'8px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  İlk Hedefi Ekle
                </button>
              </div>
            ) : studentGoals.map(g => {
              const progress = g.target_score > 0 ? Math.min(Math.round((g.current_score / g.target_score) * 100), 100) : 0
              const pColor = progress >= 80 ? '#14532D' : progress >= 50 ? '#78350F' : '#1B3A6B'
              const isCompleted = g.status === 'completed'
              return (
                <div key={g.id} style={{ background:'#fff', borderRadius:'12px', padding:'16px', marginBottom:'10px', border:'1px solid '+(isCompleted?'#86EFAC':'#E2E8F0') }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px', gap:'10px' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                        <div style={{ fontSize:'16px', fontWeight:800, color:'#1B3A6B' }}>{g.target_exam}</div>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'1px 8px', borderRadius:'10px', background:isCompleted?'#DCFCE7':'#FEF3C7', color:isCompleted?'#14532D':'#78350F' }}>
                          {isCompleted ? '✓ Tamamlandı' : 'Aktif'}
                        </span>
                      </div>
                      {g.target_date && (
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                          Hedef Tarih: {new Date(g.target_date).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:'24px', fontWeight:800, color:'#1B3A6B' }}>{g.target_score}</div>
                      <div style={{ fontSize:'10px', color:'#94A3B8' }}>hedef puan</div>
                    </div>
                  </div>

                  {/* İlerleme */}
                  <div style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#94A3B8', marginBottom:'5px' }}>
                      <span>Mevcut: {g.current_score}</span>
                      <span style={{ fontWeight:700, color:pColor }}>%{progress}</span>
                    </div>
                    <div style={{ height:'8px', background:'#F1F5F9', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:progress+'%', background:pColor, borderRadius:'4px', transition:'width 0.5s' }} />
                    </div>
                  </div>

                  {g.notes && (
                    <div style={{ fontSize:'12px', color:'#475569', marginBottom:'10px', padding:'8px 10px', background:'#F8FAFC', borderRadius:'6px' }}>{g.notes}</div>
                  )}

                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={() => toggleStatus(g.id, g.status)}
                      style={{ flex:1, padding:'7px', borderRadius:'7px', background:isCompleted?'#FEF3C7':'#DCFCE7', color:isCompleted?'#78350F':'#14532D', fontSize:'12px', fontWeight:600, border:'1px solid '+(isCompleted?'#FDE68A':'#86EFAC'), cursor:'pointer' }}>
                      {isCompleted ? 'Aktife Al' : 'Tamamlandı İşaretle'}
                    </button>
                    <button onClick={() => deleteGoal(g.id)}
                      style={{ padding:'7px 12px', borderRadius:'7px', background:'#FEF2F2', color:'#7F1D1D', fontSize:'12px', fontWeight:600, border:'1px solid #FECACA', cursor:'pointer' }}>
                      Sil
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .goals-layout { display:grid; gap:14px; grid-template-columns:1fr; }
        .goals-mob { display:block; }
        .goals-desk { display:none; }
        @media (min-width:768px) {
          .goals-layout { grid-template-columns:260px 1fr; }
          .goals-mob { display:none !important; }
          .goals-desk { display:block !important; }
        }
      `}</style>
    </div>
  )
}