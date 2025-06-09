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

  /* console.log("Fecha:", fecha);
  console.log("SKUs:", skus);
  console.log("Piqueo Unitario:", piqueoUnitario);
  console.log("Piqueo Total:", piqueoTotal);
  console.log("Base:", base);
  console.log("Total del Pedido:", total); */

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
  //console.log("Pedidos actuales:", pedidos);

  actualizarTabla();
}

function actualizarTabla() {
  const tabla = document.getElementById("tabla-pedidos");
  tabla.innerHTML = "";

  const pedidosPorFecha = {};
  pedidos.forEach((pedido, index) => {
    if (!pedidosPorFecha[pedido.fecha]) {
      pedidosPorFecha[pedido.fecha] = [];
    }
    pedidosPorFecha[pedido.fecha].push({ ...pedido, index });
  });

  console.log("Pedidos agrupados por fecha:", pedidosPorFecha);

  let totalGeneral = 0;

  for (const fecha in pedidosPorFecha) {
    const grupo = pedidosPorFecha[fecha];

    //encabezado de dia

    const encabezado = document.createElement("tr");
    encabezado.innerHTML = `<td colspan="6" style="background-color: #eee; font-weight: bold;">${fecha}</td`;
    tabla.appendChild(encabezado);

    let subTotal = 0;

    grupo.forEach((p) => {
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

    const filaSubTotal = document.createElement("tr");
    filaSubTotal.innerHTML = `
  <td colspan="4" style="text-align:right;"><strong>Subtotal del dia: </strong></td>
  <td colspan="2"><strong>$${subTotal}</strong></td>;`;
    tabla.appendChild(filaSubTotal);

    totalGeneral += subTotal;
  }
  // mostrar general

  document.getElementById("total-dia").textContent = totalGeneral;
}

function eliminarPedido(id) {
  console.log("Eliminando el pedido con id:", id);
  pedidos = pedidos.filter((p) => p.id !== id);
  console.log("Pedidos después de eliminar:", pedidos);
  actualizarTabla();
}
