// app.js

// 1. Estado global y LocalStorage (Para que no se borren al recargar)
const estadoReservas = {
    capacidadMaximaPorDia: 20,
    capacidadPorBloqueHora: 6, // Límite para no saturar cocina
    reservasPorFecha: {
        "2026-04-04": [],
        "2026-04-18": [] 
    }
};

// Cargar datos previos si existen en el navegador
const cargarDatosGuardados = () => {
    const memoria = localStorage.getItem('earthyReservas');
    if (memoria) {
        estadoReservas.reservasPorFecha = JSON.parse(memoria);
    }
};
cargarDatosGuardados();

// 2. Referencias al DOM
const formulario = document.getElementById('formulario-reserva');
const selectFecha = document.getElementById('fecha');
const spanLugares = document.getElementById('lugares-restantes');
const listaReservasDOM = document.getElementById('lista-reservas');

// 3. Lógica central
const obtenerLugaresDisponibles = (fecha) => {
    if (!fecha) return estadoReservas.capacidadMaximaPorDia;
    const reservasDelDia = estadoReservas.reservasPorFecha[fecha];
    const lugaresOcupados = reservasDelDia.reduce((total, reserva) => total + reserva.pax, 0);
    return estadoReservas.capacidadMaximaPorDia - lugaresOcupados;
};

// Nueva función: Verificar disponibilidad por bloque de hora
const obtenerOcupacionPorHora = (fecha, hora) => {
    const reservasDelDia = estadoReservas.reservasPorFecha[fecha];
    return reservasDelDia
        .filter(reserva => reserva.hora === hora) // Filtramos solo los de esa hora
        .reduce((total, reserva) => total + reserva.pax, 0); // Sumamos los pax
};

// 4. Actualizar Interfaz
const actualizarInterfaz = () => {
    const fechaSeleccionada = selectFecha.value;
    if (!fechaSeleccionada) return;

    spanLugares.textContent = obtenerLugaresDisponibles(fechaSeleccionada);
    listaReservasDOM.innerHTML = ''; 
    
    // Ordenamos las reservas por hora para que el chef las vea en orden de llegada
    const reservasOrdenadas = [...estadoReservas.reservasPorFecha[fechaSeleccionada]].sort((a, b) => a.hora.localeCompare(b.hora));
    
    reservasOrdenadas.forEach(reserva => {
        const li = document.createElement('li');
        li.classList.add('item-reserva');
        li.innerHTML = `
            <div>
                <strong>[${reserva.hora}] - ${reserva.nombre}</strong> <br>
                <small>${reserva.tipoCliente} | Alergias: ${reserva.alergias || 'Ninguna'}</small>
            </div>
            <div><strong>${reserva.pax} pax</strong></div>
        `;
        listaReservasDOM.appendChild(li);
    });
};

selectFecha.addEventListener('change', actualizarInterfaz);

// 5. Submit del Formulario
formulario.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const fecha = selectFecha.value;
    const hora = document.getElementById('hora').value; // Capturamos la hora
    const pax = parseInt(document.getElementById('pax').value);
    const tipoCliente = document.getElementById('tipo-cliente').value;
    const alergias = document.getElementById('alergias').value;

    // Validación 1: Capacidad total del día
    const disponiblesTotal = obtenerLugaresDisponibles(fecha);
    if (pax > disponiblesTotal) {
        alert(`⚠️ Lo sentimos. Solo quedan ${disponiblesTotal} lugares para el ${fecha}.`);
        return; 
    }

    // Validación 2: Escalonamiento de cocina (Max 6 por hora)
    const ocupadosEnEsaHora = obtenerOcupacionPorHora(fecha, hora);
    const disponiblesEnEsaHora = estadoReservas.capacidadPorBloqueHora - ocupadosEnEsaHora;
    
    if (pax > disponiblesEnEsaHora) {
        alert(`🔥 Para mantener la calidad del servicio, la cocina ya está al límite a las ${horas}. Solo podemos aceptar ${disponiblesEnEsaHora} personas más en este horario. Por favor elige otra hora.`);
        return;
    }

    const nuevaReserva = {
        id: Date.now(),
        nombre,
        hora, // Guardamos la hora
        pax,
        tipoCliente,
        alergias
    };

    estadoReservas.reservasPorFecha[fecha].push(nuevaReserva);

    // Guardamos en la memoria del navegador
    localStorage.setItem('earthyReservas', JSON.stringify(estadoReservas.reservasPorFecha));

    formulario.reset();
    selectFecha.value = fecha; 
    actualizarInterfaz();
    alert("✅ Reserva confirmada exitosamente.");
});

// 6. Lógica de seguridad para el prototipo (Botón Admin)
const btnAdmin = document.getElementById('btn-admin');
const panelAdmin = document.querySelector('.panel-administracion');

if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        const password = prompt("Ingrese la clave de operaciones:");
        if (password === "Earthy2026") {
            panelAdmin.classList.toggle('visible');
            actualizarInterfaz(); // Refrescamos la lista al abrir el panel
        } else {
            alert("Acceso denegado.");
        }
    });
}

// Inicializar vista al cargar la página si ya hay una fecha seleccionada
actualizarInterfaz();