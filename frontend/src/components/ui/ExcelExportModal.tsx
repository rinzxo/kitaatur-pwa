'use client'

import React, { useState } from 'react'
import { X, FileXls, Check, DownloadSimple, Palette } from '@phosphor-icons/react'
import toast from 'react-hot-toast'

export type ExcelTableTheme = 'brand-blue' | 'corporate-slate' | 'emerald' | 'minimal'

export interface ExcelColumnConfig {
  header: string
  key: string
  width?: number
  alignment?: 'left' | 'center' | 'right'
  format?: 'currency' | 'percent' | 'number' | 'text'
}

export interface ExcelExportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  filename: string
  sheetName?: string
  reportTitle?: string
  subtitle?: string
  columns: ExcelColumnConfig[]
  data: Record<string, any>[]
  summaryRow?: Record<string, any>
}

interface ThemeOption {
  id: ExcelTableTheme
  name: string
  description: string
  headerBg: string
  headerTextColor: string
  zebraBg: string
  accentBorder: string
  previewColor: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'brand-blue',
    name: 'Biru KitaAtur',
    description: 'Header biru resmi KitaAtur dengan aksen modern dan bersih.',
    headerBg: 'FF0087FF',
    headerTextColor: 'FFFFFFFF',
    zebraBg: 'FFF0F7FF',
    accentBorder: 'FFCBD5E1',
    previewColor: '#0087FF'
  },
  {
    id: 'corporate-slate',
    name: 'Slate Korporat',
    description: 'Format formal bernuansa abu-abu gelap eksekutif.',
    headerBg: 'FF1E293B',
    headerTextColor: 'FFFFFFFF',
    zebraBg: 'FFF8FAFC',
    accentBorder: 'FFCBD5E1',
    previewColor: '#1E293B'
  },
  {
    id: 'emerald',
    name: 'Emerald Finansial',
    description: 'Aksen hijau segar khas laporan akuntansi & arus kas.',
    headerBg: 'FF059669',
    headerTextColor: 'FFFFFFFF',
    zebraBg: 'FFF0FDF4',
    accentBorder: 'FFA7F3D0',
    previewColor: '#059669'
  },
  {
    id: 'minimal',
    name: 'Klasik Minimalis',
    description: 'Header abu-abu sangat muda tanpa warna berat, hemat tinta cetak printer.',
    headerBg: 'FFF1F5F9',
    headerTextColor: 'FF0F172A',
    zebraBg: 'FFFFFFFF',
    accentBorder: 'FF94A3B8',
    previewColor: '#94A3B8'
  }
]

export function ExcelExportModal({
  isOpen,
  onClose,
  title,
  filename,
  sheetName = 'Rekap Data',
  reportTitle,
  subtitle,
  columns,
  data,
  summaryRow
}: ExcelExportModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ExcelTableTheme>('brand-blue')
  const [useZebra, setUseZebra] = useState(true)
  const [useBorders, setUseBorders] = useState(true)
  const [includeHeaderKop, setIncludeHeaderKop] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setIsExporting(true)

    try {
      const ExcelJS = (await import('exceljs')).default
      const { saveAs } = (await import('file-saver')).default

      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'KitaAtur Platform'
      workbook.created = new Date()

      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }]
      })

      const theme = THEME_OPTIONS.find(t => t.id === selectedTheme) || THEME_OPTIONS[0]

      // Setup worksheet columns
      worksheet.columns = columns.map(c => ({
        header: c.header,
        key: c.key,
        width: c.width || Math.max(14, c.header.length + 4)
      }))

      let currentRowIdx = 1

      // 1. Tambahkan Kop Laporan (Header info) jika diaktifkan
      if (includeHeaderKop) {
        const topTitle = reportTitle || title.toUpperCase()
        worksheet.insertRow(currentRowIdx++, [topTitle])
        worksheet.getCell(`A1`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' } }

        const printDate = new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        const sub = subtitle ? `${subtitle} | Dicetak: ${printDate}` : `Dicetak melalui KitaAtur pada: ${printDate}`
        worksheet.insertRow(currentRowIdx++, [sub])
        worksheet.getCell(`A2`).font = { size: 10, italic: true, color: { argb: 'FF64748B' } }

        // Baris kosong pemisah
        worksheet.insertRow(currentRowIdx++, [])
      }

      // 2. Styling Baris Header Tabel
      const tableHeaderRow = worksheet.getRow(currentRowIdx)
      tableHeaderRow.values = columns.map(c => c.header)
      tableHeaderRow.height = 26

      tableHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: theme.headerBg }
        }
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: theme.headerTextColor }
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        }

        if (useBorders) {
          cell.border = {
            top: { style: 'thin', color: { argb: theme.accentBorder } },
            left: { style: 'thin', color: { argb: theme.accentBorder } },
            bottom: { style: 'medium', color: { argb: theme.accentBorder } },
            right: { style: 'thin', color: { argb: theme.accentBorder } }
          }
        }
      })

      currentRowIdx++

      // 3. Masukkan Data Baris
      data.forEach((item, rowIdx) => {
        const rowValues = columns.map(c => {
          const val = item[c.key]
          if (val === undefined || val === null) return '-'
          return val
        })

        const row = worksheet.addRow(rowValues)
        row.height = 20

        const isEven = rowIdx % 2 === 1
        const shouldApplyZebra = useZebra && isEven && theme.id !== 'minimal'

        row.eachCell((cell, colNumber) => {
          const colConfig = columns[colNumber - 1]

          // Font
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }

          // Alignment
          const align = colConfig?.alignment || (colConfig?.format === 'currency' || colConfig?.format === 'number' ? 'right' : 'left')
          cell.alignment = {
            vertical: 'middle',
            horizontal: align
          }

          // Format Angka & Mata Uang
          if (colConfig?.format === 'currency' && typeof cell.value === 'number') {
            cell.numFmt = '"Rp "#,##0'
          } else if (colConfig?.format === 'percent' && typeof cell.value === 'number') {
            cell.numFmt = '0"%"'
          } else if (colConfig?.format === 'number' && typeof cell.value === 'number') {
            cell.numFmt = '#,##0'
          }

          // Background Fill (Zebra)
          if (shouldApplyZebra) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: theme.zebraBg }
            }
          }

          // Borders
          if (useBorders) {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            }
          }
        })
      })

      // 4. Masukkan Summary Row jika ada
      if (summaryRow) {
        const summaryValues = columns.map(c => summaryRow[c.key] ?? '')
        const sRow = worksheet.addRow(summaryValues)
        sRow.height = 22

        sRow.eachCell((cell, colNumber) => {
          const colConfig = columns[colNumber - 1]
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } }
          const align = colConfig?.alignment || (colConfig?.format === 'currency' || colConfig?.format === 'number' ? 'right' : 'left')
          cell.alignment = { vertical: 'middle', horizontal: align }

          if (colConfig?.format === 'currency' && typeof cell.value === 'number') {
            cell.numFmt = '"Rp "#,##0'
          }

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }
          }

          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF475569' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          }
        })
      }

      // Generate buffer & trigger download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
      saveAs(blob, cleanFilename)

      toast.success('File Excel (.xlsx) berhasil diunduh!')
      onClose()
    } catch (err: any) {
      console.error('Gagal ekspor ke Excel:', err)
      toast.error('Gagal membuat file Excel: ' + (err?.message || 'Terjadi kesalahan sistem'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0087FF] border border-blue-100 flex items-center justify-center shrink-0">
              <FileXls size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Ekspor Rekap Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {data.length} baris data siap diformat ke tabel spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
            aria-label="Tutup"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Pilihan Desain Tabel Excel */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette size={14} weight="bold" className="text-[#0087FF]" />
              <span>Pilih Desain Tema Tabel Excel</span>
            </label>
            <span className="text-[11px] font-semibold text-[#0087FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Format .xlsx
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = selectedTheme === theme.id
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0087FF] bg-blue-50/40 shadow-xs ring-1 ring-[#0087FF]/30'
                      : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-2xs shrink-0 border border-black/10"
                        style={{ backgroundColor: theme.previewColor }}
                      />
                      <span className="text-xs font-bold text-slate-900">
                        {theme.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#0087FF] text-white flex items-center justify-center shrink-0">
                        <Check size={11} weight="bold" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {theme.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Opsi Tata Letak & Styling Tabel */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pengaturan Tampilan Tabel
          </p>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={useZebra}
              onChange={(e) => setUseZebra(e.target.checked)}
              className="w-4 h-4 rounded text-[#0087FF] border-slate-300 focus:ring-[#0087FF]"
            />
            <span>Aktifkan Baris Belang-Belang (Zebra Striping)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={useBorders}
              onChange={(e) => setUseBorders(e.target.checked)}
              className="w-4 h-4 rounded text-[#0087FF] border-slate-300 focus:ring-[#0087FF]"
            />
            <span>Beri Garis Batas Rapi (Cell Borders)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={includeHeaderKop}
              onChange={(e) => setIncludeHeaderKop(e.target.checked)}
              className="w-4 h-4 rounded text-[#0087FF] border-slate-300 focus:ring-[#0087FF]"
            />
            <span>Sertakan Kop Judul Laporan & Tanggal Cetak</span>
          </label>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition active:scale-[0.98] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#0087FF] hover:bg-[#007AE6] text-white font-semibold text-xs transition shadow-xs flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <DownloadSimple size={15} weight="bold" />
            <span>{isExporting ? 'Membuat File Excel...' : 'Unduh Rekap (.xlsx)'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
