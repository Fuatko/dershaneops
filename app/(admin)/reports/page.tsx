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

  function openPrintWindow(html: string, title: string) {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Popup engellendi! Tarayıcı ayarlarından popup iznini açın.'); return }
    const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,600;0,700;0,800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans','Segoe UI',Tahoma,Arial,sans-serif; background:#f0f4f9; }
  @media print {
    body { background:#fff; }
    .no-print { display:none !important; }
    @page { margin:0; size:A4 portrait; }
    body { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    .page { box-shadow:none; margin:0; }
  }
  .no-print {
    position:fixed; top:16px; right:16px; z-index:9999;
    display:flex; gap:8px;
  }
  .no-print button {
    padding:10px 20px; border:none; border-radius:8px;
    font-family:'Noto Sans',sans-serif; font-size:13px; font-weight:700;
    cursor:pointer;
  }
  .btn-print { background:#1B3A6B; color:#fff; }
  .btn-close { background:#f0f4f9; color:#1B3A6B; border:1px solid #D5DFF0 !important; }
  .page {
    width:210mm; min-height:297mm; margin:20px auto;
    background:#fff; box-shadow:0 4px 20px rgba(0,0,0,0.12);
  }
  .header {
    background:#1B3A6B; padding:20px 28px;
    display:flex; justify-content:space-between; align-items:center;
  }
  .header-left h1 { font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
  .header-left p { font-size:11px; color:rgba(255,255,255,0.7); margin-top:2px; }
  .header-right { font-size:11px; color:rgba(255,255,255,0.6); text-align:right; }
  .content { padding:24px 28px 60px; }
  .student-block { margin-bottom:20px; padding-bottom:16px; border-bottom:2px solid #EEF3FB; }
  .student-block h2 { font-size:24px; font-weight:800; color:#1B3A6B; }
  .student-block p { font-size:11px; color:#7A8FA8; margin-top:3px; }
  .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:24px; }
  .metric { background:#F0F4F9; border-radius:10px; padding:14px; text-align:center; }
  .metric .val { font-size:24px; font-weight:800; }
  .metric .lbl { font-size:9px; color:#7A8FA8; margin-top:3px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .sec { margin-bottom:22px; }
  .sec-title {
    font-size:13px; font-weight:700; color:#fff;
    background:#1B3A6B; padding:8px 14px; border-radius:6px 6px 0 0;
    margin-bottom:0;
  }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { background:#2A4A8A; color:#fff; padding:9px 12px; text-align:left; font-weight:600; font-size:10.5px; }
  td { padding:8px 12px; border-bottom:1px solid #F0F4F9; color:#374151; }
  tr:nth-child(even) td { background:#F8FAFF; }
  tr:hover td { background:#EEF3FB; }
  .badge { display:inline-block; padding:3px 9px; border-radius:12px; font-size:10px; font-weight:700; }
  .good { background:#EAF4EE; color:#2E7D52; }
  .mid  { background:#FDF4E7; color:#B45309; }
  .bad  { background:#FEF2F2; color:#C0392B; }
  .footer {
    position:fixed; bottom:0; width:210mm;
    background:#1B3A6B; padding:10px 28px;
    display:flex; justify-content:space-between;
    font-size:9px; color:rgba(255,255,255,0.7);
  }
  .progress-bar { height:8px; background:#E2EAF8; border-radius:4px; overflow:hidden; display:inline-block; width:80px; vertical-align:middle; }
  .progress-fill { height:100%; border-radius:4px; }
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
  <button class="btn-close" onclick="window.close()">✕ Kapat</button>
</div>
${html}
<div class="footer">
  <span>DershaneOPS — Gizli Belge</span>
  <span>${new Date().toLocaleString('tr-TR')}</span>
</div>
</body>
</html>`
    win.document.write(fullHtml)
    win.document.close()
  }

  async function exportAcademicPDF(student: any) {
    setExporting('academic_' + student.id)
    try {
      const [{ data: tp }, { data: er }, { data: hw }, { data: g }, { data: risk }, { data: streak }] = await Promise.all([
        supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', student.id).order('accuracy_rate', { ascending: true }),
        supabase.from('exam_results').select('*, exams(name, exam_date), subjects(name)').eq('student_id', student.id).order('created_at', { ascending: false }),
        supabase.from('homework_assignments').select('*, tests(name)').eq('student_id', student.id),
        supabase.from('student_goals').select('*').eq('student_id', student.id).eq('status', 'active'),
        supabase.rpc('calculate_risk_score', { p_student_id: student.id }),
        supabase.from('student_streaks').select('*').eq('student_id', student.id).single(),
      ])

      const totalQ = (tp ?? []).reduce((s, t) => s + t.total_questions, 0)
      const totalC = (tp ?? []).reduce((s, t) => s + t.correct_count, 0)
      const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
      const completedHw = (hw ?? []).filter(h => h.status === 'completed').length
      const riskVal = Math.round(risk ?? 0)
      const riskColor = riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'
      const rateColor = overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'

      const examGroups: any = {}
      for (const r of er ?? []) {
        if (!examGroups[r.exam_id]) examGroups[r.exam_id] = { name: r.exams?.name, date: r.exams?.exam_date, subjects: [], totalNet: 0 }
        examGroups[r.exam_id].subjects.push({ name: r.subjects?.name, net: Math.round(r.net * 100) / 100, d: r.correct_count, y: r.wrong_count })
        examGroups[r.exam_id].totalNet += r.net
      }

      const weakTopics = (tp ?? []).filter(t => t.accuracy_rate < 50)
      const strongTopics = (tp ?? []).filter(t => t.accuracy_rate >= 70)

      const html = `
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>DershaneOPS</h1>
      <p>Akademik Gelişim Raporu</p>
    </div>
    <div class="header-right">
      ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </div>
  <div class="content">
    <div class="student-block">
      <h2>${student.full_name}</h2>
      <p>Rapor tarihi: ${new Date().toLocaleString('tr-TR')} &nbsp;|&nbsp; Öğrenci Akademik Profili</p>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="val" style="color:${rateColor}">%${overallRate}</div>
        <div class="lbl">Genel Başarı</div>
      </div>
      <div class="metric">
        <div class="val" style="color:${riskColor}">${riskVal}/100</div>
        <div class="lbl">Risk Skoru</div>
      </div>
      <div class="metric">
        <div class="val">${completedHw}/${(hw ?? []).length}</div>
        <div class="lbl">Tamamlanan Ödev</div>
      </div>
      <div class="metric">
        <div class="val">${streak?.current_streak ?? 0} 🔥</div>
        <div class="lbl">Gün Serisi</div>
      </div>
    </div>

    ${(tp ?? []).length > 0 ? `
    <div class="sec">
      <div class="sec-title">Konu Hakimiyet Analizi</div>
      <table>
        <thead>
          <tr>
            <th>Ders</th>
            <th>Konu</th>
            <th>Doğru</th>
            <th>Yanlış</th>
            <th>Boş</th>
            <th>Başarı %</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${(tp ?? []).map(t => `
          <tr>
            <td>${t.subjects?.name ?? '-'}</td>
            <td><strong>${t.topics?.name ?? 'Genel'}</strong></td>
            <td style="color:#2E7D52;font-weight:700">${t.correct_count}</td>
            <td style="color:#C0392B;font-weight:700">${t.wrong_count}</td>
            <td style="color:#7A8FA8">${t.blank_count}</td>
            <td>
              <strong style="color:${t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'}">
                %${Math.round(t.accuracy_rate)}
              </strong>
            </td>
            <td>
              <span class="badge ${t.accuracy_rate >= 70 ? 'good' : t.accuracy_rate >= 50 ? 'mid' : 'bad'}">
                ${t.accuracy_rate >= 70 ? 'İyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayıf'}
              </span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px;">
      <div style="background:#EAF4EE;border-radius:8px;padding:14px;">
        <div style="font-size:12px;font-weight:700;color:#2E7D52;margin-bottom:8px;">✓ Güçlü Konular (${strongTopics.length})</div>
        ${strongTopics.length === 0 ? '<p style="font-size:11px;color:#7A8FA8">Henüz veri yok</p>' : strongTopics.slice(0, 5).map(t => `
        <div style="font-size:11px;color:#374151;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
          ${t.subjects?.name} — ${t.topics?.name ?? 'Genel'}
          <span style="float:right;font-weight:700;color:#2E7D52">%${Math.round(t.accuracy_rate)}</span>
        </div>`).join('')}
      </div>
      <div style="background:#FEF2F2;border-radius:8px;padding:14px;">
        <div style="font-size:12px;font-weight:700;color:#C0392B;margin-bottom:8px;">⚠ Zayıf Konular (${weakTopics.length})</div>
        ${weakTopics.length === 0 ? '<p style="font-size:11px;color:#7A8FA8">Kritik alan yok!</p>' : weakTopics.slice(0, 5).map(t => `
        <div style="font-size:11px;color:#374151;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
          ${t.subjects?.name} — ${t.topics?.name ?? 'Genel'}
          <span style="float:right;font-weight:700;color:#C0392B">%${Math.round(t.accuracy_rate)}</span>
        </div>`).join('')}
      </div>
    </div>

    ${Object.keys(examGroups).length > 0 ? `
    <div class="sec">
      <div class="sec-title">Deneme Sınavı Sonuçları</div>
      <table>
        <thead>
          <tr><th>Sınav Adı</th><th>Tarih</th><th>Ders Netleri</th><th>Toplam Net</th></tr>
        </thead>
        <tbody>
          ${Object.values(examGroups).map((e: any) => `
          <tr>
            <td><strong>${e.name}</strong></td>
            <td>${new Date(e.date).toLocaleDateString('tr-TR')}</td>
            <td style="font-size:10.5px">${e.subjects.map((s: any) => `<span style="margin-right:8px"><strong>${s.name}:</strong> ${s.net}</span>`).join('')}</td>
            <td><strong style="font-size:15px;color:#1B3A6B">${Math.round(e.totalNet * 100) / 100}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${(g ?? []).length > 0 ? `
    <div class="sec">
      <div class="sec-title">Hedefler</div>
      <table>
        <thead>
          <tr><th>Hedef Sınav</th><th>Hedef Puan</th><th>Mevcut Puan</th><th>Hedef Tarih</th><th>İlerleme</th></tr>
        </thead>
        <tbody>
          ${(g ?? []).map((goal: any) => {
            const prog = goal.target_score > 0 ? Math.min(Math.round(goal.current_score / goal.target_score * 100), 100) : 0
            const pColor = prog >= 80 ? '#2E7D52' : prog >= 50 ? '#B45309' : '#1B3A6B'
            return `<tr>
              <td><strong>${goal.target_exam}</strong></td>
              <td>${goal.target_score}</td>
              <td><strong>${goal.current_score}</strong></td>
              <td>${goal.target_date ? new Date(goal.target_date).toLocaleDateString('tr-TR') : '-'}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${prog}%;background:${pColor}"></div>
                </div>
                <strong style="margin-left:6px;color:${pColor}">%${prog}</strong>
              </td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}
  </div>
</div>`

      openPrintWindow(html, student.full_name + ' — Akademik Rapor')
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
    <div class="header-left"><h1>DershaneOPS</h1><p>Ders Programı</p></div>
    <div class="header-right">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="sec">
      <div class="sec-title">Tüm Dersler (${(lessons ?? []).length})</div>
      <table>
        <thead>
          <tr><th>#</th><th>Öğrenci</th><th>Ders</th><th>Tarih</th><th>Saat</th><th>Durum</th></tr>
        </thead>
        <tbody>
          ${(lessons ?? []).map((l, i) => `
          <tr>
            <td style="color:#9CA3AF">${i + 1}</td>
            <td><strong>${(l as any).profiles?.full_name ?? '-'}</strong></td>
            <td>${l.subject ?? '-'}</td>
            <td>${new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</td>
            <td>${new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>
              <span class="badge ${l.status === 'completed' ? 'good' : l.status === 'cancelled' ? 'bad' : 'mid'}">
                ${l.status === 'completed' ? 'Tamamlandı' : l.status === 'cancelled' ? 'İptal' : 'Planlandı'}
              </span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`

      openPrintWindow(html, 'Ders Programı')
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
        'Ogrenci': r.profiles?.full_name,
        'Sinav': r.exams?.name,
        'Tarih': r.exams?.exam_date ? new Date(r.exams.exam_date).toLocaleDateString('tr-TR') : '',
        'Tur': r.exams?.exam_type?.toUpperCase(),
        'Ders': r.subjects?.name,
        'Dogru': r.correct_count,
        'Yanlis': r.wrong_count,
        'Bos': r.blank_count,
        'Net': r.net,
        'Skor': r.score,
      }))

      const ws1 = XLSX.utils.json_to_sheet(detailRows)
      ws1['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws1, 'Sonuclar')

      const summary: any = {}
      for (const r of results ?? []) {
        const name = r.profiles?.full_name ?? '-'
        if (!summary[name]) summary[name] = { ogrenci: name, set: new Set(), toplam: 0, max: 0, min: 9999 }
        summary[name].set.add(r.exam_id)
        summary[name].toplam += r.net
        summary[name].max = Math.max(summary[name].max, r.net)
        summary[name].min = Math.min(summary[name].min, r.net)
      }

      const sumRows = Object.values(summary).map((s: any) => ({
        'Ogrenci': s.ogrenci,
        'Sinav Sayisi': s.set.size,
        'Ortalama Net': Math.round(s.toplam / s.set.size * 100) / 100,
        'En Yuksek': Math.round(s.max * 100) / 100,
        'En Dusuk': Math.round((s.min === 9999 ? 0 : s.min) * 100) / 100,
      }))
      const ws2 = XLSX.utils.json_to_sheet(sumRows)
      ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Ozet')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = 'DershaneOPS_Sinav_' + new Date().toISOString().slice(0, 10) + '.xlsx'
      a.click(); URL.revokeObjectURL(url)
    } catch (err) { console.error(err); alert('Excel hatası!') }
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
        'Ogrenci': t.profiles?.full_name,
        'Ders': t.subjects?.name,
        'Konu': t.topics?.name ?? 'Genel',
        'Toplam Soru': t.total_questions,
        'Dogru': t.correct_count,
        'Yanlis': t.wrong_count,
        'Bos': t.blank_count,
        'Basari %': Math.round(t.accuracy_rate),
        'Hakimiyet': Math.round(t.mastery_score),
        'Durum': t.accuracy_rate >= 70 ? 'Iyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayif',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Performans')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = 'DershaneOPS_Performans_' + new Date().toISOString().slice(0, 10) + '.xlsx'
      a.click(); URL.revokeObjectURL(url)
    } catch (err) { console.error(err); alert('Excel hatası!') }
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
        const riskVal = Math.round(risk ?? 0)
        rows.push({
          'Ogrenci': s.full_name,
          'Risk Skoru': riskVal,
          'Risk Seviyesi': riskVal >= 70 ? 'Kritik' : riskVal >= 45 ? 'Yuksek' : riskVal >= 20 ? 'Orta' : 'Dusuk',
          'Ortalama Basari': avgRate,
          'Konu Sayisi': tp?.length ?? 0,
        })
      }
      rows.sort((a, b) => b['Risk Skoru'] - a['Risk Skoru'])

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Risk')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = 'DershaneOPS_Risk_' + new Date().toISOString().slice(0, 10) + '.xlsx'
      a.click(); URL.revokeObjectURL(url)
    } catch (err) { console.error(err); alert('Excel hatası!') }
    setExporting(null)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  const btnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
    borderRadius: '10px', background: bg, color, fontSize: '12.5px',
    fontWeight: 600, border: '1px solid ' + border, cursor: 'pointer',
    width: '100%', textAlign: 'left'
  })

  return (
    <div style={{ padding: '28px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Raporlar & Export</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>PDF yazdırma ve Excel export</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px' }}>🏢 Kurum Raporları</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={exportExamExcel} disabled={!!exporting} style={btnStyle('#2E7D52', '#EAF4EE', '#A7D9B8')}>
              <span style={{ fontSize: '22px' }}>📊</span>
              <div>
                <div>{exporting === 'exam_excel' ? 'Hazırlanıyor...' : 'Sınav Sonuçları — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, tüm sınavlar</div>
              </div>
            </button>
            <button onClick={exportPerformanceExcel} disabled={!!exporting} style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}>
              <span style={{ fontSize: '22px' }}>📈</span>
              <div>
                <div>{exporting === 'perf_excel' ? 'Hazırlanıyor...' : 'Konu Performansı — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, konu bazlı</div>
              </div>
            </button>
            <button onClick={exportSchedulePDF} disabled={!!exporting} style={btnStyle('#B45309', '#FDF4E7', '#FED7AA')}>
              <span style={{ fontSize: '22px' }}>📅</span>
              <div>
                <div>{exporting === 'schedule_pdf' ? 'Hazırlanıyor...' : 'Ders Programı — PDF'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Yazdır veya PDF kaydet</div>
              </div>
            </button>
            <button onClick={exportRiskExcel} disabled={!!exporting} style={btnStyle('#C0392B', '#FEF2F2', '#FECACA')}>
              <span style={{ fontSize: '22px' }}>🚨</span>
              <div>
                <div>{exporting === 'risk_excel' ? 'Hazırlanıyor...' : 'Risk Analizi — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Risk skoru sıralı</div>
              </div>
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>👤 Öğrenci Akademik Raporu — PDF</div>
          <select
            value={selectedStudent?.id ?? ''}
            onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value) ?? null)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', marginBottom: '12px' }}
          >
            <option value="">Öğrenci seçin...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          {selectedStudent ? (
            <button onClick={() => exportAcademicPDF(selectedStudent)} disabled={!!exporting} style={btnStyle('#6B4FC8', '#F0ECFB', '#C4B5FD')}>
              <span style={{ fontSize: '22px' }}>📋</span>
              <div>
                <div>{exporting?.startsWith('academic_') ? 'Hazırlanıyor...' : 'Akademik Gelişim Raporu'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Konu + sınav + hedef + SWOT</div>
              </div>
            </button>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', background: '#F8FAFF', borderRadius: '8px', border: '1px dashed #D5DFF0' }}>
              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          )}

          <div style={{ marginTop: '14px', background: '#F8FAFF', borderRadius: '8px', padding: '12px 14px', border: '1px solid #E2EAF8' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '5px' }}>💡 PDF Nasıl Kaydedilir?</div>
            <div style={{ fontSize: '11px', color: '#4A6080', lineHeight: 1.7 }}>
              Rapor yeni sekmede açılır.<br />
              <strong>Yazdır</strong> butonuna tıklayın →<br />
              Yazıcı olarak <strong>"PDF Olarak Kaydet"</strong> seçin.
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📦 Toplu Rapor</div>
        <button
          onClick={async () => { for (const s of students) { await exportAcademicPDF(s) } }}
          disabled={!!exporting}
          style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}
        >
          <span style={{ fontSize: '22px' }}>📦</span>
          <div>
            <div>Tüm Öğrenciler — Ayrı PDF Sekmeleri</div>
            <div style={{ fontSize: '10.5px', opacity: 0.7 }}>{students.length} öğrenci için ayrı rapor açılır</div>
          </div>
        </button>
      </div>
    </div>
  )
}