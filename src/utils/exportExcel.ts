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
  absensi?: {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    terisi: number;
    persenHadir: number;
    rincian?: Array<{ tanggal: string; status: string; catatan?: string | null }>;
  };
  startDate?: string;
  endDate?: string;
  monthKey?: string;
}) {
  const { santri, setoran, ringkasan, absensi, startDate, endDate, monthKey } = options;
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
    ...(absensi
      ? [
          { Field: 'Absensi Hadir', Nilai: absensi.hadir },
          { Field: 'Absensi Sakit', Nilai: absensi.sakit },
          { Field: 'Absensi Izin', Nilai: absensi.izin },
          { Field: 'Absensi Alpha', Nilai: absensi.alpha },
          { Field: 'Absensi Hari Terisi', Nilai: absensi.terisi },
          { Field: 'Absensi % Hadir', Nilai: `${absensi.persenHadir}%` },
        ]
      : []),
    { Field: 'Diekspor', Nilai: new Date().toLocaleString('id-ID') },
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Ringkasan');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(mapSetoranSheet(setoran)),
    'Rincian Setoran'
  );

  if (absensi?.rincian && absensi.rincian.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        absensi.rincian.map((row, idx) => ({
          No: idx + 1,
          Tanggal: row.tanggal,
          Status: row.status,
          Catatan: row.catatan || '',
        }))
      ),
      'Rincian Absensi'
    );
  }

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

type AbsensiSantriRekapRow = {
  nama: string;
  nis?: string | null;
  kode_unik: string;
  tingkatan: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  terisi: number;
  persenHadir: number;
};

type AbsensiTingkatanRekapRow = {
  tingkatan: string;
  jumlahSantri: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  terisi: number;
  persenHadir: number;
};

export function exportRekapAbsensiExcel(options: {
  perSantri: AbsensiSantriRekapRow[];
  perTingkatan: AbsensiTingkatanRekapRow[];
  tingkatanFilterLabel?: string;
  startDate?: string;
  endDate?: string;
  monthKey?: string;
}) {
  const {
    perSantri,
    perTingkatan,
    tingkatanFilterLabel,
    startDate,
    endDate,
    monthKey,
  } = options;

  const wb = XLSX.utils.book_new();

  const totalHadir = perSantri.reduce((a, r) => a + r.hadir, 0);
  const totalTerisi = perSantri.reduce((a, r) => a + r.terisi, 0);
  const persen =
    totalTerisi > 0 ? Math.round((totalHadir / totalTerisi) * 1000) / 10 : 0;

  const meta = [
    { Field: 'Jenis Laporan', Nilai: 'Rekap Absensi' },
    { Field: 'Periode', Nilai: periodeLabel(startDate, endDate, monthKey) },
    { Field: 'Filter Tingkatan', Nilai: tingkatanFilterLabel || 'Semua' },
    { Field: 'Jumlah Santri', Nilai: perSantri.length },
    { Field: 'Total Hari Terisi', Nilai: totalTerisi },
    { Field: 'Total Hadir', Nilai: totalHadir },
    { Field: 'Persen Hadir (keseluruhan)', Nilai: `${persen}%` },
    { Field: 'Diekspor', Nilai: new Date().toLocaleString('id-ID') },
  ];

  const tingkatanSheet = perTingkatan.map((row) => ({
    Tingkatan: row.tingkatan,
    Jumlah_Santri: row.jumlahSantri,
    Hadir: row.hadir,
    Sakit: row.sakit,
    Izin: row.izin,
    Alpha: row.alpha,
    Hari_Terisi: row.terisi,
    Persen_Hadir: `${row.persenHadir}%`,
  }));

  const santriSheet = perSantri.map((row, idx) => ({
    No: idx + 1,
    Nama: row.nama,
    NIS: row.nis || '',
    Kode_PIN: row.kode_unik,
    Tingkatan: row.tingkatan,
    Hadir: row.hadir,
    Sakit: row.sakit,
    Izin: row.izin,
    Alpha: row.alpha,
    Hari_Terisi: row.terisi,
    Persen_Hadir: `${row.persenHadir}%`,
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tingkatanSheet), 'Per Tingkatan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(santriSheet), 'Per Santri');

  const periode = monthKey || startDate || 'semua';
  const tingkat = (tingkatanFilterLabel || 'semua').toLowerCase().replace(/\s+/g, '-');
  downloadWorkbook(wb, `rekap-absensi-${tingkat}-${periode}.xlsx`);
}
