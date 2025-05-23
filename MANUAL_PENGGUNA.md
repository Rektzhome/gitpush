# Panduan Pengguna: Manajemen Repositori GitHub

Selamat datang di aplikasi Manajemen Repositori GitHub! Panduan ini akan membantu Anda memahami cara mengkonfigurasi dan menggunakan berbagai fitur yang tersedia untuk mengelola repositori GitHub Anda secara efisien.

## Bagian 1: Konfigurasi Awal

### Token Akses Personal (PAT) GitHub

**Apa itu Personal Access Token (PAT)?**
Personal Access Token (PAT) adalah alternatif penggunaan kata sandi untuk autentikasi ke GitHub saat menggunakan API GitHub atau command line. Token ini berfungsi seperti token OAuth, yang dapat Anda batasi aksesnya (scope) dan cabut kapan saja.

**Mengapa PAT diperlukan?**
Aplikasi ini memerlukan PAT untuk berinteraksi dengan akun GitHub Anda secara aman. Dengan PAT, aplikasi dapat melakukan tindakan atas nama Anda, seperti membuat repositori, membaca konten, dan mengelola branch, tanpa perlu menyimpan kata sandi GitHub Anda.

**Scope yang Direkomendasikan:**
Saat membuat PAT, Anda perlu memberikan scope (cakupan izin) yang sesuai. Untuk fungsionalitas penuh aplikasi ini, scope berikut direkomendasikan:
*   `repo`: Memberikan akses penuh ke repositori publik dan privat Anda. Ini termasuk hak untuk membaca, menulis, mengkloning, dan mendorong perubahan.
*   `delete_repo`: (Opsional, jika Anda ingin dapat menghapus repositori melalui aplikasi ini). Scope ini sangat sensitif, jadi berikan dengan hati-hati.
*   `workflow`: (Opsional, jika Anda berencana untuk mengelola GitHub Actions workflows).

**Cara Membuat PAT:**
1.  Buka halaman pengaturan token akses personal di GitHub: [github.com/settings/tokens](https://github.com/settings/tokens).
2.  Klik tombol "Generate new token".
3.  Pilih "Generate new token (classic)" jika diminta memilih jenis token.
4.  Beri nama token Anda (misalnya, "AplikasiManajemenRepo").
5.  Pilih tanggal kedaluwarsa untuk token Anda.
6.  Pilih scope yang direkomendasikan di atas (`repo`, dan `delete_repo` jika perlu).
7.  Klik "Generate token".
8.  **Penting:** Salin token yang baru dibuat. Anda tidak akan bisa melihatnya lagi setelah meninggalkan halaman ini. Simpan token ini di tempat yang aman.

**Memasukkan Token di Aplikasi:**
Setelah Anda memiliki PAT, Anda perlu memasukkannya ke dalam aplikasi. Biasanya, ini dilakukan pada:
*   **Halaman Autentikasi/Login:** Saat pertama kali menggunakan aplikasi atau jika sesi Anda berakhir.
*   **Pengaturan Profil/Akun:** Jika Anda perlu memperbarui token Anda.
*   Dalam aplikasi ini, masukkan token Anda pada kolom input yang tersedia di bagian atas halaman utama atau pada halaman login jika belum terautentikasi. Token disimpan sementara di browser Anda untuk sesi saat ini dan tidak disimpan secara permanen oleh frontend.

## Bagian 2: Fitur-Fitur Utama

### Membuat Repositori Baru

Fitur ini memungkinkan Anda untuk membuat repositori baru langsung di akun GitHub Anda.
*   **Cara Mengakses:** Klik tombol "Create New Repo" yang biasanya terletak di bagian atas area manajemen repositori.
*   **Input yang Diperlukan:**
    *   **Nama Repositori:** Nama unik untuk repositori baru Anda (misalnya, `proyek-saya-hebat`).
    *   **Deskripsi:** Penjelasan singkat tentang repositori Anda (opsional).
    *   **Visibilitas:** Pilih apakah repositori akan bersifat `Public` (dapat dilihat semua orang) atau `Private` (hanya Anda dan kolaborator yang dapat melihat).
    *   **Inisialisasi README:** (Tergantung implementasi di UI) Beberapa aplikasi mungkin menawarkan opsi untuk menginisialisasi repositori dengan file README.md secara otomatis.

### Mengelola Repositori Anda ("Manage Repositories")

Area utama di mana Anda dapat melihat dan berinteraksi dengan repositori yang telah Anda hubungkan atau buat.

*   **Melihat Daftar Repositori:** Setelah autentikasi, daftar repositori Anda akan ditampilkan dalam bentuk tabel. Informasi yang ditampilkan biasanya meliputi nama lengkap, deskripsi, visibilitas, jumlah bintang, fork, dan bahasa utama.
*   **Mencari Repositori:** Gunakan kolom pencarian untuk memfilter daftar repositori berdasarkan nama atau kata kunci.
*   **Memperbarui Detail Repositori:**
    *   **Cara Mengakses:** Cari repositori yang ingin Anda ubah, lalu klik tombol "Edit" (biasanya ikon pensil) di baris repositori tersebut.
    *   **Detail yang Dapat Diubah:**
        *   **Deskripsi:** Ubah deskripsi repositori Anda.
        *   **Homepage URL:** Tautkan URL situs web proyek Anda.
        *   **Visibilitas:** Ubah antara Public dan Private (perhatikan implikasi dari perubahan ini).
        *   **Fitur Repositori:** Aktifkan atau nonaktifkan fitur seperti *Issues*, *Projects*, dan *Wiki*.
*   **Menghapus Repositori:**
    *   **Cara Mengakses:** Pilih repositori yang ingin dihapus, lalu klik tombol "Delete" (biasanya ikon tong sampah).
    *   **Peringatan Konfirmasi:** Anda akan diminta untuk mengkonfirmasi tindakan ini, seringkali dengan mengetikkan nama repositori. **Hati-hati!** Menghapus repositori adalah tindakan permanen dan tidak dapat diurungkan melalui GitHub.

### Editor README ("README Editor")

Fitur ini memungkinkan Anda untuk melihat dan mengedit file `README.md` dari repositori Anda.
*   **Cara Mengakses:**
    1.  Pilih repositori dari daftar.
    2.  Klik tombol "Readme" (biasanya ikon buku terbuka) pada baris repositori tersebut.
    3.  Pastikan Anda telah memilih branch yang benar jika aplikasi menyediakan pilihan branch untuk editor README.
*   **Penjelasan Editor:**
    *   **Mode Edit:** Area teks di mana Anda dapat menulis atau memodifikasi konten README menggunakan sintaks Markdown.
    *   **Mode Preview (Jika Ada):** Beberapa editor mungkin menawarkan tab atau tombol untuk melihat pratinjau tampilan README setelah di-render.
*   **Menyimpan Perubahan:** Setelah selesai mengedit, klik tombol "Save README". Aplikasi akan mengirimkan perubahan Anda ke GitHub dengan pesan commit yang sesuai.

### Manajemen Branch ("Branch Manager")

Kelola branch-branch di dalam repositori Anda.
*   **Cara Mengakses:** Biasanya terdapat komponen atau tab terpisah bernama "Branch Manager" atau diakses setelah memilih sebuah repositori.
*   **Melihat Daftar Branch:**
    *   Menampilkan semua branch yang ada di repositori yang dipilih.
    *   Branch default (misalnya, `main` atau `master`) biasanya ditandai secara khusus.
*   **Membuat Branch Baru:**
    *   Klik tombol "New Branch" atau sejenisnya.
    *   **Input Nama Branch Baru:** Masukkan nama untuk branch baru Anda (misalnya, `fitur/login-baru` atau `perbaikan/bug-utama`).
    *   **Pemilihan Branch Basis:** Pilih branch yang sudah ada yang akan menjadi dasar (source) untuk branch baru Anda.
*   **Menghapus Branch:**
    *   Setiap branch dalam daftar akan memiliki opsi untuk dihapus (biasanya ikon tong sampah).
    *   Sebuah **dialog konfirmasi** akan muncul untuk mencegah penghapusan yang tidak disengaja. Hati-hati saat menghapus branch, terutama jika branch tersebut belum digabungkan (merged).

### Manajemen Lisensi ("License Manager")

Tambahkan atau perbarui file lisensi untuk proyek Anda.
*   **Cara Mengakses:** Pilih repositori dan branch yang diinginkan. Cari bagian atau tombol "License Manager".
*   **Melihat/Memuat Lisensi yang Ada:**
    *   Jika file lisensi (misalnya, `LICENSE` atau `LICENSE.md`) sudah ada di path yang ditentukan, kontennya akan dimuat ke dalam editor teks.
*   **Membuat/Memperbarui dengan Template:**
    *   **Pilih Mode Template:** Aplikasi akan menyediakan opsi untuk memilih lisensi dari daftar template standar GitHub (misalnya, MIT, Apache 2.0, GPLv3).
    *   **Pemilihan Template:** Pilih template yang diinginkan dari dropdown.
    *   **Penanganan Placeholder:** Konten template akan dimuat. Placeholder umum seperti `[year]` akan otomatis diganti dengan tahun saat ini, dan `[fullname]` (atau `[name of copyright owner]`) akan diganti dengan nama pengguna GitHub Anda atau nama yang Anda konfigurasikan. Anda dapat menyesuaikannya lebih lanjut di editor.
*   **Membuat/Memperbarui dengan Konten Kustom:**
    *   **Pilih Mode Kustom:** Jika Anda memiliki teks lisensi sendiri atau ingin memodifikasi template secara signifikan, gunakan mode ini.
    *   Editor teks akan tersedia untuk Anda menulis atau menempelkan konten lisensi.
*   **Path File Lisensi:**
    *   Anda dapat menentukan nama file dan path untuk lisensi Anda. Secara default, ini biasanya `LICENSE` atau `LICENSE.md` di root repositori. Beberapa proyek mungkin menggunakan `COPYING`.
*   **Menyimpan File Lisensi:** Setelah konten siap, klik tombol "Save License". Ini akan membuat atau memperbarui file lisensi di repositori Anda pada branch yang dipilih.

## Bagian 3: Kloning dan Push Repositori (Sisi Server)

Fitur ini mungkin tersedia jika backend aplikasi dirancang untuk melakukan operasi Git langsung di server tempat aplikasi di-hosting.

*   **Kloning Repositori ke Server:**
    *   **Tujuan:** Fitur ini berguna untuk membuat salinan repositori dari GitHub ke sistem file server. Ini bisa digunakan untuk backup, analisis kode sisi server, atau proses build otomatis.
    *   **Input yang Diperlukan:**
        *   **URL Repositori:** URL lengkap repositori GitHub yang ingin dikloning (misalnya, `https://github.com/user/repo.git`).
        *   **Path Target di Server:** Lokasi di server tempat repositori akan dikloning (misalnya, `/opt/cloned-repos/repo-name`). Pastikan path ini valid dan server memiliki izin tulis.
*   **Push Perubahan dari Server:**
    *   **Kapan Digunakan:** Jika ada perubahan yang dibuat pada salinan repositori di server (misalnya, oleh proses otomatis atau modifikasi manual di server), fitur ini memungkinkan Anda untuk mendorong perubahan tersebut kembali ke repositori GitHub.
    *   **Cara Menggunakan:**
        *   Pilih repositori lokal di server yang ingin Anda sinkronkan.
        *   Tentukan branch remote yang akan menjadi tujuan push.

## Tips Tambahan

*   **Scope Token:** Pastikan PAT Anda memiliki scope yang benar. Jika Anda mengalami error "Forbidden" atau "Not Found" saat melakukan operasi tertentu, periksa kembali scope token Anda.
*   **Keamanan Token:** Jaga kerahasiaan PAT Anda seperti halnya kata sandi. Jangan pernah membagikannya secara publik atau menyimpannya langsung di dalam kode sumber.
*   **Konfirmasi Tindakan Sensitif:** Selalu periksa kembali nama repositori atau branch sebelum melakukan tindakan destruktif seperti penghapusan.
*   **Default Branch:** Perhatikan nama default branch repositori Anda (`main` atau `master`) saat membuat branch baru atau melakukan operasi lain yang bergantung pada branch.

Semoga panduan ini bermanfaat! Jika Anda memiliki pertanyaan lebih lanjut, jangan ragu untuk merujuk ke dokumentasi GitHub atau mencari bantuan dari komunitas.
