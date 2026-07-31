# MESA · Lista de espera

Landing promocional y lista de espera para la beta privada de MESA.

La web presenta el producto, muestra una vista previa de la experiencia móvil y permite:

- Registrar correos en un segmento de Resend.
- Enviar un correo de bienvenida automático.
- Preparar y enviar el correo de apertura de la beta a toda la lista.
- Probar el formulario localmente sin credenciales reales.
- Compartir la landing con metadatos SEO, imagen social, sitemap y robots.

## Requisitos

- Node.js 20 o superior.
- npm.
- Una cuenta de [Resend](https://resend.com) para guardar contactos y enviar correos reales.

## Probar la web en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

El formulario funciona en modo de vista previa si todavía no has configurado Resend. Validará el correo y mostrará el estado final, pero no enviará ningún email real.

Para comprobar que el proyecto está listo para producción:

```bash
npm run check
```

## Activar los emails reales

1. Crea una cuenta en Resend.
2. Verifica el dominio desde el que enviará MESA.
3. Crea un segmento llamado, por ejemplo, `MESA Beta`.
4. Copia `.env.example` como `.env.local`.
5. Completa las variables:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PRIVACY_CONTACT_EMAIL=hola@tu-dominio.com
RESEND_API_KEY=re_xxxxxxxxx
RESEND_SEGMENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
RESEND_FROM_EMAIL=MESA <hola@tu-dominio.com>
RESEND_REPLY_TO=hola@tu-dominio.com
BETA_LAUNCH_SECRET=una-clave-larga-aleatoria-y-privada
```

6. Reinicia `npm run dev`.
7. Apúntate con un correo real y revisa tanto la bandeja de entrada como el segmento de Resend.

> Para enviar correos a cualquier persona en producción, Resend exige un dominio verificado. El remitente de prueba de Resend tiene destinatarios limitados.

## Enviar el correo cuando abra la beta

El endpoint está protegido por `BETA_LAUNCH_SECRET`, exige una confirmación exacta y un `campaignId` único para evitar duplicados accidentales.

Envío inmediato:

```bash
curl -X POST "https://tu-dominio.com/api/beta-launch" \
  -H "Authorization: Bearer TU_BETA_LAUNCH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "ENVIAR BETA MESA",
    "campaignId": "beta-android-2026"
  }'
```

Envío programado:

```bash
curl -X POST "https://tu-dominio.com/api/beta-launch" \
  -H "Authorization: Bearer TU_BETA_LAUNCH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "ENVIAR BETA MESA",
    "campaignId": "beta-android-2026",
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
    └── emails.ts
```

## Protección incluida

- Validación de email en cliente y servidor.
- Campo trampa y tiempo mínimo contra bots básicos.
- Límite de tamaño de petición.
- Idempotencia en el email de bienvenida.
- Endpoint de lanzamiento protegido por secreto y confirmación.
- Cabeceras de seguridad básicas.
- API de lanzamiento excluida de indexación.

## Privacidad

La página `/privacidad` explica el uso del correo, la base legal, los proveedores y los derechos de la persona inscrita. Antes del lanzamiento público, configura `PRIVACY_CONTACT_EMAIL` con el canal real de contacto de MESA.
