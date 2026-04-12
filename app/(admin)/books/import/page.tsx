'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ok:boolean;message:string}|null>(null)
  const router = useRouter()

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/books/import-excel', {method:'POST',body:fd})
      const d = await res.json()
      setResult(d.ok ? {ok:true,message:d.count+' satır aktarıldı.'} : {ok:false,message:d.error??'Hata.'})
    } catch {
      setResult({ok:false,message:'Bağlanılamadı.'})
    }
    setLoading(false)
  }

  return (
    <div style={{padding:'28px',maxWidth:'580px'}}>
      <div style={{marginBottom:'24px'}}>
        <a href="/books" style={{fontSize:'12px',color:'#7A8FA8',textDecoration:'none'}}>← Kitap Kütüphanesi</a>
        <h1 style={{fontSize:'18px',fontWeight:700,color:'#1B3A6B',margin:'8px 0 0'}}>Excel ile Kitap Yükle</h1>
      </div>
      <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #D5DFF0',padding:'24px',marginBottom:'14px'}}>
        <p style={{fontSize:'13px',fontWeight:600,color:'#1B3A6B',marginBottom:'10px'}}>Şablon Sütunları</p>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
          {['kitap_adi','bolum_adi','test_adi','soru_no','dogru_cevap'].map(c => (
            <code key={c} style={{padding:'3px 8px',borderRadius:'5px',background:'#F0F4F9',border:'1px solid #D5DFF0',fontSize:'12px',color:'#1B3A6B'}}>{c}</code>
          ))}
        </div>
        <a href="data:text/csv;charset=utf-8,kitap_adi,bolum_adi,test_adi,soru_no,dogru_cevap" download="sablonu.csv" style={{fontSize:'12.5px',fontWeight:600,color:'#2E7D52',textDecoration:'none'}}>↓ CSV Şablonu İndir</a>
      </div>
      <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #D5DFF0',padding:'24px'}}>
        <form onSubmit={handleUpload}>
          <div onClick={() => document.getElementById('fi')?.click()} style={{border:'2px dashed #D5DFF0',borderRadius:'10px',padding:'32px',textAlign:'center',background:'#F8FAFF',cursor:'pointer',marginBottom:'16px'}}>
            <input id="fi" type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e => setFile(e.target.files?.[0]??null)} />
            {file
              ? <p style={{fontSize:'13px',fontWeight:600,color:'#1B3A6B',margin:0}}>{file.name}</p>
              : <p style={{fontSize:'13px',color:'#4A6080',margin:0}}>Dosya seç veya sürükle bırak (.xlsx .csv)</p>
            }
          </div>
          {result && (
            <div style={{background:result.ok?'#EAF4EE':'#FEF2F2',border:'1px solid '+(result.ok?'#A7D9B8':'#FECACA'),borderRadius:'8px',padding:'12px',fontSize:'12.5px',color:result.ok?'#2E7D52':'#B91C1C',marginBottom:'14px'}}>
              {result.ok?'✓ ':'✗ '}{result.message}
              {result.ok && (
                <button type="button" onClick={() => router.push('/books')} style={{marginLeft:'10px',fontSize:'12px',color:'#1B3A6B',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>Kitaplara Git →</button>
              )}
            </div>
          )}
          <div style={{display:'flex',gap:'8px'}}>
            <button type="submit" disabled={!file||loading} style={{flex:1,padding:'10px',borderRadius:'8px',background:file&&!loading?'#1B3A6B':'#A0B0C8',color:'#fff',fontSize:'13px',fontWeight:600,border:'none',cursor:'pointer'}}>
              {loading?'Yükleniyor...':'Sisteme Aktar'}
            </button>
            <a href="/books" style={{padding:'10px 16px',borderRadius:'8px',background:'#F0F4F9',color:'#4A6080',fontSize:'13px',fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center'}}>İptal</a>
          </div>
        </form>
      </div>
    </div>
  )
}