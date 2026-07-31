const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mesa.app";

function emailShell({
  preheader,
  eyebrow,
  title,
  body,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f9f4e9;color:#2f2826;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9f4e9;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#fffdf8;border:1px solid #eee4d3;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:30px 36px;background:#2f171b;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="44" height="44" align="center" style="background:#c9634b;border-radius:14px;color:#fffdf8;font-size:22px;font-weight:700;">M</td>
                    <td style="padding-left:12px;color:#fffdf8;font-size:18px;font-weight:800;letter-spacing:4px;">MESA</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:46px 36px 40px;">
                <p style="margin:0 0 14px;color:#c9634b;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">${eyebrow}</p>
                <h1 style="margin:0;color:#2f171b;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1.08;font-weight:500;letter-spacing:-1.2px;">${title}</h1>
                <div style="margin:22px 0 0;color:#736a66;font-size:16px;line-height:1.7;">${body}</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="background:#c9634b;border-radius:13px;">
                      <a href="${buttonUrl}" style="display:inline-block;padding:15px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${buttonLabel} &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;color:#8a7f79;background:#f4eee5;border-top:1px solid #eee4d3;font-size:12px;line-height:1.6;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmailHtml() {
  return emailShell({
    preheader: "Tu sitio en la beta privada de MESA está reservado.",
    eyebrow: "Ya estás dentro",
    title: "Te hemos guardado un sitio en la mesa.",
    body: `
      <p style="margin:0 0 16px;">Gracias por apuntarte a la beta privada de <strong style="color:#2f171b;">MESA</strong>.</p>
      <p style="margin:0;">Estamos preparando una forma más bonita de descubrir restaurantes, guardar los favoritos de cada grupo y decidir juntos el próximo plan. Cuando abramos la beta, serás de las primeras personas en saberlo.</p>
    `,
    buttonLabel: "Descubrir MESA",
    buttonUrl: siteUrl,
    footer:
      "Recibes este correo porque te has apuntado a la beta de MESA. Solo te escribiremos con novedades importantes sobre tu acceso.",
  });
}

export const welcomeEmailText = `¡Ya estás dentro!

Te hemos guardado un sitio en la mesa.

Gracias por apuntarte a la beta privada de MESA. Estamos preparando una forma más bonita de descubrir restaurantes, guardar los favoritos de cada grupo y decidir juntos el próximo plan.

Cuando abramos la beta, serás de las primeras personas en saberlo.

Descubre MESA: ${siteUrl}`;

export function betaLaunchEmailHtml() {
  return emailShell({
    preheader: "La beta privada de MESA ya está abierta.",
    eyebrow: "La mesa está lista",
    title: "Ya puedes empezar a usar MESA.",
    body: `
      <p style="margin:0 0 16px;">Ha llegado el momento: la beta privada de <strong style="color:#2f171b;">MESA</strong> ya está abierta.</p>
      <p style="margin:0;">Gracias por acompañarnos desde el principio. Crea tu primer grupo, reúne esos restaurantes que siempre acabáis perdiendo en el chat y prepara vuestro próximo plan.</p>
    `,
    buttonLabel: "Entrar en la beta",
    buttonUrl: siteUrl,
    footer:
      'Gracias por formar parte de la beta de MESA. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#736a66;">Darme de baja</a>.',
  });
}

export const betaLaunchEmailText = `La mesa está lista.

Ya puedes empezar a usar MESA.

Gracias por acompañarnos desde el principio. Crea tu primer grupo, reúne esos restaurantes que siempre acabáis perdiendo en el chat y prepara vuestro próximo plan.

Entrar en la beta: ${siteUrl}

Darme de baja: {{{RESEND_UNSUBSCRIBE_URL}}}`;
