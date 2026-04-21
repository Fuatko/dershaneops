'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MsgType = 'manual' | 'risk_alert' | 'homework_reminder' | 'weekly_report'

const MSG_TYPES: Record<MsgType, { label: string; desc: string; color: string; bg: string; icon: string }> = {
  risk_alert:          { label: 'Risk Uyarısı',         desc: 'Risk skoru ≥45 olan velilere otomatik uyarı',  color: '#DC2626', bg: '#FEF2F2', icon: '🚨' },
  homework_reminder:   { label: 'Ödev Hatırlatma',      desc: 'Bekleyen ödevleri olan velilere hatırlatma',    color: '#D97706', bg: '#FEF3C7', icon: '📚' },
  weekly_report:       { label: 'Haftalık Rapor',       desc: 'Tüm velilere haftalık rapor bildirimi',        color: '#1B3A6B', bg: '#EEF3FB', icon: '📊' },
  manual:              { label: 'Manuel Mesaj',          desc: 'Seçili kişilere özel mesaj gönder',            color: '#6B4FC8', bg: '#EDE9FE', icon: '✉️' },
}

export default function NotificationsPage() {
  const [parents, setParents]     = useState<any[]>([])
  const [history, setHistory]     = useState<any[]>([])
  const [selected, setSelected]   = useState<string[]>([])
  const [msgType, setMsgType]     = useState<MsgType>('manual')
  const [customMsg, setCustomMsg] = useState('')
  const [sending, setSending]     = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [tab, setTab]             = useState<'send' | 'history'>('send')
  const [phoneEdit, setPhoneEdit] = useState<Record<string, string>>({})
  const [savingPhone, setSavingPhone] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, phone_number, whatsapp_enabled, role')
        .in('role', ['parent', 'student'])
        .order('full_name'),
      supabase.from('whatsapp_notifications')
        .select('*, profiles!whatsapp_notifications_recipient_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setParents(p ?? [])
    setHistory(h ?? [])
  }

  async function savePhone(profileId: string) {
    const phone = phoneEdit[profileId]?.trim()
    if (!phone) return
    setSavingPhone(profileId)
    await supabase.from('profiles').update({ phone_number: phone, whatsapp_enabled: true }).eq('id', profileId)
    await load()
    setSavingPhone(null)
    setPhoneEdit(prev => { const n = {...prev}; delete n[profileId]; return n })
  }

  async function toggleWhatsApp(profileId: string, current: boolean) {
    await supabase.from('profiles').update({ whatsapp_enabled: !current }).eq('id', profileId)
    await load()
  }

  async function handleSend() {
    if (msgType === 'manual' && !customMsg.trim()) {
      alert('Manuel mesaj için mesaj metni giriniz.')
      return
    }
    setSending(true); setResult(null)
    try {
      const body: any = { type: msgType }
      if (msgType === 'manual') {
        if (selected.length === 0) { alert('En az bir alıcı seçin.'); setSending(false); return }
        body.recipient_ids = selected
        body.custom_message = customMsg
      }
      const res  = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
      await load()
    } catch (e: any) {
      setResult({ error: e.message })
    }
    setSending(false)
  }

  const enabledCount  = parents.filter(p => p.whatsapp_enabled && p.phone_number).length
  const sentToday     = history.filter(h => h.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length
  const failedTotal   = history.filter(h => h.status === 'failed').length

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      {/* Başlık */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>
          WhatsApp Bildirimleri
        </h1>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0' }}>
          Twilio WhatsApp API — Veli & öğrenci bildirimleri
        </p>
      </div>

      {/* Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'WhatsApp Aktif', value: enabledCount, color: '#14532D', bg: '#DCFCE7' },
          { label: 'Bugün Gönderilen', value: sentToday,  color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Başarısız',        value: failedTotal, color: '#DC2626', bg: '#FEF2F2' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: m.color, opacity: 0.75, marginTop: '3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
        {([['send', 'Bildirim Gönder'], ['history', 'Geçmiş']] as const).map(([val, lbl]) => (
          <button key={val} onClick={() => setTab(val)}
            style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: tab === val ? '#fff' : 'transparent', color: tab === val ? '#1B3A6B' : '#64748B', fontSize: '13px', fontWeight: tab === val ? 600 : 400, cursor: 'pointer' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── GÖNDER ── */}
      {tab === 'send' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Mesaj tipi seç */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Bildirim Tipi</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
              {(Object.entries(MSG_TYPES) as [MsgType, typeof MSG_TYPES[MsgType]][]).map(([val, cfg]) => (
                <button key={val} onClick={() => setMsgType(val)}
                  style={{ padding: '12px 14px', borderRadius: '10px', border: `2px solid ${msgType === val ? cfg.color : '#E2E8F0'}`, background: msgType === val ? cfg.bg : '#F8FAFC', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cfg.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: cfg.color, marginBottom: '2px' }}>{cfg.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>{cfg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manuel mesaj alanı */}
          {msgType === 'manual' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                Mesaj Metni
              </label>
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="Veliye gönderilecek WhatsApp mesajını yazın...&#10;&#10;*Kalın* metin için yıldız, _italik_ için alt çizgi kullanabilirsiniz."
                rows={5}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#1E293B', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{customMsg.length} karakter</div>
            </div>
          )}

          {/* Alıcı listesi (manuel için) */}
          {msgType === 'manual' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Alıcılar
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setSelected(parents.filter(p => p.whatsapp_enabled && p.phone_number).map(p => p.id))}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1B3A6B', cursor: 'pointer', fontWeight: 600 }}>
                    Tümünü Seç
                  </button>
                  <button onClick={() => setSelected([])}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer' }}>
                    Temizle
                  </button>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', maxHeight: '280px', overflowY: 'auto' }}>
                {parents.filter(p => p.whatsapp_enabled && p.phone_number).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                    WhatsApp aktif kişi yok — aşağıdan telefon numarası ekleyin
                  </div>
                ) : parents.filter(p => p.whatsapp_enabled && p.phone_number).map((p, i) => (
                  <div key={p.id} onClick={() => setSelected(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: i < parents.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', background: selected.includes(p.id) ? '#F0FDF8' : '#fff' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selected.includes(p.id) ? '#10B981' : '#E2E8F0'}`, background: selected.includes(p.id) ? '#10B981' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected.includes(p.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{p.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{p.phone_number} · {p.role === 'parent' ? 'Veli' : 'Öğrenci'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {selected.length > 0 && (
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '6px' }}>
                  {selected.length} kişi seçildi
                </div>
              )}
            </div>
          )}

          {/* Gönder butonu */}
          <button onClick={handleSend} disabled={sending}
            style={{ padding: '13px', borderRadius: '10px', background: sending ? '#94A3B8' : '#1B3A6B', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: sending ? 'default' : 'pointer' }}>
            {sending ? '⏳ Gönderiliyor...' : `📤 ${MSG_TYPES[msgType].icon} ${MSG_TYPES[msgType].label} Gönder`}
          </button>

          {/* Sonuç */}
          {result && (
            <div style={{ background: result.error ? '#FEF2F2' : '#DCFCE7', border: `1px solid ${result.error ? '#FECACA' : '#86EFAC'}`, borderRadius: '10px', padding: '14px 16px' }}>
              {result.error ? (
                <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>❌ Hata: {result.error}</div>
              ) : (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#14532D', marginBottom: '8px' }}>
                    ✅ {result.sent} mesaj gönderildi{result.failed > 0 ? `, ${result.failed} başarısız` : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.results?.map((r: any) => (
                      <div key={r.id} style={{ fontSize: '12px', color: r.status === 'sent' ? '#14532D' : '#DC2626' }}>
                        {r.status === 'sent' ? '✓' : '✗'} {r.name} {r.error ? `— ${r.error}` : ''}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GEÇMİŞ ── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {history.length === 0 ? (
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '48px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '14px' }}>
              Henüz bildirim gönderilmedi
            </div>
          ) : history.map(h => {
            const cfg = MSG_TYPES[h.message_type as MsgType] ?? MSG_TYPES.manual
            const statusColor = h.status === 'sent' ? '#14532D' : h.status === 'failed' ? '#DC2626' : '#64748B'
            const statusBg    = h.status === 'sent' ? '#DCFCE7' : h.status === 'failed' ? '#FEF2F2' : '#F1F5F9'
            const statusLabel = h.status === 'sent' ? 'Gönderildi' : h.status === 'failed' ? 'Başarısız' : 'Bekliyor'
            return (
              <div key={h.id} style={{ background: '#fff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '20px', flexShrink: 0 }}>{cfg.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>
                    {h.profiles?.full_name ?? h.phone_number}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                    {cfg.label} · {new Date(h.created_at).toLocaleString('tr-TR')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.message_body.slice(0, 80)}...
                  </div>
                  {h.error_message && (
                    <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{h.error_message}</div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: statusBg, color: statusColor, border: `1px solid ${statusColor}30`, flexShrink: 0 }}>
                  {statusLabel}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TELEFON NUMARASI YÖNETİMİ ── */}
      <div style={{ marginTop: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>📱 WhatsApp Numara Yönetimi</div>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#DCFCE7', color: '#14532D', fontWeight: 600 }}>{enabledCount} aktif</span>
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {parents.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: i < parents.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                {p.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B' }}>{p.full_name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>{p.role === 'parent' ? 'Veli' : 'Öğrenci'}</div>
              </div>

              {phoneEdit[p.id] !== undefined ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    value={phoneEdit[p.id]}
                    onChange={e => setPhoneEdit(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="+90 5XX XXX XX XX"
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px', width: '160px', outline: 'none' }}
                  />
                  <button onClick={() => savePhone(p.id)} disabled={savingPhone === p.id}
                    style={{ padding: '5px 10px', borderRadius: '6px', background: '#1B3A6B', color: '#fff', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {savingPhone === p.id ? '...' : 'Kaydet'}
                  </button>
                  <button onClick={() => setPhoneEdit(prev => { const n = {...prev}; delete n[p.id]; return n })}
                    style={{ padding: '5px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B', fontSize: '11px', border: 'none', cursor: 'pointer' }}>
                    İptal
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {p.phone_number ? (
                    <>
                      <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>{p.phone_number}</span>
                      <button
                        onClick={() => toggleWhatsApp(p.id, p.whatsapp_enabled)}
                        style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: p.whatsapp_enabled ? '#10B981' : '#CBD5E1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                        aria-label={p.whatsapp_enabled ? 'WhatsApp kapat' : 'WhatsApp aç'}
                      >
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: p.whatsapp_enabled ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>Numara yok</span>
                  )}
                  <button onClick={() => setPhoneEdit(prev => ({ ...prev, [p.id]: p.phone_number ?? '' }))}
                    style={{ padding: '4px 10px', borderRadius: '6px', background: '#F1F5F9', color: '#1B3A6B', fontSize: '11px', fontWeight: 600, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    {p.phone_number ? 'Düzenle' : '+ Ekle'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}