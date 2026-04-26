'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TenantsPage() {
  const [tenants, setTenants]         = useState<any[]>([])
  const [selected, setSelected]       = useState<any>(null)
  const [tenantUsers, setTenantUsers] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm] = useState({
    name:'', slug:'', plan:'basic', contact_email:'', phone:'',
    address:'', max_students:50, max_teachers:10,
    admin_email:'', admin_name:''
  })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [inviteResult, setInviteResult] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending:false })
    setTenants(data??[]); setLoading(false)
  }

  async function loadTenantUsers(tenantId: string) {
    const { data } = await supabase.from('profiles')
      .select('id, full_name, role')
      .eq('tenant_id', tenantId)
      .order('role')
    setTenantUsers(data??[])
  }

  async function selectTenant(t: any) {
    setSelected(t); setInviteResult(''); await loadTenantUsers(t.id)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setInviteResult('')

    const { data: newTenant, error: err } = await supabase
      .from('tenants')
      .insert({
        name:form.name, slug:form.slug, plan:form.plan,
        contact_email:form.contact_email, phone:form.phone,
        address:form.address, max_students:form.max_students,
        max_teachers:form.max_teachers, is_active:true
      })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }

    if (form.admin_email && form.admin_name) {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.admin_email,
          full_name: form.admin_name,
          role: 'admin',
          tenant_id: newTenant.id,
        }),
      })
      const d = await res.json()
      if (!d.success) {
        setError('Kurum oluşturuldu ama admin daveti başarısız: ' + d.error)
        setSaving(false); load(); return
      } else {
        setInviteResult(`✅ ${form.admin_email} adresine davet maili gönderildi.`)
      }
    }

    setShowModal(false)
    setForm({ name:'', slug:'', plan:'basic', contact_email:'', phone:'', address:'', max_students:50, max_teachers:10, admin_email:'', admin_name:'' })
    load(); setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('tenants').update({ is_active:!current }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((p: any) => ({ ...p, is_active: !current }))
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" kurumunu silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz! Tüm kullanıcılar ve veriler silinecek.`)) return
    setDeleting(true)

    // Once tum kullanicilari sil (auth.users dahil)
    const { data: users } = await supabase.from('profiles').select('user_id').eq('tenant_id', id)
    for (const u of  {
      if (u.user_id) {
        await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: u.user_id })
        })
      }
    }

    // Sonra tenant'i sil
    await supabase.from('tenants').delete().eq('id', id)
    setSelected(null); setTenantUsers([])
    setDeleting(false); load()
  }

  async function inviteAdmin(tenantId: string) {
    const email = prompt('Admin e-posta adresi:')
    if (!email) return
    const name = prompt('Admin ad soyad:')
    if (!name) return

    const res = await fetch('/api/admin/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: name, role: 'admin', tenant_id: tenantId }),
    })
    const d = await res.json()
    if (d.success) {
      setInviteResult(`✅ ${email} adresine davet maili gönderildi!`)
      await loadTenantUsers(tenantId)
    } else {
      setInviteResult(`❌ Hata: ${d.error}`)
    }
  }

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase' as const }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <div style={{ padding:'3px 10px', borderRadius:'20px', background:'#EDE9FE', border:'1px solid #C4B5FD', fontSize:'11px', fontWeight:700, color:'#4C1D95', display:'inline-block', marginBottom:'6px' }}>SÜPER ADMİN</div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Kurumlar</h1>
          <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Tüm dershane kurumlarını yönet</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding:'9px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
          + Yeni Kurum
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Toplam Kurum', value:tenants.length, color:'#4C1D95', bg:'#EDE9FE' },
          { label:'Aktif', value:tenants.filter(t=>t.is_active).length, color:'#14532D', bg:'#DCFCE7' },
          { label:'Pasif', value:tenants.filter(t=>!t.is_active).length, color:'#7F1D1D', bg:'#FEF2F2' },
          { label:'Pro+', value:tenants.filter(t=>t.plan!=='basic').length, color:'#92400E', bg:'#FEF3C7' },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
            <div style={{ fontSize:'26px', fontWeight:800, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:'14px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Kurum adı veya slug ara..."
          style={{ ...inp, maxWidth:'360px' }} />
      </div>

      <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'260px 1fr' }}>

        {/* Sol: kurum listesi */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>
            Kurumlar ({filtered.length})
          </div>
          <div style={{ maxHeight:'500px', overflowY:'auto' }}>
            {filtered.map(t => (
              <div key={t.id} onClick={() => selectTenant(t)}
                style={{ padding:'10px 14px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', background:selected?.id===t.id?'#F5F8FF':'#fff', borderLeft:selected?.id===t.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{t.name}</span>
                  <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'6px', background:'#EEF3FB', color:'#1B3A6B' }}>{t.plan?.toUpperCase()}</span>
                  {!t.is_active && <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'6px', background:'#FEF2F2', color:'#7F1D1D' }}>PASİF</span>}
                </div>
                <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{t.slug} · {t.max_students} öğrenci</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: detay */}
        {!selected ? (
          <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Sol listeden kurum seçin</div>
          </div>
        ) : (
          <div>
            {/* Kurum başlık */}
            <div style={{ background:'#1B3A6B', borderRadius:'12px', padding:'16px 18px', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:800, color:'#fff' }}>{selected.name}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>
                    {selected.slug} · {selected.contact_email}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  <button onClick={() => inviteAdmin(selected.id)}
                    style={{ padding:'7px 12px', borderRadius:'7px', border:'none', background:'#DCFCE7', color:'#14532D', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    + Admin Davet Et
                  </button>
                  <button onClick={() => toggleActive(selected.id, selected.is_active)}
                    style={{ padding:'7px 12px', borderRadius:'7px', border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    {selected.is_active ? 'Pasife Al' : 'Aktive Et'}
                  </button>
                  <button onClick={() => handleDelete(selected.id, selected.name)} disabled={deleting}
                    style={{ padding:'7px 12px', borderRadius:'7px', border:'none', background:'#FEF2F2', color:'#DC2626', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    {deleting ? 'Siliniyor...' : 'Kurumu Sil'}
                  </button>
                </div>
              </div>
            </div>

            {inviteResult && (
              <div style={{ background: inviteResult.startsWith('✅') ? '#DCFCE7' : '#FEF2F2', border:'1px solid', borderColor: inviteResult.startsWith('✅') ? '#86EFAC' : '#FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', fontSize:'13px', color: inviteResult.startsWith('✅') ? '#14532D' : '#DC2626', fontWeight:600 }}>
                {inviteResult}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
              {[
                { label:'Plan', value:selected.plan?.toUpperCase(), color:'#4C1D95', bg:'#EDE9FE' },
                { label:'Maks Öğrenci', value:selected.max_students, color:'#1B3A6B', bg:'#EEF3FB' },
                { label:'Maks Öğretmen', value:selected.max_teachers, color:'#14532D', bg:'#DCFCE7' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                  <div style={{ fontSize:'20px', fontWeight:800, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Kullanıcılar ({tenantUsers.length})</div>
              </div>
              {tenantUsers.length === 0 ? (
                <div style={{ padding:'24px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>
                  Kullanıcı yok — "+ Admin Davet Et" butonunu kullanın
                </div>
              ) : tenantUsers.map((u, i) => {
                const roleLabel = u.role==='teacher'?'Öğretmen':u.role==='student'?'Öğrenci':u.role==='admin'?'Admin':u.role==='parent'?'Veli':'Diğer'
                const roleBg = u.role==='admin'?'#FEF3C7':u.role==='teacher'?'#DCFCE7':u.role==='student'?'#EEF3FB':'#EDE9FE'
                const roleColor = u.role==='admin'?'#92400E':u.role==='teacher'?'#14532D':u.role==='student'?'#1B3A6B':'#4C1D95'
                return (
                  <div key={u.id} style={{ padding:'10px 16px', borderBottom:i<tenantUsers.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                      {u.full_name?.split(' ').map((n:string) => n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{u.full_name}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'8px', background:roleBg, color:roleColor }}>
                      {roleLabel}
                    </span>
                  <button onClick={async () => {
                      if (!confirm((u.full_name || u.email) + ' silinsin mi?')) return
                      await fetch('/api/admin/delete-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: u.user_id })
                      })
                      await loadTenantUsers(selected.id)
                    }} style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                    Sil
                  </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Yeni Kurum Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}
          onClick={() => setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', width:'500px', maxWidth:'100%', maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
              <h2 style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Yeni Kurum Ekle</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#7A8FA8' }}>×</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Kurum Bilgileri</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div><label style={lbl}>Kurum Adı *</label><input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} required placeholder="ABC Dershane" style={inp} /></div>
                <div><label style={lbl}>Slug *</label><input value={form.slug} onChange={e => setForm(p => ({...p, slug:e.target.value.toLowerCase().replace(/\s/g,'-')}))} required placeholder="abc-dershane" style={inp} /></div>
              </div>

              <div style={{ marginBottom:'10px' }}>
                <label style={lbl}>İletişim E-postası</label>
                <input type="email" value={form.contact_email} onChange={e => setForm(p => ({...p, contact_email:e.target.value}))} placeholder="info@dershane.com" style={inp} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div><label style={lbl}>Telefon</label><input value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))} placeholder="0212 xxx xx xx" style={inp} /></div>
                <div>
                  <label style={lbl}>Plan</label>
                  <select value={form.plan} onChange={e => setForm(p => ({...p, plan:e.target.value}))} style={inp}>
                    <option value="basic">Basic (50 öğrenci)</option>
                    <option value="pro">Pro (200 öğrenci)</option>
                    <option value="enterprise">Enterprise (Sınırsız)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:'10px' }}>
                <label style={lbl}>Adres</label>
                <input value={form.address} onChange={e => setForm(p => ({...p, address:e.target.value}))} placeholder="Kurum adresi..." style={inp} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                <div><label style={lbl}>Maks Öğrenci</label><input type="number" value={form.max_students} onChange={e => setForm(p => ({...p, max_students:parseInt(e.target.value)}))} style={inp} /></div>
                <div><label style={lbl}>Maks Öğretmen</label><input type="number" value={form.max_teachers} onChange={e => setForm(p => ({...p, max_teachers:parseInt(e.target.value)}))} style={inp} /></div>
              </div>

              <div style={{ height:'1px', background:'#F0F4F9', margin:'14px 0' }} />
              <div style={{ fontSize:'11px', fontWeight:700, color:'#4C1D95', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
                Admin Kullanıcı Daveti (Opsiyonel)
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div><label style={lbl}>Admin Ad Soyad</label><input value={form.admin_name} onChange={e => setForm(p => ({...p, admin_name:e.target.value}))} placeholder="Ahmet Yılmaz" style={inp} /></div>
                <div><label style={lbl}>Admin E-posta</label><input type="email" value={form.admin_email} onChange={e => setForm(p => ({...p, admin_email:e.target.value}))} placeholder="admin@dershane.com" style={inp} /></div>
              </div>

              <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'10px 12px', marginBottom:'16px', fontSize:'12px', color:'#1B3A6B' }}>
                Girilirse admin kullanıcıya otomatik davet maili gönderilir.
              </div>

              {error && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px', fontSize:'12px', color:'#7F1D1D', marginBottom:'12px' }}>{error}</div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <button type="submit" disabled={saving}
                  style={{ flex:1, padding:'10px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  {saving ? 'Oluşturuluyor...' : 'Kurumu Oluştur'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding:'10px 16px', borderRadius:'8px', background:'#F1F5F9', color:'#475569', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}