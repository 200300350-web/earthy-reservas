// app.js (Versión Definitiva y Ordenada)

const estadoReservas = {
    capacidadMaximaPorDia: 20,
    capacidadPorBloqueHora: 6, // El límite que salvó a tu cocina
    reservasPorFecha: {
        "2026-04-04": [],
        "2026-04-18": [] 
    }
};

// Cargar memoria con protección anti-errores
const cargarDatosGuardados = () => {
    try {
        const memoria = localStorage.getItem('earthyReservas');
        if (memoria) {
            estadoReservas.reservasPorFecha = JSON.parse(memoria);
        }
    } catch (error) {
        console.log("Memoria limpia iniciada.");
    }
};
cargarDatosGuardados();

const formulario = document.getElementById('formulario-reserva');
const selectFecha = document.getElementById('fecha');
const spanLugares = document.getElementById('lugares-restantes');
const listaReservasDOM = document.getElementById('lista-reservas');

const obtenerLugaresDisponibles = (fecha) => {
    if (!fecha) return estadoReservas.capacidadMaximaPorDia;
    const reservasDelDia = estadoReservas.reservasPorFecha[fecha] || [];
    return estadoReservas.capacidadMaximaPorDia - reservasDelDia.reduce((total, res) => total + res.pax, 0);
};

const obtenerOcupacionPorHora = (fecha, hora) => {
    const reservasDelDia = estadoReservas.reservasPorFecha[fecha] || [];
    return reservasDelDia
        .filter(res => res.hora === hora)
        .reduce((total, res) => total + res.pax, 0);
};

const actualizarInterfaz = () => {
    const fechaSeleccionada = selectFecha.value;
    if (!fechaSeleccionada) return;

    spanLugares.textContent = obtenerLugaresDisponibles(fechaSeleccionada);
    listaReservasDOM.innerHTML = ''; 
    
    // Aquí está la corrección blindada para que no choque con datos viejos
    const reservasOrdenadas = [...estadoReservas.reservasPorFecha[fechaSeleccionada] || []].sort((a, b) => {
        const horaA = a.hora || "00:00";
        const horaB = b.hora || "00:00";
        return horaA.localeCompare(horaB);
    });
    
    reservasOrdenadas.forEach(reserva => {
        const li = document.createElement('li');
        li.classList.add('item-reserva');
        li.innerHTML = `
            <div>
                <strong>[${reserva.hora || 'Sin hora'}] - ${reserva.nombre}</strong> <br>
                <small>${reserva.tipoCliente} | Alergias: ${reserva.alergias || 'Ninguna'}</small>
            </div>
            <div><strong>${reserva.pax} pax</strong></div>
        `;
        listaReservasDOM.appendChild(li);
    });
};

selectFecha.addEventListener('change', actualizarInterfaz);

formulario.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const fecha = selectFecha.value;
    const hora = document.getElementById('hora').value; 
    const pax = parseInt(document.getElementById('pax').value);
    const tipoCliente = document.getElementById('tipo-cliente').value;
    const alergias = document.getElementById('alergias').value;

    // 1. Validación de la capacidad TOTAL del día
    const disponiblesTotal = obtenerLugaresDisponibles(fecha);
    if (pax > disponiblesTotal) {
        alert(`⚠️ Lo sentimos. Solo quedan ${disponiblesTotal} lugares en total para el ${fecha}.`);
        return; 
    }

    // 2. Validación de la capacidad POR HORA (El anti-encamote)
    const ocupadosEnEsaHora = obtenerOcupacionPorHora(fecha, hora);
    const disponiblesEnEsaHora = estadoReservas.capacidadPorBloqueHora - ocupadosEnEsaHora;
    
    if (pax > disponiblesEnEsaHora) {
        alert(`🔥 La cocina está al límite a las ${hora} horas. Solo podemos aceptar ${disponiblesEnEsaHora} personas más en este bloque. Por favor elige otra hora.`);
        return;
    }

    // 3. Si pasa las dos validaciones, se guarda la reserva
    const nuevaReserva = { id: Date.now(), nombre, hora, pax, tipoCliente, alergias };
    estadoReservas.reservasPorFecha[fecha].push(nuevaReserva);

    localStorage.setItem('earthyReservas', JSON.stringify(estadoReservas.reservasPorFecha));

    formulario.reset();
    selectFecha.value = fecha; 
    actualizarInterfaz();
    alert("✅ Reserva confirmada exitosamente.");
});

const btnAdmin = document.getElementById('btn-admin');
const panelAdmin = document.querySelector('.panel-administracion');

if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        const password = prompt("Ingrese la clave de operaciones:");
        if (password === "Earthy2026") {
            panelAdmin.classList.toggle('visible');
            actualizarInterfaz(); 
        } else {
            alert("Acceso denegado.");
        }
    });
}

actualizarInterfaz();