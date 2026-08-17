// ==========================================================
// SHARED.JS
// Dipakai bersama oleh index.html, dashboard.html, rekap.html,
// dan aspek.html. Wajib dimuat SEBELUM script khusus tiap
// halaman (<script src="shared.js"></script> sebelum script
// halaman itu sendiri).
//
// Karena sekarang setiap halaman adalah dokumen HTML terpisah
// (navigasi via window.location, bukan SPA), state seperti
// `user`, kelas/mapel yang sedang dibuka, dan aspek yang sedang
// dibuka DISIMPAN ULANG lewat sessionStorage setiap kali
// berpindah halaman, lalu dibaca ulang di halaman tujuan.
// ==========================================================

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = "https://eraport-worker.rdmi.workers.dev";

const ASPEK_LIST = ['PENGETAHUAN', 'KETERAMPILAN', 'SPIRITUAL', 'SOSIAL', 'KEHADIRAN'];

// ==========================================
// MODUL HALAQOH: daftar Surah (urutan Mushaf 1-114), Juz (1-30),
// dan opsi PREDIKAT/STATUS/JENIS EVALUASI, dipakai bersama oleh
// nilai-tahfidz.html dan nilai-tilawah.html.
// ==========================================
const SURAH_LIST = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am",
  "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd",
  "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara",
  "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah",
  "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar",
  "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat",
  "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid",
  "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah",
  "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam",
  "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir",
  "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
  "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams",
  "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr",
  "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur",
  "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar",
  "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);

// Jumlah ayat tiap Surah (mengikuti penomoran Hafs 'an 'Ashim / Mushaf
// Madinah, yang dipakai cetakan Al-Qur'an di Indonesia) -- index array
// ini SEJAJAR dengan SURAH_LIST di atas (index 0 = Al-Fatihah = 7 ayat,
// dst). Dipakai isiDropdownAyat() di bawah untuk membatasi pilihan Ayat
// sesuai Surah yang dipilih.
const JUMLAH_AYAT_SURAH = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6
];

// Daftar Halaman mushaf standar (Mushaf Madinah, 604 halaman) -- dipakai
// untuk dropdown Halaman di nilai-tahfidz.html & nilai-tilawah.html.
const HALAMAN_LIST = Array.from({ length: 604 }, (_, i) => i + 1);

// Isi ulang <select> Ayat (id `ayatSelectId`) berdasarkan Surah yang
// sedang dipilih di <select> `surahSelectId` -- pilihannya otomatis jadi
// 1..jumlah ayat Surah itu. Dipanggil sekali saat modal dibuka/diisi
// ulang (mode edit) dan setiap kali user mengganti pilihan Surah
// (listener 'change', lihat nilai-tahfidz.html/nilai-tilawah.html).
//
// `nilaiTerpilih` (opsional): dipakai khusus saat mengisi ulang form
// pada mode edit, untuk mencoba mempertahankan nilai Ayat yang sudah
// tersimpan -- kalau nilai itu masih valid (<= jumlah ayat Surah
// tersebut) maka tetap dipilih, kalau tidak (mis. data lama tidak
// konsisten) dropdown dikosongkan lagi supaya user harus memilih ulang.
function isiDropdownAyat(surahSelectId, ayatSelectId, nilaiTerpilih) {
  const surahSel = document.getElementById(surahSelectId);
  const ayatSel = document.getElementById(ayatSelectId);
  if (!surahSel || !ayatSel) return;

  const idx = SURAH_LIST.indexOf(surahSel.value);
  const jumlahAyat = idx >= 0 ? JUMLAH_AYAT_SURAH[idx] : 0;
  const nilaiSekarang = (nilaiTerpilih !== undefined) ? nilaiTerpilih : ayatSel.value;

  if (!jumlahAyat) {
    ayatSel.innerHTML = '<option value="">-</option>';
    return;
  }

  let opsi = '<option value="">-</option>';
  for (let a = 1; a <= jumlahAyat; a++) opsi += `<option value="${a}">${a}</option>`;
  ayatSel.innerHTML = opsi;
  ayatSel.value = (nilaiSekarang && Number(nilaiSekarang) <= jumlahAyat) ? String(nilaiSekarang) : '';
}

const PREDIKAT_HALAQOH_LIST = ['A', 'B', 'C'];
const STATUS_HALAQOH_LIST = ['Lulus', 'Lanjut', 'Ulang'];
const JENIS_EVALUASI_TAHFIDZ_LIST = ['Ziadah', 'Murojaah'];

// Gabungkan 4 parameter (Surah/Ayat/Juz/Halaman) jadi satu teks,
// urutan mengikuti tampilan form input (nilai-tahfidz.html &
// nilai-tilawah.html): "Surah Al-Baqarah, Ayat 10, Juz 1, Hal 5"
// -- minimal satu parameter harus diisi, bagian yang kosong tidak
// ikut ditulis.
function gabungBacaan(surah, juz, halaman, ayat) {
  const parts = [];
  if (surah) parts.push('Surah ' + surah);
  if (ayat) parts.push('Ayat ' + ayat);
  if (juz) parts.push('Juz ' + juz);
  if (halaman) parts.push('Hal ' + halaman);
  return parts.join(', ');
}

// Kebalikan dari gabungBacaan() -- dipakai untuk mengisi ulang form saat
// membuka data yang sudah pernah tersimpan (mode edit).
function uraiBacaan(teks) {
  const hasil = { surah: '', juz: '', halaman: '', ayat: '' };
  if (!teks) return hasil;
  String(teks).split(',').map(s => s.trim()).forEach(tok => {
    if (tok.startsWith('Surah ')) hasil.surah = tok.slice(6).trim();
    else if (tok.startsWith('Juz ')) hasil.juz = tok.slice(4).trim();
    else if (tok.startsWith('Hal ')) hasil.halaman = tok.slice(4).trim();
    else if (tok.startsWith('Ayat ')) hasil.ayat = tok.slice(5).trim();
  });
  return hasil;
}

// ==========================================
// TAG & STATE: HALAQOH (kelompok Musrif yang dibuka guru)
// ==========================================
function setCurrentHalaqoh(halaqoh, kegiatan) {
  sessionStorage.setItem('currentHalaqoh', JSON.stringify({ halaqoh, kegiatan }));
}
function getCurrentHalaqoh() {
  try {
    return JSON.parse(sessionStorage.getItem('currentHalaqoh'));
  } catch (e) {
    return null;
  }
}

// State dalam-memori untuk halaman yang sedang aktif saja (di-reset
// setiap kali dokumen dimuat ulang). Diisi oleh ensureLoggedIn()/
// getCurrentClass()/getCurrentAspek().
let user = null;

// ==========================================
// CORE UTILS
// ==========================================
async function apiCall(action, params = {}) {
  const payload = Object.assign({ action }, params);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return res.json();
  } catch (e) {
    console.error("API Error:", e);
    return { success: false, message: "Koneksi ke server gagal.", offline: true };
  }
}

function showLoading(show, text = 'Memuat...') {
  const loadingText = document.getElementById('loadingText');
  const loading = document.getElementById('loading');
  if (loadingText) loadingText.textContent = text;
  if (loading) loading.style.display = show ? 'flex' : 'none';
}

function formatWaktu_(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID');
  } catch (e) {
    return iso;
  }
}

// ==========================================
// JEMBATAN KE TINYDB KODULAR
// ==========================================
const kPending = {};
let kReqCounter = 0;

// Dipanggil dari Kodular via EvaluateJavaScript.
// PENTING: parameter dikirim TERPISAH (bukan satu JSON string) agar isi
// `payload` (data siswa/nilai yang bisa mengandung kutip, backslash, dst)
// tidak perlu di-escape jadi JSON valid di sisi Kodular — cukup di-encode
// dengan Web1.URIEncode lalu didekode via decodeURIComponent() di sini.
// reqId, opType, success TIDAK BOLEH mengandung data bebas (harus berupa
// token internal yang dibuat sistem, misal reqId/op), karena nilai-nilai
// itu ditulis langsung sebagai literal string di blok Kodular.
window.__kodularResponse = function (reqId, opType, success, payload) {
  try {
    const pending = kPending[reqId];
    if (!pending) return;
    delete kPending[reqId];

    // Web1.URIEncode di Kodular meng-encode spasi sebagai '+' (gaya Java
    // URLEncoder), sedangkan decodeURIComponent() di JS TIDAK mengubah
    // '+' balik jadi spasi (hanya menangani %XX). Tanpa baris ini, semua
    // spasi di data (nama siswa, dll.) akan muncul sebagai '+' literal.
    if (typeof payload === 'string') {
      payload = payload.split('+').join(' ');
    }

    if (!success) {
      pending.reject(new Error(payload || 'Operasi TinyDB gagal'));
      return;
    }

    if (opType === 'LIST') {
      // Tag internal aplikasi ini selalu aman (huruf/angka/underscore saja,
      // lihat tagSafe()), jadi aman dipisah dengan koma tanpa encoding khusus.
      const tags = payload ? payload.split(',').filter(Boolean) : [];
      pending.resolve({ success: true, tags });
    } else {
      // GET dan lainnya: payload adalah string mentah (mis. hasil
      // JSON.stringify dari sisi web sebelumnya), sudah didekode utuh.
      pending.resolve({ success: true, value: payload });
    }
  } catch (e) {
    console.error('Gagal memproses respons Kodular:', e);
  }
};

// ----------------------------------------------------------
// ANTRIAN kSend_() -- channel window.AppInventor.setWebViewString()
// cuma menampung SATU pesan dalam satu waktu (bukan antrian bawaan).
// Kalau beberapa halaman/fungsi memanggil kStorage.get/set secara
// BERSAMAAN (mis. dashboard.html menembak banyak kStorage.getJSON()
// sekaligus saat DOMContentLoaded), pesan yang lebih dulu bisa ketimpa
// oleh pesan berikutnya sebelum sisi Kodular sempat membacanya --
// request yang ketimpa itu tidak pernah dapat balasan dan macet
// sampai timeout 8 detik (biasanya tertangkap try/catch di pemanggil
// dan dianggap "kosong", padahal datanya sebenarnya ADA).
//
// kSendQueue_ memastikan setiap kSend_() BARU baru dikirim SETELAH
// kSend_() sebelumnya benar-benar selesai (dapat balasan ATAU
// timeout) -- jadi tidak akan pernah ada dua pesan di channel yang
// sama secara bersamaan.
// ----------------------------------------------------------
let kSendQueue_ = Promise.resolve();

function kSend_(op, tag, value) {
  const runNow = () => new Promise((resolve, reject) => {
    if (!window.AppInventor || !window.AppInventor.setWebViewString) {
      reject(new Error('Bridge Kodular (AppInventor) tidak tersedia. Buka aplikasi ini melalui WebViewer di Kodular.'));
      return;
    }
    const reqId = 'r' + (++kReqCounter) + '_' + Date.now();
    kPending[reqId] = { resolve, reject };

    const payload = { reqId, op, tag };
    if (value !== undefined) payload.value = value;

    window.AppInventor.setWebViewString(JSON.stringify(payload));

    setTimeout(() => {
      if (kPending[reqId]) {
        delete kPending[reqId];
        reject(new Error('Waktu tunggu TinyDB habis untuk operasi ' + op + ' (' + tag + ')'));
      }
    }, 8000);
  });

  // Antre di belakang panggilan sebelumnya -- .then(runNow, runNow) supaya
  // tetap lanjut ke request berikutnya walau request sebelumnya gagal/reject.
  const result = kSendQueue_.then(runNow, runNow);
  // Simpan versi yang "tidak pernah reject" sebagai queue berikutnya, supaya
  // satu kegagalan tidak membuat SEMUA antrian setelahnya ikut batal terkirim.
  kSendQueue_ = result.then(() => {}, () => {});
  return result;
}

const kStorage = {
  async get(tag) {
    const res = await kSend_('GET', tag);
    return (res.value !== undefined && res.value !== null && res.value !== '') ? res.value : null;
  },
  async set(tag, value) {
    await kSend_('SET', tag, value);
    return true;
  },
  async delete(tag) {
    await kSend_('DELETE', tag);
    return true;
  },
  async list(prefix) {
    const res = await kSend_('LIST', prefix || '');
    return res.tags || [];
  },
  async getJSON(tag, fallback = null) {
    const v = await this.get(tag);
    if (!v) return fallback;
    try { return JSON.parse(v); } catch (e) { return fallback; }
  },
  async setJSON(tag, obj) {
    return this.set(tag, JSON.stringify(obj));
  }
};

function tagSafe(str) {
  return String(str).trim().replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
}

function siswaTag(kelas) {
  return 'SISWA_' + tagSafe(kelas);
}

function nilaiTag(kelas, mapel, aspek) {
  return 'NILAI_' + tagSafe(kelas) + '_' + tagSafe(mapel) + '_' + tagSafe(aspek);
}

function nilaiSyncMetaTag(kelas, mapel, aspek) {
  return 'NILAI_SYNC_META_' + tagSafe(kelas) + '_' + tagSafe(mapel) + '_' + tagSafe(aspek);
}

function nilaiPendingDeleteTag(kelas, mapel, aspek) {
  return 'NILAI_PENDING_DELETE_' + tagSafe(kelas) + '_' + tagSafe(mapel) + '_' + tagSafe(aspek);
}

function userSessionTag() {
  return 'USER_SESSION';
}

// ==========================================
// TAG: NILAI HALAQOH (Tahfidz/Tilawah) -- histori penilaian per
// kelompok Halaqoh, disimpan lokal-dulu (lihat PRD Nilai Tahfidz &
// Tilawah). Dipakai bersama oleh nilai-tahfidz.html & nilai-tilawah.html.
// ==========================================
function nilaiHalaqohTag(halaqoh, kegiatan) {
  return 'NILAI_HALAQOH_' + tagSafe(halaqoh) + '_' + tagSafe(kegiatan);
}
function nilaiHalaqohSyncMetaTag(halaqoh, kegiatan) {
  return 'NILAI_HALAQOH_SYNC_META_' + tagSafe(halaqoh) + '_' + tagSafe(kegiatan);
}
function nilaiHalaqohPendingDeleteTag(halaqoh, kegiatan) {
  return 'NILAI_HALAQOH_PENDING_DELETE_' + tagSafe(halaqoh) + '_' + tagSafe(kegiatan);
}

// Daftar penugasan Halaqoh (guru sebagai Musrif) & roster siswa per
// kelompok Halaqoh -- disinkron & disimpan offline oleh sinkronData(),
// SAMA seperti ASSIGNMENTS dan siswaTag(kelas) untuk kelas/mapel biasa.
function halaqohAssignmentsTag() {
  return 'HALAQOH_ASSIGNMENTS';
}
function siswaHalaqohTag(halaqoh) {
  return 'SISWA_HALAQOH_' + tagSafe(halaqoh);
}

// ==========================================
// TAG & STATE: WALI KELAS
// ==========================================
function waliKelasInfoTag() {
  return 'WALIKELAS_INFO';
}
function setCurrentWaliKelas(kelas) {
  sessionStorage.setItem('currentWaliKelas', kelas);
}
function getCurrentWaliKelas() {
  return sessionStorage.getItem('currentWaliKelas') || null;
}

function infoLembagaTag() {
  return 'INFO_LEMBAGA';
}

// ==========================================
// CUSTOM MODAL (ganti alert dan confirm)
// Markup #modalAlert dan #modalKonfirmasi harus ada di halaman
// yang memanggil showAlert()/showKonfirmasi() (lihat dashboard.html
// dan aspek.html).
// ==========================================
let __modalKonfirmasiResolve = null;
function showKonfirmasi(msg, title = 'Konfirmasi') {
  return new Promise(resolve => {
    __modalKonfirmasiResolve = resolve;
    document.getElementById('modalKonfirmasiTitle').textContent = title;
    document.getElementById('modalKonfirmasiMsg').textContent = msg;
    document.getElementById('modalKonfirmasi').classList.add('active');
  });
}
function modalKonfirmasiResolve_(val) {
  document.getElementById('modalKonfirmasi').classList.remove('active');
  if (__modalKonfirmasiResolve) { __modalKonfirmasiResolve(val); __modalKonfirmasiResolve = null; }
}

let __modalAlertResolve = null;
function showAlert(msg, title = 'Informasi') {
  return new Promise(resolve => {
    __modalAlertResolve = resolve;
    document.getElementById('modalAlertTitle').textContent = title;
    document.getElementById('modalAlertMsg').textContent = msg;
    document.getElementById('modalAlert').classList.add('active');
  });
}
function modalAlertResolve_() {
  document.getElementById('modalAlert').classList.remove('active');
  if (__modalAlertResolve) { __modalAlertResolve(); __modalAlertResolve = null; }
}

// ==========================================
// STATE ANTAR HALAMAN (sessionStorage)
// ==========================================
function setCurrentClass(kelas, mapel) {
  sessionStorage.setItem('currentClass', JSON.stringify({ kelas, mapel }));
}
function getCurrentClass() {
  try {
    return JSON.parse(sessionStorage.getItem('currentClass'));
  } catch (e) {
    return null;
  }
}
function setCurrentAspek(aspek) {
  sessionStorage.setItem('currentAspek', aspek);
}
function getCurrentAspek() {
  return sessionStorage.getItem('currentAspek') || null;
}

// ==========================================
// SESI LOGIN
// ==========================================
// Dipanggil di awal dashboard.html, rekap.html, dan aspek.html.
// Mengisi variabel global `user`. Jika tidak ada sesi valid,
// mengarahkan (redirect) balik ke index.html dan mengembalikan false
// -- pemanggil harus langsung `return` saat hasilnya false.
async function ensureLoggedIn() {
  const savedUser = sessionStorage.getItem('user');
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
      return true;
    } catch (e) {
      // lanjut ke pengecekan TinyDB di bawah
    }
  }

  // sessionStorage kosong (mis. WebView baru dibuka langsung ke halaman
  // ini) -> coba pulihkan dari sesi tersimpan di TinyDB, sama seperti
  // auto-login di splash screen.
  try {
    const savedSession = await kStorage.getJSON(userSessionTag(), null);
    if (savedSession && savedSession.username && savedSession.password) {
      const loginRes = await apiCall('login', { username: savedSession.username, password: savedSession.password });
      if (loginRes.success) {
        user = loginRes;
        sessionStorage.setItem('user', JSON.stringify(user));
        return true;
      }
      if (loginRes.offline) {
        user = { username: savedSession.username, nama: savedSession.nama || savedSession.username, role: savedSession.role };
        sessionStorage.setItem('user', JSON.stringify(user));
        return true;
      }
    }
  } catch (e) {
    console.log('Tidak bisa membaca session dari TinyDB:', e);
  }

  window.location.href = 'index.html';
  return false;
}

async function logout() {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('currentClass');
  sessionStorage.removeItem('currentAspek');
  user = null;

  // Hapus session dari TinyDB
  try {
    await kStorage.delete(userSessionTag());
  } catch (e) {
    console.log('Tidak bisa menghapus session dari TinyDB:', e);
  }

  if (window.AppInventor) {
    window.AppInventor.setWebViewString(JSON.stringify({
      status: "logout",
      waktu: Date.now()
    }));
  }

  window.location.href = 'index.html';
}

// ==========================================
// HEADER: INFO LEMBAGA (versi ringan, tanpa splash)
// Dipakai di dashboard.html, rekap.html, aspek.html untuk mengisi
// header dari cache TinyDB yang sudah disimpan saat index.html
// pertama kali dibuka. Lihat index.html untuk versi lengkap yang
// juga mengurus splash screen.
// ==========================================
async function loadAppHeaderFromCache() {
  const headerEl = document.getElementById('appHeader');
  if (!headerEl) return;
  try {
    const res = await kStorage.getJSON(infoLembagaTag(), null);
    if (!res || !res.success) {
      headerEl.style.display = 'none';
      return;
    }
    document.getElementById('appNamaLembaga').textContent = res.namaLembaga || '';
    const periodeText = [res.tahunAjaran, res.semester].filter(Boolean).join(' ');
    document.getElementById('appPeriode').textContent = periodeText;

    const logoEl = document.getElementById('appLogo');
    if (res.logoUrl) {
      logoEl.src = res.logoUrl;
      logoEl.style.visibility = 'visible';
    } else {
      logoEl.style.visibility = 'hidden';
    }

    if (res.appNama) document.title = res.appNama;
    headerEl.style.display = 'flex';
  } catch (e) {
    headerEl.style.display = 'none';
  }
}

// ==========================================
// SINKRON DATA GURU (assignments + data siswa per kelas, TANPA nilai)
// - Otomatis: dipicu hanya saat login manual (lihat index.html).
// - Manual: dipicu tombol "Sinkron Data Guru" di dashboard.html.
// ==========================================
async function refreshSyncStatus() {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;
  try {
    const meta = await kStorage.getJSON('SYNC_META', null);
    statusEl.textContent = (meta && meta.syncedAt) ?
      'Tersinkron: ' + formatWaktu_(meta.syncedAt) :
      'Belum pernah sinkron';
  } catch (e) {
    statusEl.textContent = 'Mode online (bridge TinyDB tidak terdeteksi)';
  }
}

async function sinkronData(silent = false, onSaved = null) {
  const btn = document.getElementById('btnSinkron');
  const statusEl = document.getElementById('syncStatus');
  if (btn) btn.disabled = true;
  showLoading(true, 'Menyinkronkan data...');

  try {
    const res = await apiCall('getSyncData', { username: user.username });
    if (!res.success) {
      if (!silent) await showAlert('Gagal sinkron: ' + res.message, 'Gagal');
      return;
    }

    await kStorage.setJSON('ASSIGNMENTS', res.assignments);

    const kelasList = Object.keys(res.siswaByKelas);
    for (const kelas of kelasList) {
      await kStorage.setJSON(siswaTag(kelas), res.siswaByKelas[kelas]);
    }

    // Info wali kelas ikut disimpan di sini (satu aksi sinkron untuk
    // semuanya) -- bentuknya disamakan dengan hasil getWaliKelasInfo
    // (success/isWaliKelas/kelasList) supaya konsumen cache (dashboard.html)
    // tidak perlu tahu bedanya data ini datang dari sinkron atau dari
    // pemanggilan langsung.
    const wk = res.waliKelasInfo || { isWaliKelas: false, kelasList: [] };
    await kStorage.setJSON(waliKelasInfoTag(), {
      success: true,
      isWaliKelas: wk.isWaliKelas,
      kelasList: wk.kelasList
    });

    // ==========================================
    // HALAQOH (Musrif): daftar penugasan + roster siswa per kelompok --
    // sudah ikut dikembalikan oleh SATU aksi getSyncData di atas (lihat
    // getSyncData() di rekapDanSync.js), jadi di sini tinggal disimpan
    // ke TinyDB. Tidak ada request API tambahan yang terpisah.
    // ==========================================
    const halaqohAssignments = res.halaqohAssignments || [];
    await kStorage.setJSON(halaqohAssignmentsTag(), halaqohAssignments);

    const namaHalaqohUnik = [...new Set(halaqohAssignments.map(a => a.halaqoh))];
    const siswaByHalaqoh = res.siswaByHalaqoh || {};
    for (const halaqoh of namaHalaqohUnik) {
      await kStorage.setJSON(siswaHalaqohTag(halaqoh), siswaByHalaqoh[halaqoh] || []);
    }

    await kStorage.setJSON('SYNC_META', {
      syncedAt: res.syncedAt,
      nama: res.nama,
      periode: res.periode
    });

    if (statusEl) statusEl.textContent = 'Tersinkron: ' + formatWaktu_(res.syncedAt);

    // Refresh UI (card Wali Kelas/Musrif dkk) SEGERA setelah data tersimpan,
    // SEBELUM modal "Sinkron Berhasil" ditampilkan -- supaya tampilan sudah
    // benar duluan di belakang modal, tidak menunggu user menekan OK
    // (showAlert() di bawah ini baru resolve setelah modal ditutup manual).
    if (typeof onSaved === 'function') {
      try { await onSaved(); } catch (e) { }
    }

    if (!silent) {
      const bagianMapel = res.assignments.length ?
        res.assignments.length + ' kelas/mapel & data siswa tersimpan offline.' :
        'Tidak ada kelas/mapel yang diampu untuk periode ini.';
      const infoWali = wk.isWaliKelas ? '\nData wali kelas tersinkron.' : '';
      const infoHalaqoh = halaqohAssignments.length ?
        '\nData Halaqoh (' + namaHalaqohUnik.length + ' kelompok) & siswanya tersimpan offline.' : '';
      await showAlert('Sinkron berhasil ✓\n' + bagianMapel + infoWali + infoHalaqoh + (res.assignments.length ? '\nSekarang input nilai bisa dilakukan tanpa internet.' : ''), 'Sinkron Berhasil');
    }
  } catch (e) {
    if (!silent) await showAlert('Gagal sinkron: ' + e.message, 'Gagal');
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}
