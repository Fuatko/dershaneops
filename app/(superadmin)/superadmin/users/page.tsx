'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterTenant, setFilterTenant] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: u } = await supabase.from('profiles').select('*, tenants(name)').order('created_at', { ascending:false })
    const { data: t } = await supabase.from('tenants').select('id, name').order('name')
    setUsers(u??[]); setTenants(t??[]); setLoading(false)
  }

  async function toggleRole(user: any, newRole: string) {
    setSaving(true)
    await supabase.from('profiles').update({ role:newRole }).eq('id', user.id)
    load(); setSelected(null); setSaving(false)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole==='all' || u.role===filterRole
    const matchTenant = filterTenant==='all' || u.tenant_id===filterTenant
    return matchSearch && matchRole && matchTenant
  })

  const roleColor = (role: string) => {
    if (role==='teacher') return { bg:'#DCFCE7', color:'#14532D', label:'Öğretmen' }
    if (role==='student') return { bg:'#EEF3FB', color:'#1B3A6B', label:'Öğrenci' }
    if (role==='parent') return { bg:'#EDE9FE', color:'#4C1D95', label:'Veli' }
    return { bg:'#FEF3C7', color:'#92400E', label:role }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Tüm Kullanıcılar</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Platform genelinde tüm kullanıcılar</p>
      </div>

      <div className="metrics-row">
        {[
          { label:'Toplam', value:users.length, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Öğrenci', value:users.filter(u=>u.role==='student').length, color:'#1B3A6B', bg:'#EEF3FB' },
          { label:'Öğretmen', value:users.filter(u=>u.role==='teacher').length, color:'#14532D', bg:'#DCFCE7' },
          { label:'Veli', value:users.filter(u=>u.role==='parent').length, color:'#4C1D95', bg:'#EDE9FE' },
        ].map(m=>(
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
            <div style={{ fontSize:'26px', fontWeight:800, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="İsim veya e-posta ara..." style={{ ...inp, flex:1, minWidth:'160px', maxWidth:'280px' }} />
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{ ...inp, width:'auto', minWidth:'120px' }}>
          <option value="all">Tüm Roller</option>
          <option value="student">Öğrenci</option>
          <option value="teacher">Öğretmen</option>
          <option value="parent">Veli</option>
        </select>
        <select value={filterTenant} onChange={e=>setFilterTenant(e.target.value)} style={{ ...inp, width:'auto', minWidth:'140px' }}>
          <option value="all">Tüm Kurumlar</option>
          {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
          Kullanıcılar ({filtered.length})
        </div>
        {filtered.length===0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>Kullanıcı bulunamadı</div>
        ) : filtered.map((u,i)=>{
          const rc = roleColor(u.role)
          return (
            <div key={u.id} onClick={()=>setSelected(selected?.id===u.id?null:u)} style={{ padding:'11px 16px', borderBottom:i<filtered.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:selected?.id===u.id?'#F5F8FF':'#fff', flexWrap:'wrap' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                {u.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:'100px' }}>
                <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{u.full_name}</div>
                <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{u.email} · {u.tenants?.name}</div>
              </div>
              <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'8px', background:rc.bg, color:rc.color, flexShrink:0 }}>{rc.label}</span>

              {selected?.id===u.id && (
                <div style={{ width:'100%', background:'#F8FAFC', borderRadius:'8px', padding:'10px 12px', marginTop:'6px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  <div style={{ fontSize:'11px', color:'#475569', marginBottom:'6px', width:'100%' }}>Rolü Değiştir:</div>
                  {['student','teacher','parent'].map(r=>(
                    <button key={r} onClick={e=>{ e.stopPropagation(); toggleRole(u,r) }} disabled={saving||u.role===r}
                      style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #E2E8F0', background:u.role===r?'#1B3A6B':'#fff', color:u.role===r?'#fff':'#475569', fontSize:'11.5px', fontWeight:600, cursor:u.role===r?'default':'pointer' }}>
                      {r==='student'?'Öğrenci':r==='teacher'?'Öğretmen':'Veli'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}