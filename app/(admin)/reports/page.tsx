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

      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // Başlık
      doc.setFillColor(27, 58, 107)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('DershaneOPS', 14, 12)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Akademik Gelisim Raporu', 14, 20)
      doc.setFontSize(10)
      doc.text(new Date().toLocaleDateString('tr-TR'), 160, 20)

      // Öğrenci bilgisi
      doc.setTextColor(27, 58, 107)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(student.full_name, 14, 40)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Olusturulma: ' + new Date().toLocaleString('tr-TR'), 14, 47)

      // Özet metrikler
      const metrics = [
        { label: 'Genel Basari', value: '%' + overallRate },
        { label: 'Risk Skoru', value: Math.round(risk ?? 0) + '/100' },
        { label: 'Tamamlanan Odev', value: completedHw + '/' + (hw ?? []).length },
        { label: 'Toplam Soru', value: totalQ.toString() },
      ]

      let mx = 14
      metrics.forEach(m => {
        doc.setFillColor(240, 244, 249)
        doc.rect(mx, 52, 44, 18, 'F')
        doc.setTextColor(27, 58, 107)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(m.value, mx + 22, 63, { align: 'center' })
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        doc.text(m.label, mx + 22, 68, { align: 'center' })
        mx += 48
      })

      // Konu Hakimiyeti
      doc.setTextColor(27, 58, 107)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Konu Hakimiyet Analizi', 14, 82)

      if (tp && tp.length > 0) {
        autoTable(doc, {
          startY: 86,
          head: [['Ders', 'Konu', 'Dogru', 'Yanlis', 'Bos', 'Basari %', 'Durum']],
          body: tp.map(t => [
            t.subjects?.name ?? '-',
            t.topics?.name ?? 'Genel',
            t.correct_count,
            t.wrong_count,
            t.blank_count,
            '%' + Math.round(t.accuracy_rate),
            t.accuracy_rate >= 70 ? 'Iyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayif'
          ]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [27, 58, 107], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 255] },
          columnStyles: {
            5: { halign: 'center', fontStyle: 'bold' },
            6: { halign: 'center' }
          },
          didDrawCell: (data: any) => {
            if (data.column.index === 6 && data.row.section === 'body') {
              const val = data.cell.text[0]
              if (val === 'Iyi') doc.setTextColor(46, 125, 82)
              else if (val === 'Orta') doc.setTextColor(180, 83, 9)
              else doc.setTextColor(192, 57, 43)
            }
          }
        })
      }

      // Deneme Sınavları
      const currentY = (doc as any).lastAutoTable?.finalY ?? 160
      if (er && er.length > 0) {
        doc.setTextColor(27, 58, 107)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Deneme Sinavi Sonuclari', 14, currentY + 12)

        const examGroups: any = {}
        er.forEach(r => {
          if (!examGroups[r.exam_id]) examGroups[r.exam_id] = { name: r.exams?.name, date: r.exams?.exam_date, subjects: [], totalNet: 0 }
          examGroups[r.exam_id].subjects.push(r.subjects?.name + ': ' + r.net)
          examGroups[r.exam_id].totalNet += r.net
        })

        autoTable(doc, {
          startY: currentY + 16,
          head: [['Sinav Adi', 'Tarih', 'Dersler', 'Toplam Net']],
          body: Object.values(examGroups).map((e: any) => [
            e.name, new Date(e.date).toLocaleDateString('tr-TR'), e.subjects.join(' | '), Math.round(e.totalNet * 100) / 100
          ]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [46, 125, 82], textColor: 255 },
          alternateRowStyles: { fillColor: [240, 255, 248] },
        })
      }

      // Hedefler
      if (g && g.length > 0) {
        const y2 = (doc as any).lastAutoTable?.finalY ?? currentY + 40
        doc.setTextColor(27, 58, 107)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Hedefler', 14, y2 + 12)

        autoTable(doc, {
          startY: y2 + 16,
          head: [['Hedef Sinav', 'Hedef Puan', 'Mevcut Puan', 'Hedef Tarih', 'Ilerleme']],
          body: g.map(goal => {
            const prog = goal.target_score > 0 ? Math.round(goal.current_score / goal.target_score * 100) : 0
            return [goal.target_exam, goal.target_score, goal.current_score, goal.target_date ? new Date(goal.target_date).toLocaleDateString('tr-TR') : '-', '%' + prog]
          }),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [107, 79, 200], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 243, 255] },
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(27, 58, 107)
        doc.rect(0, 285, 210, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('DershaneOPS | dershaneops.vercel.app', 14, 292)
        doc.text('Sayfa ' + i + ' / ' + pageCount, 196, 292, { align: 'right' })
      }

      doc.save(student.full_name.replace(' ', '_') + '_Akademik_Rapor.pdf')
    } catch (err) {
      console.error(err)
      alert('PDF oluşturma hatası!')
    }
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

      // Detay sayfası
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
      ws1['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws1, 'Sinav Sonuclari')

      // Özet sayfası — öğrenci bazlı
      const summary: any = {}
      for (const r of results ?? []) {
        const name = r.profiles?.full_name
        if (!summary[name]) summary[name] = { ogrenci: name, sinav_sayisi: 0, toplam_net: 0, en_yuksek: 0, en_dusuk: 9999 }
        const examKey = r.exam_id
        if (!summary[name]['_exams']) summary[name]['_exams'] = new Set()
        summary[name]['_exams'].add(examKey)
        summary[name].sinav_sayisi = summary[name]['_exams'].size
        summary[name].toplam_net += r.net
        summary[name].en_yuksek = Math.max(summary[name].en_yuksek, r.net)
        summary[name].en_dusuk = Math.min(summary[name].en_dusuk, r.net)
      }

      const summaryRows = Object.values(summary).map((s: any) => ({
        'Ogrenci': s.ogrenci,
        'Sinav Sayisi': s.sinav_sayisi,
        'Ortalama Net': Math.round(s.toplam_net / s.sinav_sayisi * 100) / 100,
        'En Yuksek Net': Math.round(s.en_yuksek * 100) / 100,
        'En Dusuk Net': Math.round(s.en_dusuk === 9999 ? 0 : s.en_dusuk * 100) / 100,
      }))

      const ws2 = XLSX.utils.json_to_sheet(summaryRows)
      ws2['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Ozet')

      XLSX.writeFile(wb, 'DershaneOPS_Sinav_Sonuclari_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) {
      console.error(err)
      alert('Excel oluşturma hatası!')
    }
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
        'Hakimiyet Skoru': Math.round(t.mastery_score),
        'Trend': t.trend_direction === 'up' ? 'Yukseliyor' : t.trend_direction === 'down' ? 'Dusiyor' : 'Stabil',
        'Durum': t.accuracy_rate >= 70 ? 'Iyi' : t.accuracy_rate >= 50 ? 'Orta' : 'Zayif',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Konu Performansi')

      XLSX.writeFile(wb, 'DershaneOPS_Konu_Performans_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) {
      console.error(err)
      alert('Excel oluşturma hatası!')
    }
    setExporting(null)
  }

  async function exportSchedulePDF() {
    setExporting('schedule_pdf')
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*, profiles!lessons_student_id_fkey(full_name), profiles!lessons_teacher_id_fkey(full_name)')
        .order('scheduled_at', { ascending: true })

      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      doc.setFillColor(27, 58, 107)
      doc.rect(0, 0, 297, 22, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('DershaneOPS - Ders Programi', 14, 14)
      doc.setFontSize(10)
      doc.text(new Date().toLocaleDateString('tr-TR'), 250, 14)

      autoTable(doc, {
        startY: 28,
        head: [['Ogrenci', 'Ogretmen', 'Ders', 'Tarih', 'Saat', 'Durum']],
        body: (lessons ?? []).map(l => [
          (l as any).profiles?.full_name ?? '-',
          l.subject ?? '-',
          new Date(l.scheduled_at).toLocaleDateString('tr-TR'),
          new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          l.status === 'completed' ? 'Tamamlandi' : l.status === 'cancelled' ? 'Iptal' : 'Planlanmis'
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [27, 58, 107], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 255] },
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(27, 58, 107)
        doc.rect(0, 198, 297, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('DershaneOPS | dershaneops.vercel.app', 14, 205)
        doc.text('Sayfa ' + i + ' / ' + pageCount, 280, 205, { align: 'right' })
      }

      doc.save('DershaneOPS_Ders_Programi_' + new Date().toISOString().slice(0, 10) + '.pdf')
    } catch (err) {
      console.error(err)
      alert('PDF oluşturma hatası!')
    }
    setExporting(null)
  }

  async function exportRiskExcel() {
    setExporting('risk_excel')
    try {
      const { data: students } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
      const rows = []
      for (const s of students ?? []) {
        const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
        const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate, subjects(name)').eq('student_id', s.id)
        const avgRate = tp && tp.length > 0 ? Math.round(tp.reduce((a, t) => a + t.accuracy_rate, 0) / tp.length) : 0
        rows.push({
          'Ogrenci': s.full_name,
          'Risk Skoru': Math.round(risk ?? 0),
          'Risk Seviyesi': (risk ?? 0) >= 70 ? 'Kritik' : (risk ?? 0) >= 45 ? 'Yuksek' : (risk ?? 0) >= 20 ? 'Orta' : 'Dusuk',
          'Ortalama Basari': '%' + avgRate,
          'Konu Sayisi': tp?.length ?? 0,
        })
      }
      rows.sort((a, b) => parseInt(b['Risk Skoru'].toString()) - parseInt(a['Risk Skoru'].toString()))

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Risk Analizi')
      XLSX.writeFile(wb, 'DershaneOPS_Risk_Analizi_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (err) {
      console.error(err)
      alert('Excel oluşturma hatası!')
    }
    setExporting(null)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  const btnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px',
    background: bg, color, fontSize: '12.5px', fontWeight: 600, border: '1px solid ' + border,
    cursor: 'pointer', width: '100%'
  })

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Raporlar & Export</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>PDF ve Excel formatında rapor indirme</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Kurum Raporları */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏢</span> Kurum Raporları
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={exportExamExcel} disabled={exporting === 'exam_excel'} style={btnStyle('#2E7D52', '#EAF4EE', '#A7D9B8')}>
              <span>📊</span>
              <div>
                <div>{exporting === 'exam_excel' ? 'Hazırlanıyor...' : 'Sınav Sonuçları — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, tüm sınavlar</div>
              </div>
            </button>
            <button onClick={exportPerformanceExcel} disabled={exporting === 'perf_excel'} style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}>
              <span>📈</span>
              <div>
                <div>{exporting === 'perf_excel' ? 'Hazırlanıyor...' : 'Konu Performansı — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm öğrenciler, konu bazlı</div>
              </div>
            </button>
            <button onClick={exportSchedulePDF} disabled={exporting === 'schedule_pdf'} style={btnStyle('#B45309', '#FDF4E7', '#FED7AA')}>
              <span>📅</span>
              <div>
                <div>{exporting === 'schedule_pdf' ? 'Hazırlanıyor...' : 'Ders Programı — PDF'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Tüm dersler, tarih sıralı</div>
              </div>
            </button>
            <button onClick={exportRiskExcel} disabled={exporting === 'risk_excel'} style={btnStyle('#C0392B', '#FEF2F2', '#FECACA')}>
              <span>🚨</span>
              <div>
                <div>{exporting === 'risk_excel' ? 'Hazırlanıyor...' : 'Risk Analizi — Excel'}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Risk skoru sıralı</div>
              </div>
            </button>
          </div>
        </div>

        {/* Öğrenci Bazlı Raporlar */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span> Öğrenci Bazlı PDF Rapor
          </div>
          <div style={{ marginBottom: '12px' }}>
            <select value={selectedStudent?.id ?? ''} onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value) ?? null)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff' }}>
              <option value="">Öğrenci seçin...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          {selectedStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => exportAcademicPDF(selectedStudent)} disabled={exporting === 'academic_' + selectedStudent.id} style={btnStyle('#6B4FC8', '#F0ECFB', '#C4B5FD')}>
                <span>📋</span>
                <div>
                  <div>{exporting === 'academic_' + selectedStudent.id ? 'PDF Hazırlanıyor...' : 'Akademik Gelişim Raporu — PDF'}</div>
                  <div style={{ fontSize: '10.5px', opacity: 0.7 }}>Konu analizi + sınav + hedefler</div>
                </div>
              </button>
            </div>
          )}
          {!selectedStudent && (
            <div style={{ padding: '30px', textAlign: 'center', background: '#F8FAFF', borderRadius: '8px', border: '1px dashed #D5DFF0' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👆</div>
              <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          )}
        </div>
      </div>

      {/* Tüm Öğrenciler PDF */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📦</span> Toplu Rapor
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          <button
            onClick={async () => {
              setExporting('all_pdf')
              for (const s of students) {
                await exportAcademicPDF(s)
              }
              setExporting(null)
            }}
            disabled={!!exporting}
            style={btnStyle('#1B3A6B', '#EEF3FB', '#BFDBFE')}
          >
            <span>📦</span>
            <div>
              <div>{exporting === 'all_pdf' ? 'Hazırlanıyor...' : 'Tüm Öğrenci PDF'}</div>
              <div style={{ fontSize: '10.5px', opacity: 0.7 }}>{students.length} öğrenci için ayrı PDF</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}