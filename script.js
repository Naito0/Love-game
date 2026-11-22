// =====================================================
//  FRASES: cámbialas aquí cuando quieras
// =====================================================
const FRASES = {
  sol:      "Eres la luz que ilumina todos mis días ☀️",
  mercurio: "Contigo el tiempo vuela más rápido que Mercurio alrededor del Sol",
  venus:    "Venus es el planeta del amor... pero tú me enamoras más 💗",
  tierra:   "De todos los mundos posibles, mi favorito es el que tengo contigo 🌍",
  luna:     "Te amo de la Tierra a la Luna a pasitos de tortuga 🐢",
  marte:    "Iría hasta Marte solo para traerte una piedrita 🪨",
  jupiter:  "Mi amor por ti es más grande que Júpiter",
  saturno:  "Si fueras un planeta, te pondría un anillo 💍",
  galaxia:  "En todo el universo, te elegiría a ti una y mil veces 🌌",
  fugaz:    "Ya no pido deseos a las estrellas, porque ya te tengo a ti 🌠",
};
const FINAL = {
  emoji: "💖",
  titulo: "Nuestro universo",
  frase: "De todos los universos posibles, en todos te encontraría a ti. Te amo 💖",
};

// =====================================================
//  Datos de cada astro
//  orbita: distancia al Sol (0 a 1) · periodo: segundos por vuelta
//  tam: tamaño relativo · min: tamaño mínimo en píxeles
// =====================================================
const ASTROS = [
  { id: "sol",      nombre: "El Sol",    emoji: "☀️", tam: .28, min: 42 },
  { id: "mercurio", nombre: "Mercurio",  emoji: "🪨", orbita: .26, periodo: 9,  tam: .05,  min: 10 },
  { id: "venus",    nombre: "Venus",     emoji: "💗", orbita: .38, periodo: 14, tam: .08,  min: 14 },
  { id: "tierra",   nombre: "La Tierra", emoji: "🌍", orbita: .52, periodo: 21, tam: .085, min: 16 },
  { id: "luna",     nombre: "La Luna",   emoji: "🌙", padre: "tierra", periodo: 5, tam: .035, min: 9 },
  { id: "marte",    nombre: "Marte",     emoji: "🔴", orbita: .66, periodo: 28, tam: .065, min: 13 },
  { id: "jupiter",  nombre: "Júpiter",   emoji: "🟠", orbita: .81, periodo: 40, tam: .15,  min: 26 },
  { id: "saturno",  nombre: "Saturno",   emoji: "🪐", orbita: .96, periodo: 52, tam: .12,  min: 21 },
  { id: "galaxia",  nombre: "La Galaxia", emoji: "🌌", tam: .42, min: 70 },
];
const TOTAL = Object.keys(FRASES).length;

// =====================================================
//  Referencias al HTML
// =====================================================
const cielo = document.getElementById("cielo");
const ctxCielo = cielo.getContext("2d");
const orbitas = document.getElementById("orbitas");
const ctxOrbitas = orbitas.getContext("2d");
const universo = document.getElementById("universo");
const contador = document.getElementById("contador");
const velo = document.getElementById("velo");
const cartaEmoji = document.getElementById("cartaEmoji");
const cartaTitulo = document.getElementById("cartaTitulo");
const cartaFrase = document.getElementById("cartaFrase");
const cartaCerrar = document.getElementById("cartaCerrar");

// Medidas de la pantalla (se recalculan al girar el teléfono)
let W, H, CX, CY, RX, RY, BASE, DPR;
let estrellas = [];
const descubiertos = new Set();
let abierta = false;
let finalMostrado = false;
let velocidad = 1;          // las órbitas se frenan cuando la carta está abierta
let progresoCorazon = -1;   // constelación del final (-1 = aún no)

// =====================================================
//  Crear los astros como botones
// =====================================================
for (const a of ASTROS) {
  const btn = document.createElement("button");
  const esPlaneta = a.orbita || a.padre;
  btn.className = `astro ${a.id}${esPlaneta ? " planeta" : ""}`;
  btn.setAttribute("aria-label", a.nombre);
  btn.innerHTML = '<span class="visual"></span>';
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tocar(a.id, a.nombre, a.emoji, e.clientX, e.clientY);
  });
  universo.appendChild(btn);
  a.el = btn;
  a.fase = Math.random() * Math.PI * 2; // cada uno empieza en un punto distinto
}

// =====================================================
//  Ajustar tamaños a la pantalla
// =====================================================
function medir() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;

  for (const c of [cielo, orbitas]) {
    c.width = W * DPR;
    c.height = H * DPR;
  }
  ctxCielo.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctxOrbitas.setTransform(DPR, 0, 0, DPR, 0, 0);

  // Centro y radios de las órbitas (elipses)
  CX = W / 2;
  CY = H / 2 + 30;
  RX = W / 2 - 26;
  RY = H / 2 - 100;
  if (RY > RX * 1.55) RY = RX * 1.55;
  if (RY < RX * 0.45) RX = RY / 0.45;
  BASE = Math.min(RX, RY);

  // Tamaño de cada astro
  for (const a of ASTROS) {
    a.s = Math.max(a.min, BASE * a.tam);
    const hit = a.id === "luna" ? 38 : Math.max(a.s + 18, 46);
    a.el.style.setProperty("--s", a.s + "px");
    a.el.style.setProperty("--hit", hit + "px");
  }

  // Posiciones fijas: Sol al centro, galaxia en una esquina
  colocar(ASTROS[0], CX, CY, 5);
  const gal = ASTROS.find((a) => a.id === "galaxia");
  colocar(gal, W - gal.s * 0.55, H - gal.s * 0.55 - 10, 3);

  crearEstrellas();
  dibujarOrbitas();
}

function colocar(a, x, y, z) {
  a.x = x;
  a.y = y;
  a.el.style.transform = `translate(${x}px, ${y}px)`;
  a.el.style.zIndex = z;
}

// =====================================================
//  Cielo estrellado
// =====================================================
function crearEstrellas() {
  const cantidad = Math.min(450, Math.floor((W * H) / 3000));
  estrellas = [];
  for (let i = 0; i < cantidad; i++) {
    estrellas.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.2,
      fase: Math.random() * Math.PI * 2,
      vel: 0.5 + Math.random() * 2,
      color: Math.random() < 0.15 ? "200,210,255" : Math.random() < 0.1 ? "255,210,230" : "255,255,255",
    });
  }
}

function dibujarCielo(t) {
  ctxCielo.clearRect(0, 0, W, H);
  for (const e of estrellas) {
    const brillo = 0.35 + 0.65 * Math.abs(Math.sin(t * e.vel + e.fase));
    ctxCielo.fillStyle = `rgba(${e.color},${brillo})`;
    ctxCielo.beginPath();
    ctxCielo.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctxCielo.fill();
  }
  if (progresoCorazon >= 0) dibujarCorazon();
}

function dibujarOrbitas() {
  ctxOrbitas.clearRect(0, 0, W, H);
  ctxOrbitas.lineWidth = 1;
  for (const a of ASTROS) {
    if (!a.orbita) continue;
    ctxOrbitas.strokeStyle = "rgba(200,180,255,.16)";
    ctxOrbitas.beginPath();
    ctxOrbitas.ellipse(CX, CY, RX * a.orbita, RY * a.orbita, 0, 0, Math.PI * 2);
    ctxOrbitas.stroke();
  }
}

// =====================================================
//  Movimiento de los planetas
// =====================================================
let tiempo = 0;
let ultimo = performance.now();

function animar(ahora) {
  const dt = Math.min((ahora - ultimo) / 1000, 0.05);
  ultimo = ahora;

  // Suaviza el cambio de velocidad
  const objetivo = abierta ? 0.12 : 1;
  velocidad += (objetivo - velocidad) * 0.08;
  tiempo += dt * velocidad;

  for (const a of ASTROS) {
    if (a.orbita) {
      const ang = a.fase + (tiempo * Math.PI * 2) / a.periodo;
      const x = CX + Math.cos(ang) * RX * a.orbita;
      const y = CY + Math.sin(ang) * RY * a.orbita;
      // Si pasa por delante del Sol se dibuja encima; si pasa por detrás, debajo
      colocar(a, x, y, Math.sin(ang) > 0 ? 6 : 4);
    } else if (a.padre) {
      const p = ASTROS.find((b) => b.id === a.padre);
      const r = Math.max(p.s * 1.4, 30);
      const ang = a.fase + (tiempo * Math.PI * 2) / a.periodo;
      colocar(a, p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * 0.6, Math.sin(ang) > 0 ? 7 : 4);
    }
  }

  if (progresoCorazon >= 0 && progresoCorazon < 1) {
    progresoCorazon = Math.min(1, progresoCorazon + dt / 2.5);
  }

  dibujarCielo(ahora / 1000);
  requestAnimationFrame(animar);
}

// =====================================================
//  Estrellas fugaces
// =====================================================
function lanzarFugaz() {
  if (!abierta) {
    const f = document.createElement("button");
    f.className = "fugaz";
    f.setAttribute("aria-label", "Estrella fugaz");

    // Sale por arriba o por un lado y cruza en diagonal
    const desdeIzq = Math.random() < 0.5;
    const x0 = desdeIzq ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5;
    const y0 = Math.random() * H * 0.4;
    const dist = Math.max(W, H) * 0.6;
    const ang = (desdeIzq ? 25 : 155) * (Math.PI / 180) + (Math.random() - 0.5) * 0.4;
    const x1 = x0 + Math.cos(ang) * dist;
    const y1 = y0 + Math.sin(ang) * dist;
    f.style.setProperty("--ang", ang + "rad");

    f.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      tocar("fugaz", "Estrella fugaz", "🌠", e.clientX, e.clientY);
      f.remove();
    });

    document.body.appendChild(f);
    const anim = f.animate(
      [
        { transform: `translate(${x0}px, ${y0}px)`, opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { opacity: 1, offset: 0.8 },
        { transform: `translate(${x1}px, ${y1}px)`, opacity: 0 },
      ],
      { duration: 2200, easing: "linear" }
    );
    anim.onfinish = () => f.remove();
  }
  setTimeout(lanzarFugaz, 2500 + Math.random() * 4000);
}

// =====================================================
//  Al tocar un astro
// =====================================================
function tocar(id, nombre, emoji, x, y) {
  if (abierta) return;
  chispas(x, y);
  if (navigator.vibrate) navigator.vibrate(30);

  descubiertos.add(id);
  const astro = ASTROS.find((a) => a.id === id);
  if (astro) astro.el.classList.add("visto");
  contador.textContent = `${descubiertos.size}/${TOTAL} mensajes descubiertos`;

  abrirCarta(emoji, nombre, FRASES[id]);
}

let abiertaDesde = 0;
function abrirCarta(emoji, titulo, frase) {
  abierta = true;
  abiertaDesde = performance.now();
  document.body.classList.add("abierta");
  cartaEmoji.textContent = emoji;
  cartaTitulo.textContent = titulo;
  escribir(frase);
}

let escribiendo;
function escribir(texto) {
  // Efecto máquina de escribir
  clearInterval(escribiendo);
  const letras = Array.from(texto); // Array.from respeta los emojis
  let i = 0;
  cartaFrase.textContent = "";
  escribiendo = setInterval(() => {
    cartaFrase.textContent += letras[i++];
    if (i >= letras.length) clearInterval(escribiendo);
  }, 35);
}

function cerrarCarta() {
  // En celular, el "click" del mismo toque que abrió la carta cae sobre el velo:
  // se ignora durante el primer medio segundo para que no se cierre sola.
  if (performance.now() - abiertaDesde < 500) return;
  abierta = false;
  document.body.classList.remove("abierta");

  // Cuando descubre todo: constelación de corazón y mensaje final
  if (descubiertos.size >= TOTAL && !finalMostrado) {
    finalMostrado = true;
    progresoCorazon = 0;
    setTimeout(() => abrirCarta(FINAL.emoji, FINAL.titulo, FINAL.frase), 2900);
  }
}
cartaCerrar.addEventListener("click", cerrarCarta);
velo.addEventListener("click", cerrarCarta);

// Corazoncitos que salen del dedo
function chispas(x, y) {
  const iconos = ["💖", "✨", "💕", "⭐"];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement("span");
    c.className = "chispa";
    c.textContent = iconos[i % iconos.length];
    const ang = (i / 8) * Math.PI * 2;
    c.style.left = x + "px";
    c.style.top = y + "px";
    c.style.setProperty("--dx", Math.cos(ang) * 55 + "px");
    c.style.setProperty("--dy", Math.sin(ang) * 55 + "px");
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 950);
  }
}

// =====================================================
//  Constelación en forma de corazón (final)
// =====================================================
function puntosCorazon() {
  const pts = [];
  const n = 26;
  const k = BASE * 0.028;
  const cy = CY - BASE * 0.05;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([CX + x * k, cy - y * k]);
  }
  return pts;
}

function dibujarCorazon() {
  const pts = puntosCorazon();
  const visibles = Math.floor(progresoCorazon * pts.length);

  ctxCielo.strokeStyle = "rgba(255,170,220,.7)";
  ctxCielo.lineWidth = 1.4;
  ctxCielo.shadowColor = "rgba(255,120,200,.9)";
  ctxCielo.shadowBlur = 10;
  ctxCielo.beginPath();
  for (let i = 0; i <= visibles && i < pts.length; i++) {
    i === 0 ? ctxCielo.moveTo(...pts[i]) : ctxCielo.lineTo(...pts[i]);
  }
  if (progresoCorazon >= 1) ctxCielo.closePath();
  ctxCielo.stroke();

  ctxCielo.fillStyle = "#fff";
  for (let i = 0; i <= visibles && i < pts.length; i++) {
    ctxCielo.beginPath();
    ctxCielo.arc(pts[i][0], pts[i][1], 2.2, 0, Math.PI * 2);
    ctxCielo.fill();
  }
  ctxCielo.shadowBlur = 0;
}

// =====================================================
//  Arranque
// =====================================================
window.addEventListener("resize", medir);
medir();
requestAnimationFrame(animar);
setTimeout(lanzarFugaz, 1500);
