import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// ------------------------
// Buscar por correo
// ------------------------
async function buscarUsuarioPorCorreo(correo) {
  const q = query(
    collection(db, "usuarios"),
    where("email", "==", correo.toLowerCase().trim()),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    alert("No se encontró usuario con ese correo");
    return;
  }

  snap.forEach((docu) => {
    const uid = docu.id;
    alert(`UID encontrado: ${uid}`);
    document.getElementById("uid").value = uid;
  });
}

// ------------------------
// Cambiar estado
// ------------------------
async function cambiarEstadoUsuario(uid, nuevoEstado) {
  const ref = doc(db, "usuarios", uid);
  await updateDoc(ref, { activo: nuevoEstado });
  alert(`Usuario ${uid} actualizado a activo=${nuevoEstado}`);
}

// ------------------------
// Buscar usuarios activos
// ------------------------
async function buscarUsuariosActivos() {
  const q = query(collection(db, "usuarios"), where("activo", "==", true));
  const snap = await getDocs(q);

  if (snap.empty) {
    alert("No hay usuarios activos");
    return;
  }

  const lista = snap.docs.map((docu) => ({ id: docu.id, ...docu.data() }));
  renderListaUsuarios(lista, "Usuarios activos");
}

// ------------------------
// Buscar usuarios inactivos
// ------------------------
async function buscarUsuariosInactivos() {
  const q = query(collection(db, "usuarios"), where("activo", "==", false));
  const snap = await getDocs(q);

  if (snap.empty) {
    alert("No hay usuarios inactivos");
    return;
  }

  const lista = snap.docs.map((docu) => ({ id: docu.id, ...docu.data() }));
  renderListaUsuarios(lista, "Usuarios inactivos");
}

// ------------------------
// Renderizar lista en tabla
// ------------------------
function renderListaUsuarios(lista, titulo) {
  const contenedor = document.getElementById("resultado");
  contenedor.innerHTML = `<h3>${titulo}</h3>`;

  const tabla = document.createElement("table");
  tabla.border = "1";
  tabla.style.width = "100%";
  tabla.innerHTML = `
    <tr>
      <th>Correo</th>
      <th>UID</th>
      <th>Activo</th>
      <th>Acciones</th>
    </tr>
  `;

  lista.forEach((u) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${u.email}</td>
      <td>${u.id}</td>
      <td>${u.activo ? "Sí" : "No"}</td>
      <td>
        <button onclick="activarUsuarioPorId('${u.id}')">Activar</button>
        <button onclick="desactivarUsuarioPorId('${u.id}')">Desactivar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });

  contenedor.appendChild(tabla);
}

// ------------------------
// Exponer funciones al HTML
// ------------------------
window.buscarPorCorreo = async () => {
  const correo = document.getElementById("correo").value;
  if (!correo) return alert("Debes ingresar un correo");
  await buscarUsuarioPorCorreo(correo);
};

window.activarUsuario = async () => {
  const uid = document.getElementById("uid").value;
  if (!uid) return alert("Debes ingresar un UID");
  await cambiarEstadoUsuario(uid, true);
};

window.desactivarUsuario = async () => {
  const uid = document.getElementById("uid").value;
  if (!uid) return alert("Debes ingresar un UID");
  await cambiarEstadoUsuario(uid, false);
};

window.buscarActivos = async () => {
  await buscarUsuariosActivos();
};

window.buscarInactivos = async () => {
  await buscarUsuariosInactivos();
};

// Acciones directas desde la tabla
window.activarUsuarioPorId = async (uid) => {
  await cambiarEstadoUsuario(uid, true);
};

window.desactivarUsuarioPorId = async (uid) => {
  await cambiarEstadoUsuario(uid, false);
};
