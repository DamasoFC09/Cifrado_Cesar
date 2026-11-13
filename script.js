// =========================================================
// Cifrado César — SPD
// =========================================================

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = {
    codigo:       document.getElementById('codigo'),
    despl:        document.getElementById('conversion'),
    contador:     document.getElementById('contador'),
    rot:          document.getElementById('rot'),
    alfabeto:     document.querySelector('.alphabet'),
    alfaPlano:    document.getElementById('alfaPlano'),
    alfaCifrado:  document.getElementById('alfaCifrado'),
    resultado:    document.getElementById('resultado'),
    modo:         document.getElementById('modo'),
    btnCifrar:    document.getElementById('btnCifrar'),
    btnDescifrar: document.getElementById('btnDescifrar'),
    btnCopiar:    document.getElementById('btnCopiar'),
    btnUsar:      document.getElementById('btnUsar'),
    btnLimpiar:   document.getElementById('btnLimpiar'),
};

let ultimoResultado = '';
let animacionId = null;

// Módulo que también funciona con números negativos (-1 % 26 → 25)
const mod = (n, m) => ((n % m) + m) % m;

// ---------- Lógica del cifrado ----------

function cesar(texto, desplazamiento) {
    return texto.replace(/[a-z]/gi, (letra) => {
        const base = letra <= 'Z' ? 65 : 97; // mayúscula o minúscula
        return String.fromCharCode(mod(letra.charCodeAt(0) - base + desplazamiento, 26) + base);
    });
}

function leerDesplazamiento() {
    const valor = parseInt(el.despl.value, 10);
    return Number.isNaN(valor) ? null : valor;
}

function procesarCodigo(direccion) {
    const texto = el.codigo.value;
    const despl = leerDesplazamiento();

    if (!texto.trim()) return marcarError(el.codigo);
    if (despl === null) return marcarError(el.despl);

    ultimoResultado = cesar(texto, direccion * despl);

    el.modo.textContent = `${direccion === 1 ? 'Cifrado' : 'Descifrado'} · ROT-${mod(despl, 26)}`;
    el.btnCopiar.disabled = false;
    el.btnUsar.disabled = false;
    el.btnCopiar.textContent = 'Copiar';

    revelar(ultimoResultado);
}

const cifrar = () => procesarCodigo(1);
const descifrar = () => procesarCodigo(-1);

// ---------- Efecto "decodificando" ----------

function letraAleatoria(original) {
    const l = ALFABETO[Math.floor(Math.random() * 26)];
    return original === original.toLowerCase() ? l.toLowerCase() : l;
}

function revelar(textoFinal) {
    cancelAnimationFrame(animacionId);
    el.resultado.classList.remove('is-done');

    const terminar = () => {
        el.resultado.textContent = textoFinal;
        void el.resultado.offsetWidth; // reinicia la animación CSS
        el.resultado.classList.add('is-done');
    };

    if (reducirMovimiento || textoFinal.length > 600) return terminar();

    const duracion = Math.min(900, 250 + textoFinal.length * 18);
    const inicio = performance.now();

    const cuadro = (ahora) => {
        const progreso = Math.min(1, (ahora - inicio) / duracion);
        const visibles = Math.floor(progreso * textoFinal.length);

        let salida = textoFinal.slice(0, visibles);
        for (let i = visibles; i < textoFinal.length; i++) {
            const c = textoFinal[i];
            salida += /[a-z]/i.test(c) ? letraAleatoria(c) : c;
        }
        el.resultado.textContent = salida;

        if (progreso < 1) animacionId = requestAnimationFrame(cuadro);
        else terminar();
    };

    animacionId = requestAnimationFrame(cuadro);
}

// ---------- Interfaz ----------

function marcarError(campo) {
    campo.classList.remove('is-error');
    void campo.offsetWidth;
    campo.classList.add('is-error');
    campo.focus();
    campo.addEventListener('animationend', () => campo.classList.remove('is-error'), { once: true });
}

function crearAlfabeto() {
    const celdas = (fila) => ALFABETO.split('').map((l) => {
        const span = document.createElement('span');
        span.textContent = l;
        fila.appendChild(span);
        return span;
    });
    celdas(el.alfaPlano);
    return celdas(el.alfaCifrado);
}

const celdasCifradas = crearAlfabeto();

function actualizarAlfabeto() {
    const d = mod(leerDesplazamiento() ?? 0, 26);
    celdasCifradas.forEach((span, i) => { span.textContent = ALFABETO[mod(i + d, 26)]; });
    el.rot.textContent = d;

    el.alfabeto.classList.remove('is-changing');
    void el.alfabeto.offsetWidth;
    el.alfabeto.classList.add('is-changing');
}

function actualizarContador() {
    const n = el.codigo.value.length;
    el.contador.textContent = `${n} ${n === 1 ? 'carácter' : 'caracteres'}`;
}

async function copiar() {
    if (!ultimoResultado) return;
    try {
        await navigator.clipboard.writeText(ultimoResultado);
        el.btnCopiar.textContent = '¡Copiado!';
    } catch {
        // Si el navegador bloquea el portapapeles, deja el texto seleccionado
        const rango = document.createRange();
        rango.selectNodeContents(el.resultado);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
        el.btnCopiar.textContent = 'Seleccionado: Ctrl + C';
    }
    setTimeout(() => { el.btnCopiar.textContent = 'Copiar'; }, 1800);
}

function usarComoEntrada() {
    if (!ultimoResultado) return;
    el.codigo.value = ultimoResultado;
    actualizarContador();
    el.codigo.focus();
}

function limpiar() {
    cancelAnimationFrame(animacionId);
    el.codigo.value = '';
    el.resultado.textContent = '';
    el.modo.textContent = '';
    ultimoResultado = '';
    el.btnCopiar.disabled = true;
    el.btnUsar.disabled = true;
    actualizarContador();
    el.codigo.focus();
}

// ---------- Eventos ----------

el.btnCifrar.addEventListener('click', cifrar);
el.btnDescifrar.addEventListener('click', descifrar);
el.btnCopiar.addEventListener('click', copiar);
el.btnUsar.addEventListener('click', usarComoEntrada);
el.btnLimpiar.addEventListener('click', limpiar);

el.codigo.addEventListener('input', actualizarContador);
el.despl.addEventListener('input', actualizarAlfabeto);

document.querySelectorAll('.stepper__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const actual = leerDesplazamiento() ?? 0;
        el.despl.value = actual + Number(btn.dataset.step);
        actualizarAlfabeto();
    });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.shiftKey ? descifrar() : cifrar();
    }
});

// ---------- Inicio ----------

document.getElementById('anio').textContent = new Date().getFullYear();
actualizarAlfabeto();
actualizarContador();
