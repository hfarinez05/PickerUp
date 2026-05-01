import admin from "firebase-admin";

// Inicializar Admin SDK con tu clave
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

async function syncUsuarios() {
  try {
    // Listar todos los usuarios de Auth
    const listUsersResult = await admin.auth().listUsers();

    for (const user of listUsersResult.users) {
      const uid = user.uid;
      const email = user.email;

      const userRef = db.collection("usuarios").doc(uid);

      // Actualizar/agregar campos email y activo
      await userRef.set(
        {
          email: email || null, // 👈 guarda el correo si existe
          activo: false, // 👈 inicializa todos en false
        },
        { merge: true }, // merge para no borrar otros campos
      );

      console.log(
        `Usuario ${uid} actualizado con email=${email}, activo=false`,
      );
    }

    console.log("✅ Sincronización completa");
  } catch (error) {
    console.error("Error al sincronizar usuarios:", error);
  }
}

syncUsuarios();
