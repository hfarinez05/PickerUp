import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// 💰 Marcar/desmarcar pago por ID (solo identifica, no toca "activo")
window.marcarPago = async (id, pago) => {
  const ref = doc(db, "usuarios", id);
  await updateDoc(ref, { pago });
};

// ✅ Activar/desactivar por ID único
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

// 👉 Buscar usuario por correo
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
        <label style="margin-left:10px;">
          <input
            type="checkbox"
            ${data.pago ? "checked" : ""}
            onchange="marcarPago('${docu.id}', this.checked)"
          />
          Pagó
        </label>
        <div class="acciones">
          <button class="btn-activar" onclick="activarPorId('${docu.id}')">Activar</button>
          <button class="btn-desactivar" onclick="desactivarPorId('${docu.id}')">Desactivar</button>
        </div>
      </li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
};

// 🔎 Ver usuarios activos
window.buscarActivos = async () => {
  const q = query(collection(db, "usuarios"), where("activo", "==", true));
  const snap = await getDocs(q);

  let resultado = "<h4>Usuarios Activos:</h4><ul>";
  snap.forEach((docu) => {
    const data = docu.data();
    resultado += `
      <li class="activo">
        <span>${data.email}</span>
        <label>
          <input
            type="checkbox"
            ${data.pago ? "checked" : ""}
            onchange="marcarPago('${docu.id}', this.checked)"
          />
          Pagó
        </label>
        <div class="acciones">
          <button class="btn-activar" onclick="activarPorId('${docu.id}')">Activar</button>
          <button class="btn-desactivar" onclick="desactivarPorId('${docu.id}')">Desactivar</button>
        </div>
      </li>`;
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
    const data = docu.data();
    resultado += `
      <li class="inactivo">
        <span>${data.email}</span>
        <label>
          <input
            type="checkbox"
            ${data.pago ? "checked" : ""}
            onchange="marcarPago('${docu.id}', this.checked)"
          />
          Pagó
        </label>
        <div class="acciones">
          <button class="btn-activar" onclick="activarPorId('${docu.id}')">Activar</button>
          <button class="btn-desactivar" onclick="desactivarPorId('${docu.id}')">Desactivar</button>
        </div>
      </li>`;
  });
  resultado += "</ul>";

  document.getElementById("resultado").innerHTML = resultado;
};
