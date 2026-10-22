// Verificacion E2E tarea 4.2: dos clientes socket.io contra node server.js
// Comprueba embeds (img/iframe) y que el texto/nombre con <script> lleguen escapados
// Requiere: node server.js levantado en el puerto 3000
var io = require('socket.io-client');

var URL_SERVIDOR = 'http://localhost:3000';
var EVENTO = 'Evento-Mensaje-Server';

// secuencia de envios y predicados de lo que B debe recibir, en orden
var CASOS = [
  { nombre: 'A', mensaje: 'http://image.com/image.jpg', color: '#123456',
    ok: function (m) { return m.mensaje.indexOf('<img src="http://image.com/image.jpg"') === 0; },
    etiqueta: '(a) imagen -> <img>' },
  { nombre: 'A', mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok', color: '#123456',
    ok: function (m) { return m.mensaje.indexOf('<iframe') === 0 && m.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1; },
    etiqueta: '(b) youtube -> <iframe embed>' },
  { nombre: 'A', mensaje: 'Hola a todos', color: '#123456',
    ok: function (m) { return m.mensaje === 'Hola a todos'; },
    etiqueta: '(c) texto -> sin cambios' },
  { nombre: 'A', mensaje: '<script>alert(1)</script>', color: '#123456',
    ok: function (m) { return m.mensaje === '&lt;script&gt;alert(1)&lt;/script&gt;'; },
    etiqueta: '(d) texto con <script> -> escapado' },
  { nombre: '<script>alert(2)</script>', mensaje: 'adios', color: '#ffffff',
    ok: function (m) { return m.nombre === '&lt;script&gt;alert(2)&lt;/script&gt;' && m.mensaje === 'adios'; },
    etiqueta: '(e) nombre con <script> -> escapado' },
  { nombre: 'A', mensaje: '<script>alert(3)</script> http://image.com/image.jpg bye', color: '#123456',
    ok: function (m) { return m.mensaje.indexOf('<img') === -1 && m.mensaje.indexOf('<script>') === -1; },
    etiqueta: '(f) URL a media frase con script -> texto escapado' },
];

var clienteA = io(URL_SERVIDOR);
var clienteB = io(URL_SERVIDOR);

function salir(codigo) {
  try { clienteA.disconnect(); } catch (e) {}
  try { clienteB.disconnect(); } catch (e) {}
  console.log(codigo === 0 ? 'E2E PASSED' : 'E2E FAILED');
  process.exit(codigo);
}

var conectados = 0;
var indice = 0;
var recibidos = 0;
var fallos = [];

[clienteA, clienteB].forEach(function (c) {
  c.on('connect', function () {
    conectados++;
    if (conectados === 2) {
      // B escucha y valida cada mensaje re-emitido en orden
      clienteB.on(EVENTO, function (msg) {
        var obj = JSON.parse(msg);
        var esperado = CASOS[indice];
        if (!esperado) { return; }
        if (esperado.ok(obj)) {
          console.log('OK  ' + esperado.etiqueta + ' -> ' + String(obj.mensaje).slice(0, 80));
          indice++;
          recibidos++;
          if (recibidos === CASOS.length) { salir(fallos.length ? 1 : 0); }
        } else if (indice === 0 || true) {
          // el orden puede empalmar con eco del cliente A? A no escucha emit propia;
          // si un mensaje no coincide NO se avanza el indice (se ignora)
          console.log('SKIP (indice ' + indice + '): ' + msg.slice(0, 120));
        }
      });
      // A envia la secuencia completa con pausas
      CASOS.forEach(function (caso, i) {
        setTimeout(function () {
          clienteA.emit(EVENTO, JSON.stringify(caso));
        }, i * 250);
      });
    }
  });
});

// control de tiempo: si en 5s no llegaron todos, falla
setTimeout(function () {
  if (recibidos < CASOS.length) {
    console.log('FAIL: solo ' + recibidos + '/' + CASOS.length + ' casos validados');
    salir(1);
  }
}, 5000);
