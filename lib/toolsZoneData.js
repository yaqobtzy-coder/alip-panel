// ============================================
// TOOLS-ZONE DATA
// Canvas/image tools yang "fun" saja — generator bukti palsu
// (E-KTP, saldo DANA/GoPay, profil/chat WA/TikTok/Discord palsu)
// sengaja TIDAK dimasukkan di sini.
// ============================================
export const CANVAS_TOOLS = {
  basket: {
    name: "Sertifikat Basket",
    reqUrl: "https://api.blckrose.my.id/canvas/basket",
    method: "GET",
    needsApiKey: true,
    params: [{ name: "text", label: "Nama Peserta", type: "text", required: true }]
  },
  cbadminton: {
    name: "Sertifikat Badminton",
    reqUrl: "https://api.blckrose.my.id/canvas/cbadminton",
    method: "GET",
    needsApiKey: true,
    params: [{ name: "text", label: "Nama Penerima", type: "text", required: true }]
  },
  crypto: {
    name: "Crypto Chart Generator",
    reqUrl: "https://api.blckrose.my.id/canvas/crypto",
    method: "GET",
    needsApiKey: false,
    params: [{ name: "symbol", label: "Symbol (BTCUSDT, ETHUSDT, dll)", type: "text", required: true }]
  },
  circle: {
    name: "Circle Foto",
    reqUrl: "https://api.blckrose.my.id/canvas/circle",
    method: "POST",
    fileField: "image",
    needsApiKey: true,
    params: []
  },
  gura: {
    name: "Gura Filter",
    reqUrl: "https://api.blckrose.my.id/canvas/gura",
    method: "POST",
    fileField: "image",
    needsApiKey: true,
    params: []
  },
  cyberspider: {
    name: "Cyber Spider",
    reqUrl: "https://api.blckrose.my.id/canvas/cyberspider",
    method: "POST",
    fileField: "image",
    needsApiKey: true,
    params: [{ name: "text", label: "Teks", type: "text", required: true }]
  },
  fakeml: {
    name: "Fake Mobile Legend",
    reqUrl: "https://api.blckrose.my.id/canvas/fakeml",
    method: "POST",
    fileField: "avatar",
    needsApiKey: true,
    params: [{ name: "nickname", label: "Nickname", type: "text", required: true }]
  },
  fakeffduo: {
    name: "Fake FF Duo",
    reqUrl: "https://api.blckrose.my.id/canvas/fakeffduo",
    method: "GET",
    needsApiKey: true,
    params: [
      { name: "name1", label: "Nama Player 1", type: "text", required: true },
      { name: "name2", label: "Nama Player 2", type: "text", required: true },
      { name: "bg", label: "Background (1-11)", type: "number", required: true }
    ]
  },
  lobyff: {
    name: "Lobby FF",
    reqUrl: "https://api.blckrose.my.id/canvas/lobyff",
    method: "GET",
    needsApiKey: true,
    params: [
      { name: "nickname", label: "Nickname", type: "text", required: true },
      { name: "versi", label: "Versi (1-11)", type: "number", required: true }
    ]
  },
  iqc: {
    name: "IQC Generator",
    reqUrl: "https://api.blckrose.my.id/canvas/iqc",
    method: "GET",
    needsApiKey: false,
    params: [{ name: "teks", label: "Teks", type: "text", required: true }]
  },
  iqcv2: {
    name: "IQC V2 Generator",
    reqUrl: "https://api.blckrose.my.id/canvas/iqc/v2",
    method: "GET",
    needsApiKey: false,
    params: [{ name: "text", label: "Teks", type: "text", required: true }]
  }
};

export const GAMES_DATA = {
  "asah-otak": { name: "Asah Otak", reqUrl: "https://api.blckrose.my.id/game/asahotak", responseType: "text" },
  "cak-lontong": { name: "Cak Lontong", reqUrl: "https://api.blckrose.my.id/game/caklontong", responseType: "text" },
  "family-100": { name: "Family 100", reqUrl: "https://api.blckrose.my.id/game/family100", responseType: "list" },
  "lengkapi-kalimat": { name: "Lengkapi Kalimat", reqUrl: "https://api.blckrose.my.id/game/lengkapikalimat", responseType: "text" },
  "siapakah-aku": { name: "Siapakah Aku", reqUrl: "https://api.blckrose.my.id/game/siapakahaku", responseType: "text" },
  "susun-kata": { name: "Susun Kata", reqUrl: "https://api.blckrose.my.id/game/susunkata", responseType: "text" },
  "tebak-bendera": { name: "Tebak Bendera", reqUrl: "https://api.blckrose.my.id/game/tebakbendera", responseType: "image" },
  "tebak-gambar": { name: "Tebak Gambar", reqUrl: "https://api.blckrose.my.id/game/tebakgambar", responseType: "image-text" },
  "tebak-game": { name: "Tebak Game", reqUrl: "https://api.blckrose.my.id/game/tebakgame", responseType: "image" },
  "tebak-kata": { name: "Tebak Kata", reqUrl: "https://api.blckrose.my.id/game/tebakkata", responseType: "text" },
  "tebak-lagu": { name: "Tebak Lagu", reqUrl: "https://api.blckrose.my.id/game/tebaklagu", responseType: "audio" },
  "tebak-logo": { name: "Tebak Logo", reqUrl: "https://api.blckrose.my.id/game/tebaklogo", responseType: "image" },
  "tebak-makanan": { name: "Tebak Makanan", reqUrl: "https://api.blckrose.my.id/game/tebakmakanan", responseType: "image-text" }
};

export function normalize(str) {
  return String(str).toLowerCase().trim().replace(/\s+/g, " ");
}

export function checkAnswer(userGuess, correctAnswer) {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.some((ans) => normalize(userGuess) === normalize(ans));
  }
  return normalize(userGuess) === normalize(correctAnswer);
}
