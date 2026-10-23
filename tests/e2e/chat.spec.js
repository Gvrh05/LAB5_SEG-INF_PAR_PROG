// Recorrido completo del usuario con frontend y backend REALES de UNA Chat.
// Playwright abre Chromium, abre http://localhost:3000 (frontend servido por el
// backend) y chatea por la misma UI que usaria una persona.
import { test, expect } from '@playwright/test';

// medios de prueba conocidos y estables
var IMG = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
var VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
var SCRIPT = '<script>alert(1)</script>';

test.describe('UNA Chat - recorrido del usuario (frontend + backend reales)', function () {

  test('1) Enviar una URL de imagen y verificar que la imagen se muestra y termina de cargar', async function ({ page }) {
    await page.goto('/');

    await page.getByPlaceholder('Username').fill('Playwright');
    await page.getByPlaceholder('Escriba un mensaje').fill(IMG);
    await page.getByRole('button', { name: 'Send' }).click();

    // la imagen se muestra en el historial del chat
    var img = page.locator('#messages li img').last();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', IMG);

    // la imagen termina de cargar (complete y con pixeles reales)
    await expect.poll(async function () {
      return img.evaluate(function (el) { return el.complete && el.naturalWidth > 0; });
    }, { timeout: 15000 }).toBe(true);
  });

  test('2) Enviar una URL de video y verificar que el reproductor aparece y carga el contenido', async function ({ page }) {
    await page.goto('/');

    await page.getByPlaceholder('Username').fill('Playwright');
    await page.getByPlaceholder('Escriba un mensaje').fill(VIDEO);
    await page.getByRole('button', { name: 'Send' }).click();

    // el reproductor embebido aparece con el src del componenet de YouTube
    var iframe = page.locator('#messages li iframe').last();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', expect.stringContaining('https://www.youtube.com/embed/dQw4w9WgXcQ'));
    await expect(iframe).toHaveAttribute('allowfullscreen', /.*/);

    // el contenido embebido de YouTube carga (el frame real se adjunta a la pagina)
    var frame = page.frameLocator('#messages li iframe');
    await expect(frame.locator('body')).toBeAttached({ timeout: 20000 });
  });

  test('3) Enviar un script: NUNCA debe aparecer el alert y el mensaje llega saneado', async function ({ page }) {
    // se registra el listener de dialogos ANTES del envio:
    // cualquier dialog (alert) debe hacer la prueba fallar
    var alertas = [];
    page.on('dialog', async function (dialog) {
      alertas.push(dialog);
      await dialog.dismiss();
    });

    await page.goto('/');

    await page.getByPlaceholder('Username').fill('Playwright');
    await page.getByPlaceholder('Escriba un mensaje').fill(SCRIPT);
    await page.getByRole('button', { name: 'Send' }).click();

    // el mensaje se muestra SANADO: como texto literal, no como codigo ejecutable
    var li = page.locator('#messages li').last();
    await expect(li).toContainText('<script>alert(1)</script>');

    // y lo que se muestra NO es el <script> ejecutado:
    // el historial no debe contener un nodo <script> y no debe haber alerts
    await expect(page.locator('#messages script')).toHaveCount(0);
    expect(alertas).toHaveLength(0);
  });

});
