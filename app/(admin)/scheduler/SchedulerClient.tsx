'use client'

import { useState } from 'react'

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const DAYS_SHORT = ['Pzt','Sal','Çar','Prş','Cum','Cmt','Paz']
const DAYS_FULL = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar']
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

const SUBJECT_COLORS: Record<string, {bg:string;text:string;border:string}> = {
  'Matematik': {bg:'#EEF3FB',text:'#1B3A6B',border:'#1B3A6B'},
  'Fizik':     {bg:'#FDF4E7',text:'#92400E',border:'#B45309'},
  'Kimya':     {bg:'#EAF4EE',text:'#14532D',border:'#2E7D52'},
  'Biyoloji':  {bg:'#F0ECFB',text:'#3B0764',border:'#6B4FC8'},
  'Türkçe':    {bg:'#FEF2F2',text:'#7F1D1D',border:'#C0392B'},
  'İngilizce': {bg:'#E0F7FA',text:'#006064',border:'#0F7070'},
  'default':   {bg:'#F5F5F5',text:'#374151',border:'#9CA3AF'},
}

// Türkiye resmi tatil ve özel günler
const SPECIAL_DAYS: Record<string, {label:string;type:'holiday'|'special'|'exam'}> = {
  '01-01': {label:'Yılbaşı',type:'holiday'},
  '04-23': {label:'23 Nisan',type:'holiday'},
  '05-01': {label:'İşçi Bayramı',type:'holiday'},
  '05-19': {label:'19 Mayıs',type:'holiday'},
  '07-15': {label:'15 Temmuz',type:'holiday'},
  '08-30': {label:'30 Ağustos',type:'holiday'},
  '10-29': {label:'Cumhuriyet Bayramı',type:'holiday'},
  '03-14': {label:'Tıp Bayramı',type:'special'},
  '11-10': {label:'Atatürk\'ü Anma',type:'special'},
  '12-25': {label:'Yılsonu',type:'special'},
}

function getSpecialDay(date: Date) {
  const key = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  return SPECIAL_DAYS[key] ?? null
}

function getWeekDates(baseDate: Date) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return Array.from({length:7},(_,i) => {
    const nd = new Date(d)
    nd.setDate(d.getDate() + i)
    return nd
  })
}

function getMonthDates(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month+1, 0)
  const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1
  const dates: (Date|null)[] = Array(startDay).fill(null)
  for (let i = 1; i <= last.getDate(); i++) dates.push(new Date(year,month,i))
  while (dates.length % 7 !== 0) dates.push(null)
  return dates
}

interface Lesson {
  id: string
  student_id: string
  teacher_id: string
  subject: string
  scheduled_at: string
  duration_min: number
  status: string
  is_makeup: boolean
}

interface Profile { id: string; full_name: string }

export default function SchedulerClient({
  lessons, teachers, students
}: {
  lessons: Lesson[]
  teachers: Profile[]
  students: Profile[]
}) {
  const today = new Date()
  const [view, setView] = useState<'week'|'month'>('week')
  const [baseDate, setBaseDate] = useState(today)
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{date:Date;hour:string}|null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHolidays, setAiHolidays] = useState<string>('')

  const weekDates = getWeekDates(baseDate)
  const monthDates = getMonthDates(baseDate.getFullYear(), baseDate.getMonth())

  function prevPeriod() {
    const d = new Date(baseDate)
    view === 'week' ? d.setDate(d.getDate()-7) : d.setMonth(d.getMonth()-1)
    setBaseDate(d)
  }

  function nextPeriod() {
    const d = new Date(baseDate)
    view === 'week' ? d.setDate(d.getDate()+7) : d.setMonth(d.getMonth()+1)
    setBaseDate(d)
  }

  function getLessonsForSlot(date: Date, hour: string) {
    return lessons.filter(l => {
      const ld = new Date(l.scheduled_at)
      return ld.toDateString() === date.toDateString() &&
        ld.getHours() === parseInt(hour.split(':')[0])
    })
  }

  function getLessonsForDay(date: Date) {
    return lessons.filter(l => new Date(l.scheduled_at).toDateString() === date.toDateString())
  }

  function getTeacherName(id: string) {
    return teachers.find(t => t.id === id)?.full_name?.split(' ')[0] ?? '?'
  }

  async function askAiHolidays() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          type: 'holidays',
          year: baseDate.getFullYear(),
          month: baseDate.getMonth() + 1
        })
      })
      const d = await res.json()
      setAiHolidays(d.result ?? '')
    } catch {
      setAiHolidays('Bilgi alınamadı.')
    }
    setAiLoading(false)
  }

  const headerTitle = view === 'week'
    ? `${weekDates[0].getDate()} ${MONTHS[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${MONTHS[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`
    : `${MONTHS[baseDate.getMonth()]} ${baseDate.getFullYear()}`

  return (
    <div style={{padding:'24px',maxWidth:'1200px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h1 style={{fontSize:'18px',fontWeight:700,color:'#1B3A6B',margin:0}}>Planlama Takvimi</h1>
          <p style={{fontSize:'12px',color:'#7A8FA8',margin:'3px 0 0'}}>Ders programı, özel günler ve tatiller</p>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          {/* Görünüm */}
          <div style={{display:'flex',border:'1px solid #D5DFF0',borderRadius:'8px',overflow:'hidden'}}>
            {(['week','month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{padding:'7px 14px',fontSize:'12px',fontWeight:600,border:'none',cursor:'pointer',background:view===v?'#1B3A6B':'#fff',color:view===v?'#fff':'#4A6080'}}>
                {v==='week'?'Haftalık':'Aylık'}
              </button>
            ))}
          </div>
          {/* Nav */}
          <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
            <button onClick={prevPeriod} style={{padding:'7px 10px',borderRadius:'7px',border:'1px solid #D5DFF0',background:'#fff',cursor:'pointer',fontSize:'13px',color:'#1B3A6B'}}>←</button>
            <span style={{fontSize:'13px',fontWeight:600,color:'#1B3A6B',minWidth:'220px',textAlign:'center'}}>{headerTitle}</span>
            <button onClick={nextPeriod} style={{padding:'7px 10px',borderRadius:'7px',border:'1px solid #D5DFF0',background:'#fff',cursor:'pointer',fontSize:'13px',color:'#1B3A6B'}}>→</button>
          </div>
          <button onClick={() => setBaseDate(today)} style={{padding:'7px 12px',borderRadius:'7px',border:'1px solid #D5DFF0',background:'#fff',cursor:'pointer',fontSize:'12px',color:'#4A6080'}}>
            Bugün
          </button>
          <button onClick={() => setShowModal(true)} style={{padding:'7px 14px',borderRadius:'7px',border:'none',background:'#1B3A6B',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600}}>
            + Ders Ekle
          </button>
          <button onClick={askAiHolidays} style={{padding:'7px 12px',borderRadius:'7px',border:'1px solid #D5DFF0',background:'#F0F4F9',cursor:'pointer',fontSize:'12px',color:'#6B4FC8',fontWeight:600}}>
            {aiLoading ? '⏳' : '✨ AI Tatiller'}
          </button>
        </div>
      </div>

      {/* AI Tatil Sonucu */}
      {aiHolidays && (
        <div style={{background:'#F0ECFB',border:'1px solid #C4B5FD',borderRadius:'10px',padding:'12px 16px',marginBottom:'14px',fontSize:'12.5px',color:'#3B0764',lineHeight:1.6}}>
          <strong>AI Tatil Bilgisi:</strong> {aiHolidays}
          <button onClick={() => setAiHolidays('')} style={{marginLeft:'10px',fontSize:'11px',color:'#6B4FC8',background:'none',border:'none',cursor:'pointer'}}>✕ Kapat</button>
        </div>
      )}

      {/* Haftalık Görünüm */}
      {view === 'week' && (
        <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #D5DFF0',overflow:'hidden'}}>
          {/* Gün başlıkları */}
          <div style={{display:'grid',gridTemplateColumns:'64px repeat(7,1fr)',borderBottom:'1px solid #D5DFF0'}}>
            <div style={{background:'#F5F8FF'}} />
            {weekDates.map((date,i) => {
              const special = getSpecialDay(date)
              const isToday = date.toDateString() === today.toDateString()
              const isWeekend = i >= 5
              return (
                <div key={i} style={{padding:'10px 6px',textAlign:'center',background:special?'#FEF2F2':isWeekend?'#FAFBFF':'#F5F8FF',borderLeft:'1px solid #D5DFF0'}}>
                  <div style={{fontSize:'10px',fontWeight:600,color:isWeekend?'#9CA3AF':'#7A8FA8',letterSpacing:'.5px'}}>{DAYS_SHORT[i]}</div>
                  <div style={{
                    width:'28px',height:'28px',borderRadius:'50%',margin:'3px auto 0',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'13px',fontWeight:700,
                    background:isToday?'#1B3A6B':'transparent',
                    color:isToday?'#fff':isWeekend?'#9CA3AF':'#1B3A6B'
                  }}>
                    {date.getDate()}
                  </div>
                  {special && (
                    <div style={{fontSize:'9px',color:special.type==='holiday'?'#C0392B':'#B45309',fontWeight:600,marginTop:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {special.label}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Saat satırları */}
          <div style={{maxHeight:'560px',overflowY:'auto'}}>
            {HOURS.map(hour => (
              <div key={hour} style={{display:'grid',gridTemplateColumns:'64px repeat(7,1fr)',borderBottom:'1px solid #EEF2F9',minHeight:'52px'}}>
                <div style={{padding:'6px 8px',fontSize:'11px',color:'#9CA3AF',fontWeight:500,background:'#FAFBFF',borderRight:'1px solid #D5DFF0',display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}>
                  {hour}
                </div>
                {weekDates.map((date,di) => {
                  const slotLessons = getLessonsForSlot(date, hour)
                  const special = getSpecialDay(date)
                  const isWeekend = di >= 5
                  return (
                    <div
                      key={di}
                      onClick={() => { setSelectedSlot({date,hour}); setShowModal(true) }}
                      style={{
                        borderLeft:'1px solid #EEF2F9',padding:'3px',
                        background:special?'#FEF9F9':isWeekend?'#FAFBFF':'#fff',
                        cursor:'pointer',minHeight:'52px',
                        transition:'background .1s'
                      }}
                      onMouseEnter={e => !special && !isWeekend && ((e.currentTarget as HTMLElement).style.background='#F5F8FF')}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=special?'#FEF9F9':isWeekend?'#FAFBFF':'#fff'}
                    >
                      {slotLessons.map(l => {
                        const col = SUBJECT_COLORS[l.subject] ?? SUBJECT_COLORS['default']
                        return (
                          <div key={l.id} style={{background:col.bg,borderLeft:`3px solid ${col.border}`,borderRadius:'5px',padding:'3px 5px',marginBottom:'2px'}}>
                            <div style={{fontSize:'10px',fontWeight:700,color:col.text}}>{l.subject}</div>
                            <div style={{fontSize:'9px',color:col.text,opacity:.7}}>{getTeacherName(l.teacher_id)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aylık Görünüm */}
      {view === 'month' && (
        <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #D5DFF0',overflow:'hidden'}}>
          {/* Gün başlıkları */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #D5DFF0'}}>
            {DAYS_SHORT.map((d,i) => (
              <div key={d} style={{padding:'10px',textAlign:'center',fontSize:'11px',fontWeight:700,color:i>=5?'#9CA3AF':'#7A8FA8',background:'#F5F8FF',borderLeft:i>0?'1px solid #D5DFF0':'none',letterSpacing:'.5px'}}>
                {d}
              </div>
            ))}
          </div>
          {/* Günler */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {monthDates.map((date,i) => {
              if (!date) return <div key={i} style={{minHeight:'80px',background:'#FAFBFF',borderLeft:i%7>0?'1px solid #EEF2F9':'none',borderBottom:'1px solid #EEF2F9'}} />
              const special = getSpecialDay(date)
              const dayLessons = getLessonsForDay(date)
              const isToday = date.toDateString() === today.toDateString()
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isOtherMonth = date.getMonth() !== baseDate.getMonth()
              return (
                <div key={i} style={{minHeight:'80px',padding:'6px',background:special?'#FEF2F2':isWeekend?'#FAFBFF':'#fff',borderLeft:i%7>0?'1px solid #EEF2F9':'none',borderBottom:'1px solid #EEF2F9',cursor:'pointer',opacity:isOtherMonth?.5:1}} onClick={() => {setSelectedSlot({date,hour:'09:00'});setShowModal(true)}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,background:isToday?'#1B3A6B':'transparent',color:isToday?'#fff':isWeekend?'#9CA3AF':'#1B3A6B'}}>
                      {date.getDate()}
                    </div>
                    {special && <span style={{fontSize:'9px',color:'#C0392B',fontWeight:600}}>{special.label}</span>}
                  </div>
                  {dayLessons.slice(0,2).map(l => {
                    const col = SUBJECT_COLORS[l.subject] ?? SUBJECT_COLORS['default']
                    return (
                      <div key={l.id} style={{background:col.bg,borderLeft:`2px solid ${col.border}`,borderRadius:'3px',padding:'2px 4px',marginBottom:'2px',fontSize:'9px',fontWeight:600,color:col.text,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>
                        {new Date(l.scheduled_at).getHours()}:00 {l.subject}
                      </div>
                    )
                  })}
                  {dayLessons.length > 2 && <div style={{fontSize:'9px',color:'#7A8FA8',fontWeight:600}}>+{dayLessons.length-2} daha</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Renk Açıklaması */}
      <div style={{display:'flex',gap:'12px',marginTop:'12px',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:'11px',color:'#7A8FA8',fontWeight:600}}>Dersler:</span>
        {Object.entries(SUBJECT_COLORS).filter(([k])=>k!=='default').map(([subject,col]) => (
          <div key={subject} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:col.bg,border:`1.5px solid ${col.border}`}} />
            <span style={{fontSize:'11px',color:'#4A6080'}}>{subject}</span>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'8px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#FEF2F2',border:'1.5px solid #C0392B'}} />
          <span style={{fontSize:'11px',color:'#4A6080'}}>Resmi Tatil</span>
        </div>
      </div>

      {/* Ders Ekleme Modalı */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setShowModal(false)}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'24px',width:'380px',maxWidth:'90vw'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
              <h2 style={{fontSize:'15px',fontWeight:700,color:'#1B3A6B',margin:0}}>Ders Ekle</h2>
              <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:'#7A8FA8'}}>✕</button>
            </div>

            <AddLessonForm
              teachers={teachers}
              students={students}
              defaultDate={selectedSlot?.date ?? today}
              defaultHour={selectedSlot?.hour ?? '09:00'}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AddLessonForm({teachers,students,defaultDate,defaultHour,onClose}: {
  teachers:Profile[]; students:Profile[]; defaultDate:Date; defaultHour:string; onClose:()=>void
}) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '')
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [subject, setSubject] = useState('Matematik')
  const [date, setDate] = useState(defaultDate.toISOString().slice(0,10))
  const [hour, setHour] = useState(defaultHour)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const specialDay = getSpecialDay(new Date(date))

  const SUBJECTS = ['Matematik','Fizik','Kimya','Biyoloji','Türkçe','İngilizce','Tarih','Coğrafya']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const scheduledAt = new Date(`${date}T${hour}:00`).toISOString()

    const res = await fetch('/api/scheduling', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({teacher_id:teacherId, student_id:studentId, subject, scheduled_at:scheduledAt, duration_min:60})
    })
    const d = await res.json()
    if (d.ok) {
      onClose()
      window.location.reload()
    } else {
      setError(d.error ?? 'Hata oluştu.')
    }
    setLoading(false)
  }

  const inp = {width:'100%',padding:'8px 10px',borderRadius:'7px',border:'1px solid #D5DFF0',fontSize:'12.5px',color:'#1B3A6B',outline:'none',background:'#fff',boxSizing:'border-box' as const}
  const lbl = {display:'block',fontSize:'11.5px',fontWeight:600,color:'#4A6080',marginBottom:'5px'} as React.CSSProperties

  return (
    <form onSubmit={handleSubmit}>
      <div style={{marginBottom:'12px'}}>
        <label style={lbl}>Öğrenci</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} style={inp}>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>
      <div style={{marginBottom:'12px'}}>
        <label style={lbl}>Öğretmen</label>
        <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} style={inp}>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>
      <div style={{marginBottom:'12px'}}>
        <label style={lbl}>Ders</label>
        <select value={subject} onChange={e=>setSubject(e.target.value)} style={inp}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
        <div>
          <label style={lbl}>Tarih</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Saat</label>
          <select value={hour} onChange={e=>setHour(e.target.value)} style={inp}>
            {HOURS.map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
      </div>
      {specialDay && (
  <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'8px',padding:'10px 12px',marginBottom:'12px',display:'flex',alignItems:'flex-start',gap:'8px'}}>
    <span style={{fontSize:'16px',flexShrink:0}}>⚠️</span>
    <div>
      <div style={{fontSize:'12.5px',fontWeight:700,color:'#991B1B',marginBottom:'2px'}}>
        {specialDay.type === 'holiday' ? 'Resmi Tatil Günü!' : 'Özel Gün!'}
      </div>
      <div style={{fontSize:'12px',color:'#B91C1C'}}>
        {date} tarihi <strong>{specialDay.label}</strong> olarak işaretli. Yine de ders eklemek istiyor musunuz?
      </div>
    </div>
  </div>
)}
      {error && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'7px',padding:'8px 10px',fontSize:'12px',color:'#B91C1C',marginBottom:'12px'}}>{error}</div>}
      <div style={{display:'flex',gap:'8px'}}>
        <button type="submit" disabled={loading} style={{flex:1,padding:'9px',borderRadius:'8px',background:'#1B3A6B',color:'#fff',fontSize:'13px',fontWeight:600,border:'none',cursor:'pointer'}}>
          {loading?'Ekleniyor...':'Dersi Ekle'}
        </button>
        <button type="button" onClick={onClose} style={{padding:'9px 14px',borderRadius:'8px',background:'#F0F4F9',color:'#4A6080',fontSize:'13px',fontWeight:600,border:'none',cursor:'pointer'}}>
          İptal
        </button>
      </div>
    </form>
  )
}
