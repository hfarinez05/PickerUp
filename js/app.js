let pedidos = [];
try {
  const datosGuardados = JSON.parse(localStorage.getItem("pedidos"));
  if (Array.isArray(datosGuardados)) {
    pedidos = datosGuardados;
  }
} catch (error) {
  console.error("Error al cargar datos:", error);
}

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

function agregarPedido() {
  const fecha = document.getElementById("Fecha").value;

  const skus = parseInt(document.getElementById("skus").value);

  if (!fecha || isNaN(skus) || skus < 1) {
    alert("Por favor ingresa una fecha válida y un número de SKUS mayor a 0");
    return;
  }

  const piqueoUnitario = obtenerPiqueoUnitario(skus);
  const piqueoTotal = piqueoUnitario * skus;
  const base = calcularBase(skus);
  const total = piqueoTotal + base;
  mostrarFeedback(skus);

  if (typeof gtag === "function") {
    gtag("event", "add_to_cart", {
      currency: "USD",
      value: total,
      items: [
        {
          item_name: "Pedido",
          quantity: skus,
          price: piqueoUnitario,
        },
      ],
    });

    // 📊 Evento Google Analytics: pedido agregado
    //if (typeof gtag === "function") {
    //console.log("📊 Evento agregar_pedido disparado", { skus, total });
    // gtag("event", "agregar_pedido", {
    //   skus: skus,
    //   total: total,
    // });
  }

  const nuevoPedido = {
    id: Date.now(),
    fecha,
    skus,
    piqueoUnitario,
    piqueoTotal,
    base,
    total,
  };

  pedidos.push(nuevoPedido);
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
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
    pedidosPorFecha[pedido.fecha].push({ ...pedido, index });
  });

  // Paso 2: Obtener fecha de hoy
  //const hoy = new Date().toISOString().split("T")[0];
  // Paso 3: Sacar las fechas agrupadas Y ordenarlas
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
      .sort((a, b) => b.id - a.id)
      .forEach((p) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
    <td>${p.fecha}</td>
    <td>${p.skus}</td>
    <td>${p.piqueoTotal}<br><small>(${p.piqueoUnitario}x${p.skus})</small></td>
    <td>${p.base}</td>
    <td>${p.total}</td>
    <td><button class="eliminar" onclick="eliminarPedido(${p.id})">X</button> </td>`;
        tabla.appendChild(fila);
        subTotal += p.total;
      });

    // Cantidad de pedidos del día
    /* const filaCantidad = document.createElement("tr");
    filaCantidad.innerHTML = `
      <td colspan="6" style="text-align:right; font-style: italic;">Pedidos del día: ${grupo.length}</td>`;
    tabla.appendChild(filaCantidad);

    // Subtotal del día
    const filaSubTotal = document.createElement("tr");
    filaSubTotal.innerHTML = `
  <td colspan="4" style="text-align:right;"><strong>Subtotal del dia: </strong></td>
  <td colspan="2"><strong>$${subTotal}</strong></td>`;
    filaSubTotal.classList.add("subTotal");
    tabla.appendChild(filaSubTotal); */

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

function eliminarPedido(id) {
  pedidos = pedidos.filter((p) => p.id !== id);
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
  actualizarTabla();
}

function cargarDatosIniciales() {
  actualizarTabla();

  const iconoPapelera = document.getElementById("iconoPapelera");
  iconoPapelera.addEventListener("click", () => {
    if (confirm("¿Estás seguro que quieres eliminar todos los pedidos?")) {
      eliminarTodosLosPedidos();
    }
  });
}
function eliminarTodosLosPedidos() {
  pedidos = [];
  localStorage.removeItem("pedidos");
  actualizarTabla();
}
function mostrarFeedback(skus) {
  const feedback = document.getElementById("feedback");
  if (skus === 9 || skus === 10) {
    feedback.textContent = "😊";
  } else if (skus > 25) {
    feedback.textContent = "😟";
  } else {
    feedback.textContent = "";
    return;
  }

  feedback.classList.add("mostrar");

  setTimeout(() => {
    feedback.classList.remove("mostrar");
  }, 2000); // se oculta luego de 2 segundos
}

// Llamar la función al cargar la página
document.addEventListener("DOMContentLoaded", cargarDatosIniciales);
