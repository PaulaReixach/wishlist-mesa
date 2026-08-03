import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { MesaLogo } from "@/components/brand";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Información sobre el tratamiento de los datos de la lista de espera de MESA.",
};

const privacyEmail = process.env.PRIVACY_CONTACT_EMAIL;

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="Volver a la página principal">
          <MesaLogo />
        </Link>
        <Link className={styles.back} href="/">
          <ArrowLeft size={16} /> Volver
        </Link>
      </header>

      <article className={styles.article}>
        <span className={styles.eyebrow}>Información clara, como debe ser</span>
        <h1>Privacidad de la lista de espera</h1>
        <p className={styles.updated}>Última actualización: 3 de agosto de 2026</p>

        <p className={styles.intro}>
          Esta política explica de forma sencilla qué ocurre con tu correo
          cuando te apuntas a la beta privada de MESA.
        </p>

        <section>
          <h2>1. Responsable</h2>
          <p>
            El responsable del tratamiento es MESA, un proyecto independiente
            actualmente en fase beta.
          </p>
          {privacyEmail && (
            <p>
              Contacto:{" "}
              <a href={`mailto:${privacyEmail}`}>
                <Mail size={15} /> {privacyEmail}
              </a>
            </p>
          )}
        </section>

        <section>
          <h2>2. Qué datos recogemos</h2>
          <p>
            Solo recogemos el correo electrónico que introduces
            voluntariamente en el formulario. Esta landing no utiliza cookies
            publicitarias ni recopila datos sensibles.
          </p>
        </section>

        <section>
          <h2>3. Para qué lo usamos</h2>
          <p>
            Usaremos tu correo para confirmar que formas parte de la lista,
            comunicarte la apertura de la beta, avisarte del lanzamiento
            público y enviarte novedades estrictamente relacionadas con tu
            acceso a MESA.
          </p>
        </section>

        <section>
          <h2>4. Base legal</h2>
          <p>
            La base legal es tu consentimiento al enviar el formulario. Puedes
            retirarlo en cualquier momento sin que ello afecte al tratamiento
            realizado previamente.
          </p>
        </section>

        <section>
          <h2>5. Proveedores y transferencias</h2>
          <p>
            Para gestionar la lista y enviar los correos utilizamos Resend como
            proveedor de email y el proveedor donde se aloje la web. Estos
            servicios tratan los datos únicamente para prestar su función y
            conforme a sus compromisos de privacidad.
          </p>
        </section>

        <section>
          <h2>6. Durante cuánto tiempo</h2>
          <p>
            Conservaremos tu correo mientras la beta esté activa o hasta que
            retires tu consentimiento. Después lo eliminaremos o lo
            anonimizaremos cuando deje de ser necesario.
          </p>
        </section>

        <section>
          <h2>7. Tus derechos</h2>
          <p>
            Puedes solicitar el acceso, rectificación, supresión, limitación,
            oposición o portabilidad de tus datos. También podrás darte de baja
            desde el enlace incluido en los correos de lanzamiento o
            respondiendo a una comunicación de MESA.
          </p>
        </section>

        <section>
          <h2>8. Cambios en esta política</h2>
          <p>
            Si cambia la forma en la que tratamos tus datos, actualizaremos esta
            página y, cuando sea relevante, te avisaremos por correo.
          </p>
        </section>
      </article>
    </main>
  );
}
