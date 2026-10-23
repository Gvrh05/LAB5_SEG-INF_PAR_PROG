
// npm install para descargar los paquetes...

// libreriuas
var validation = require('./libs/unalib');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// root: presentar html
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// escuchar una conexion por socket
io.on('connection', function(socket){
  // si se escucha "chat message"
  socket.on('Evento-Mensaje-Server', function(msg){

    msg =  validation.validateMessage(msg);
    // volvemos a emitir el mismo mensaje
    io.emit('Evento-Mensaje-Server', msg);
  });
});

// el servidor escucha solo cuando se ejecuta directo (node server.js);
// al ser requerido por pruebas de integracion, las pruebas controlan listen/close
if (require.main === module) {
  http.listen(port, function(){
    console.log('listening on *:' + port);
  });
}

// exportado para pruebas de integracion (jest + supertest + socket.io-client)
module.exports = { app: app, http: http, io: io };
