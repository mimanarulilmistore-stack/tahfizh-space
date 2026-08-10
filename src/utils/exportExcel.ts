import * as XLSX from 'xlsx';
import { getTingkatanLabel } from '@/src/utils/tingkatan';

type SantriInfo = {
  nama_lengkap: string;
  kode_unik: string;
  nis?: string | null;
  target_juz?: number | null;
  tingkatan?: string | null;
};

type SetoranRow = {
  id: string;
  santri_id?: string;
  jenis_setoran: string;
  nama_surah: string | null;
  juz: number | null;
  juz_selesai: boolean | null;
  ayat_mulai: number | null;
  ayat_selesai: number | null;
  nilai_kelancaran: string | null;
  nilai_tajwid: string | null;
  catatan: string | null;
  tanggal_setoran: string | null;
  created_at: string;
};

type RekapRow = {
  santri: SantriInfo;
  juzSelesai: number;
  level: string;
  ziyadah: number;
  murajaah: number;
  total: number;
};

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function periodeLabel(startDate?: string, endDate?: string, monthKey?: string) {
  if (monthKey) return `Bulan ${monthKey}`;
  if (startDate && endDate) return `${startDate} s/d ${endDate}`;
  if (startDate) return `Dari ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;
  return 'Semua periode';
}

function formatTanggalRow(item: SetoranRow) {
  return item.tanggal_setoran || (item.created_at ? item.created_at.slice(0, 10) : '');
}

function mapSetoranSheet(rows: SetoranRow[], santriNameById?: Record<string, string>) {
  const includeSantri = Boolean(santriNameById);
  return rows.map((item, idx) => {
    const base: Record<string, string | number> = {
      No: idx + 1,
      Tanggal: formatTanggalRow(item),
    };
    if (includeSantri && santriNameById) {
      base.Santri = item.santri_id ? santriNameById[item.santri_id] || '' : '';
    }
    base.Jenis = item.jenis_setoran;
    base.Juz = item.juz ?? '';
    base.Juz_Selesai = item.juz_selesai ? 'Ya' : 'Tidak';
    base.Surah = item.nama_surah || '';
    base.Ayat_Mulai = item.ayat_mulai ?? '';
    base.Ayat_Selesai = item.ayat_selesai ?? '';
    base.Kelancaran = item.nilai_kelancaran || '';
    base.Tajwid = item.nilai_tajwid || '';
    base.Catatan = item.catatan || '';
    return base;
  });
}

export function exportRaporIndividualExcel(options: {
  santri: SantriInfo;
  setoran: SetoranRow[];
  ringkasan: {
    totalSetoran: number;
    ziyadah: number;
    murajaah: number;
    juzSelesai: number;
    level: string;
  };
  startDate?: string;
  endDate?: string;
  monthKey?: string;
}) {
  const { santri, setoran, ringkasan, startDate, endDate, monthKey } = options;
  const wb = XLSX.utils.book_new();

  const meta = [
    { Field: 'Nama', Nilai: santri.nama_lengkap },
    { Field: 'NIS', Nilai: santri.nis || '-' },
    { Field: 'Kode PIN', Nilai: santri.kode_unik },
    { Field: 'Tingkatan', Nilai: getTingkatanLabel(santri.tingkatan) },
    { Field: 'Target Juz', Nilai: santri.target_juz ?? 30 },
    { Field: 'Periode', Nilai: periodeLabel(startDate, endDate, monthKey) },
    { Field: 'Total Setoran', Nilai: ringkasan.totalSetoran },
    { Field: 'Ziyadah', Nilai: ringkasan.ziyadah },
    { Field: 'Murajaah', Nilai: ringkasan.murajaah },
    { Field: 'Juz Selesai', Nilai: ringkasan.juzSelesai },
    { Field: 'Level', Nilai: ringkasan.level },
    { Field: 'Diekspor', Nilai: new Date().toLocaleString('id-ID') },
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Ringkasan');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(mapSetoranSheet(setoran)),
    'Rincian Setoran'
  );

  const safeName = santri.nama_lengkap.replace(/[^\w\-]+/g, '_').slice(0, 40);
  const periode = monthKey || startDate || 'semua';
  downloadWorkbook(wb, `rapor-${safeName}-${periode}.xlsx`);
}

export function exportRekapKelasExcel(options: {
  rekap: RekapRow[];
  detailSetoran: SetoranRow[];
  santriNameById: Record<string, string>;
  totals: { ziyadah: number; murajaah: number; total: number; juz: number };
  tingkatanFilterLabel?: string;
  startDate?: string;
  endDate?: string;
  monthKey?: string;
}) {
  const {
    rekap,
    detailSetoran,
    santriNameById,
    totals,
    tingkatanFilterLabel,
    startDate,
    endDate,
    monthKey,
  } = options;

  const wb = XLSX.utils.book_new();

  const meta = [
    { Field: 'Jenis Laporan', Nilai: 'Rekapitulasi Kelas' },
    { Field: 'Periode', Nilai: periodeLabel(startDate, endDate, monthKey) },
    { Field: 'Filter Tingkatan', Nilai: tingkatanFilterLabel || 'Semua' },
    { Field: 'Total Ziyadah', Nilai: totals.ziyadah },
    { Field: 'Total Murajaah', Nilai: totals.murajaah },
    { Field: 'Total Sesi', Nilai: totals.total },
    { Field: 'Total Juz Selesai (jumlah)', Nilai: totals.juz },
    { Field: 'Diekspor', Nilai: new Date().toLocaleString('id-ID') },
  ];

  const rekapSheet = rekap.map((row, idx) => ({
    No: idx + 1,
    Nama: row.santri.nama_lengkap,
    NIS: row.santri.nis || '',
    Kode_PIN: row.santri.kode_unik,
    Tingkatan: getTingkatanLabel(row.santri.tingkatan),
    Target_Juz: row.santri.target_juz ?? 30,
    Juz_Selesai: row.juzSelesai,
    Level: row.level,
    Ziyadah: row.ziyadah,
    Murajaah: row.murajaah,
    Total_Setoran: row.total,
    Status: row.total > 0 ? 'Aktif' : 'Belum Ada',
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rekapSheet), 'Rekap Santri');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(mapSetoranSheet(detailSetoran, santriNameById)),
    'Detail Setoran'
  );

  const periode = monthKey || startDate || 'semua';
  const tingkat = (tingkatanFilterLabel || 'semua').toLowerCase().replace(/\s+/g, '-');
  downloadWorkbook(wb, `rekap-kelas-${tingkat}-${periode}.xlsx`);
}
