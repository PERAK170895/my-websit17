// Ganti dengan URL dan API KEY Supabase kamu
const SUPABASE_URL = 'https://ciashuymvwhmfuxqgqlr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXNodXltdndobWZ1eHFncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTQyOTEsImV4cCI6MjA2MzAzMDI5MX0.CfmfbISXd_T941XE0j8pAMqrgCUFa9ocBhuQ3B6gUY8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let daftarStaf = {}; // { nama: kode_akses }
const antrianKeluar = {};

function formatJam(date) {
  return date.toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' });
}

function formatJamWIB(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return isoString;
  }
}

function formatDurasi(ms) {
  const detik = Math.floor(ms / 1000);
  const jam = Math.floor(detik / 3600);
  const menit = Math.floor((detik % 3600) / 60);
  const sisaDetik = detik % 60;
  return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${sisaDetik.toString().padStart(2, '0')}`;
}

function validasiKodeAkses(nama, inputKode) {
  return daftarStaf[nama] === inputKode;
}

function catatKeluar() {
  const nama = document.getElementById('namaStaf').value.trim();
  const kode = document.getElementById('kodeAkses').value.trim();
  if (!nama || !kode) return alert("Pilih nama dan masukkan kode akses!");
  if (!validasiKodeAkses(nama, kode)) return alert("Kode akses salah!");
  if (antrianKeluar[nama]) return alert("Sudah klik 'Keluar'. Tunggu masuk.");
  if (Object.keys(antrianKeluar).length >= 5) return alert("Maksimal 5 orang keluar! Hubungi leader/joker.");

  const jamKeluar = new Date();
  antrianKeluar[nama] = jamKeluar;
  simpanKeluarSementara(nama, jamKeluar);
  tampilkanDaftarKeluar();

  alert(`${nama} keluar pada ${formatJam(jamKeluar)}. Klik 'Masuk' saat kembali.`);
}



async function catatMasuk() {
  const nama = document.getElementById('namaStaf').value.trim();
  if (!nama || !antrianKeluar[nama]) return alert("Pilih nama dan pastikan sudah klik 'Keluar'.");

  const keluar = antrianKeluar[nama];
  const masuk = new Date();
  const durasi = formatDurasi(masuk - keluar);

  const row = document.querySelector("#tabelPresensi tbody").insertRow();
  row.insertCell(0).innerText = nama;
  row.insertCell(1).innerText = formatJam(keluar);
  row.insertCell(2).innerText = formatJam(masuk);
  const durasiCell = row.insertCell(3);
durasiCell.innerText = durasi;

const [jam, menit, detik] = durasi.split(":").map(Number);

if ((jam * 3600 + menit * 60 + detik) > 900) { // 900 detik = 15 menit
  durasiCell.classList.add("durasi-merah");
}


await simpanKeSupabase(nama, masuk, keluar, durasi);
delete antrianKeluar[nama];
await hapusKeluarSementara(nama);

}

function tampilkanDaftarKeluar() {
  const container = document.getElementById("daftarKeluar");
  container.innerHTML = "";

  const entries = Object.entries(antrianKeluar).slice(-7);
  entries.forEach(([nama, jamKeluar]) => {
    const durasi = formatDurasi(new Date() - jamKeluar);
    const el = document.createElement("div");
    el.className = "keluar-item";
    el.textContent = `${nama} - ${durasi}`;
    container.appendChild(el);
  });

  if (entries.length > 0) {
    setTimeout(tampilkanDaftarKeluar, 1000);
  }
}

async function simpanKeSupabase(nama, masuk, keluar, durasi) {
  const { error } = await supabaseClient.from('presensi').insert([
    {
      nama,
      jam_masuk: masuk.toISOString(),
      jam_keluar: keluar.toISOString(),
      durasi
    }
  ]);
  if (error) {
    console.error("Gagal simpan:", error.message);
    alert("Gagal simpan ke Supabase!");
  }
}

function exportToCSV() {
  let csv = "Nama,Jam Keluar,Jam Masuk,Durasi\n";
  document.querySelectorAll("#tabelPresensi tbody tr").forEach(row => {
    const cols = row.querySelectorAll("td");
    csv += Array.from(cols).map(td => td.innerText).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "presensi.csv";
  a.click();
}

window.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("namaStaf");
  select.innerHTML = "<option value=''>-- Pilih Nama --</option>";

  const { data, error } = await supabaseClient.from("staf").select("nama, kode_akses");
  if (error) {
    alert("Gagal ambil staf!");
    return;
  }

  data.forEach(({ nama, kode_akses }) => {
    daftarStaf[nama] = kode_akses;
    const option = document.createElement("option");
    option.value = nama;
    option.textContent = nama;
    select.appendChild(option);
  });

  await loadPresensiDariSupabase();
  await muatKeluarSementara(); // <--- tambahkan ini
updateDigitalClock();


});
async function loadPresensiDariSupabase() {
  const { data, error } = await supabaseClient
    .from("presensi")
    .select("*")
    .order("jam_keluar", { ascending: false });

  if (error) {
    console.error("Gagal ambil data presensi:", error.message);
    return;
  }

  const tbody = document.querySelector("#tabelPresensi tbody");
  tbody.innerHTML = "";

  data.forEach(item => {
    const row = tbody.insertRow();
row.insertCell(0).innerText = item.nama || "-";

// Tanggal dari jam_keluar
const tanggal = new Date(item.jam_keluar).toLocaleDateString("id-ID", {
  day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta"
});
row.insertCell(1).innerText = tanggal;

// Jam keluar & masuk
row.insertCell(2).innerText = formatJamWIB(item.jam_keluar);
row.insertCell(3).innerText = formatJamWIB(item.jam_masuk);

// Durasi
const durasiCell = row.insertCell(4);

    durasiCell.innerText = item.durasi || "-";

    if (item.durasi) {
      const [jam, menit, detik] = item.durasi.split(":").map(Number);
      const totalMenit = jam * 60 + menit + (detik >= 30 ? 1 : 0);

      if (totalMenit > 15) {
        durasiCell.classList.add("durasi-merah");
      }
    }
  }); // <<< penutup .forEach

} // <<< PENUTUP loadPresensiDariSupabase YANG HILANG

async function simpanKeluarSementara(nama, jamKeluar) {
  await supabaseClient.from("keluar_sementara").upsert([
    { nama, jam_keluar: jamKeluar.toISOString() }
  ]);
}

async function hapusKeluarSementara(nama) {
  await supabaseClient.from("keluar_sementara").delete().eq("nama", nama);
}

async function muatKeluarSementara() {
  const { data, error } = await supabaseClient.from("keluar_sementara").select("*");
  if (error) {
    console.error("Gagal ambil daftar keluar sementara:", error.message);
    return;
  }

  data.forEach(({ nama, jam_keluar }) => {
    antrianKeluar[nama] = new Date(jam_keluar);
  });

  tampilkanDaftarKeluar();
}
function updateDigitalClock() {
  const clock = document.getElementById("digitalClock");
  const now = new Date();

  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hari = hariList[now.getDay()];

  const tanggal = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const waktu = now.toLocaleTimeString("id-ID", { hour12: false });

  clock.textContent = `${hari}, ${tanggal} - ${waktu}`;

  setTimeout(updateDigitalClock, 1000);
}
async function bersihkanTabel() {
  const tanggal = document.getElementById("tanggalHapus").value;
  const kodeInput = document.getElementById("kodeAksesHapus").value.trim();

  if (!tanggal || !kodeInput) {
    return alert("Harap isi tanggal dan kode akses.");
  }

  // Cek kode akses admin
  const { data: adminData, error: adminError } = await supabaseClient
    .from("admin")
    .select("*")
    .eq("kode_akses", kodeInput)
    .maybeSingle();

  if (adminError || !adminData) {
    return alert("Kode akses salah atau bukan admin.");
  }

  // Buat rentang waktu dari tanggal tersebut (WIB)
  const awal = new Date(`${tanggal}T00:00:00+07:00`).toISOString();
  const akhir = new Date(`${tanggal}T23:59:59+07:00`).toISOString();

  // Hapus data presensi yang jam_keluar-nya dalam rentang tersebut
  const { error } = await supabaseClient
    .from("presensi")
    .delete()
    .gte("jam_keluar", awal)
    .lte("jam_keluar", akhir);

  if (error) {
    console.error("Gagal menghapus:", error.message);
    alert("Gagal menghapus data!");
  } else {
    alert(`Semua data presensi pada ${tanggal} telah dihapus.`);
    await loadPresensiDariSupabase();
  }
}
