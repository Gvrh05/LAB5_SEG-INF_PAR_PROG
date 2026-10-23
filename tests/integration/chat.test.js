// Pruebas de integracion: backend Node.js (server.js) + una-lib (libs/unalib.js)
//
// * Supertest -> para la UNICA ruta HTTP real: GET / (sirve index.html)
// * socket.io-client -> para el evento REAL de envio de mensajes:
//   "Evento-Mensaje-Server" dentro de la conexion (no existe ruta HTTP de mensajes)
// * jest.spyOn -> para verificar que el backend realmente llama a validarMensaje
var request = require('supertest');
var io = require('socket.io-client');
var unalib = require('../../libs/unalib');
var servidor = require('../../server');

var EVENTO = 'Evento-Mensaje-Server';
var clienteA; // emisor
var clienteB; // receptor

// levanta el servidor real en un puerto libre antes de TODAS las pruebas
beforeAll(function (done) {
  servidor.http.listen(0, function () {
    var puerto = servidor.http.address().port;
    var baseURL = 'http://127.0.0.1:' + puerto;
    clienteA = io(baseURL);
    clienteB = io(baseURL);
    // resuelve cuando ambos clientes estan conectados
    var esperando = 2;
    [clienteA, clienteB].forEach(function (c) {
      c.on('connect', function () {
        esperando--;
        if (esperando === 0) { done(); }
      });
    });
  });
});

// cierra conexiones y servidor que abrieron las pruebas
afterAll(function (done) {
  clienteA.disconnect();
  clienteB.disconnect();
  servidor.io.close(function () { done(); });
});

// utilidad: emite el evento real y captura lo que el servidor re-emite
function emitirYEsperar(caso, predicado) {
  return new Promise(function (resolve, reject) {
    var temporizador = setTimeout(function () {
      reject(new Error('el servidor no respondio el evento ' + EVENTO));
    }, 5000);
    function escucha(msg) {
      var obj = JSON.parse(msg);
      if (predicado(obj)) {
        clearTimeout(temporizador);
        clienteB.off(EVENTO, escucha);
        resolve(obj);
      }
    }
    clienteB.on(EVENTO, escucha);
    clienteA.emit(EVENTO, JSON.stringify(caso));
  });
}

// ==============================================================
// Entrada HTTP real (Supertest)
// ==============================================================
describe('Integracion backend: ruta HTTP real GET /', function () {

  it('deberia responder 200 con el HTML del chat', function () {
    return request(servidor.app).get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .then(function (res) {
        expect(res.text).toContain('Chat Socket.IO UNA');
        expect(res.text).toContain('id="messages"');
        expect(res.text).toContain('socket.io');
      });
  });

  it('deberia responder 404 para una ruta que no existe', function () {
    return request(servidor.app).get('/no-existe').expect(404);
  });

});

// ==============================================================
// Entrada real de mensajes: evento de Socket.IO
// ==============================================================
describe('Integracion backend: evento real Evento-Mensaje-Server', function () {

  it('URL de imagen valida -> el backend llama a validarMensaje y re-emitte un <img>', function () {
    var espia = jest.spyOn(unalib, 'validateMessage');
    var antes = espia.mock.calls.length;

    return emitirYEsperar(
      { nombre: 'Integracion', mensaje: 'http://image.com/image.jpg', color: '#ffffff' },
      function (obj) { return obj.mensaje && obj.mensaje.indexOf('<img') === 0; }
    ).then(function (obj) {
      // el backend llamo realmente a validarMensaje de una-lib con el payload
      expect(espia.mock.calls.length).toBeGreaterThan(antes);
      expect(espia.mock.calls[espia.mock.calls.length - 1][0]).toContain('image.jpg');
      expect(obj.mensaje).toContain('<img src="http://image.com/image.jpg"');
      espia.mockRestore();
    });
  });

  it('URL de video de YouTube valida -> el backend re-emitte un <iframe embed>', function () {
    return emitirYEsperar(
      { nombre: 'Integracion', mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok', color: '#ffffff' },
      function (obj) { return obj.mensaje && obj.mensaje.indexOf('<iframe') === 0; }
    ).then(function (obj) {
      expect(obj.mensaje).toContain('src="https://www.youtube.com/embed/qYwlqx-JLok"');
      expect(obj.mensaje).toContain('allowfullscreen');
    });
  });

  it('script inyectado en el mensaje -> la validacion lo sanea (llega escapado)', function () {
    return emitirYEsperar(
      { nombre: 'Integracion', mensaje: '<script>alert(1)</script>', color: '#ffffff' },
      function (obj) { return obj.mensaje && obj.mensaje.indexOf('alert(1)') !== -1; }
    ).then(function (obj) {
      expect(obj.mensaje).not.toContain('<script>');
      expect(obj.mensaje).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  it('script inyectado en el nombre -> la validacion lo escapa tambien', function () {
    return emitirYEsperar(
      { nombre: '<script>alert(1)</script>', mensaje: 'hola', color: '#ffffff' },
      function (obj) { return obj.mensaje === 'hola'; }
    ).then(function (obj) {
      expect(obj.nombre).not.toContain('<script>');
      expect(obj.nombre).toContain('&lt;script&gt;');
    });
  });

  it('payload que no es JSON -> la validacion lo descarta (mensaje vacio)', function () {
    return emitirYEsperar(
      'not-json {',
      function (obj) { return obj.mensaje === ''; }
    ).then(function (obj) {
      expect(obj.mensaje).toBe('');
    });
  });

});
