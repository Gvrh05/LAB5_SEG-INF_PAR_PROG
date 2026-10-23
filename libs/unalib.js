// modulo UNALib: validaciones para el chat (prevencion de inyeccion de scripts)

// constantes de validacion (expresiones regulares)
var RE_IMAGEN = /^(https?:\/\/)?[^\s"'<>]+\.(?:jpg|jpeg|gif|png|bmp)$/i;
var RE_YT = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
var RE_YT_ID = /^[A-Za-z0-9_-]{1,11}$/;
var RE_COLOR = /^#[0-9A-Fa-f]{3,8}$/;

module.exports = {

    // convierte los caracteres peligrosos a entidades HTML para que el
    // mensaje nunca se renderice como codigo ejecutable en el cliente
    escapeHtml: function (texto) {
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // valida que el color sea un hex corto (#abc) o largo (#a1b2c3...)
    isValidColor: function (color) {
        // inicializacion lazy
        var isValid = false;

        try {
            isValid = RE_COLOR.test(String(color));
        } catch (e) {
            console.log(e);
        } finally {
            return isValid;
        }
        // fin del try-catch block
    },

    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
        // inicializacion lazy
        var isValid = false;
        // expresion regular copiada de StackOverflow
        var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;

        // validacion Regex
        try {
            isValid = re.test(phone);
        } catch (e) {
            console.log(e);
        } finally {
            return isValid;
        }
        // fin del try-catch block
    },

    // valida que el mensaje COMPLETO sea una URL de imagen con extension segura
    // (regex anclado: sin espacios, comillas ni angulares)
    is_valid_url_image: function (url) {

        // inicializacion lazy
        var isValid = false;

        // validacion Regex
        try {
            isValid = RE_IMAGEN.test(url);
        } catch (e) {
            console.log(e);
        } finally {
            return isValid;
        }
        // fin del try-catch block
    },

    // valida que el mensaje COMPLETO sea una URL de YouTube
    is_valid_yt_video: function (url) {

        // inicializacion lazy
        var isValid = false;

        // validacion Regex
        try {
            isValid = RE_YT.test(url);
        } catch (e) {
            console.log(e);
        } finally {
            return isValid;
        }
        // fin del try-catch block
    },

    // el ID de un video YT solo acepta letras, digitos, guion y underscores
    isValidYTId: function (id) {
        return RE_YT_ID.test(String(id));
    },

    getYTVideoId: function (url) {

        return url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1];
    },

    getEmbeddedCode: function (url) {
        var id = this.getYTVideoId(url);
        // si el ID no cumple el patron seguro, no se construye iframe:
        // se devuelve el mensaje como texto escapado
        if (!this.isValidYTId(id)) {
            return this.escapeHtml(url);
        }
        var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        return code;
    },

    getImageTag: function (url) {
        // se eliminan caracteres peligrosos para evitar inyeccion de html/js
        var safeUrl = String(url).replace(/[<>"']/g, '');
        var tag = '<img src="' + safeUrl + '" style="max-height: 400px;max-width: 400px;">';
        return tag;
    },

    validateMessage: function (msg) {
        // payload vacio, no string o no JSON valido: mensaje se descarta
        if (!msg || typeof msg !== 'string') {
            return JSON.stringify({ mensaje: '' });
        }

        try {
            var obj = JSON.parse(msg);

            if (!obj || typeof obj !== 'object' || typeof obj.mensaje !== 'string') {
                return JSON.stringify({ mensaje: '' });
            }

            var mensaje = obj.mensaje;

            // nombre siempre escapa (se interpola en un nodo HTML del cliente)
            var nombreSeguro = (typeof obj.nombre === 'string') ? this.escapeHtml(obj.nombre) : '';
            // color solo se acepta si es un hex valido; si no, cadena vacia (fallback del cliente)
            var colorSeguro = (typeof obj.color === 'string' && this.isValidColor(obj.color)) ? obj.color : '';

            // el mensaje solo se renderiza como imagen o video si el mensaje
            // COMPLETO es una de esas URLs; cualquier otro texto se escapa
            if (this.is_valid_url_image(mensaje)) {
                console.log("Es una imagen!")
                mensaje = this.getImageTag(mensaje);
            }
            else if (this.is_valid_yt_video(mensaje)) {
                console.log("Es un video!")
                mensaje = this.getEmbeddedCode(mensaje);
            }
            else {
                console.log("Es un texto!")
                mensaje = this.escapeHtml(mensaje);
            }

            return JSON.stringify({ nombre: nombreSeguro, mensaje: mensaje, color: colorSeguro });
        } catch (e) {
            console.log('Error processing message:', e);
            // nunca se re-emitte el texto crudo: mensaje vacio
            return JSON.stringify({ mensaje: '' });
        }
    },

    // fin del modulo
};
