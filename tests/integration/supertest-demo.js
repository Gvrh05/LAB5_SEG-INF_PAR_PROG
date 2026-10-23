// Demo manual del envio de una solicitud con Supertest a la entrada HTTP real.
// Correr con:  node tests/integration/supertest-demo.js
var request = require('supertest');
var servidor = require('../../server');

// La ruta/metodo HTTP que recibe las peticiones: GET / (sirve el index.html)
request(servidor.app)
  .get('/') //          <- METODO: GET  |  RUTA: /
  .expect(200)
  .end(function (err, res) {
    if (err) {
      console.log('FALLO la solicitud GET /');
      console.log(err.message);
      process.exit(1);
    }
    console.log('=== SOLICITUD ENVIADA CON SUPERTEST A LA ENTRADA REAL ===');
    console.log('Metodo HTTP : GET');
    console.log('Ruta        : /');
    console.log('Estado      : ' + res.status);
    console.log('Content-Type: ' + res.headers['content-type']);
    console.log('El HTML responde el chat       : ' + res.text.includes('Chat Socket.IO UNA'));
    console.log('El HTML responde el historial  : ' + res.text.includes('id="messages"'));
    process.exit(0);
  });
