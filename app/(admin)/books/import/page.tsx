'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ok:boolean;message:string;count?:number}|null>(null)
  const [dragOver, setDragOver] = useState(false)
  const router = useRouter()

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/books/import-excel', { method:'POST', body:fd })
      const d = await res.json()
      setResult(d.ok
        ? { ok:true, message: d.count + ' satir aktarildi.', count: d.count }
        : { ok:false, message: d.error ?? 'Hata olustu.' }
      )
    } catch {
      setResult({ ok:false, message: 'Baglanilamadi.' })
    }
    setLoading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setFile(f); setResult(null)
    }
  }

  const csvTemplate = 'kitap_adi,bolum_adi,test_adi,soru_no,dogru_cevap\nMatematik 10,Birinci Bolum,Test 1,1,A\nMatematik 10,Birinci Bolum,Test 1,2,C'

  return (
    <div style={{ padding:'28px', maxWidth:'620px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      <div style={{ marginBottom:'24px' }}>
        <a href="/books" style={{ fontSize:'12px', color:'#7A8FA8', textDecoration:'none' }}>← Kitap Kutuphanesi</a>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:'8px 0 4px' }}>Excel ile Kitap Yukle</h1>
        <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>CSV veya Excel dosyasi yukleyerek toplu kitap ve cevap anahtari aktarimi yapabilirsiniz</p>
      </div>

      {/* Sablon */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'18px', marginBottom:'14px' }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Dosya Formati</div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
          {['kitap_adi','bolum_adi','test_adi','soru_no','dogru_cevap'].map(c => (
            <code key={c} style={{ padding:'3px 8px', borderRadius:'5px', background:'#EEF3FB', border:'1px solid #BFDBFE', fontSize:'12px', color:'#1B3A6B' }}>{c}</code>
          ))}
        </div>
        <div style={{ background:'#F8FAFC', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', fontSize:'11.5px', color:'#475569', fontFamily:'monospace' }}>
          kitap_adi,bolum_adi,test_adi,soru_no,dogru_cevap<br/>
          Matematik 10,1. Bolum,Test 1,1,A<br/>
          Matematik 10,1. Bolum,Test 1,2,C
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <a href={'data:text/csv;charset=utf-8,' + encodeURIComponent(csvTemplate)}
            download="sablon.csv"
            style={{ fontSize:'12px', fontWeight:600, color:'#2E7D52', textDecoration:'none', padding:'6px 12px', borderRadius:'7px', background:'#DCFCE7', border:'1px solid #86EFAC' }}>
            CSV Sablonu Indir
          </a>
          <div style={{ fontSize:'12px', color:'#94A3B8', display:'flex', alignItems:'center' }}>
            .xlsx, .xls veya .csv
          </div>
        </div>
      </div>

      {/* Yukle */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'24px' }}>
        <form onSubmit={handleUpload}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fi')?.click()}
            style={{ border: '2px dashed ' + (dragOver?'#1B3A6B':'#D5DFF0'), borderRadius:'10px', padding:'32px', textAlign:'center', background:dragOver?'#EEF3FB':'#F8FAFF', cursor:'pointer', marginBottom:'16px', transition:'all 0.2s' }}>
            <input id="fi" type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }}
              onChange={e => { setFile(e.target.files?.[0]??null); setResult(null) }} />
            {file ? (
              <div>
                <div style={{ fontSize:'24px', marginBottom:'8px' }}>DOSYA</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{file.name}</div>
                <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'4px' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <div style={{ fontSize:'11px', color:'#2E7D52', marginTop:'6px', fontWeight:600 }}>
                  Degistirmek icin tekrar tikla
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>YUKLE</div>
                <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B', marginBottom:'4px' }}>
                  Dosyayi buraya surukle veya tikla
                </div>
                <div style={{ fontSize:'11.5px', color:'#94A3B8' }}>
                  Excel (.xlsx, .xls) veya CSV desteklenir
                </div>
              </div>
            )}
          </div>

          {/* Sonuc */}
          {result && (
            <div style={{ background:result.ok?'#DCFCE7':'#FEF2F2', border:'1px solid '+(result.ok?'#86EFAC':'#FECACA'), borderRadius:'8px', padding:'12px 14px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:result.ok?'#14532D':'#DC2626', marginBottom:result.ok?'8px':0 }}>
                {result.ok ? 'Aktarim Tamamlandi!' : 'Hata: ' + result.message}
              </div>
              {result.ok && (
                <div>
                  <div style={{ fontSize:'12px', color:'#14532D', marginBottom:'10px' }}>
                    {result.count} soru basariyla yuklendi
                  </div>
                  <button type="button" onClick={() => router.push('/books')}
                    style={{ padding:'7px 14px', borderRadius:'7px', background:'#14532D', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer' }}>
                    Kitaplari Gor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Butonlar */}
          <div style={{ display:'flex', gap:'8px' }}>
            <button type="submit" disabled={!file || loading}
              style={{ flex:1, padding:'11px', borderRadius:'9px', background:file&&!loading?'#1B3A6B':'#94A3B8', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:file&&!loading?'pointer':'default' }}>
              {loading ? 'Yukleniyor...' : 'Sisteme Aktar'}
            </button>
            <a href="/books"
              style={{ padding:'11px 18px', borderRadius:'9px', background:'#F0F4F9', color:'#4A6080', fontSize:'13px', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center' }}>
              Iptal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
