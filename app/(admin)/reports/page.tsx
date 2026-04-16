'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setStudents(data ?? [])
    setLoading(false)
  }

  function printHTML(html: string, filename: string) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${filename}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1B3A6B; background: #fff; font-size: 12px; }
  @media print {
    .no-print { display: none !important; }
    @page { margin: 0; size: A4; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page { width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: #fff; }
  .header { background: #1B3A6B; color: white; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 20px; font-weight: 800; }
  .header p { font-size: 11px; opacity: 0.8; margin-top: 2px; }
  .header .date { font-size: 11px; opacity: 0.7; }
  .content { padding: 20px 24px; }
  .student-name { font-size: 22px; font-weight: 800; color: #1B3A6B; margin-bottom: 4px; }
  .subtitle { font-size: 11px; color: #7A8FA8; margin-bottom: 16px; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .metric { background: #F0F4F9; border-radius: 8px; padding: 12px; text-align: center; }
  .metric .val { font-size: 22px; font-weight: 800; color: #1B3A6B; }
  .metric .lbl { font-size: 10px; color: #7A8FA8; margin-top: 2px; }
  .section-title { font-size: 13px; font-weight: 700; color: #1B3A6B; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #EEF3FB; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1B3A6B; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #F0F4F9; }
  tr:nth-child(even) { background: #F8FAFF; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .good { background: #EAF4EE; color: #2E7D52; }
  .mid { background: #FDF4E7; color: #B45309; }
  .bad { background: #FEF2F2; color: #C0392B; }
  .footer { background: #1B3A6B; color: white; padding: 10px 24px; font-size: 10px; display: flex; justify-content: space-between; position: fixed; bottom: 0; width: 210mm; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #1B3A6B; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; z-index: 999; }
</style>
</head>
<body>
<button class="no-print print-btn" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
${html}
</body>
</html>`)
    win.document.close()
  }

  async function exportAcademicPDF(student: any) {
    setExporting('academic_' + student.id)
    try {
      const [{ data: tp }, { data: er }, { data: hw }, { data: g }, { data: risk }] = await Promise.all([
        supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', student.id),
        supabase.from('exam_results').select('*, exams(name, exam_date), subjects(name)').eq('student_id', student.id).order('created_at', { ascending: false }),
        supabase.from('homework_assignments').select('*, tests(name)').eq('student_id', student.id),
        supabase.from('student_goals').select('*').eq('student_id', student.id).eq('status', 'active'),
        supabase.rpc('calculate_risk_score', { p_student_id: student.id }),
      ])

      const totalQ = (tp ?? []).reduce((s, t) => s + t.total_questions, 0)
      const totalC = (tp ?? []).reduce((s, t) => s + t.correct_count, 0)
      const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
      const completedHw = (hw ?? []).filter(h => h.status === 'completed').length
      const riskVal = Math.round(risk ?? 0)

      const examGroups: any = {}
      for (const r of er ?? []) {
        if (!examGroups[r.exam_id]) examGroups[r.exam_id] = { name: r.exams?.name, date: r.exams?.exam_date, subjects: [], totalNet: 0 }
        examGroups[r.exam_id].subjects.push({ name: r.subjects?.name, net: r.net, correct: r.correct_count, wrong: r.wrong_count })
        examGroups[r.exam_id].totalNet += r.net
      }

      const html = `
<div class="page">
  <div class="header">
    <div>
      <h1>DershaneOPS</h1>
      <p>Akademik Gelişim Raporu</p>
    </div>
    <div class="date">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="student-name">${student.full_name}</div>
    <div class="subtitle">Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}</div>

    <div class="metrics">
      <div class="metric"><div class="val" style="color:${overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'}">%${overallRate}</div><div class="lbl">Genel Başarı</div></div>
      <div class="metric"><div class="val" style="color:${riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'}">${riskVal}/100</div><div class="lbl">Risk Skoru</div></div>
      <div class="metric"><div class="val">${completedHw}/${(hw ?? []).length}</div><div class="lbl">Tamamlanan Ödev</div></div>
      <div class="metric"><div class="val">${totalQ}</div><div class="lbl">Toplam Soru</div></div>
    </div>

    ${(tp ?? []).length > 0 ? `
    <div class="section-title">Konu Hakimiyet Analizi</div>
    <table>
      <thead><tr><th>Ders</th><th>Konu</th><th>Doğru</th><th>Yanlış</th><th>Boş</th><th>Başarı</th><th>Durum</th></tr></thead>
      <tbody>
        ${(tp ?? []).map(t => `
        <tr>
          <td>${t.subjects?.name ?? '-'}</td>
          <td>${t.topics?.name ?? 'Genel'}</td>
          <td style="color:#2E7D52;font-weight:600">${t.correct_count}</td>
          <td style="color:#C0392B;font-weight:600">${t.wrong_count}</td>
          <td style="color:#7A8FA8">${t.blank_count}</td>
          <td><strong style="color:${t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'}">%${Math.round(t.accuracy_rate)}</strong></td>
          <td><span class="badge ${t.accuracy_rate >= 70 ? 'good' : t.accuracy_rate >= 50 ? 'mid' : 'bad'}">${t.accuracy_rate >= 70 ? 'İyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayıf'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${Object.keys(examGroups).length > 0 ? `
    <div class="section-title">Deneme Sınavı Sonuçları</div>
    <table>
      <thead><tr><th>Sınav Adı</th><th>Tarih</th><th>Dersler (Net)</th><th>Toplam Net</th></tr></thead>
      <tbody>
        ${Object.values(examGroups).map((e: any) => `
        <tr>
          <td><strong>${e.name}</strong></td>
          <td>${new Date(e.date).toLocaleDateString('tr-TR')}</td>
          <td>${e.subjects.map((s: any) => `${s.name}: <strong>${Math.round(s.net * 100) / 100}</strong>`).join(' &nbsp;|&nbsp; ')}</td>
          <td><strong style="font-size:14px;color:#1B3A6B">${Math.round(e.totalNet * 100) / 100}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${(g ?? []).length > 0 ? `
    <div class="section-title">Hedefler</div>
    <table>
      <thead><tr><th>Hedef Sınav</th><th>Hedef Puan</th><th>Mevcut Puan</th><th>Hedef Tarih</th><th>İlerleme</th></tr></thead>
      <tbody>
        ${(g ?? []).map((goal: any) => {
          const prog = goal.target_score > 0 ? Math.min(Math.round(goal.current_score / goal.target_score * 100), 100) : 0
          return `<tr>
            <td><strong>${goal.target_exam}</strong></td>
            <td>${goal.target_score}</td>
            <td>${goal.current_score}</td>
            <td>${goal.target_date ? new Date(goal.target_date).toLocaleDateString('tr-TR') : '-'}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="height:8px;width:100px;background:#F0F4F9;border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${prog}%;background:${prog >= 80 ? '#2E7D52' : prog >= 50 ? '#B45309' : '#1B3A6B'};border-radius:4px"></div>
                </div>
                <strong>%${prog}</strong>
              </div>
            </td>
          </tr>`
        }).join('')}
      </tbody>
    </table>` : ''}
  </div>
  <div class="footer">
    <span>DershaneOPS | dershaneops.vercel.app</span>
    <span>Gizli — Sadece Yetkili Kullanıcılar İçin</span>
  </div>
</div>`

      printHTML(html, student.full_name + '_Akademik_Rapor')
    } catch (err) {
      console.error(err)
      alert('Rapor oluşturma hatası!')
    }
    setExporting(null)
  }

  async function exportSchedulePDF() {
    setExporting('schedule_pdf')
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*, profiles!lessons_student_id_fkey(full_name)')
        .order('scheduled_at', { ascending: true })

      const html = `
<div class="page">
  <div class="header">
    <div><h1>DershaneOPS</h1><p>Ders Programı</p></div>
    <div class="date">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <table>
      <thead><tr><th>Öğrenci</th><th>Ders</th><th>Tarih</th><th>Saat</th><th>Durum</th></tr></thead>
      <tbody>
        ${(lessons ?? []).map(l => `
        <tr>
          <td>${(l as any).profiles?.full_name ?? '-'}</td>
          <td>${l.subject ?? '-'}</td>
          <td>${new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</td>
          <td>${new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
          <td><span class="badge ${l.status === 'completed' ? 'good' : l.status === 'cancelled' ? 'bad' : 'mid'}">${l.status === 'completed' ? 'Tamamlandı' : l.status === 'cancelled' ? 'İptal' : 'Planlandı'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer"><span>DershaneOPS | dershaneops.vercel.app</span><span>${new Date().toLocaleDateString('tr-TR')}</span></div>
</div>`

      printHTML(html, 'Ders_Programi')
    } catch (err) { console.error(err) }
    setExporting(null)
  }

  async function exportExamExcel() {
    setExporting('exam_excel')
    try {
      const { data: results } = await supabase
        .from('exam_results')
        .select('*, profiles!exam_results_student_id_fkey(full_name), exams(name, exam_date, exam_type), subjects(name)')
        .order('created_at', { ascending: false })

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const detailRows = (results ?? []).map(r => ({
        'Öğrenci': r.profiles?.full_name,
        'Sınav': r.exams?.name,
        'Tarih': r.exams?.exam_date ? new Date(r.exams.exam_date).toLocaleDateString('tr-TR') : '',
        'Tür': r.exams?.exam_type?.toUpperCase(),
        'Ders': r.subjects?.name,
        'Doğru': r.correct_count,
        'Yanlış': r.wrong_count,
        'Boş': r.blank_count,
        'Net': r.net,
        'Skor': r.score,
      }))

      const ws1 = XLSX.utils.json_to_sheet(detailRows)
      ws1['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws1, 'Sınav Sonuçları')

      const summary: any = {}
      for (const r of results ?? []) {
        const name = r.profiles?.full_name
        if (!summary[name]) summary[name] = { ogrenci: name, sinav_sayisi: new Set(), toplam_net: 0, en_yuksek: 0, en_dusuk: 9999 }
        summary[name].sinav_sayisi.add(r.exam_id)
        summary[name].toplam_net += r.net
        summary[name].en_yuksek = Math.max(summary[name].en_yuksek, r.net)
        summary[name].en_dusuk = Math.min(summary[name].en_dusuk, r.net)
      }

      const summaryRows = Object.values(summary).map((s: any) => ({
        'Öğrenci': s.ogrenci,
        'Sınav Sayısı': s.sinav_sayisi.size,
        'Ortalama Net': Math.round(s.toplam_net / s.sinav_sayisi.size * 100) / 100,
        'En Yüksek Net': Math.round(s.en_yuksek * 100) / 100,
        'En Düşük Net': Math.round((s.en_dusuk === 9999 ? 0 : s.en_dusuk) * 100) / 100,
      }))

      const ws2 = XLSX.utils.json_to_sheet(summaryRows)
      ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Özet')

      XLSX.writeFile(wb, 'DershaneOPS_Sinav_Sonuclari_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) { console.error(err) }
    setExporting(null)
  }

  async function exportPerformanceExcel() {
    setExporting('perf_excel')
    try {
      const { data: tp } = await supabase
        .from('student_topic_performance')
        .select('*, profiles!student_topic_performance_student_id_fkey(full_name), topics(name), subjects(name)')
        .order('accuracy_rate', { ascending: true })

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const rows = (tp ?? []).map(t => ({
        'Öğrenci': t.profiles?.full_name,
        'Ders': t.subjects?.name,
        'Konu': t.topics?.name ?? 'Genel',
        'Toplam Soru': t.total_questions,
        'Doğru': t.correct_count,
        'Yanlış': t.wrong_count,
        'Boş': t.blank_count,
        'Başarı %': Math.round(t.accuracy_rate),
        'Hakimiyet Skoru': Math.round(t.mastery_score),
        'Trend': t.trend_direction === 'up' ? 'Yükseliyor' : t.trend_direction === 'down' ? 'Düşüyor' : 'Stabil',
        'Durum': t.accuracy_rate >= 70 ? 'İyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayıf',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Konu Performansı')

      XLSX.writeFile(wb, 'DershaneOPS_Konu_Performans_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) { console.error(err) }
    setExporting(null)
  }

  async function exportRiskExcel() {
    setExporting('risk_excel')
    try {
      const { data: stList } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
      const rows = []
      for (const s of stList ?? []) {
        const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
        const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate').eq('student_id', s.id)
        const avgRate = tp && tp.length > 0 ? Math.round(tp.reduce((a, t) => a + t.accuracy_rate, 0) / tp.length) : 0
        rows.push({
          'Öğrenci': s.full_name,
          'Risk Skoru': Math.round(risk ?? 0),
          'Risk Seviyesi': (risk ?? 0) >= 70 ? 'Kritik' : (risk ?? 0) >= 45 ? 'Yüksek' : (risk ?? 0) >= 20 ? 'Orta' : 'Düşük',
          'Ortalama Başarı %': avgRate,
          'Konu Sayısı': tp?.length ?? 0,
        })
      }
      rows.sort((a, b) => b['Risk Skoru'] - a['Risk Skoru'])

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Risk Analizi')
      XLSX.writeFile(wb, 'DershaneOPS_Risk_Analizi_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) { console.error(err) }
    setExporting(null)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  const btnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '9px',
    background: bg, color, fontSize: '12.5px', fontWeight: 600, border: '1px solid ' + border,
    cursor: 'pointer', width: '100%', textAlign: 'left'
  })

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Raporlar & Export</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>PDF yazdırma ve Excel export — Türkçe karakter destekli</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>🏢 Kurum Raporları</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={exportExamExcel} disabled={!!exporting} style={btnStyle('#2E7D52', '#EAF4EE', '#A7D9B8')}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <div>
                <div>{exporting === 'exam_excel' ? 'Hazırlanıyor...' : 'Sınav Sonuçları — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, tüm sınavlar</div>
              </div>
            </button>
            <button onClick={exportPerformanceExcel} disabled={!!exporting} style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}>
              <span style={{ fontSize: '20px' }}>📈</span>
              <div>
                <div>{exporting === 'perf_excel' ? 'Hazırlanıyor...' : 'Konu Performansı — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, konu bazlı</div>
              </div>
            </button>
            <button onClick={exportSchedulePDF} disabled={!!exporting} style={btnStyle('#B45309', '#FDF4E7', '#FED7AA')}>
              <span style={{ fontSize: '20px' }}>📅</span>
              <div>
                <div>{exporting === 'schedule_pdf' ? 'Hazırlanıyor...' : 'Ders Programı — PDF'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Yazdır / PDF kaydet</div>
              </div>
            </button>
            <button onClick={exportRiskExcel} disabled={!!exporting} style={btnStyle('#C0392B', '#FEF2F2', '#FECACA')}>
              <span style={{ fontSize: '20px' }}>🚨</span>
              <div>
                <div>{exporting === 'risk_excel' ? 'Hazırlanıyor...' : 'Risk Analizi — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Risk skoru sıralı</div>
              </div>
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>👤 Öğrenci Akademik Raporu</div>
          <div style={{ marginBottom: '12px' }}>
            <select value={selectedStudent?.id ?? ''} onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value) ?? null)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', marginBottom: '10px' }}>
              <option value="">Öğrenci seçin...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            {selectedStudent ? (
              <button onClick={() => exportAcademicPDF(selectedStudent)} disabled={!!exporting} style={btnStyle('#6B4FC8', '#F0ECFB', '#C4B5FD')}>
                <span style={{ fontSize: '20px' }}>📋</span>
                <div>
                  <div>{exporting?.startsWith('academic_') ? 'Hazırlanıyor...' : 'Akademik Gelişim Raporu — PDF'}</div>
                  <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Konu analizi + sınav + hedefler</div>
                </div>
              </button>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', background: '#F8FAFF', borderRadius: '8px', border: '1px dashed #D5DFF0' }}>
                <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Öğrenci seçin</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px', background: '#F8FAFF', borderRadius: '8px', padding: '12px', border: '1px solid #E2EAF8' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '6px' }}>💡 PDF Nasıl Kaydedilir?</div>
            <div style={{ fontSize: '11px', color: '#4A6080', lineHeight: 1.6 }}>
              Rapor yeni sekmede açılır. Tarayıcının <strong>Yazdır</strong> penceresinde:<br />
              Yazıcı → <strong>PDF Olarak Kaydet</strong> seçin.
            </div>
          </div>
        </div>
      </div>

      {/* Toplu */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📦 Toplu Rapor</div>
        <button
          onClick={async () => {
            for (const s of students) await exportAcademicPDF(s)
          }}
          disabled={!!exporting}
          style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}
        >
          <span style={{ fontSize: '20px' }}>📦</span>
          <div>
            <div>Tüm Öğrenciler — Ayrı PDF Sekmeleri</div>
            <div style={{ fontSize: '10.5px', opacity: 0.7 }}>{students.length} öğrenci için ayrı rapor açılır</div>
          </div>
        </button>
      </div>
    </div>
  )
}