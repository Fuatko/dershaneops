'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SEVERITY_CFG: Record<string, { label:string, color:string, bg:string, border:string }> = {
  critical: { label:'KRITIK', color:'#7F1D1D', bg:'#FEF2F2', border:'#FECACA' },
  high:     { label:'YUKSEK', color:'#92400E', bg:'#FEF3C7', border:'#FDE68A' },
  medium:   { label:'ORTA',   color:'#1E40AF', bg:'#EFF6FF', border:'#BFDBFE' },
  low:      { label:'DUSUK',  color:'#14532D', bg:'#F0FDF4', border:'#BBF7D0' },
}

export default function EarlyAlertsPage() {
  const [savedAlerts, setSavedAlerts] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [scanning, setScanning]       = useState(false)
  const [filter, setFilter]           = useState('all')
  const [tenantId, setTenantId]       = useState<string>('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!prof?.tenant_id) return
    setTenantId(prof.tenant_id)
    const { data: saved } = await supabase.from('early_alerts')
      .select('*, profiles!early_alerts_student_id_fkey(full_name, grade_level)')
      .eq('tenant_id', prof.tenant_id)
      .order('created_at', { ascending: false })
    setSavedAlerts(saved ?? [])
    setLoading(false)
  }

  async function runScan() {
    if (!tenantId) return
    setScanning(true)
    const { data, error } = await supabase.rpc('calculate_early_alerts', { p_tenant_id: tenantId })
    if (!error && data) {
      for (const a of data) {
        if (a.signal_count === 0) continue
        const alertType = a.signal_count >= 3 ? 'combined' :
          a.signal_exam ? 'exam_decline' :
          a.signal_homework ? 'homework_drop' : 'attendance_drop'
        const { data: existing } = await supabase.from('early_alerts')
          .select('id').eq('student_id', a.student_id).eq('status', 'open').single()
        if (!existing) {
          await supabase.from('early_alerts').insert({
            tenant_id: tenantId,
            student_id: a.student_id,
            alert_type: alertType,
            severity: a.severity,
            signal_exam_decline: a.signal_exam,
            signal_homework_drop: a.signal_homework,
            signal_attendance_drop: a.signal_attendance,
            details: a.details,
          })
        }
      }
      await load()
    }
    setScanning(false)
  }

  async function acknowledge(alertId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('id').eq('user_id', user?.id ?? '').single()
    await supabase.from('early_alerts').update({
      status: 'acknowledged',
      acknowledged_by: prof?.id,
      acknowledged_at: new Date().toISOString(),
    }).eq('id', alertId)
    await load()
  }

  async function resolve(alertId: string) {
    await supabase.from('early_alerts').update({ status: 'resolved' }).eq('id', alertId)
    await load()
  }

  const filtered = savedAlerts.filter(a => filter === 'all' || a.status === filter)
  const critical = savedAlerts.filter(a => a.severity === 'critical' && a.status === 'open').length
  const high = savedAlerts.filter(a => a.severity === 'high' && a.status === 'open').length
  const open = savedAlerts.filter(a => a.status === 'open').length

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1100px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Erken Uyari Sistemi</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>3 sinyal: Sinav dusus + Odev tamamlama + Devamsizlik</p>
        </div>
        <button onClick={runScan} disabled={scanning}
          style={{ padding:'10px 20px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
          {scanning ? 'Taraniyor...' : 'Tara ve Guncelle'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Toplam Acik', value:open, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Kritik', value:critical, color:'#7F1D1D', bg:'#FEF2F2' },
          { label:'Yuksek', value:high, color:'#92400E', bg:'#FEF3C7' },
          { label:'Cozulen', value:savedAlerts.filter(a=>a.status==='resolved').length, color:'#14532D', bg:'#DCFCE7' },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:'24px', fontWeight:800, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:'10px', color:m.color, opacity:0.7, marginTop:'3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'14px', background:'#F0F4F9', borderRadius:'8px', padding:'3px', width:'fit-content' }}>
        {[
          { id:'all', label:'Tumu' },
          { id:'open', label:'Acik' },
          { id:'acknowledged', label:'Goruldu' },
          { id:'resolved', label:'Cozuldu' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'6px 14px', borderRadius:'6px', border:'none', background:filter===f.id?'#fff':'transparent', color:filter===f.id?'#1B3A6B':'#94A3B8', fontSize:'12px', fontWeight:filter===f.id?700:500, cursor:'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>Uyari yok</div>
          <div style={{ fontSize:'14px', color:'#94A3B8' }}>
            {filter === 'all' ? '"Tara ve Guncelle" ile sistemi tarayin' : 'Bu kategoride uyari yok'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {filtered.map(alert => {
            const cfg = SEVERITY_CFG[alert.severity] ?? SEVERITY_CFG.medium
            const details = alert.details ?? {}
            return (
              <div key={alert.id} style={{ background:'#fff', borderRadius:'12px', border:'2px solid '+cfg.border, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'11px', fontWeight:800, padding:'3px 10px', borderRadius:'20px', background:cfg.color, color:'#fff' }}>
                      {cfg.label}
                    </span>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>{alert.profiles?.full_name}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                        {alert.profiles?.grade_level ? alert.profiles.grade_level+'. Sinif · ' : ''}
                        {new Date(alert.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    {alert.status === 'open' && (
                      <>
                        <button onClick={() => acknowledge(alert.id)}
                          style={{ padding:'5px 10px', borderRadius:'6px', border:'1px solid #FDE68A', background:'#FEF3C7', color:'#92400E', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                          Goruldu
                        </button>
                        <button onClick={() => resolve(alert.id)}
                          style={{ padding:'5px 10px', borderRadius:'6px', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1E40AF', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                          Cozuldu
                        </button>
                      </>
                    )}
                    {alert.status !== 'open' && (
                      <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'10px', background:alert.status==='resolved'?'#DCFCE7':'#FEF3C7', color:alert.status==='resolved'?'#14532D':'#92400E' }}>
                        {alert.status === 'resolved' ? 'Cozuldu' : 'Goruldu'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ padding:'12px 16px', display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {alert.signal_exam_decline && (
                    <div style={{ padding:'6px 12px', borderRadius:'8px', background:'#FEF2F2', border:'1px solid #FECACA', fontSize:'12px', color:'#7F1D1D', fontWeight:600 }}>
                      Sinav Dususu: {details.exam_prev3_avg} net den {details.exam_last3_avg} nete dustu
                    </div>
                  )}
                  {alert.signal_homework_drop && (
                    <div style={{ padding:'6px 12px', borderRadius:'8px', background:'#FEF3C7', border:'1px solid #FDE68A', fontSize:'12px', color:'#92400E', fontWeight:600 }}>
                      Odev Tamamlama: Yuzde{details.hw_completion_rate}
                    </div>
                  )}
                  {alert.signal_attendance_drop && (
                    <div style={{ padding:'6px 12px', borderRadius:'8px', background:'#FFF7ED', border:'1px solid #FED7AA', fontSize:'12px', color:'#C2410C', fontWeight:600 }}>
                      Devamsizlik: Yuzde{details.absence_rate}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
