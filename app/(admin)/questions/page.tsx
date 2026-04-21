'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuestionsPage() {
  const [activeTab, setActiveTab] = useState('bank')
  const [questions, setQuestions] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [form, setForm] = useState({
    subject_id: '', question: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', difficulty: 'medium',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: q }, { data: sub }, { data: att }, { data: st }] = await Promise.all([
      supabase.from('verification_questions').select('*, subjects(name)').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('student_question_attempts')
        .select('*, profiles!student_question_attempts_student_id_fkey(full_name), subjects(name), topics(name)')
        .order('attempt_date', { ascending: false })
        .limit(200),
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
    ])
    setQuestions(q ?? [])
    setSubjects(sub ?? [])
    setAttempts(att ?? [])
    setStudents(st ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ subject_id:'', question:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_answer:'A', difficulty:'medium' })
    setEditItem(null)
  }

  function startEdit(q: any) {
    setEditItem(q)
    setForm({
      subject_id: q.subject_id ?? '',
      question: q.question,
      option_a: q.option_a ?? '',
      option_b: q.option_b ?? '',
      option_c: q.option_c ?? '',
      option_d: q.option_d ?? '',
      correct_answer: q.correct_answer ?? 'A',
      difficulty: q.difficulty ?? 'medium',
    })
    setActiveTab('form')
    window.scrollTo(0, 0)
  }

  async function handleSave() {
    if (!form.question || !form.option_a || !form.option_b) {
      setSuccess('Soru metni ve en az A-B seçeneği zorunludur!')
      return
    }
    setSaving(true); setSuccess('')
    const payload = {
      subject_id: form.subject_id || null,
      question: form.question,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c || null,
      option_d: form.option_d || null,
      correct_answer: form.correct_answer,
      difficulty: form.difficulty,
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
    }
    if (editItem) {
      await supabase.from('verification_questions').update(payload).eq('id', editItem.id)
      setSuccess('Soru güncellendi.')
    } else {
      await supabase.from('verification_questions').insert(payload)
      setSuccess('Soru eklendi.')
    }
    resetForm(); await load(); setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu soruyu silmek istiyor musunuz?')) return
    await supabase.from('verification_questions').delete().eq('id', id)
    await load()
  }

  const filteredQ = questions.filter(q => !filterSubject || q.subject_id === filterSubject)
  const filteredAtt = attempts.filter(a =>
    (!filterStudent || a.student_id === filterStudent) &&
    (!filterSubject || a.subject_id === filterSubject)
  )

  const diffBg: any  = { easy:'#DCFCE7', medium:'#FEF3C7', hard:'#FEF2F2' }
  const diffTc: any  = { easy:'#14532D', medium:'#78350F', hard:'#7F1D1D' }
  const diffLbl: any = { easy:'Kolay',   medium:'Orta',    hard:'Zor'    }

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1E293B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px' }

  // ── Stats
  const totalQ = questions.length
  const totalAtt = attempts.length
  const avgAcc = totalAtt > 0 ? Math.round(attempts.reduce((s, a) => s + (a.total_questions > 0 ? a.correct_count / a.total_questions * 100 : 0), 0) / totalAtt) : 0

  const TABS = [
    { id:'bank',  label:'Soru Bankası' },
    { id:'form',  label: editItem ? 'Soruyu Düzenle' : 'Yeni Soru Ekle' },
    { id:'stats', label:'Çözüm İstatistikleri' },
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#94A3B8', fontSize:'14px' }}>
      Yükleniyor...
    </div>
  )

  return (
    <div style={{ padding:'24px', maxWidth:'960px', fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      {/* Başlık */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Soru Bankası</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Doğrulama soruları ve soru çözüm istatistikleri</p>
      </div>

      {/* Metrikler */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Soru Bankası', value:totalQ, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Toplam Çözüm', value:totalAtt, color:'#2E7D52', bg:'#DCFCE7' },
          { label:'Ort. Başarı', value:`%${avgAcc}`, color:'#78350F', bg:'#FEF3C7' },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'14px 16px', border:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:'24px', fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', borderRadius:'10px', padding:'4px', marginBottom:'20px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex:1, padding:'8px 12px', borderRadius:'7px', border:'none', background:activeTab===t.id?'#fff':'transparent', color:activeTab===t.id?'#1B3A6B':'#64748B', fontSize:'13px', fontWeight:activeTab===t.id?600:400, cursor:'pointer', boxShadow:activeTab===t.id?'0 1px 4px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SORU BANKASI ── */}
      {activeTab === 'bank' && (
        <div>
          <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ ...inp, flex:1 }}>
              <option value="">Tüm Dersler</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => { resetForm(); setActiveTab('form') }}
              style={{ padding:'9px 18px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
              + Yeni Soru
            </button>
          </div>

          {success && (
            <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', fontSize:'13px', color:'#14532D', fontWeight:600 }}>
              {success}
            </div>
          )}

          {filteredQ.length === 0 ? (
            <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'48px', textAlign:'center', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'14px', color:'#94A3B8', marginBottom:'12px' }}>Soru bankası boş</div>
              <button onClick={() => setActiveTab('form')} style={{ padding:'9px 18px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                İlk Soruyu Ekle
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {filteredQ.map(q => (
                <div key={q.id} style={{ background:'#fff', borderRadius:'10px', padding:'14px 16px', border:'1px solid #E2E8F0' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'8px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B', marginBottom:'4px', lineHeight:1.5 }}>{q.question}</div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {q.subjects?.name && (
                          <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background:'#EEF3FB', color:'#1B3A6B', fontWeight:600 }}>{q.subjects.name}</span>
                        )}
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background:diffBg[q.difficulty], color:diffTc[q.difficulty], fontWeight:600 }}>{diffLbl[q.difficulty]}</span>
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background:'#F1F5F9', color:'#475569', fontWeight:600 }}>Cevap: {q.correct_answer}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                      <button onClick={() => startEdit(q)} style={{ padding:'5px 12px', borderRadius:'6px', background:'#EEF3FB', color:'#1B3A6B', fontSize:'12px', fontWeight:600, border:'1px solid #BFDBFE', cursor:'pointer' }}>Düzenle</button>
                      <button onClick={() => handleDelete(q.id)} style={{ padding:'5px 12px', borderRadius:'6px', background:'#FEF2F2', color:'#7F1D1D', fontSize:'12px', fontWeight:600, border:'1px solid #FECACA', cursor:'pointer' }}>Sil</button>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                    {['a','b','c','d'].filter(opt => q[`option_${opt}`]).map(opt => (
                      <div key={opt} style={{ fontSize:'12px', padding:'4px 8px', borderRadius:'5px', background: q.correct_answer === opt.toUpperCase() ? '#DCFCE7' : '#F8FAFC', color: q.correct_answer === opt.toUpperCase() ? '#14532D' : '#64748B', border:`1px solid ${q.correct_answer === opt.toUpperCase() ? '#86EFAC' : '#E2E8F0'}` }}>
                        <strong>{opt.toUpperCase()})</strong> {q[`option_${opt}`]}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FORM ── */}
      {activeTab === 'form' && (
        <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', border:'1px solid #E2E8F0' }}>
          <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', marginBottom:'16px' }}>
            {editItem ? 'Soruyu Düzenle' : 'Yeni Doğrulama Sorusu'}
          </div>

          {success && (
            <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#14532D', fontWeight:600 }}>
              {success}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={lbl}>Ders (İsteğe Bağlı)</label>
              <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id:e.target.value }))} style={inp}>
                <option value="">Genel (Ders Bağımsız)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Zorluk</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty:e.target.value }))} style={inp}>
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Soru Metni *</label>
            <textarea value={form.question} onChange={e => setForm(p => ({ ...p, question:e.target.value }))} placeholder="Soruyu yazın..." rows={3} style={{ ...inp, resize:'vertical' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            {['a','b','c','d'].map(opt => (
              <div key={opt}>
                <label style={lbl}>{opt.toUpperCase()} Şıkkı {opt === 'a' || opt === 'b' ? '*' : '(İsteğe bağlı)'}</label>
                <input value={form[`option_${opt}` as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [`option_${opt}`]: e.target.value }))} placeholder={`${opt.toUpperCase()} şıkkını yazın`} style={inp} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={lbl}>Doğru Cevap *</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {['A','B','C','D'].map(opt => (
                <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, correct_answer:opt }))}
                  style={{ flex:1, padding:'10px', borderRadius:'8px', border:'2px solid', borderColor:form.correct_answer===opt?'#14532D':'#E2E8F0', background:form.correct_answer===opt?'#DCFCE7':'#F8FAFC', color:form.correct_answer===opt?'#14532D':'#64748B', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex:1, padding:'11px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
              {saving ? 'Kaydediliyor...' : editItem ? 'Güncelle' : 'Soruyu Kaydet'}
            </button>
            <button onClick={() => { resetForm(); setActiveTab('bank') }}
              style={{ padding:'11px 20px', borderRadius:'8px', background:'#F1F5F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'1px solid #E2E8F0', cursor:'pointer' }}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── İSTATİSTİKLER ── */}
      {activeTab === 'stats' && (
        <div>
          <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} style={{ ...inp, flex:1 }}>
              <option value="">Tüm Öğrenciler</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ ...inp, flex:1 }}>
              <option value="">Tüm Dersler</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {filteredAtt.length === 0 ? (
            <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'48px', textAlign:'center', border:'1px solid #E2E8F0', color:'#94A3B8', fontSize:'14px' }}>
              Henüz soru çözüm kaydı yok
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {filteredAtt.map(a => {
                const acc = a.total_questions > 0 ? Math.round(a.correct_count / a.total_questions * 100) : 0
                const color = acc >= 70 ? '#14532D' : acc >= 50 ? '#78350F' : '#7F1D1D'
                const bg    = acc >= 70 ? '#DCFCE7' : acc >= 50 ? '#FEF3C7' : '#FEF2F2'
                return (
                  <div key={a.id} style={{ background:'#fff', borderRadius:'10px', padding:'12px 16px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B', marginBottom:'2px' }}>
                        {a.profiles?.full_name ?? '—'}
                      </div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                        {a.subjects?.name ?? 'Genel'}{a.topics?.name ? ' · ' + a.topics.name : ''} · {a.attempt_date}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'4px', background:'#DCFCE7', color:'#14532D', fontWeight:600 }}>{a.correct_count}D</span>
                        <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'4px', background:'#FEF2F2', color:'#7F1D1D', fontWeight:600 }}>{a.wrong_count}Y</span>
                        <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'4px', background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{a.blank_count}B</span>
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', background:bg, color, minWidth:'42px', textAlign:'center' }}>
                        %{acc}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}