// Ganti dengan URL dan API KEY Supabase kamu
const SUPABASE_URL = 'https://ciashuymvwhmfuxqgqlr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXNodXltdndobWZ1eHFncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTQyOTEsImV4cCI6MjA2MzAzMDI5MX0.CfmfbISXd_T941XE0j8pAMqrgCUFa9ocBhuQ3B6gUY8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  await isiDropdownNama();
  await tampilkanDenda();

  document.getElementById("formDenda").addEventListener("submit", async (e) => {
    e.preventDefault();
    await tambahDenda();
  });

  // Jam digital
  setInterval(() => {
    const now = new Date();
    const jam = now.toLocaleTimeString("id-ID");
    document.getElementById("digitalClock").textContent = jam;
  }, 1000);
});

async function isiDropdownNama() {
  const dropdown = document.getElementById("namaDropdown");
  const { data, error } = await supabaseClient.from("staf").select("nama");

  if (error) return alert("Gagal ambil nama staf");

  dropdown.innerHTML = "<option disabled selected>Pilih Nama</option>";
  data.forEach(({ nama }) => {
    const opt = document.createElement("option");
    opt.value = nama;
    opt.textContent = nama;
    dropdown.appendChild(opt);
  });
}
console.log("Script dimuat");

async function tambahDenda() {
  const kodeAdmin = prompt("Kode akses LEADER / JOKER:");

  // Cek kode akses admin di Supabase
  const { data: adminData, error: adminError } = await supabaseClient
    .from("admin")
    .select("*")
    .eq("kode_akses", kodeAdmin)
    .single(); // karena kita anggap 1 kode unik

  if (adminError || !adminData) {
    alert("Kode akses LEADER / JOKER salah atau tidak ditemukan!");
    return;

  }

  // Kalau valid, lanjutkan proses tambah denda
  const nama = document.getElementById("namaDropdown").value;
  const tanggal = document.getElementById("tanggalDenda").value;
  const ss = document.getElementById("ssDenda").value;
  const nominal = parseInt(document.getElementById("nominalDenda").value) || 0;
  const keterangan = document.getElementById("keteranganDenda").value.trim();

  const { error } = await supabaseClient.from("denda").insert([
    { nama, tanggal, ss_denda: ss, nominal, keterangan }
  ]);

  if (error) {
    alert("Gagal tambah denda!");
    console.error(error);
  } else {
    alert("Denda berhasil ditambahkan oleh admin: " + adminData.nama_admin);
    document.getElementById("formDenda").reset();
    await tampilkanDenda();
  }
  
}


async function tampilkanDenda() {
  document.getElementById("loadingDenda").style.display = "block";

  const { data, error } = await supabaseClient
    .from("denda")
    .select("*")
    .order("tanggal", { ascending: true });

  document.getElementById("loadingDenda").style.display = "none";

  if (error) return alert("Gagal tampilkan data denda");

  const tbody = document.querySelector("#tabelDenda tbody");
  tbody.innerHTML = "";

  let totalNominal = 0;

  data.forEach(({ nama, tanggal, ss_denda, nominal, keterangan }) => {
    totalNominal += nominal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(tanggal).toLocaleDateString("id-ID")}</td>
      <td>${nama}</td>
      <td><a href="${ss_denda}" target="_blank">bukti pelanggaran</a></td>
      <td>$${Number(nominal).toLocaleString("en-US")}</td>
      <td>${keterangan || "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  // Tampilkan total denda
  const totalDendaElem = document.getElementById("totalDenda");
totalDendaElem.textContent = `Total Denda: $${totalNominal.toLocaleString("en-US")}`;
}

