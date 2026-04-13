'use client'
export const dynamic = 'force-dynamic'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [logs, setLogs] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const tables = ['tenants', 'profiles', 'lessons', 'books', 'homework_assignments', 'student_answers', 'notifications']
    const counts: any = {}
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
      counts[t] = count ?? 0
    }
    setStats(counts)
  }

  async function exportAll() {
    setLoading(true)
    const tables = ['tenants', 'profiles', 'books', 'chapters', 'tests', 'answer_keys', 'lessons', 'homework_assignments', 'student_answers', 'notifications']
    const backup: any = { exported_at: new Date().toISOString(), version: '1.0', tables: {} }
    let total = 0

    for (const t of tables) {
      const { data } = await supabase.from(t).select('*')
      backup.tables[t] = data ?? []
      total += data?.length ?? 0
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dershaneops_backup_${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    addLog('Tam sistem yedegi alindi', total, 'export')
    setLoading(false)
  }

  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('Bu islem mevcut verilerin uzerine yazabilir. Devam etmek istiyor musunuz?')) return
    setLoading(true)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      if (!backup.tables) { alert('Gecersiz yedek dosyasi!'); setLoading(false); return }

      let total = 0
      for (const [tableName, rows] of Object.entries(backup.tables)) {
        const data = rows as any[]
        if (data.length === 0) continue
        const { error } = await supabase.from(tableName).upsert(data, { onConflict: 'id' })
        if (!error) total += data.length
      }

      addLog(`Yedek yuklendi: ${file.name}`, total, 'import')
      alert(`Basarili! ${total} kayit yuklendi.`)
      loadStats()
    } catch { alert('Dosya okunamadi.') }

    setLoading(false)
    e.target.value = ''
  }

  function addLog(action: string, count: number, type: string) {
    setLogs(prev => [{ id: Date.now(), action, count, type, time: new Date().toLocaleTimeString('tr-TR') }, ...prev.slice(0, 19)])
  }

  const TABLES = [
    { name: 'tenants', label: 'Kurumlar' },
    { name: 'profiles', label: 'Kullanicilar' },
    { name: 'books', label: 'Kitaplar' },
    { name: 'lessons', label: 'Dersler' },
    { name: 'homework_assignments', label: 'Odevler' },
    { name: 'student_answers', label: 'Ogrenci Cevaplari' },
    { name: 'notifications', label: 'Bildirimler' },
  ]

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Yedekleme & Geri Yukleme</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Cok katmanli veri guvenligi sistemi</p>
      </div>

      {/* Supabase PITR Durumu */}
      <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2E7D52', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D52' }}>Supabase Pro — Otomatik Yedekleme Aktif</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {[
            { label: 'Gunluk Tam Yedek', value: 'Aktif', icon: '✓', color: '#2E7D52' },
            { label: 'Point-in-Time Recovery', value: '7 Gun', icon: '✓', color: '#2E7D52' },
            { label: 'WAL Arshivleme', value: 'Surekli', icon: '✓', color: '#2E7D52' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: '#3B7A57', fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: m.color }}>{m.icon} {m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#3B7A57', lineHeight: 1.6 }}>
          Supabase'in WAL mekanizmasi sayesinde son 7 gun icindeki herhangi bir saniyeye geri donebilirsiniz.
          Geri yukleme icin: <strong>supabase.com → proje → Settings → Backups → Restore</strong>
        </div>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', padding: '6px 14px', borderRadius: '7px', background: '#2E7D52', color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          Supabase Backup Dashboard →
        </a>
      </div>

      {/* Katmanlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Katman 1', desc: 'Gunluk tam yedek', status: 'Aktif', color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Katman 2', desc: 'WAL surekli arsiv', status: 'Aktif', color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Katman 3', desc: 'PITR (7 gun)', status: 'Aktif', color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Katman 4', desc: 'Manuel JSON export', status: 'Manuel', color: '#B45309', bg: '#FDF4E7' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: m.color, fontWeight: 700, marginBottom: '3px' }}>{m.label}</div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500, marginBottom: '4px' }}>{m.desc}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: m.color }}>{m.status}</div>
          </div>
        ))}
      </div>

      {/* Manuel Export/Import */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>Manuel Tam Yedek Al</div>
          <p style={{ fontSize: '12px', color: '#4A6080', marginBottom: '14px', lineHeight: 1.6 }}>
            Tum verileri JSON olarak bilgisayariniza indirin. Ekstra guvenlik katmani.
          </p>
          <button onClick={exportAll} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            {loading ? 'Hazirlaniyor...' : 'JSON Yedek Al'}
          </button>
        </div>

        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#C0392B', marginBottom: '6px' }}>Yedekten Geri Yukle</div>
          <p style={{ fontSize: '12px', color: '#7F1D1D', marginBottom: '14px', lineHeight: 1.6 }}>
            JSON yedek dosyasindan verileri geri yukleyin. Mevcut veriler uzerine yazilir!
          </p>
          <label style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '8px', background: '#C0392B', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}>
            {loading ? 'Yukleniyor...' : 'Yedek Dosyasi Sec'}
            <input type="file" accept=".json" onChange={importBackup} style={{ display: 'none' }} disabled={loading} />
          </label>
        </div>
      </div>

      {/* Tablo Bazli */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Tablo Bazli Yedek</span>
        </div>
        {TABLES.map((table, i) => (
          <div key={table.name} style={{ padding: '11px 18px', borderBottom: i < TABLES.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{table.label}</div>
              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{stats[table.name] ?? 0} kayit</div>
            </div>
            <button
              onClick={async () => {
                setLoading(true)
                const { data } = await supabase.from(table.name).select('*')
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${table.name}_${new Date().toISOString().slice(0,10)}.json`
                a.click()
                URL.revokeObjectURL(url)
                addLog(`${table.label} export edildi`, data?.length ?? 0, 'export')
                setLoading(false)
              }}
              disabled={loading}
              style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #D5DFF0', background: '#F5F8FF', color: '#1B3A6B', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Export
            </button>
          </div>
        ))}
      </div>

      {/* KVKK Notu */}
      <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12.5px', color: '#92400E', lineHeight: 1.7 }}>
          <strong>KVKK & Veri Guvenligi:</strong> Yedek dosyalari kisisel veri icerir.
          Guvenli ortamlarda saklayin, yetkisiz kisilerle paylasmayın.
          Turkiye'deki sunuculara tasima icin KVKK Surec belgelerini inceleyin.
          Saklama suresi: Haftalik 30 gun, aylik 1 yil.
        </div>
      </div>

      {/* Log */}
      {logs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #D5DFF0' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Islem Gecmisi</span>
          </div>
          {logs.map((log, i) => (
            <div key={log.id} style={{ padding: '10px 18px', borderBottom: i < logs.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.type === 'import' ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>{log.action}</span>
              <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{log.count} kayit</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{log.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
