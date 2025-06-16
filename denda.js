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

async function tambahDenda() {
  const nama = document.getElementById("namaDropdown").value;
  const tanggal = document.getElementById("tanggalDenda").value;
  const ss = document.getElementById("ssDenda").value;
  const nominal = parseInt(document.getElementById("nominalDenda").value) || 0;

  const { error } = await supabaseClient.from("denda").insert([
    { nama, tanggal, ss_denda: ss, nominal }
  ]);

  if (error) {
    alert("Gagal tambah denda!");
    console.error(error);
  } else {
    alert("Denda berhasil ditambahkan.");
    document.getElementById("formDenda").reset();
    await tampilkanDenda();
  }
}

async function tampilkanDenda() {
  document.getElementById("loadingDenda").style.display = "block";

  const { data, error } = await supabaseClient
    .from("denda")
    .select("*")
    .order("tanggal", { ascending: false });

  document.getElementById("loadingDenda").style.display = "none";

  if (error) return alert("Gagal tampilkan data denda");

  const tbody = document.querySelector("#tabelDenda tbody");
  tbody.innerHTML = "";

  data.forEach(({ nama, tanggal, ss_denda, nominal }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nama}</td>
      <td>${new Date(tanggal).toLocaleDateString("id-ID")}</td>
      <td><a href="${ss_denda}" target="_blank">Lihat SS</a></td>
      <td>Rp ${Number(nominal).toLocaleString("id-ID")}</td>
    `;
    tbody.appendChild(tr);
  });
}