import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function registrar() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Usuario registrado"))
    .catch((e) => alert(e.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert("Bienvenido"))
    .catch((e) => alert(e.message));
}

let pedidos = [];

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

  const fecha = document.getElementById("Fecha").value;
  const skus = parseInt(document.getElementById("skus").value);

  if (!fecha || isNaN(skus) || skus < 1) {
    alert("Datos inválidos");
    return;
  }

  const piqueoUnitario = obtenerPiqueoUnitario(skus);
  const piqueoTotal = piqueoUnitario * skus;
  const base = calcularBase(skus);
  const total = piqueoTotal + base;

  await addDoc(collection(db, "pedidos"), {
    uid: user.uid,
    fecha,
    skus,
    piqueoUnitario,
    piqueoTotal,
    base,
    total,
  });

  mostrarFeedback(skus);
  cargarPedidos();

  document.getElementById("skus").value = "";
}

async function cargarPedidos() {
  const user = auth.currentUser;
  if (!user) return; // 🔥 evita error
  const q = query(collection(db, "pedidos"), where("uid", "==", user.uid));

  const snapshot = await getDocs(q);

  pedidos = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  actualizarTabla();
}

function actualizarTabla() {
  const tabla = document.getElementById("tabla-pedidos");
  tabla.innerHTML = "";
  pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Paso 1: Agrupar pedidos por fecha
  const pedidosPorFecha = {};
  pedidos.forEach((pedido, index) => {
    if (!pedidosPorFecha[pedido.fecha]) {
      pedidosPorFecha[pedido.fecha] = [];
    }
    pedidosPorFecha[pedido.fecha].push(pedido);
  });

  const fechasOrdenadas = Object.keys(pedidosPorFecha);

  // Paso 4: Usar esas fechas para recorrer y mostrar los pedidos
  let totalGeneral = 0;
  for (const fecha of fechasOrdenadas) {
    const grupo = pedidosPorFecha[fecha];

    const encabezado = document.createElement("tr");
    encabezado.innerHTML = `<td colspan="6" style="background-color: #eee; font-weight: bold;">${fecha}</td>`;
    tabla.appendChild(encabezado);

    let subTotal = 0;

    grupo
      //.sort((a, b) => b.id - a.id)
      .forEach((p) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
    <td>${p.fecha}</td>
    <td>${p.skus}</td>
    <td>${p.piqueoTotal}<br><small>(${p.piqueoUnitario}x${p.skus})</small></td>
    <td>${p.base}</td>
    <td>${p.total}</td>
    <td><button class="eliminar" onclick="eliminarPedido('${p.id}')">X</button> </td>`;
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
  // mostrar general de dinero
  document.getElementById("total-dia").textContent = totalGeneral;
  const descuento = totalGeneral * 0.145;
  const totalConDescuento = totalGeneral - descuento;
  document.getElementById("total-con-descuento").textContent =
    totalConDescuento.toFixed(2);

  // Mostrar cantidad total de pedidos
  const cantidadPedidosEl = document.getElementById("cantidad-pedidos");
  if (cantidadPedidosEl) {
    cantidadPedidosEl.textContent = pedidos.length;
  }
}

async function eliminarPedido(id) {
  await deleteDoc(doc(db, "pedidos", id));
  cargarPedidos();
}

async function eliminarTodosLosPedidos() {
  const confirmacion = confirm("¿Estás seguro de borrar todos los pedidos?");
  if (!confirmacion) return;

  const user = auth.currentUser;

  if (!user) {
    alert("No hay usuario logueado");
    return;
  }

  const q = query(collection(db, "pedidos"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("No hay pedidos para eliminar");
    return;
  }

  const eliminaciones = snapshot.docs.map((docu) =>
    deleteDoc(doc(db, "pedidos", docu.id)),
  );

  await Promise.all(eliminaciones);

  alert("Todos los pedidos eliminados");

  cargarPedidos();
}

function mostrarFeedback(skus) {
  const feedback = document.getElementById("feedback");

  if (skus <= 10) {
    feedback.textContent = "😊";
  } else if (skus <= 25) {
    feedback.textContent = "😐";
  } else {
    feedback.textContent = "😟";
  }

  feedback.classList.add("mostrar");

  setTimeout(() => {
    feedback.classList.remove("mostrar");
  }, 2000);
}

onAuthStateChanged(auth, (user) => {
  const app = document.getElementById("app");
  const authDiv = document.getElementById("auth");
  const loading = document.getElementById("loading");

  // 👇 primero ocultamos loading
  loading.style.display = "none";

  if (user) {
    authDiv.style.display = "none";
    app.style.display = "block";
    cargarPedidos();
  } else {
    authDiv.style.display = "block";
    app.style.display = "none";
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
