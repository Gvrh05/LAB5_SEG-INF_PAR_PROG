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


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

  });

  describe('funcion validateMessage (hardening anti-XSS)', function(){

    function enviar(nombre, mensaje, color) {
      return JSON.parse(val.validateMessage(JSON.stringify({ nombre: nombre, mensaje: mensaje, color: color })));
    }

    it('deberia escapar el nombre que contiene <script>', function(){

      var res = enviar('<script>alert(1)</script>', 'hola', '#ffffff');

      assert.equal(res.nombre.indexOf('<script>') === -1, true);
      assert.equal(res.nombre.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('deberia escapar el texto del mensaje que contiene <script>', function(){

      var res = enviar('Ana', '<script>alert(1)</script>', '#ffffff');

      assert.equal(res.mensaje.indexOf('<script>') === -1, true);
      assert.equal(res.mensaje.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('deberia descartar un color invalido y devolver cadena vacia', function(){

      var res = enviar('Ana', 'hola', '#123; background:red');

      assert.equal(res.color, '');

    });

    it('deberia aceptar un color hex valido', function(){

      var res = enviar('Ana', 'hola', '#a1b2c3');

      assert.equal(res.color, '#a1b2c3');

    });

    it('deberia tratar como texto una URL de imagen a media frase', function(){

      var res = enviar('Ana', 'ver http://image.com/image.jpg en la web', '#ffffff');

      assert.equal(res.mensaje.indexOf('<img') === -1, true);

    });

    it('deberia descartar el payload que no es JSON valido', function(){

      var res = JSON.parse(val.validateMessage('not-json {'));

      assert.equal(res.mensaje, '');

    });

    it('deberia seguir transformando URL de imagen completa en <img>', function(){

      var res = enviar('Ana', 'http://image.com/image.jpg', '#ffffff');

      assert.equal(res.mensaje.indexOf('<img src="http://image.com/image.jpg"') === 0, true);

    });

    it('deberia seguir transformando URL de YouTube en <iframe> embed', function(){

      var res = enviar('Ana', 'https://www.youtube.com/watch?v=qYwlqx-JLok', '#ffffff');

      assert.equal(res.mensaje.indexOf('<iframe') === 0, true);
      assert.equal(res.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1, true);

    });

  });

});







