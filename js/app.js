import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const claveDia = (f) => {
  const d = f?.toDate ? f.toDate() : new Date(f);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtDia = (k) => {
  const [a, m, d] = k.split("-");
  return `${d}/${m}/${a}`;
};

let pedidos = [];
let registrando = false;
let avisoT;

function aviso(texto, ms = 3500) {
  const el = $("aviso");
  el.textContent = texto;
  clearTimeout(avisoT);
  avisoT = setTimeout(() => (el.textContent = ""), ms);
}

// Doble toque para confirmar (sin cuadros del navegador)
function dobleToque(btn, textoConfirmar, textoNormal) {
  if (btn.classList.contains("sure")) {
    btn.classList.remove("sure");
    btn.textContent = textoNormal;
    return true;
  }
  btn.classList.add("sure");
  btn.textContent = textoConfirmar;
  setTimeout(() => {
    btn.classList.remove("sure");
    btn.textContent = textoNormal;
  }, 3000);
  return false;
}

// -------------------- REGLAS DE CÁLCULO --------------------
function obtenerPiqueoUnitario(skus) {
  if (skus <= 10) return 120;
  if (skus <= 20) return 70;
  if (skus <= 30) return 60;
  if (skus <= 40) return 55;
  if (skus <= 50) return 50;
  return 40;
}
const calcularBase = (skus) => (skus <= 50 ? 1000 : 1200);

// -------------------- AUTENTICACIÓN --------------------
const ERRORES_AUTH = {
  "auth/email-already-in-use": "Este correo ya está registrado.",
  "auth/invalid-email": "Correo inválido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  "auth/network-request-failed": "Error de conexión. Revisa tu internet.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-login-credentials": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
};

async function login(e) {
  e.preventDefault();
  const email = $("email").value.toLowerCase().trim();
  try {
    await signInWithEmailAndPassword(auth, email, $("password").value);
  } catch (err) {
    console.error("Error en login:", err.code);
    aviso(ERRORES_AUTH[err.code] ?? "Error al iniciar sesión.");
  }
}

async function registrar() {
  const email = $("email").value.toLowerCase().trim();
  const password = $("password").value;
  if (!email || !password) {
    aviso("Escribe tu correo y una contraseña.");
    return;
  }

  registrando = true; // evita que onAuthStateChanged lea antes de crear el documento
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        email,
        activo: false,
        admin: false,
      });
    } catch (err) {
      console.error("Error guardando usuario:", err);
      await cred.user.delete().catch(() => {}); // evita un usuario a medias
      aviso("No se pudo completar el registro. Intenta nuevamente.");
      return;
    }
    await auth.signOut();
    $("password").value = "";
    aviso("Registro exitoso. Debe ser habilitado por el administrador.", 8000);
  } catch (err) {
    console.error("Error en registro:", err.code);
    aviso(ERRORES_AUTH[err.code] ?? "Error al registrar usuario.");
  } finally {
    registrando = false;
    mostrarLogin();
  }
}

function mostrarLogin() {
  $("loading").hidden = true;
  $("app").hidden = true;
  $("auth").hidden = false;
}

onAuthStateChanged(auth, async (user) => {
  if (registrando) return;

  if (!user) {
    mostrarLogin();
    return;
  }

  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists() || snap.data().activo !== true) {
      mostrarLogin();
      aviso("Tu cuenta aún no está habilitada por el administrador.", 8000);
      await auth.signOut();
      return;
    }
  } catch (err) {
    console.error("Error leyendo usuario:", err);
    mostrarLogin();
    aviso("No se pudo verificar tu cuenta. Intenta nuevamente.");
    await auth.signOut();
    return;
  }

  $("loading").hidden = true;
  $("auth").hidden = true;
  $("app").hidden = false;
  $("usuario").textContent = user.email;

  try {
    $("porcentaje").value =
      localStorage.getItem(`porcentaje_${user.uid}`) ?? "";
  } catch {
    $("porcentaje").value = "";
  }
  $("fecha").value = hoyISO();
  $("mes").value = hoyISO().slice(0, 7);
  cargar();
});

// -------------------- PEDIDOS --------------------
function consultaMes(uid, mes) {
  const [a, m] = mes.split("-").map(Number);
  return query(
    collection(db, "usuarios", uid, "pedidos"),
    where("fecha", ">=", new Date(a, m - 1, 1)),
    where("fecha", "<", new Date(a, m, 1)),
    orderBy("fecha", "desc"),
  );
}

async function cargar() {
  const user = auth.currentUser;
  const mes = $("mes").value;
  if (!user || !mes) return;
  try {
    const snap = await getDocs(consultaMes(user.uid, mes));
    pedidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    pintar();
  } catch (err) {
    console.error("Error cargando pedidos:", err);
    aviso("No se pudieron cargar los pedidos.");
  }
}

function pintar() {
  const pct = Number($("porcentaje").value) || 0;
  const factor = pct / 100;

  const orden = [];
  const porDia = {};
  pedidos.forEach((p) => {
    const k = claveDia(p.fecha);
    if (!porDia[k]) {
      porDia[k] = [];
      orden.push(k);
    }
    porDia[k].push(p);
  });

  const totalMes = pedidos.reduce((s, p) => s + (Number(p.total) || 0), 0);
  $("tB").textContent = clp(totalMes);
  $("tD").textContent = clp(totalMes * factor);
  $("tN").textContent = clp(totalMes - totalMes * factor);
  $("cant").textContent = pedidos.length;

  $("dias").innerHTML = orden.length
    ? orden
        .map((k) => {
          const grupo = porDia[k];
          const sub = grupo.reduce((s, p) => s + (Number(p.total) || 0), 0);
          return (
            `<section class="card"><h2>${fmtDia(k)}</h2>` +
            grupo
              .map(
                (p) =>
                  `<div class="item"><div><strong>${p.skus} SKUs</strong>` +
                  `<small>${p.piqueoUnitario} × ${p.skus} = ${clp(p.piqueoTotal)} · base ${clp(p.base)}</small></div>` +
                  `<div class="monto">${clp(p.total)}</div>` +
                  `<button type="button" class="del" data-id="${p.id}" aria-label="Eliminar pedido">✕</button></div>`,
              )
              .join("") +
            `<div class="dia"><div><span>Subtotal</span>${clp(sub)}</div>` +
            `<div><span>Descuento (${pct}%)</span>${clp(sub * factor)}</div>` +
            `<div><span>Total</span><strong>${clp(sub - sub * factor)}</strong></div></div></section>`
          );
        })
        .join("")
    : `<section class="card"><p class="vacio">Aún no hay pedidos este mes. Agrega el primero arriba.</p></section>`;
}

async function agregarPedido(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const skus = parseInt($("skus").value, 10);
  const fechaInput = $("fecha").value;
  if (!fechaInput || !(skus >= 1)) {
    aviso("Ingresa una fecha y una cantidad de SKUs de 1 o más.");
    return;
  }

  const [a, m, d] = fechaInput.split("-").map(Number);
  const ahora = new Date();
  const fecha = new Date(
    a,
    m - 1,
    d,
    ahora.getHours(),
    ahora.getMinutes(),
    ahora.getSeconds(),
  );

  const piqueoUnitario = obtenerPiqueoUnitario(skus);
  const piqueoTotal = piqueoUnitario * skus;
  const base = calcularBase(skus);

  const btn = $("agregar");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "usuarios", user.uid, "pedidos"), {
      fecha,
      skus,
      piqueoUnitario,
      piqueoTotal,
      base,
      total: piqueoTotal + base,
    });
    $("skus").value = "";
    $("mes").value = fechaInput.slice(0, 7);
    await cargar();
  } catch (err) {
    console.error("Error guardando pedido:", err);
    aviso("No se pudo guardar el pedido.");
  } finally {
    btn.disabled = false;
  }
}

async function eliminarPedido(btn) {
  if (!dobleToque(btn, "¿Eliminar?", "✕")) return;
  const user = auth.currentUser;
  if (!user) return;
  const id = btn.dataset.id;
  try {
    await deleteDoc(doc(db, "usuarios", user.uid, "pedidos", id));
    pedidos = pedidos.filter((p) => p.id !== id);
    pintar();
  } catch (err) {
    console.error("Error eliminando pedido:", err);
    aviso("No se pudo eliminar el pedido.");
  }
}

async function borrarMes() {
  const mes = $("mes").value;
  const user = auth.currentUser;
  if (!user || !mes) return;
  const [a, m] = mes.split("-");
  if (!dobleToque($("borrarMes"), `¿Borrar todo ${m}/${a}?`, "Borrar mes"))
    return;

  try {
    const snap = await getDocs(consultaMes(user.uid, mes));
    if (snap.empty) {
      aviso("No hay pedidos en este mes.");
      return;
    }
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    pedidos = [];
    pintar();
    aviso("Pedidos del mes eliminados.");
  } catch (err) {
    console.error("Error borrando el mes:", err);
    aviso("No se pudieron eliminar los pedidos.");
  }
}

// -------------------- EVENTOS --------------------
$("formLogin").addEventListener("submit", login);
$("btnRegistrar").addEventListener("click", registrar);
$("formPedido").addEventListener("submit", agregarPedido);
$("btnLogout").addEventListener("click", () => auth.signOut());
$("borrarMes").addEventListener("click", borrarMes);
$("mes").addEventListener("change", () => $("mes").value && cargar());

$("porcentaje").addEventListener("input", () => {
  try {
    const user = auth.currentUser;
    if (user)
      localStorage.setItem(`porcentaje_${user.uid}`, $("porcentaje").value);
  } catch {
    /* sin almacenamiento disponible */
  }
  pintar();
});

$("dias").addEventListener("click", (e) => {
  const btn = e.target.closest(".del");
  if (btn) eliminarPedido(btn);
});
