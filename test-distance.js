// 1. Copy fungsi lo
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 2. Definisi Koordinat Kantor
const OFFICE_LAT = -2.930156;
const OFFICE_LNG = 104.763686;

// 3. Tes dengan koordinat yang SAMA (Harus 0)
const jarakTestSama = haversineDistance(OFFICE_LAT, OFFICE_LNG, OFFICE_LAT, OFFICE_LNG);
console.log("Jarak ke titik yang SAMA (harusnya 0):", jarakTestSama, "meter");

// 4. Tes dengan koordinat yang SEDIKIT BERGESER (Misal bergeser 100 meter)
// Geser sedikit latitude-nya
const jarakTestGeser = haversineDistance(OFFICE_LAT, OFFICE_LNG, -2.931, 104.763686);
console.log("Jarak jika bergeser sedikit:", jarakTestGeser.toFixed(2), "meter");
