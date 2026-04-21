'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function DailyTasksPage() {
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterDate, setFilterDate] = useState(localDate())
  const [form, setForm] = useState({
    subject_id: '', topic_id: '', task_date: localDate(),
    target_duration_minutes: 45, target_question_count: 20,
    task_type: 'study', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => { if (form.subject_id) loadTopics(form.subject_id); else setTopics([]) }, [form.subject_id])
  useEffect(() => { if (selected) loadTasks(selected.id, filterDate) }, [filterDate, selected])

  async function load() {
    const [{ data: s }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level'),
      supabase.from('subjects').select('*').order('name'),
    ])
    const { data: classrooms } = await supabase.from('classrooms').select('id, name')
    const classMap: Record<string,string> = {}
    for (const c of classrooms ?? []) classMap[c.id] = c.name
    const studentsWithClass = (s ?? []).map((st: any) => ({ ...st, classroom_name: st.classroom_id ? classMap[st.classroom_id] : null }))
    setStudents(studentsWithClass)
    setSubjects(sub ?? [])
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setTopics(data ?? [])
    setForm(p => ({ ...p, topic_id: '' }))
  }

  async function loadTasks(studentId: string, date: string) {
    const { data } = await supabase
      .from('daily_tasks')
      .select('*, subjects(name), topics(name)')
      .eq('student_id', studentId)
      .eq('task_date', date)
      .order('created_at')
    setTasks(data ?? [])
  }

  async function selectStudent(s: any) {
    setSelected(s)
    await loadTasks(s.id, filterDate)
    setForm(p => ({ ...p, task_date: filterDate }))
    setSuccess('')
  }

  async function handleSave() {
    if (!selected || !form.subject_id) { alert('Öğrenci ve ders seçin!'); return }
    setSaving(true); setSuccess('')
    await supabase.from('daily_tasks').insert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: selected.id,
      subject_id: form.subject_id,
      topic_id: form.topic_id || null,
      task_date: form.task_date,
      target_duration_minutes: form.target_duration_minutes,
      target_question_count: form.target_question_count,
      task_type: form.task_type,
      notes: form.notes || null,
      status: 'pending',
    })
    setSuccess('Görev eklendi!')
    setForm(p => ({ ...p, subject_id: '', topic_id: '', notes: '' }))
    await loadTasks(selected.id, filterDate)
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function deleteTask(id: string) {
    if (!confirm('Görevi silmek istiyor musunuz?')) return
    await supabase.from('daily_tasks').delete().eq('id', id)
    if (selected) await loadTasks(selected.id, filterDate)
  }

  const grades = [...new Set(students.filter(s => s.grade_level).map(s => s.grade_level))].sort()
  const filteredStudents = students.filter(s => !filterClass || String(s.grade_level) === filterClass)

  const inp: React.CSSProperties = { width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1E293B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px' }

  const taskTypeCfg: any = {
    study:    { label:'Çalışma',      color:'#1B3A6B', bg:'#EEF3FB' },
    review:   { label:'Tekrar',       color:'#78350F', bg:'#FEF3C7' },
    exam:     { label:'Sınav Hazırlık', color:'#6B4FC8', bg:'#EDE9FE' },
    homework: { label:'Ödev',         color:'#14532D', bg:'#DCFCE7' },
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1100px', fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Günlük Görev Yönetimi</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Öğrenci bazlı günlük çalışma görevleri</p>
      </div>

      <div className="dt-layout">

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
          <div className="dt-mob" style={{ marginBottom:'10px' }}>
            <select value={selected?.id ?? ''} onChange={e => { const s = students.find(x => x.id === e.target.value); if (s) selectStudent(s) }} style={inp}>
              <option value="">Öğrenci seçin...</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.grade_level}. Sınıf</option>)}
            </select>
          </div>

          {/* Desktop liste */}
          <div className="dt-desk" style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E2E8F0', overflow:'hidden', maxHeight:'500px', overflowY:'auto' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Öğrenci bulunamadı</div>
            ) : filteredStudents.map((s, i) => (
              <div key={s.id} onClick={() => selectStudent(s)}
                style={{ padding:'10px 14px', borderBottom: i < filteredStudents.length-1 ? '1px solid #F8FAFC' : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background: selected?.id === s.id ? '#1B3A6B' : '#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink:0 }}>
                  {s.full_name?.split(' ').map((n:string) => n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.full_name}</div>
                  <div style={{ fontSize:'10px', color:'#94A3B8' }}>
                    {s.grade_level}. Sınıf {s.classroom_name ? '· '+s.classroom_name : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ panel */}
        {!selected ? (
          <div className="dt-desk" style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'60px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#94A3B8' }}>Öğrenci seçin</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Tarih seçici */}
            <div style={{ background:'#fff', borderRadius:'10px', padding:'12px 14px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                  {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name}</div>
                  <div style={{ fontSize:'11px', color:'#94A3B8' }}>{selected.grade_level}. Sınıf {selected.classroom_name ? '· '+selected.classroom_name : ''}</div>
                </div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
                <label style={{ fontSize:'11px', fontWeight:600, color:'#475569' }}>Tarih:</label>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12px', outline:'none', color:'#1B3A6B' }} />
              </div>
            </div>

            {/* Görev ekleme formu */}
            <div style={{ background:'#fff', borderRadius:'10px', padding:'14px', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Yeni Görev Ekle</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div>
                  <label style={lbl}>Ders *</label>
                  <select value={form.subject_id} onChange={e => setForm(p => ({...p, subject_id:e.target.value}))} style={inp}>
                    <option value="">Seçin...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Konu</label>
                  <select value={form.topic_id} onChange={e => setForm(p => ({...p, topic_id:e.target.value}))} style={inp} disabled={topics.length===0}>
                    <option value="">Seçin...</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Görev Tipi</label>
                  <select value={form.task_type} onChange={e => setForm(p => ({...p, task_type:e.target.value}))} style={inp}>
                    <option value="study">Çalışma</option>
                    <option value="review">Tekrar</option>
                    <option value="exam">Sınav Hazırlık</option>
                    <option value="homework">Ödev</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tarih</label>
                  <input type="date" value={form.task_date} onChange={e => setForm(p => ({...p, task_date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Süre (dk)</label>
                  <input type="number" min={5} value={form.target_duration_minutes} onChange={e => setForm(p => ({...p, target_duration_minutes:parseInt(e.target.value)||45}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Soru Sayısı</label>
                  <input type="number" min={0} value={form.target_question_count} onChange={e => setForm(p => ({...p, target_question_count:parseInt(e.target.value)||0}))} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:'10px' }}>
                <label style={lbl}>Not</label>
                <input value={form.notes} onChange={e => setForm(p => ({...p, notes:e.target.value}))} placeholder="Öğrenciye not..." style={inp} />
              </div>
              {success && (
                <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'7px', padding:'8px 12px', marginBottom:'10px', fontSize:'12px', color:'#14532D', fontWeight:600 }}>
                  {success}
                </div>
              )}
              <button onClick={handleSave} disabled={saving}
                style={{ width:'100%', padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                {saving ? 'Ekleniyor...' : '+ Görev Ekle'}
              </button>
            </div>

            {/* Görev listesi */}
            <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
                  {new Date(filterDate+'T12:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'long', weekday:'long' })}
                </div>
                <span style={{ fontSize:'11px', color:'#94A3B8' }}>{tasks.length} görev</span>
              </div>
              {tasks.length === 0 ? (
                <div style={{ padding:'28px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Bu tarih için görev yok</div>
              ) : tasks.map((t, i) => {
                const isDone = t.status === 'completed'
                const cfg = taskTypeCfg[t.task_type] ?? taskTypeCfg.study
                return (
                  <div key={t.id} style={{ padding:'11px 14px', borderBottom: i < tasks.length-1 ? '1px solid #F8FAFC' : 'none', display:'flex', alignItems:'center', gap:'10px', background: isDone ? '#F0FDF4' : '#fff' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isDone ? '#10B981' : '#1B3A6B', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12.5px', fontWeight:600, color: isDone ? '#94A3B8' : '#1E293B', textDecoration: isDone ? 'line-through' : 'none', marginBottom:'2px' }}>
                        {t.subjects?.name} {t.topics?.name ? '— '+t.topics.name : ''}
                      </div>
                      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'10px', fontWeight:600, padding:'1px 7px', borderRadius:'10px', background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'10px', background:'#F1F5F9', color:'#475569' }}>{t.target_duration_minutes} dk</span>
                        {t.target_question_count > 0 && (
                          <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'10px', background:'#F1F5F9', color:'#475569' }}>{t.target_question_count} soru</span>
                        )}
                        {isDone && <span style={{ fontSize:'10px', fontWeight:600, padding:'1px 7px', borderRadius:'10px', background:'#DCFCE7', color:'#14532D' }}>✓ Tamamlandı</span>}
                      </div>
                      {t.notes && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'3px' }}>{t.notes}</div>}
                    </div>
                    {!isDone && (
                      <button onClick={() => deleteTask(t.id)}
                        style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', cursor:'pointer' }}>
                        Sil
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dt-layout { display:grid; gap:14px; grid-template-columns:1fr; }
        .dt-mob { display:block; }
        .dt-desk { display:none; }
        @media (min-width:768px) {
          .dt-layout { grid-template-columns:260px 1fr; }
          .dt-mob { display:none !important; }
          .dt-desk { display:block !important; }
        }
      `}</style>
    </div>
  )
}