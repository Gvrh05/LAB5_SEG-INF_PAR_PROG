var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  // ============================================================
  // 7.1 Validacion de URLs de Imagenes
  // ============================================================
  describe('7.1 Validacion de URLs de Imagenes (is_valid_url_image)', function(){

    it('deberia validar una URL .jpg con http', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia validar una URL .gif con https', function(){

      assert.equal(val.is_valid_url_image('https://image.com/mifoto.gif'), true);

    });

    it('deberia validar una URL .png', function(){

      assert.equal(val.is_valid_url_image('https://image.com/captura.png'), true);

    });

    it('deberia validar una URL .jpeg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/foto.jpeg'), true);

    });

    it('deberia validar una URL .bmp', function(){

      assert.equal(val.is_valid_url_image('http://image.com/dibujo.bmp'), true);

    });

    it('deberia validar una URL sin esquema http/https', function(){

      assert.equal(val.is_valid_url_image('www.image.com/image.jpg'), true);

    });

    it('deberia rechazar una URL que NO apunta a una imagen', function(){

      assert.equal(val.is_valid_url_image('https://image.com/documento.txt'), false);

    });

    it('deberia rechazar un texto que solo contienene la URL a media frase', function(){

      assert.equal(val.is_valid_url_image('Hoy: http://image.com/image.jpg bye'), false);

    });

    it('deberia rechazar una cadena vacia', function(){

      assert.equal(val.is_valid_url_image(''), false);

    });

  });


  // ============================================================
  // 7.2 Validacion de URLs de Videos (YouTube)
  // ============================================================
  describe('7.2 Validacion de URLs de Videos (is_valid_yt_video)', function(){

    it('deberia validar un link de youtube watch?v=', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia validar un link corto de youtu.be', function(){

      assert.equal(val.is_valid_yt_video('https://youtu.be/9D45xg7hGwk'), true);

    });

    it('deberia validar un link de embed', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/embed/qYwlqx-JLok'), true);

    });

    it('deberia validar un link directo /v/', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/v/qYwlqx-JLok'), true);

    });

    it('deberia validar un link sin https ni www', function(){

      assert.equal(val.is_valid_yt_video('youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia rechazar un video de otra plataforma (vimeo)', function(){

      assert.equal(val.is_valid_yt_video('https://vimeo.com/123456'), false);

    });

    it('deberia rechazar solo texto', function(){

      assert.equal(val.is_valid_yt_video('miren esre video esta bueno'), false);

    });

    it('deberia generar el reproductor embebido con getEmbeddedCode', function(){

      var iframe = val.getEmbeddedCode('https://www.youtube.com/watch?v=qYwlqx-JLok');

      assert.equal(iframe.indexOf('<iframe') === 0, true);
      assert.equal(iframe.indexOf('src="https://www.youtube.com/embed/qYwlqx-JLok"') !== -1, true);
      assert.equal(iframe.indexOf('allowfullscreen') !== -1, true);

    });
  });

  // ============================================================
  // 7.3 Prevencion de Inyeccion de Scripts
  // ============================================================
  describe('7.3 Prevencion de Inyeccion de Scripts', function(){

    it('escapeHtml deberia neutralizar <script> en el mensaje', function(){

      var seguro = val.escapeHtml('<script>alert("xss")</script>');

      assert.equal(seguro.indexOf('<script>') === -1, true);
      assert.equal(seguro.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('escapeHtml deberia escapar comillas y ampersand', function(){

      var seguro = val.escapeHtml('&<>"\'');

      assert.equal(seguro, '&amp;&lt;&gt;&quot;&#39;');

    });

    it('getImageTag deberia eliminar caracteres peligrosos de la URL', function(){

      var tag = val.getImageTag('x"><script>alert(1)</script>');

      assert.equal(tag.indexOf('<script>') === -1, true);

    });

    it('getEmbeddedCode deberia rechazar un ID de video con caracteres peligrosos', function(){

      var media = val.getEmbeddedCode('https://www.youtube.com/watch?v=%22%3E%3Cscript%3Ealert(1)%3C/script%3E');

      assert.equal(media.indexOf('<iframe') === -1, true);

    });

    it('validateMessage deberia bloquear la inyeccion via ID de un video de YouTube', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: 'https://www.youtube.com/watch?v="><script>alert(1)</script>', color: '#ffffff' })));

      assert.equal(res.mensaje.indexOf('<iframe') === -1, true);
      assert.equal(res.mensaje.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('validateMessage deberia bloquear un <script> en el texto del mensaje', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: '<script>alert(1)</script>', color: '#ffffff' })));

      assert.equal(res.mensaje.indexOf('<script>') === -1, true);
      assert.equal(res.mensaje.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('validateMessage deberia bloquear un <script> en el nombre', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: '<script>alert(1)</script>', mensaje: 'hola', color: '#ffffff' })));

      assert.equal(res.nombre.indexOf('<script>') === -1, true);
      assert.equal(res.nombre.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('validateMessage deberia bloquear html en el payload (img onerror)', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: '<img src=x onerror=alert(1)>', color: '#ffffff' })));

      assert.equal(res.mensaje.indexOf('<img') === -1, true);
      assert.equal(res.mensaje.indexOf('onerror') !== -1, true); // queda como texto escapado, no como tag

    });

    it('validateMessage deberia descartar un color invalido', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: 'hola', color: '#123; background:red' })));

      assert.equal(res.color, '');

    });

    it('validateMessage deberia mostrar una URL de imagen completa como <img>', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: 'http://image.com/image.jpg', color: '#ffffff' })));

      assert.equal(res.mensaje.indexOf('<img src="http://image.com/image.jpg"') === 0, true);

    });

    it('validateMessage deberia mostrar una URL de video completa como <iframe embed>', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok', color: '#ffffff' })));

      assert.equal(res.mensaje.indexOf('<iframe') === 0, true);
      assert.equal(res.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1, true);

    });

    it('validateMessage deberia dejar el texto normal sin ningun cambio', function(){

      var res = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Sol', mensaje: 'Hola a todos', color: '#ffffff' })));

      assert.equal(res.mensaje, 'Hola a todos');

    });

    it('validateMessage deberia descartar el payload que NO es JSON', function(){

      // se silencia el log de error esperado para que la salida sea limpia
      var logOriginal = console.log;
      console.log = function () {};
      var res;
      try {
        res = JSON.parse(val.validateMessage('not-json {'));
      } finally {
        console.log = logOriginal;
      }
      assert.equal(res.mensaje, '');

    });

  });

});
