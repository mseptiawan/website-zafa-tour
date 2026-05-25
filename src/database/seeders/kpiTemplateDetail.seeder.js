import KpiTemplate from "../../models/kpi/KpiTemplate.js";
import KpiTemplateDetail from "../../models/kpi/KpiTemplateDetail.js";

const kpiTemplateDetailSeeder = async () => {
  await KpiTemplateDetail.deleteMany();

  // =====================================================
  // GET TEMPLATE
  // =====================================================
  const managerAdministrasi = await KpiTemplate.findOne({
    name: "Manager Bidang Administrasi",
  });

  const customerService = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Customer Service)",
  });

  const pelaporan = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Pelaporan Jamaah dan Transportasi)",
  });

  const onlineCs = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Online Customer Service)",
  });

  const ticketing = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Ticketing dan Administrasi Haji)",
  });

  const visaHotel = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Visa dan Hotel)",
  });

  const landArrangement = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Pelayanan Land Arrangement)",
  });

  const edukasi = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Edukasi Jamaah dan Alumni)",
  });
  const penerimaanPenagihan = await KpiTemplate.findOne({
    name: "Unit Penerimaan dan Penagihan",
  });
  const penerimaaanStoran = await KpiTemplate.findOne({
    name: "Unit Penerimaan Tunai dan Non Tunai",
  });
  const taxAccounting = await KpiTemplate.findOne({
    name: "Unit Tax and Accounting",
  });
  const pengeluaranCogs = await KpiTemplate.findOne({
    name: "Unit Pengeluaran COGS",
  });
  const pengeluaranOperasional = await KpiTemplate.findOne({
    name: "Unit Pengeluaran Operasional Harian",
  });
  const perlengkapan = await KpiTemplate.findOne({
    name: "Staff Perlengkapan dan Pemeliharaan Gedung",
  });
  const marketing = await KpiTemplate.findOne({
    name: "Staff Bidang Marketing dan Perlengkapan",
  });
  // =====================================================
  // INSERT KPI DETAILS
  // =====================================================

  await KpiTemplateDetail.insertMany([
    // =====================================================
    // CUSTOMER SERVICE
    // =====================================================
    {
      kpiTemplateId: managerAdministrasi._id,
      areaKinerja: "Koordinasi Tim Administrasi",
      indikator: "Tingkat koordinasi dan pencapaian target kerja staf administrasi",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: managerAdministrasi._id,
      areaKinerja: "Manajemen Pendaftaran & Jadwal Keberangkatan",
      indikator: "Jumlah pendaftaran dan penjadwalan keberangkatan yang tepat dan akurat",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: managerAdministrasi._id,
      areaKinerja: "Pengelolaan Dokumen Penting",
      indikator: "Ketersediaan dan kelengkapan dokumen legal dan penting perusahaan",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: managerAdministrasi._id,
      areaKinerja: "Koordinasi Antar Bidang",
      indikator: "Jumlah pertemuan koordinasi dan hasil sinkronisasi antar bidang",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: customerService._id,
      areaKinerja: "Pelayanan Tamu & Jamaah",
      indikator: "Kepuasan tamu dan jamaah terhadap pelayanan langsung",
      bobot: 20,
      target: "≥ 90%",
    },
    {
      kpiTemplateId: customerService._id,
      areaKinerja: "Pembuatan Surat Rekomendasi Paspor",
      indikator: "Ketepatan dan jumlah surat rekomendasi paspor yang dibuat sesuai permintaan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: customerService._id,
      areaKinerja: "Pemeriksaan Berkas Keberangkatan",
      indikator: "Tingkat kelengkapan berkas jamaah sebelum keberangkatan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: customerService._id,
      areaKinerja: "Pelaporan Pendaftaran Jamaah",
      indikator: "Ketepatan pembuatan laporan pendaftaran jamaah per periode",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: customerService._id,
      areaKinerja: "Pengelolaan Grup & Reminder Jadwal",
      indikator: "Konsistensi pengiriman reminder dan manajemen WA group keberangkatan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pelaporan._id,
      areaKinerja: "Input Data Jamaah",
      indikator: "Ketepatan dan kecepatan input data jamaah dalam sistem pendaftaran",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pelaporan._id,
      areaKinerja: "Pengajuan Asuransi Jamaah",
      indikator:
        "Jumlah pengajuan asuransi jamaah yang dilakukan tepat waktu sebelum keberangkatan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pelaporan._id,
      areaKinerja: "Pengajuan Klaim Asuransi",
      indikator: "Responsif dalam pengajuan klaim asuransi jamaah saat ada kejadian",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: pelaporan._id,
      areaKinerja: "Laporan SISKOPATUH",
      indikator: "Ketepatan dan kelengkapan laporan keberangkatan di SISKOPATUH",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: pelaporan._id,
      areaKinerja: "Perawatan Kendaraan Operasional",
      indikator:
        "Kepatuhan terhadap jadwal servis, administrasi pajak dan kondisi kendaraan operasional",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: onlineCs._id,
      areaKinerja: "Penerusan Informasi",
      indikator:
        "Ketepatan dan kecepatan meneruskan informasi dari panggilan/obrolan ke bagian terkait",
      bobot: 25,
      target: "≥ 95%",
    },
    {
      kpiTemplateId: onlineCs._id,
      areaKinerja: "Kualitas Informasi Call Center",
      indikator: "Tingkat akurasi dan kelengkapan informasi yang diberikan kepada calon jamaah",
      bobot: 25,
      target: "≥ 95%",
    },
    {
      kpiTemplateId: onlineCs._id,
      areaKinerja: "Pengelolaan Pendaftaran Jamaah",
      indikator: "Jumlah pendaftaran jamaah yang berhasil dicatat dan diteruskan ke sistem",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: onlineCs._id,
      areaKinerja: "Pelaporan Bulanan Kontak Masuk",
      indikator:
        "Ketepatan dan kelengkapan laporan bulanan tentang kontak masuk, topik pertanyaan, dan respons",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: ticketing._id,
      areaKinerja: "Manifest Group Keberangkatan",
      indikator: "Tingkat akurasi dan ketepatan waktu penyelesaian manifest group keberangkatan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: ticketing._id,
      areaKinerja: "Pengelolaan Surat",
      indikator: "Jumlah surat masuk/keluar yang tercatat dan terdokumentasi dengan baik",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: ticketing._id,
      areaKinerja: "Pendaftaran Haji Khusus",
      indikator: "Jumlah pendaftaran haji khusus yang diproses sesuai prosedur dan waktu",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: ticketing._id,
      areaKinerja: "Pemesanan Tiket Keberangkatan",
      indikator: "Jumlah tiket yang dipesan sesuai jadwal dan kebutuhan group",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: ticketing._id,
      areaKinerja: "Rekapitulasi Tagihan Tiket",
      indikator: "Ketepatan waktu pelaporan rekap tagihan tiket ke tim keuangan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: visaHotel._id,
      areaKinerja: "Pengelolaan Visa Jamaah",
      indikator: "Ketepatan pengajuan visa dan validasi tagihan dengan tim keuangan",
      bobot: 20,
      target: "≥ 98%",
    },
    {
      kpiTemplateId: visaHotel._id,
      areaKinerja: "Pengaturan Akomodasi",
      indikator: "Ketepatan alokasi kamar dan data akomodasi di Makkah dan Madinah",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: visaHotel._id,
      areaKinerja: "Pelaksanaan Manasik",
      indikator: "Jumlah manasik terlaksana sesuai jadwal dan kepuasan peserta",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: visaHotel._id,
      areaKinerja: "Manajemen Tour Leader & Administrasi Group",
      indikator: "Ketersediaan tour leader sesuai jadwal dan jumlah keberangkatan",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: visaHotel._id,
      areaKinerja: "Pembinaan Tour Leader & Muthowif",
      indikator: "Frekuensi dan kualitas pembinaan internal",
      bobot: 15,
      target: "≥ 1 sesi/bulan",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Pengelolaan Petugas Saudi & Keuangan",
      indikator: "Ketepatan data pengeluaran dan pencatatan keuangan petugas Saudi",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Monitoring Group Sesuai Itinerary",
      indikator: "Persentase group yang mengikuti itinerary sesuai jadwal",
      bobot: 20,
      target: "≥ 95%",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Bimbingan Muthowif dan Tour Leader",
      indikator: "Frekuensi dan kualitas pengarahan kepada petugas lapangan",
      bobot: 15,
      target: "≥ 1 briefing / keberangkatan",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Manajemen Handling Bandara",
      indikator: "Ketersediaan tim handling bandara sesuai jadwal & proses check-in",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Kegiatan Manasik",
      indikator: "Persentase manasik terlaksana sesuai standar & mendapat evaluasi positif",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: landArrangement._id,
      areaKinerja: "Koordinasi Lintas Bidang",
      indikator:
        "Tingkat efektivitas koordinasi antar bidang (perjalanan, akomodasi, pelayanan Saudi)",
      bobot: 15,
      target: "≥ 90%",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Bimbingan Manasik Jamaah",
      indikator: "Jumlah sesi manasik yang terlaksana sesuai standar & tepat waktu",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Pengembangan Kurikulum",
      indikator: "Ketersediaan dan pembaruan kurikulum manasik & pelayanan jamaah",
      bobot: 20,
      target: "Update min. 1x/tahun",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Evaluasi Program Manasik",
      indikator: "Pelaksanaan evaluasi pra dan pasca keberangkatan jamaah",
      bobot: 15,
      target: "≥ 90% group dievaluasi",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Pelatihan Tim Pendukung",
      indikator: "Jumlah pelatihan internal untuk tour leader, muthowif, atau staf layanan",
      bobot: 15,
      target: "Min. 1 pelatihan/3 bulan",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Kepuasan Jamaah",
      indikator: "Persentase peserta manasik yang merasa puas dengan materi dan pembimbing",
      bobot: 15,
      target: "≥ 85% puas",
    },
    {
      kpiTemplateId: edukasi._id,
      areaKinerja: "Dokumentasi & Laporan Program",
      indikator: "Kelengkapan laporan kegiatan manasik dan pelatihan sesuai waktu",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Sinkronisasi ke Mitra/Jamaah",
      indikator: "Ketepatan waktu sinkronisasi paling lama 1 bulan sebelum keberangkatan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Respon Chat Call Center Keuangan",
      indikator: "Respon cepat ke mitra/jamaah minimal 20 menit dan maksimal 1,5 jam di jam kantor",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Pengajuan Refund Dana ke Group WA",
      indikator: "Ketepatan waktu pengajuan refund H+2 dari pengajuan mitra atau jamaah",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Pengecekan Pembayaran Wilayah",
      indikator: "Persentase dan ketepatan pengecekan jumlah pembayaran wilayah harian",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Pengajuan Ujroh ke PIC Ujroh",
      indikator: "Ketepatan waktu pengajuan H+1 dari pengajuan mitra/jamaah",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaanPenagihan._id,
      areaKinerja: "Penarikan Mutasi Bank & Penandaan",
      indikator:
        "Ketepatan waktu penarikan mutasi bank (2–5 menit) dan penandaan untuk penginputan",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaaanStoran._id,
      areaKinerja: "Penerimaan Uang Tunai Harian",
      indikator: "Ketepatan waktu penerimaan uang dengan waktu minimal 1 menit",
      bobot: 35,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaaanStoran._id,
      areaKinerja: "Input Pembayaran dari CS Pusat",
      indikator: "Ketepatan waktu input pembayaran sesuai data yang dikirim CS Pusat setiap hari",
      bobot: 30,
      target: "100%",
    },
    {
      kpiTemplateId: penerimaaanStoran._id,
      areaKinerja: "Pengiriman Bukti Invoice ke Jamaah/Mitra",
      indikator: "Ketepatan waktu dan jumlah pengiriman invoice pembayaran setiap hari",
      bobot: 35,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Input Data Mutasi Bank",
      indikator: "Ketepatan waktu dan jumlah mutasi bank (20–35 transaksi per hari)",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Rekonsiliasi Bank",
      indikator: "Ketepatan waktu dan jumlah rekonsiliasi bank per bulan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Jurnal Biaya Balik Hotel di Saudi",
      indikator: "Penyelesaian jurnal biaya balik maksimal H+2 setelah keberangkatan",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Input Piutang Pegawai & Piutang Usaha",
      indikator: "Tingkat akurasi input piutang sesuai dengan realisasi",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Laporan Keuangan untuk Pajak",
      indikator: "Ketepatan waktu pelaporan pajak maksimal awal Januari",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Audit Laporan Keuangan",
      indikator: "Penyelesaian audit laporan keuangan maksimal bulan Mei setiap tahun",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: taxAccounting._id,
      areaKinerja: "Review Buku Besar Laba Rugi & Neraca",
      indikator: "Pemeriksaan buku besar selesai direview setiap tanggal 5 setiap bulan",
      bobot: 15,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranCogs._id,
      areaKinerja: "Pemrosesan Komisi Mitra Pusat & Wilayah",
      indikator: "Ketepatan waktu pemrosesan komisi sebelum tanggal 5 dan 20 setiap bulan",
      bobot: 40,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranCogs._id,
      areaKinerja: "Pembayaran Visa dan Hotel",
      indikator: "Ketepatan pembayaran maksimal H-7 dari keberangkatan sesuai invoice masuk",
      bobot: 35,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranCogs._id,
      areaKinerja: "Pembayaran Haji",
      indikator: "Ketepatan pembayaran SPPH maksimal 3 hari setelah terbit",
      bobot: 25,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranOperasional._id,
      areaKinerja: "Petty Cash Harian",
      indikator: "Ketepatan waktu proses petty cash H+1 maksimal setiap ada pengajuan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranOperasional._id,
      areaKinerja: "Transfer Harian dan Bulanan",
      indikator: "Ketepatan proses transfer sesuai jadwal harian atau bulanan",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranOperasional._id,
      areaKinerja: "Refund Dana Jamaah",
      indikator: "Refund H+1 dari pengajuan mitra/jamaah",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranOperasional._id,
      areaKinerja: "Input Kas Masuk Bank (Accurate)",
      indikator: "Akurasi dan minimal 10 transaksi per hari di sistem Accurate",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: pengeluaranOperasional._id,
      areaKinerja: "Input Petty Cash (Accurate)",
      indikator: "Input sesuai seluruh pengeluaran petty cash harian di sistem Accurate",
      bobot: 20,
      target: "100%",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Pemeliharaan Gudang dan Fasilitas",
      indikator: "Jumlah kerusakan gudang dan fasilitas",
      bobot: 15,
      target: "0 kerusakan / bulan",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Barang Masuk dan Keluar",
      indikator: "Jumlah barang masuk dan keluar tercatat secara harian",
      bobot: 15,
      target: "100% tercatat harian",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Stock Barang di Gudang",
      indikator: "Tingkat akurasi data stok barang",
      bobot: 20,
      target: "≥ 98%",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Kepatuhan SOP Gudang",
      indikator: "Tingkat kepatuhan terhadap SOP pengelolaan gudang",
      bobot: 15,
      target: "100% SOP dijalankan",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Waktu Pemenuhan Permintaan Barang",
      indikator: "Rata-rata waktu penyelesaian permintaan barang",
      bobot: 20,
      target: "≤ 2 hari",
    },
    {
      kpiTemplateId: perlengkapan._id,
      areaKinerja: "Kepuasan Pengguna Layanan Perlengkapan",
      indikator: "Survei kepuasan jamaah/mitra terhadap layanan",
      bobot: 15,
      target: "≥ 85% puas",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Do Call Mitra",
      indikator: "Semua mitra dihubungi",
      bobot: 8,
      target: "100%",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Basic Training Mitra",
      indikator: "Pelatihan untuk semua mitra baru",
      bobot: 8,
      target: "100%",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Pertemuan Rutin Mitra & Cabang",
      indikator: "Pertemuan rutin mitra dan cabang",
      bobot: 8,
      target: "1x per bulan",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Pertemuan Cabang",
      indikator: "Pertemuan cabang",
      bobot: 6,
      target: "1x per bulan per cabang",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Pertemuan Seluruh Mitra",
      indikator: "Pertemuan seluruh mitra",
      bobot: 5,
      target: "4x per tahun",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Pelatihan Mitra",
      indikator: "Pelatihan mitra secara berkala",
      bobot: 5,
      target: "Min 1 per triwulan",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Rekrutmen Mitra Baru",
      indikator: "Pertumbuhan mitra baru",
      bobot: 8,
      target: "10% per kuartal",
    },

    // =====================================================
    // SYIAR BAITULLAH (25%)
    // =====================================================
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Aktivasi Sosial Media Mitra",
      indikator: "Konsistensi posting mitra di media sosial",
      bobot: 10,
      target: "80% mitra aktif posting",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Tools Marketing (Brosur)",
      indikator: "Ketersediaan materi marketing",
      bobot: 7,
      target: "Tersedia 1 minggu setelah launching",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Canvassing / Pendampingan Mitra",
      indikator: "Pendampingan langsung ke mitra",
      bobot: 8,
      target: "Setiap mitra didampingi",
    },

    // =====================================================
    // PENGENALAN PERUSAHAAN (20%)
    // =====================================================
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Silaturahmi Lembaga",
      indikator: "Kunjungan ke lembaga",
      bobot: 8,
      target: "2 lembaga per bulan",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Silaturahmi Tokoh",
      indikator: "Kunjungan ke tokoh masyarakat",
      bobot: 6,
      target: "1 tokoh per bulan",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Sharing Konten",
      indikator: "Produksi konten marketing",
      bobot: 6,
      target: "Min 2 konten per minggu",
    },

    // =====================================================
    // KOORDINASI TIM (15%)
    // =====================================================
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Koordinasi Wilayah",
      indikator: "Koordinasi antar wilayah",
      bobot: 8,
      target: "1x per bulan per wilayah",
    },
    {
      kpiTemplateId: marketing._id,
      areaKinerja: "Koordinasi Tim BMK & Multimedia",
      indikator: "Koordinasi produksi konten",
      bobot: 7,
      target: "Setiap ada kebutuhan konten",
    },
  ]);

  console.log("KPI Template Details seeded");
};

export default kpiTemplateDetailSeeder;
