document.addEventListener('DOMContentLoaded', () => {
    cargarProgreso();
    cargarLogros();
});

function cargarProgreso() {
    fetch('/api/progreso')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            actualizarBarraProgreso(data);
        })
        .catch(error => console.error('Error al cargar el progreso:', error));
}

function cargarLogros() {
    fetch('/api/logros')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const listaLogros = document.getElementById('lista-logros');
            listaLogros.innerHTML = '';
            document.getElementById('total-logros').textContent = data.logros.length;

            data.logros.forEach(logro => {
                const li = document.createElement('li');
                li.classList.add('logro-item');
                li.innerHTML = `
                    <div>
                        <span class="logro-nombre" style="color: black;">${logro.nombre}</span>
                        <p class="logro-descripcion" style="color: black;">${logro.descripcion}</p>
                        <p class="logro-xp" style="color: black;">XP: ${logro.xp}</p>
                    </div>
                    <button class="btn-completar" onclick="completarLogro(${logro.id}, ${logro.xp})">Completar</button>
                `;
                listaLogros.appendChild(li);
            });
        })
        .catch(error => console.error('Error al cargar los logros:', error));
}

function completarLogro(logroId, xp) {
    fetch('/api/progreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logro_id: logroId })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            actualizarBarraProgreso(data);
        })
        .catch(error => console.error('Error al completar el logro:', error));
}

function actualizarBarraProgreso(data) {
    const nivel = data.nivel;
    const xpActual = data.xp_actual;
    const xpSiguienteNivel = data.xp_siguiente_nivel;
    const porcentajeXP = (xpActual / xpSiguienteNivel) * 100;

    document.getElementById('nivel-usuario').textContent = nivel;
    document.getElementById('xp-actual').textContent = xpActual;
    document.getElementById('xp-siguiente-nivel').textContent = xpSiguienteNivel;
    document.getElementById('barra-xp').style.width = `${porcentajeXP}%`;
    document.getElementById('contador-logros').textContent = data.logros_obtenidos.length;
}
