"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import styles from "./waitlist-form.module.css";

type WaitlistFormProps = {
  variant?: "hero" | "cta";
};

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; preview: boolean }
  | { status: "error"; message: string };

export function WaitlistForm({ variant = "hero" }: WaitlistFormProps) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          company: formData.get("company"),
          startedAt: startedAt.current || undefined,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        preview?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message ?? "No hemos podido apuntarte. Inténtalo de nuevo.",
        );
      }

      setState({ status: "success", preview: Boolean(payload.preview) });
      form.reset();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ha ocurrido algo inesperado. Inténtalo de nuevo.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div
        className={`${styles.success} ${styles[variant]}`}
        role="status"
        aria-live="polite"
      >
        <span className={styles.successIcon}>
          <Check size={20} strokeWidth={2.5} />
        </span>
        <span>
          <strong>¡Ya tienes un sitio en la mesa!</strong>
          <small>
            {state.preview
              ? "Modo local: conecta Resend para recibir el correo real."
              : "Revisa tu bandeja de entrada. Te hemos enviado la bienvenida."}
          </small>
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${styles[variant]}`}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.inputWrap}>
          <span className={styles.srOnly}>Tu correo electrónico</span>
          <Mail size={19} aria-hidden="true" />
          <input
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
            disabled={state.status === "loading"}
            aria-describedby={`waitlist-help-${variant}`}
          />
        </label>
        <label className={styles.honeypot} aria-hidden="true">
          Empresa
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
        <button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? (
            <>
              <LoaderCircle className={styles.spinner} size={19} />
              Guardando…
            </>
          ) : (
            <>
              Quiero entrar
              <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>
      <p
        id={`waitlist-help-${variant}`}
        className={styles.privacy}
        aria-live="polite"
      >
        {state.status === "error" ? (
          <span className={styles.error}>{state.message}</span>
        ) : (
          <>
            Sin spam. Solo novedades importantes de la beta.{" "}
            <a href="/privacidad">Privacidad</a>
          </>
        )}
      </p>
    </div>
  );
}
