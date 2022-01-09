// Variables iniciales
let carrito = [];
let cantidadDeEntradas = 0;

// Defino clase EntradaCarrito
class EntradaCarrito {
    constructor(entrada, cantidad) {
        this.id = entrada.id;
        this.fechaRecital = entrada.fechaRecital;
        this.ubicacion = entrada.ubicacion;
        this.precio = entrada.precio;
        this.cantidad = cantidad;
    }
}

// Genero en el DOM todas las opciones y la cotizacion del dolar para el formulario tomando los valores del json de entradas
let entradasJSON = [];
let valorCotizacionDolar = 0;

$(document).ready(function () {
    // Obtengo cotizacion del dolar
    cotizacionDolar();

    // Obtengo los distintos tipos de entrada
    obtenerJSON();

    // Genero tabla en el DOM para resumen de compra
    generarTabla();

    // Obtengo el contenido del local storage
    obtenerLocalStorage();

    // Genero evento para finalizar la compra. Al clickear en Finalizar Compra se pide email al usuario y puede confirmar o cancelar
    $("#finalizarCompra").click(() => {
        Swal.fire({
            title: "Para finalizar dejanos tu email",
            text: "Te enviaremos alli toda la informacion necesaria para el retiro de tus entradas",
            icon: 'info',
            input: 'email',
            inputPlaceholder: 'Ingresa tu email',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            background: '#212529',
            color: '#f8f9fa'
        }).then((result) => {
            if (result.isConfirmed) {
                finalizarCompra();
            }
        })
    });
});

// Funcion para generar la tabla de compra en el DOM
function generarTabla() {
    $("#compra").hide();
    $("#compra").append(`<h4 class="text-light">Tu compra:</h4>`);

    $("#compra").append(`<table id="tabla" class="table table-striped table-dark">
                        <thead class="bg-dark">
                            <th>Cantidad</th>
                            <th>Fecha Del Recital</th>
                            <th>Ubicacion</th>
                            <th>Sub-Total US$</th>
                            <th>Sub-Total $</th>
                            <th>Accion</th>
                        </thead>
                        <tbody>
                            
                        </tbody>
                    </table>`);
    $("#compra").fadeIn(2000);
}

function cotizacionDolar() {

    // Se debe usar una extension en el navegador para evitar el error de CORS 
    const URL_COTIZACION = "https://api-dolar-argentina.herokuapp.com/api/dolaroficial";

    $.ajax({
        method: "GET",
        url: URL_COTIZACION,
        success: function (cotizacion) {
            $("#valorCotizacion").prepend(`<p class="text-light text-center">Cotizacion US$: $${cotizacion.venta}</p>`);
            valorCotizacionDolar = cotizacion.venta;
        }
    })
}

// Obtengo JSON de tipos de entrada y llamo a funcion para llenar el formulario
function obtenerJSON() {
    $.getJSON("/js/tiposEntrada.json", function (respuesta, estado) {
        if (estado == "success") {
            entradasJSON = respuesta;
            llenarFormulario();
        }
    });
}

// Lleno el formulario en base a las fechas, ubicaciones y precios disponibles
function llenarFormulario() {
    // Identifico fechas de recital y ubicaciones/precios unicos para que no se repitan en los select
    const fechasRecitalUnicas = [...new Set(entradasJSON.map(entrada => entrada.fechaRecital))];
    const ubicacionesUnicas = [...new Set(entradasJSON.map(entrada => `${entrada.ubicacion} - US$${entrada.precio}`))];

    // Lleno los select con los valores obtenidos
    fechasRecitalUnicas.forEach((fecha, indice) => {
        $("#opcionesFechaRecital").append(`<option value="${indice}">${fecha}</option>`);
    });

    ubicacionesUnicas.forEach((ubicacion, indice) => {
        $("#opcionesUbicacion").append(`<option value="${indice}">${ubicacion}</option>`);
    });
}

function obtenerLocalStorage() {
    // Si el localStorage no esta vacio agrego las entradas al carrito y muestro los totales
    if (localStorage.getItem("Entradas") != null) {
        carrito = JSON.parse(localStorage.getItem("Entradas"));
        $("#totalCompra").fadeIn();
        $("#totalCompra").html(`<p>Total US$: ${calcularTotal()}</p> 
                                <p>Total $: ${(calcularTotal() * valorCotizacionDolar).toFixed(2)}</p>`);
        carrito.forEach(entrada => {
            $("tbody").append(`<tr id="fila${entrada.id}">
                                    <td id="cantidadEntrada${entrada.id}" class="align-middle">${entrada.cantidad}</td>                           
                                    <td class="align-middle">${entrada.fechaRecital}</td>
                                    <td class="align-middle">${entrada.ubicacion + ' - US$' + entrada.precio}</td>
                                    <td id="subTotalDolaresEntrada${entrada.id}" class="align-middle">US$${entrada.cantidad * entrada.precio}</td>
                                    <td id="subTotalPesosEntrada${entrada.id}" class="align-middle">$${(entrada.cantidad * entrada.precio * valorCotizacionDolar).toFixed(2)}</td>
                                    <td> <button id="eliminarEntrada${entrada.id}" class="btn btn-danger">Borrar</button></td>
                                </tr>`)

            // Defino evento para boton de borrar
            $(`#eliminarEntrada${entrada.id}`).click(() => {
                Swal.fire({
                    title: "¿Estas seguro/a de borrar las entradas?",
                    //text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Confirmar',
                    cancelButtonText: 'Cancelar',
                    background: '#212529',
                    color: '#f8f9fa'
                }).then((result) => {
                    if (result.isConfirmed) {
                        eliminarEntrada(entrada.id);
                    }
                })
            });
        });

        // Habilito boton de Finalizar Compra
        $("#finalizarCompra").prop("disabled", false);

    } else {
        // Si el localStorage esta vacio deshabilito el boton de Finalizar Compra
        $("#finalizarCompra").prop("disabled", true);
    }
}

// Reseteo el formulario si el usuario hace click en Cancelar
$("#botonCancelar").click(resetearFormulario);

// Valido formulario al clickear Confirmar en el form
$("#formularioCompra").submit(validarFormulario);

// Funcion para validar el formulario
function validarFormulario(e) {

    e.preventDefault();

    cantidadDeEntradas = parseInt($("#cantidadEntradas").val());
    let opcionFechaRecital = $("#opcionesFechaRecital").val();
    let opcionUbicacion = $("#opcionesUbicacion").val();

    if (!(cantidadDeEntradas > 0)) {
        $("#errorCantidadEntradas").css("margin-top", "-5%");
        $("#errorCantidadEntradas").text("Por favor ingresa un valor numerico mayor a 0");
    } else {
        $("#errorCantidadEntradas").css("margin-top", "0");
        $("#errorCantidadEntradas").text("");
    }

    if (opcionFechaRecital == "-1") {
        $("#errorFechaRecitalVacia").text("Por favor selecciona una fecha para el recital");
    } else {
        $("#errorFechaRecitalVacia").text("");
    }

    if (opcionUbicacion == "-1") {
        $("#errorUbicacionVacia").text("Por favor selecciona una ubicacion");
    } else {
        $("#errorUbicacionVacia").text("");
    }

    if (cantidadDeEntradas > 0 && opcionFechaRecital != "-1" && opcionUbicacion != "-1") {
        let fechaRecitalSeleccionada = $("#opcionesFechaRecital option:selected").text();
        let ubicacionSeleccionada = $("#opcionesUbicacion option:selected").text();

        // Reseteo formulario y cierro el modal
        resetearFormulario();
        $("#modalEntradas").modal("hide");

        // Identifico el tipo de entrada en base a fecha y ubicacion elegidas
        let entradaElegida = identificarEntrada(fechaRecitalSeleccionada, ubicacionSeleccionada);

        // Agrego la entrada al carrito y actualizo el localStorage
        agregarEntradaCarrito(entradaElegida);
        localStorage.setItem("Entradas", JSON.stringify(carrito));

        // Habilito el boton de Finalizar Compra
        $("#finalizarCompra").prop("disabled", false);

        return true;

    } else {
        return false;
    }

}

// Funcion para resetear el formulario
function resetearFormulario() {
    $("#errorCantidadEntradas").text("");
    $("#errorCantidadEntradas").css("margin-top", "0");
    $("#errorFechaRecitalVacia").text("");
    $("#errorUbicacionVacia").text("");
    $("#errorFechaRetiroVacia").text("");
    formularioCompra.reset();
}

// Funcion para identificar la entrada elegida en base a fecha y ubicacion elegidas
function identificarEntrada(fechaRecitalSeleccionada, ubicacionSeleccionada) {
    let entradaIdentificada;
    entradasJSON.forEach(entrada => {
        if (entrada.fechaRecital == fechaRecitalSeleccionada && (entrada.ubicacion + " - US$" + entrada.precio) == ubicacionSeleccionada) {
            entradaIdentificada = entrada;
        }
    });
    return entradaIdentificada;
}

// Funcion para agregar las entradas al carrito. Si ya estaba en el carrito solo suma la cantidad.
function agregarEntradaCarrito(entradaElegida) {
    // Verifico si ya esta en el carrito
    let encontrado = carrito.find(entrada => entrada.id == entradaElegida.id);

    if (encontrado == undefined) {
        let entradaACarrito = new EntradaCarrito(entradaElegida, cantidadDeEntradas);
        carrito.push(entradaACarrito);
        // Toast message confirmando que se agregaron las entradas al carrito
        Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Entradas agregadas con exito',
            position: 'top-right',
            iconColor: 'white',
            color: '#f8f9fa',
            background: '#a5dc86',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });

        $("tbody").fadeIn();

        //Se agrega una nueva fila a la tabla del carrito
        $("tbody").append(`<tr id="fila${entradaElegida.id}">
                                    <td id="cantidadEntrada${entradaElegida.id}" class="align-middle">${cantidadDeEntradas}</td>                           
                                    <td class="align-middle">${entradaElegida.fechaRecital}</td>
                                    <td class="align-middle">${entradaElegida.ubicacion + ' - US$' + entradaElegida.precio}</td>
                                    <td id="subTotalDolaresEntrada${entradaElegida.id}" class="align-middle">US$${cantidadDeEntradas * entradaElegida.precio}</td>
                                    <td id="subTotalPesosEntrada${entradaElegida.id}" class="align-middle">$${(cantidadDeEntradas * entradaElegida.precio * valorCotizacionDolar).toFixed(2)}</td>
                                    <td> <button id="eliminarEntrada${entradaElegida.id}" class="btn btn-danger">Borrar</button></td>
                                </tr>`)

        // Defino evento para boton de borrar. Si el usuario confirma, llamo a la funcion eliminarEntrada
        $(`#eliminarEntrada${entradaElegida.id}`).click(() => {
            Swal.fire({
                title: "¿Estas seguro/a de borrar las entradas?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                background: '#212529',
                color: '#f8f9fa'
            }).then((result) => {
                if (result.isConfirmed) {
                    eliminarEntrada(entradaElegida.id);
                }
            })
        });

    } else {
        //Si ya estaba en el carrito, se obtiene la posicion de la entrada y solo se suma la cantidad y recalcula el subtotal en dolares y pesos
        let posicion = carrito.findIndex(entrada => entrada.id == entradaElegida.id);
        let nuevaCantidad = carrito[posicion].cantidad + cantidadDeEntradas;
        carrito[posicion].cantidad = nuevaCantidad
        $(`#cantidadEntrada${entradaElegida.id}`).html(carrito[posicion].cantidad);
        let nuevoSubTotalDolares = carrito[posicion].precio * nuevaCantidad;
        $(`#subTotalDolaresEntrada${entradaElegida.id}`).html(`US$${nuevoSubTotalDolares}`);
        $(`#subTotalPesosEntrada${entradaElegida.id}`).html(`$${nuevoSubTotalDolares * valorCotizacionDolar}`);

        // Toast message confirmando que se sumaron las entradas
        Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Entradas agregadas con exito',
            position: 'top-right',
            iconColor: 'white',
            color: '#f8f9fa',
            background: '#a5dc86',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
    }

    // Se obtiene el total de la compra
    $("#totalCompra").fadeIn();
    $("#totalCompra").html(`<p>Total US$: ${calcularTotal()}</p> 
                            <p>Total $: ${(calcularTotal() * valorCotizacionDolar).toFixed(2)}</p>`);
}

// Funcion para calcular el total de la compra
function calcularTotal() {
    let total = 0;
    carrito.forEach(entrada => {
        total += entrada.precio * entrada.cantidad;
    });
    return total;
}

// Funcion para elminar entradas individualmente
function eliminarEntrada(idEntrada) {
    // Identifico la entrada a eliminar y lo saco del carrito y de la tabla
    let entradaEliminar = carrito.findIndex(entrada => entrada.id == idEntrada);
    carrito.splice(entradaEliminar, 1);
    $(`#fila${idEntrada}`).remove();

    // Toast message confirmando que se eliminaron las entradas del carrito
    Swal.fire({
        toast: true,
        icon: 'error',
        title: 'Entradas removidas con exito',
        position: 'top-right',
        iconColor: 'white',
        color: '#f8f9fa',
        background: '#dc3545',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
    });

    // Recargo el localStorage y recalculo el total de la compra
    localStorage.setItem("Entradas", JSON.stringify(carrito));
    let nuevoTotal = calcularTotal();

    // Si el total es 0 oculto el total y deshabilito el boton de Finalizar Compra, sino actualizo el valor y me aseguro que quede habilitado
    if (nuevoTotal == 0) {
        $("#totalCompra").fadeOut();
        $("#finalizarCompra").prop("disabled", true);
    } else {
        $("#totalCompra").html(`<p>Total US$: ${calcularTotal()}</p> 
                                                            <p>Total $: ${(calcularTotal() * valorCotizacionDolar).toFixed(2)}</p>`)

        $("#finalizarCompra").prop("disabled", false);
    }
}

// Funcion para finalizar la compra del cliente
function finalizarCompra() {
    // Limpio el localStorage y el carrito
    localStorage.clear();
    carrito = [];

    // Limpio totales
    $("#totalCompra").html(`<p>Total US$: ${calcularTotal()}</p> 
                            <p>Total $: ${calcularTotal() * valorCotizacionDolar}</p>`)
    $("#totalCompra").fadeOut();

    // Limpio la tabla
    $("tbody").fadeOut();
    $("tbody").find("tr").remove();

    Swal.fire({
        background: '#212529',
        color: '#f8f9fa',
        icon: 'success',
        title: 'Listo!',
        text: 'Compra finalizada con exito',
        confirmButtonColor: '#dc3545'
    })

    // Deshabilito el boton de Finalizar Compra
    $("#finalizarCompra").prop("disabled", true);
}
