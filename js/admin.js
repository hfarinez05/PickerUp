import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// 🔎 Buscar usuario por correo
async function buscarUsuarioPorCorreo(correo) {
  const q = query(
    collection(db, "usuarios"),
    where("email", "==", correo.toLowerCase().trim()),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    document.getElementById("resultado").innerText =
      "No se encontró usuario con ese correo.";
    return;
  }

  let resultado = "<h4>Usuario encontrado:</h4><ul>";
  snap.forEach((docu) => {
    const data = docu.data();
    resultado += `<li>${data.email} → activo=${data.activo}</li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
}

// 🔄 Actualizar estado (activo/inactivo) por correo
async function actualizarEstadoPorCorreo(correo, nuevoEstado) {
  const q = query(
    collection(db, "usuarios"),
    where("email", "==", correo.toLowerCase().trim()),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    document.getElementById("resultado").innerText =
      "No se encontró usuario con ese correo.";
    return;
  }

  snap.forEach(async (docu) => {
    const ref = doc(db, "usuarios", docu.id);
    await updateDoc(ref, { activo: nuevoEstado });
    document.getElementById("resultado").innerText =
      `Usuario ${correo} actualizado a activo=${nuevoEstado}`;
  });
}

// 👉 Funciones expuestas al HTML
window.buscarPorCorreo = async () => {
  const correo = document.getElementById("correo").value;
  if (!correo) return alert("Debes ingresar un correo");

  const q = query(collection(db, "usuarios"), where("email", "==", correo));
  const snap = await getDocs(q);

  if (snap.empty) {
    document.getElementById("resultado").innerText =
      "No se encontró usuario con ese correo.";
    return;
  }

  let resultado = "<h4>Usuarios encontrados:</h4><ul>";
  snap.forEach((docu) => {
    const data = docu.data();
    const estadoClase = data.activo ? "activo" : "inactivo";
    resultado += `
      <li class="${estadoClase}">
        <span>${data.email} → activo=${data.activo}</span>
        <div class="acciones">
          <button class="btn-activar" onclick="activarPorId('${docu.id}')">Activar</button>
          <button class="btn-desactivar" onclick="desactivarPorId('${docu.id}')">Desactivar</button>
        </div>
      </li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
};

// Funciones para activar/desactivar por ID único
window.activarPorId = async (id) => {
  const ref = doc(db, "usuarios", id);
  await updateDoc(ref, { activo: true });
  alert(`Usuario ${id} activado`);
};

window.desactivarPorId = async (id) => {
  const ref = doc(db, "usuarios", id);
  await updateDoc(ref, { activo: false });
  alert(`Usuario ${id} desactivado`);
};

window.activarUsuario = async () => {
  const correo = document.getElementById("correo").value;
  if (!correo) return alert("Debes ingresar un correo");
  await actualizarEstadoPorCorreo(correo, true);
};

window.desactivarUsuario = async () => {
  const correo = document.getElementById("correo").value;
  if (!correo) return alert("Debes ingresar un correo");
  await actualizarEstadoPorCorreo(correo, false);
};

// 🔎 Ver usuarios activos
// 🔎 Ver usuarios activos
window.buscarActivos = async () => {
  const q = query(collection(db, "usuarios"), where("activo", "==", true));
  const snap = await getDocs(q);

  let resultado = "<h4>Usuarios Activos:</h4><ul>";
  snap.forEach((docu) => {
    resultado += `<li class="activo">${docu.data().email}</li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
};

// 🔎 Ver usuarios inactivos
window.buscarInactivos = async () => {
  const q = query(collection(db, "usuarios"), where("activo", "==", false));
  const snap = await getDocs(q);

  let resultado = "<h4>Usuarios Inactivos:</h4><ul>";
  snap.forEach((docu) => {
    resultado += `<li class="inactivo">${docu.data().email}</li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
};
