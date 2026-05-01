import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";
console.log("🔥 ADMIN JS CARGADO");

// Función interna para buscar por correo
async function buscarUsuarioPorCorreo(correo) {
  console.log("🔎 Buscando:", correo);
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

// Función interna para cambiar estado
async function cambiarEstadoUsuario(uid, nuevoEstado) {
  const ref = doc(db, "usuarios", uid);
  await updateDoc(ref, { activo: nuevoEstado });
  alert(`Usuario ${uid} actualizado a activo=${nuevoEstado}`);
}

// 👇 Exponer funciones al HTML
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
