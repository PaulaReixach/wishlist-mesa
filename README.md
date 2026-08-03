# MESA · Lista de espera

Landing promocional y lista de espera para la beta privada de MESA.

La web presenta el producto, muestra una vista previa de la experiencia móvil y permite:

- Registrar correos en una lista de Brevo.
- Enviar un correo de bienvenida automático.
- Reactivar de forma segura a quien vuelva a dar su consentimiento.
- Preparar y enviar el correo de lanzamiento a toda la lista.
- Probar el formulario localmente sin credenciales reales.
- Compartir la landing con metadatos SEO, imagen social, sitemap y robots.

## Requisitos

- Node.js 20 o superior.
- npm.
- Una cuenta gratuita de [Brevo](https://www.brevo.com) para guardar contactos y enviar correos reales.

## Probar la web en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

El formulario funciona en modo de vista previa si todavía no has configurado Brevo. Validará el correo y mostrará el estado final, pero no enviará ningún email real.

Para comprobar que el proyecto está listo para producción:

```bash
npm run check
```

## Activar los emails reales

1. Crea una cuenta gratuita en Brevo.
2. En **Transactional → Settings → Senders & IP**, añade
   `mesaappsupport@gmail.com` como remitente y valídalo con el código que Brevo
   enviará a ese correo. No hace falta comprar ni verificar un dominio.
3. En **Contacts → Lists**, crea una lista llamada `MESA Waitlist` y copia su ID
   numérico.
4. En **SMTP & API → API Keys**, crea una API key para la landing.
5. Copia `.env.example` como `.env.local`.
6. Completa las variables:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PRIVACY_CONTACT_EMAIL=hola@tu-dominio.com
MESA_APP_URL=https://play.google.com/store/apps/details?id=tu.app.id
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
BREVO_LIST_ID=123
BREVO_SENDER_EMAIL=mesaappsupport@gmail.com
BREVO_SENDER_NAME=MESA
BREVO_REPLY_TO=mesaappsupport@gmail.com
MESA_LAUNCH_SECRET=una-clave-larga-aleatoria-y-privada
```

7. Reinicia `npm run dev`.
8. Apúntate con un correo real y revisa tanto la bandeja de entrada como la
   lista `MESA Waitlist` de Brevo.

Una vez validado el remitente individual, la bienvenida puede enviarse a
cualquier dirección. Al utilizar un Gmail sin dominio propio, Brevo puede
mostrar un remitente técnico suyo para cumplir los requisitos de autenticación;
las respuestas seguirán llegando a `BREVO_REPLY_TO`.

En Vercel, sustituye las variables `RESEND_*` del despliegue anterior por las
variables `BREVO_*` anteriores y haz un **Redeploy**.

## Enviar el correo el día del lanzamiento

Antes de este envío, sustituye `MESA_APP_URL` por la ficha real de Google Play.
El endpoint está protegido por `MESA_LAUNCH_SECRET`, exige una confirmación
exacta y un `campaignId` único para evitar duplicados accidentales.

Envío inmediato:

```bash
curl -X POST "https://tu-dominio.com/api/beta-launch" \
  -H "Authorization: Bearer TU_MESA_LAUNCH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "ENVIAR LANZAMIENTO MESA",
    "campaignId": "android-launch-2026"
  }'
```

Envío programado:

```bash
curl -X POST "https://tu-dominio.com/api/beta-launch" \
  -H "Authorization: Bearer TU_MESA_LAUNCH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "ENVIAR LANZAMIENTO MESA",
    "campaignId": "android-launch-2026",
    "scheduledAt": "2026-09-01T10:00:00+02:00"
  }'
```

No guardes nunca la clave en el repositorio ni la pongas en código accesible desde el navegador.

## Despliegue recomendado

La opción más directa es importar este repositorio en Vercel:

1. En Vercel, selecciona **Add New → Project**.
2. Importa `PaulaReixach/wishlist-mesa`.
3. Añade todas las variables de `.env.example` en **Project Settings → Environment Variables**.
4. Cambia `NEXT_PUBLIC_SITE_URL` por el dominio final.
5. Despliega.

Cada actualización de la rama conectada generará un nuevo despliegue.

## Estructura principal

```text
src/
├── app/
│   ├── api/
│   │   ├── beta-launch/route.ts
│   │   └── waitlist/route.ts
│   ├── privacidad/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── brand.tsx
│   ├── landing-page.tsx
│   └── waitlist-form.tsx
└── lib/
    ├── brevo.ts
    └── emails.ts
```

## Protección incluida

- Validación de email en cliente y servidor.
- Campo trampa contra bots básicos sin bloquear el autocompletado del navegador.
- Límite de tamaño de petición.
- Reactivación explícita de contactos que vuelven a suscribirse.
- Endpoint de lanzamiento protegido por secreto, confirmación y comprobación
  de campaña existente para impedir un doble envío accidental.
- Enlace de baja individual en el correo masivo.
- Cabeceras de seguridad básicas.
- API de lanzamiento excluida de indexación.

## Privacidad

La página `/privacidad` explica el uso del correo, la base legal, los proveedores y los derechos de la persona inscrita. Antes del lanzamiento público, configura `PRIVACY_CONTACT_EMAIL` con el canal real de contacto de MESA.
