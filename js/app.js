import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function registrar() {
  console.log("👉 INICIANDO REGISTRO");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("📧 EMAIL:", email);
  console.log("🔑 PASSWORD LENGTH:", password?.length);

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      console.log("✔ AUTH OK");

      const user = userCredential.user;

      console.log("🧾 USER CREADO:");
      console.log(user);

      console.log("🆔 UID:", user.uid);
      console.log("📧 USER EMAIL:", user.email);

      try {
        console.log("👉 ANTES DE FIRESTORE (setDoc)");

        const data = {
          activo: false,
          email: user.email.toLowerCase().trim(),
        };

        console.log("📦 DATA A GUARDAR:", data);
        console.log("🔥 EJECUTANDO setDoc...");

        await setDoc(doc(db, "usuarios", user.uid), data);

        console.log("✔ FIRESTORE OK");
        console.log("🎉 USUARIO COMPLETAMENTE REGISTRADO");

        alert(
          "Usuario registrado con éxito. Debe ser habilitado por el administrador.",
        );
      } catch (error) {
        console.error("❌ ERROR EN FIRESTORE");
        console.error("CODE:", error.code);
        console.error("MESSAGE:", error.message);
        console.error("FULL ERROR:", error);

        alert("Usuario creado, pero hubo un error guardando datos.");
      }

      console.log("👉 FIN BLOQUE AUTH SUCCESS");
    })
    .catch((e) => {
      console.error("❌ ERROR EN AUTH");
      console.error("CODE:", e.code);
      console.error("MESSAGE:", e.message);

      alert(e.message);
    });

  console.log("👉 FUNCIÓN REGISTRAR EJECUTADA (FIN SCOPE)");
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert("Bienvenido"))
    .catch((e) => alert(e.message));
}

// -------------------- VARIABLES GLOBALES --------------------
let pedidos = []; // 👈 se declara UNA sola vez aquí
let ultimoDoc = null; // 👈 para paginación

function obtenerPiqueoUnitario(skus) {
  if (skus >= 1 && skus <= 10) return 120;
  else if (skus >= 11 && skus <= 20) return 70;
  else if (skus >= 21 && skus <= 30) return 60;
  else if (skus >= 31 && skus <= 40) return 55;
  else if (skus >= 41 && skus <= 50) return 50;
  else return 40;
}

function calcularBase(skus) {
  return skus <= 50 ? 1000 : 1200;
}

async function agregarPedido() {
  const user = auth.currentUser;
  if (!user) {
    alert("Debes iniciar sesión");
    return;
  }

  const fechaInput = document.getElementById("Fecha").value; // ej: "2026-04-30"
  console.log("Valor crudo del input Fecha:", fechaInput);

  const skus = parseInt(document.getElementById("skus").value);
  if (!fechaInput || isNaN(skus) || skus < 1) {
    alert("Datos inválidos");
    return;
  }

  const [anio, mes, dia] = fechaInput.split("-");
  const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

  if (isNaN(fecha.getTime())) {
    alert("La fecha ingresada no es válida");
    return;
  }

  const ahora = new Date();
  fecha.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());

  const piqueoUnitario = obtenerPiqueoUnitario(skus);
  const piqueoTotal = piqueoUnitario * skus;
  const base = calcularBase(skus);
  const total = piqueoTotal + base;

  console.log("Pedido a guardar:", {
    fecha,
    skus,
    piqueoUnitario,
    piqueoTotal,
    base,
    total,
  });

  await addDoc(collection(db, "usuarios", user.uid, "pedidos"), {
    fecha,
    skus,
    piqueoUnitario,
    piqueoTotal,
    base,
    total,
  });

  mostrarFeedback(skus);
  await cargarPedidosIniciales();
  document.getElementById("skus").value = "";
}

// ✅ Cargar primeros 20 pedidos
async function cargarPedidosIniciales() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "usuarios", user.uid, "pedidos"),
    orderBy("fecha", "desc"),
    limit(20),
  );

  const snapshot = await getDocs(q);
  pedidos = [];

  snapshot.forEach((docu) => {
    const data = docu.data();
    const pedido = { id: docu.id, ...data };
    if (pedido.fecha && typeof pedido.fecha.toDate === "function") {
      pedido.fechaObj = pedido.fecha.toDate();
    }
    pedidos.push(pedido);
  });

  if (!snapshot.empty) {
    ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  actualizarTabla();

  const btn = document.getElementById("btn-cargar-mas");
  btn.style.display = snapshot.size === 20 ? "block" : "none";
}

// ✅ Cargar más pedidos (otros 20)
async function cargarMasPedidos() {
  const user = auth.currentUser;
  if (!user || !ultimoDoc) return;

  const q = query(
    collection(db, "usuarios", user.uid, "pedidos"),
    orderBy("fecha", "desc"),
    startAfter(ultimoDoc),
    limit(20),
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docu) => {
    const data = docu.data();
    const pedido = { id: docu.id, ...data };
    if (pedido.fecha && typeof pedido.fecha.toDate === "function") {
      pedido.fechaObj = pedido.fecha.toDate();
    }
    pedidos.push(pedido);
  });

  if (!snapshot.empty) {
    ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  actualizarTabla();

  const btn = document.getElementById("btn-cargar-mas");
  if (snapshot.size < 20) {
    btn.style.display = "none";
  }
}

function actualizarTabla() {
  const tabla = document.getElementById("tabla-pedidos");
  tabla.innerHTML = "";

  const pedidosPorFecha = {};
  pedidos.forEach((pedido) => {
    let fechaObj;
    if (pedido.fecha && typeof pedido.fecha.toDate === "function") {
      fechaObj = pedido.fecha.toDate(); // Timestamp
    } else {
      fechaObj = new Date(pedido.fecha); // Date
    }
    const fechaStr = fechaObj.toLocaleDateString("es-CL"); // 👈 solo fecha

    if (!pedidosPorFecha[fechaStr]) {
      pedidosPorFecha[fechaStr] = [];
    }
    pedidosPorFecha[fechaStr].push({ ...pedido, fechaObj });
  });

  const fechasOrdenadas = Object.keys(pedidosPorFecha);
  let totalGeneral = 0;

  for (const fecha of fechasOrdenadas) {
    const grupo = pedidosPorFecha[fecha];
    const encabezado = document.createElement("tr");
    encabezado.innerHTML = `<td colspan="6" style="background-color: #eee; font-weight: bold;">${fecha}</td>`;
    tabla.appendChild(encabezado);

    let subTotal = 0;
    grupo.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.fechaObj.toLocaleDateString("es-CL")}</td>
        <td>${p.skus}</td>
        <td>${p.piqueoTotal}<br><small>(${p.piqueoUnitario}x${p.skus})</small></td>
        <td>${p.base}</td>
        <td>${p.total}</td>
        <td><button class="eliminar" onclick="eliminarPedido('${p.id}')">X</button></td>`;
      tabla.appendChild(fila);
      subTotal += p.total;
    });

    const filaResumen = document.createElement("tr");
    filaResumen.innerHTML = `
      <td colspan="3" style="text-align:left; font-style: italic;">Pedidos del día: ${grupo.length}</td>
      <td colspan="3" style="text-align:right;"><strong>Subtotal del día:</strong> $${subTotal}</td>`;
    tabla.appendChild(filaResumen);

    totalGeneral += subTotal;
  }

  document.getElementById("total-dia").textContent = totalGeneral;
  const descuento = totalGeneral * 0.145;
  const totalConDescuento = totalGeneral - descuento;
  document.getElementById("total-con-descuento").textContent =
    totalConDescuento.toFixed(2);

  const cantidadPedidosEl = document.getElementById("cantidad-pedidos");
  if (cantidadPedidosEl) cantidadPedidosEl.textContent = pedidos.length;
}

async function eliminarPedido(id) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await deleteDoc(doc(db, "usuarios", user.uid, "pedidos", id));

    // 👇 en vez de recargar todo, actualizamos el array en memoria
    pedidos = pedidos.filter((p) => p.id !== id);
    actualizarTabla();

    alert("Pedido eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    alert("No se pudo eliminar el pedido");
  }
}

async function eliminarTodosLosPedidos() {
  const confirmacion = confirm("¿Estás seguro de borrar todos los pedidos?");
  if (!confirmacion) return;

  const user = auth.currentUser;
  if (!user) {
    alert("No hay usuario logueado");
    return;
  }

  const q = query(collection(db, "usuarios", user.uid, "pedidos"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("No hay pedidos para eliminar");
    return;
  }

  const eliminaciones = snapshot.docs.map((docu) =>
    deleteDoc(doc(db, "usuarios", user.uid, "pedidos", docu.id)),
  );

  await Promise.all(eliminaciones);

  // 👇 vaciamos el array en memoria y refrescamos tabla
  pedidos = [];
  actualizarTabla();

  alert("Todos los pedidos eliminados");
}

function mostrarFeedback(skus) {
  const feedback = document.getElementById("feedback");
  if (skus <= 10) feedback.textContent = "😊";
  else if (skus <= 25) feedback.textContent = "😐";
  else feedback.textContent = "😟";

  feedback.classList.add("mostrar");
  setTimeout(() => feedback.classList.remove("mostrar"), 2000);
}

onAuthStateChanged(auth, async (user) => {
  const app = document.getElementById("app");
  const authDiv = document.getElementById("auth");
  const loading = document.getElementById("loading");
  const banner = document.getElementById("banner-alert");

  loading.style.display = "none";

  if (user) {
    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists() || snap.data().activo !== true) {
      banner.style.display = "block";
      app.style.display = "none";
      authDiv.style.display = "block";
      await auth.signOut();
      return;
    }

    banner.style.display = "none";
    authDiv.style.display = "none";
    app.style.display = "block";
    cargarPedidosIniciales();
  } else {
    authDiv.style.display = "block";
    app.style.display = "none";
    banner.style.display = "block";
  }
});

function logout() {
  auth.signOut();
}

window.registrar = registrar;
window.login = login;
window.logout = logout;
window.agregarPedido = agregarPedido;
window.eliminarPedido = eliminarPedido;
window.eliminarTodosLosPedidos = eliminarTodosLosPedidos;
window.cargarMasPedidos = cargarMasPedidos;
