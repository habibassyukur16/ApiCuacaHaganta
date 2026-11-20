let fahrenheit = false;
let lokasiTerakhir = null;

const inputKota = document.getElementById("kota");
const tombolCari = document.getElementById("btnCari");
const tombolLokasi = document.getElementById("btnLokasi");
const tombolSatuan = document.getElementById("btnSatuan");
const tombolFavorit = document.getElementById("btnFavorit");

const pesan = document.getElementById("pesan");
const konten = document.getElementById("kontenCuaca");

// Penyimpanan riwayat dan favorit
function bacaStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function simpanStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Terjemahan kode cuaca
function infoCuaca(kode) {
    const daftar = {
        0: ["Cerah", "☀️"],
        1: ["Cerah berawan", "🌤️"],
        2: ["Berawan sebagian", "⛅"],
        3: ["Mendung", "☁️"],
        45: ["Berkabut", "🌫️"],
        48: ["Kabut tebal", "🌫️"],
        51: ["Gerimis ringan", "🌦️"],
        53: ["Gerimis sedang", "🌦️"],
        55: ["Gerimis lebat", "🌧️"],
        61: ["Hujan ringan", "🌧️"],
        63: ["Hujan sedang", "🌧️"],
        65: ["Hujan lebat", "⛈️"],
        71: ["Salju ringan", "❄️"],
        73: ["Salju sedang", "❄️"],
        75: ["Salju lebat", "❄️"],
        80: ["Hujan lokal", "🌦️"],
        81: ["Hujan lokal sedang", "🌧️"],
        82: ["Hujan lokal lebat", "⛈️"],
        95: ["Badai petir", "⛈️"],
        96: ["Badai petir dan hujan es", "⛈️"],
        99: ["Badai petir kuat", "⛈️"]
    };

    return daftar[kode] || ["Tidak diketahui", "🌡️"];
}

// Format suhu
function formatSuhu(nilai) {
    if (nilai === null || nilai === undefined) return "--";

    let hasil = fahrenheit
        ? (nilai * 9 / 5) + 32
        : nilai;

    return Math.round(hasil) + "°";
}

// Format tanggal
function formatTanggal(tanggal) {
    const date = new Date(tanggal + "T12:00:00");

    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short"
    }).format(date);
}

// Format jam
function formatJam(waktu) {
    return waktu ? waktu.split("T")[1] : "--:--";
}

// Pencarian nama kota
async function cariKota(nama) {
    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nama)}&count=1&language=id&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Gagal mencari kota.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("Kota tidak ditemukan!");
    }

    const kota = data.results[0];

    return {
        lat: kota.latitude,
        lon: kota.longitude,
        name: kota.name,
        country: kota.country || ""
    };
}

// Mengambil data cuaca
async function ambilCuaca(lokasi) {

    const params = new URLSearchParams({
        latitude: lokasi.lat,
        longitude: lokasi.lon,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "cloud_cover"
        ].join(","),

        hourly: [
            "temperature_2m",
            "precipitation_probability",
            "weather_code",
            "uv_index"
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "sunrise",
            "sunset",
            "wind_speed_10m_max"
        ].join(","),

        temperature_unit: fahrenheit ? "fahrenheit" : "celsius",
        wind_speed_unit: "kmh",
        timezone: "auto",
        forecast_days: "7"
    });

    const url =
        "https://api.open-meteo.com/v1/forecast?" + params;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Gagal mengambil informasi cuaca.");
    }

    return await response.json();
}

// Fungsi utama
async function tampilkanCuaca(lokasi) {

    tombolCari.disabled = true;
    pesan.textContent = "Sedang mengambil data cuaca...";

    try {

        const data = await ambilCuaca(lokasi);

        lokasiTerakhir = lokasi;

        const sekarang = data.current;
        const harian = data.daily;
        const perJam = data.hourly;

        const info = infoCuaca(sekarang.weather_code);

        // Informasi kota
        document.getElementById("namaKota").textContent =
            lokasi.name + (lokasi.country ? ", " + lokasi.country : "");

        document.getElementById("tanggal").textContent =
            formatTanggal(sekarang.time.split("T")[0]);

        // Cuaca utama
        document.getElementById("deskripsi").textContent =
            info[0];

        document.getElementById("ikonUtama").textContent =
            info[1];

        document.getElementById("suhu").textContent =
            formatSuhu(sekarang.temperature_2m);

        document.getElementById("terasa").textContent =
            "Terasa seperti " + formatSuhu(sekarang.apparent_temperature);

        // Detail cuaca
        document.getElementById("kelembapan").textContent =
            sekarang.relative_humidity_2m + "%";

        document.getElementById("angin").textContent =
            sekarang.wind_speed_10m + " km/h";

        document.getElementById("hujan").textContent =
            sekarang.precipitation + " mm";

        document.getElementById("awan").textContent =
            sekarang.cloud_cover + "%";

        // Mencari jam prakiraan terdekat
        let indexJam = perJam.time.findIndex(
            waktu => waktu >= sekarang.time
        );

        if (indexJam < 0) indexJam = 0;

        const indexUV = Math.min(indexJam, perJam.uv_index.length - 1);

        document.getElementById("uv").textContent =
            perJam.uv_index[indexUV];

        document.getElementById("peluangHujan").textContent =
            perJam.precipitation_probability[indexJam] + "%";

        // Matahari terbit dan terbenam
        document.getElementById("terbit").textContent =
            formatJam(harian.sunrise[0]);

        document.getElementById("terbenam").textContent =
            formatJam(harian.sunset[0]);

        // Prakiraan per jam
        tampilkanPerJam(perJam, indexJam);

        // Prakiraan 7 hari
        tampilkanHarian(harian);

        konten.classList.remove("hidden");
        pesan.textContent = "";

        tombolFavorit.textContent =
            bacaStorage("favorit").some(
                item => item.toLowerCase() === lokasi.name.toLowerCase()
            )
            ? "★ Hapus Favorit"
            : "☆ Tambahkan Favorit";

        simpanRiwayat(lokasi.name);

    } catch (error) {

        pesan.textContent = error.message;
        konten.classList.add("hidden");

    } finally {

        tombolCari.disabled = false;

    }
}

// Prakiraan per jam
function tampilkanPerJam(data, indexMulai) {

    const tempat = document.getElementById("prakiraanJam");

    tempat.replaceChildren();

    const batas = Math.min(indexMulai + 12, data.time.length);

    for (let i = indexMulai; i < batas; i++) {

        const info = infoCuaca(data.weather_code[i]);

        const kartu = document.createElement("div");
        kartu.className = "hour-card";

        kartu.innerHTML = `
            <p>${formatJam(data.time[i])}</p>
            <div class="icon">${info[1]}</div>
            <h3>${formatSuhu(data.temperature_2m[i])}</h3>
            <p>${data.precipitation_probability[i] ?? 0}% hujan</p>
        `;

        tempat.appendChild(kartu);
    }
}

// Prakiraan 7 hari
function tampilkanHarian(data) {

    const tempat = document.getElementById("prakiraanHari");

    tempat.replaceChildren();

    for (let i = 0; i < data.time.length; i++) {

        const info = infoCuaca(data.weather_code[i]);

        const kartu = document.createElement("div");

        kartu.className = "day-card";

        kartu.innerHTML = `
            <div>
                <strong>${formatTanggal(data.time[i])}</strong>
                <p>${info[0]}</p>
            </div>

            <div class="icon">${info[1]}</div>

            <div>
                ${formatSuhu(data.temperature_2m_max[i])}
                /
                ${formatSuhu(data.temperature_2m_min[i])}
            </div>

            <div>
                🌧️ ${data.precipitation_probability_max[i] ?? 0}%
            </div>
        `;

        tempat.appendChild(kartu);
    }
}

// Riwayat kota
function simpanRiwayat(nama) {

    let daftar = bacaStorage("riwayat");

    daftar = daftar.filter(
        item => item.toLowerCase() !== nama.toLowerCase()
    );

    daftar.unshift(nama);

    simpanStorage("riwayat", daftar.slice(0, 5));

    tampilkanRiwayat();
}

function tampilkanRiwayat() {

    const tempat = document.getElementById("daftarTerakhir");

    tempat.replaceChildren();

    bacaStorage("riwayat").forEach(nama => {

        const tombol = document.createElement("button");

        tombol.className = "chip";
        tombol.textContent = nama;

        tombol.addEventListener("click", () => {
            inputKota.value = nama;
            cariDanTampilkan();
        });

        tempat.appendChild(tombol);
    });
}

// Kota favorit
function tampilkanFavorit() {

    const tempat = document.getElementById("daftarFavorit");

    tempat.replaceChildren();

    bacaStorage("favorit").forEach(nama => {

        const tombol = document.createElement("button");

        tombol.className = "chip";
        tombol.textContent = "⭐ " + nama;

        tombol.addEventListener("click", () => {
            inputKota.value = nama;
            cariDanTampilkan();
        });

        tempat.appendChild(tombol);
    });
}

// Tambah / hapus favorit
tombolFavorit.addEventListener("click", () => {

    if (!lokasiTerakhir) return;

    let daftar = bacaStorage("favorit");

    const nama = lokasiTerakhir.name;

    const sudahAda = daftar.some(
        item => item.toLowerCase() === nama.toLowerCase()
    );

    if (sudahAda) {
        daftar = daftar.filter(
            item => item.toLowerCase() !== nama.toLowerCase()
        );
    } else {
        daftar.push(nama);
    }

    simpanStorage("favorit", daftar);

    tampilkanFavorit();

    tombolFavorit.textContent =
        sudahAda ? "☆ Tambahkan Favorit" : "★ Hapus Favorit";
});

// Cari berdasarkan nama
async function cariDanTampilkan() {

    const nama = inputKota.value.trim();

    if (!nama) {
        pesan.textContent = "Masukkan nama kota terlebih dahulu!";
        return;
    }

    try {

        pesan.textContent = "Mencari kota...";

        const lokasi = await cariKota(nama);

        await tampilkanCuaca(lokasi);

    } catch (error) {

        pesan.textContent = error.message;

    }
}

// Tombol cari
tombolCari.addEventListener("click", cariDanTampilkan);

inputKota.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        cariDanTampilkan();
    }
});

// Ganti Celsius / Fahrenheit
tombolSatuan.addEventListener("click", async () => {

    if (!lokasiTerakhir) return;

    fahrenheit = !fahrenheit;

    tombolSatuan.textContent =
        fahrenheit ? "Ubah ke °C" : "Ubah ke °F";

    await tampilkanCuaca(lokasiTerakhir);
});

// Menggunakan lokasi HP
tombolLokasi.addEventListener("click", () => {

    if (!navigator.geolocation) {
        pesan.textContent = "Browser tidak mendukung lokasi.";
        return;
    }

    pesan.textContent = "Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(

        async posisi => {

            const lokasi = {
                lat: posisi.coords.latitude,
                lon: posisi.coords.longitude,
                name: "Lokasi Saya",
                country: ""
            };

            await tampilkanCuaca(lokasi);
        },

        error => {

            pesan.textContent =
                "Lokasi tidak tersedia. Periksa izin lokasi browser.";

        }
    );
});

// Inisialisasi
tampilkanRiwayat();
tampilkanFavorit();