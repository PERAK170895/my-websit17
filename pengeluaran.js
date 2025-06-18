// Ganti dengan URL dan API KEY Supabase kamu
const SUPABASE_URL = 'https://ciashuymvwhmfuxqgqlr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXNodXltdndobWZ1eHFncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTQyOTEsImV4cCI6MjA2MzAzMDI5MX0.CfmfbISXd_T941XE0j8pAMqrgCUFa9ocBhuQ3B6gUY8';


const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Element form dan container
const form = document.getElementById('formPengeluaran');
const gambarContainer = document.getElementById('gambarContainer');

// Submit form pengeluaran
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tanggal = document.getElementById('tanggal').value;
  const keterangan = document.getElementById('keterangan').value;
  const file = document.getElementById('buktiGambar').files[0];

  if (!file) return alert('Pilih gambar terlebih dahulu!');

  const fileName = `bukti-${Date.now()}-${file.name}`;
  const { error: uploadError } = await client.storage.from('pengeluaran').upload(fileName, file);
  if (uploadError) return alert('Gagal upload gambar: ' + uploadError.message);

  const bukti_url = `${SUPABASE_URL}/storage/v1/object/public/pengeluaran/${fileName}`;
  const { error: insertError } = await client
    .from('pengeluaran')
    .insert([{ tanggal, keterangan, bukti_url, file_name: fileName }]);

  if (insertError) return alert('Gagal simpan data: ' + insertError.message);

  alert('Berhasil upload dan simpan data!');
  form.reset();
  loadPengeluaran();
});

// Tampilkan semua gambar
async function loadPengeluaran() {
  gambarContainer.innerHTML = 'Memuat...';
  const { data, error } = await client
    .from('pengeluaran')
    .select('*')
    .order('tanggal', { ascending: false });

  if (error || !data) return gambarContainer.innerHTML = 'Gagal memuat data.';

  gambarContainer.innerHTML = '';
  data.forEach((item) => {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '10px';
    div.style.width = '200px';
    div.style.position = 'relative';

    const img = document.createElement('img');
    img.src = item.bukti_url;
    img.alt = item.keterangan;
    img.style.width = '100%';
    img.style.cursor = 'pointer';
    img.title = 'Klik untuk perbesar/kecil';
    img.onclick = () => {
      img.style.width = img.style.width === '100%' ? '500px' : '100%';
    };

    const info = document.createElement('p');
    info.textContent = `${item.tanggal} - ${item.keterangan}`;

    const btnHapus = document.createElement('button');
    btnHapus.textContent = 'Hapus';
    btnHapus.style.position = 'absolute';
    btnHapus.style.top = '5px';
    btnHapus.style.right = '5px';
    btnHapus.style.backgroundColor = '#f44336';
    btnHapus.style.color = 'white';
    btnHapus.style.border = 'none';
    btnHapus.style.padding = '5px 8px';
    btnHapus.style.cursor = 'pointer';

    btnHapus.onclick = () => hapusPengeluaran(item.id, item.file_name);

    div.appendChild(img);
    div.appendChild(info);
    div.appendChild(btnHapus);
    gambarContainer.appendChild(div);
  });
}

// Validasi admin sebelum hapus
async function validasiAdmin() {
  const kode = prompt('Masukkan kode akses admin:');
  if (!kode) return false;

  const { data, error } = await client
    .from('admin')
    .select('*')
    .eq('kode_akses', kode)
    .single();

  if (error || !data) {
    alert('Kode admin salah!');
    return false;
  }

  return true;
}

// Fungsi hapus pengeluaran
async function hapusPengeluaran(id, fileName) {
  const isValid = await validasiAdmin();
  if (!isValid) return;

  const { error: delFileError } = await client.storage
    .from('pengeluaran')
    .remove([fileName]);

  if (delFileError) return alert('Gagal hapus file: ' + delFileError.message);

  const { error: delDataError } = await client
    .from('pengeluaran')
    .delete()
    .eq('id', id);

  if (delDataError) return alert('Gagal hapus data: ' + delDataError.message);

  alert('Berhasil menghapus pengeluaran.');
  loadPengeluaran();
}

// Jalankan saat pertama kali
loadPengeluaran();

function bukaHalamanDenda() {
  // Misalnya, buka halaman denda baru:
  window.location.href = 'denda.html';
}
