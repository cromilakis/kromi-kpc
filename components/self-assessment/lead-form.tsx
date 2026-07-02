"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/components/landing/whatsapp";
import { Button, Field, Input } from "@/components/ui";
import { submitSelfAssessment } from "@/lib/actions/self-assessment";
import type { EstimateInput } from "@/lib/self-assessment/estimate";

/**
 * Captura de lead OPCIONAL al final del autoevaluador (RFC §13: el embudo
 * persigue el contacto, no lo exige). Se pide lo mínimo (minimización N4):
 * nombre opcional y al menos un correo o teléfono para poder responder.
 *
 * Estados visibles: idle → enviando → éxito / error de validación / servicio
 * no disponible. En "no disponible" se degrada con gracia: el resultado sigue
 * en pantalla y se sugiere WhatsApp.
 *
 * Anti-abuso (D8): incluye un honeypot ("website") oculto a personas y
 * lectores de pantalla; si un bot lo completa, el servidor descarta el envío.
 */
type Status = "idle" | "success" | "validation" | "unavailable";

export interface LeadFormProps {
  /** Respuestas del cuestionario (el servidor recalcula la estimación). */
  assessment: EstimateInput;
}

export function LeadForm({ assessment }: LeadFormProps) {
  const t = useTranslations("selfAssessment.lead");
  const tResult = useTranslations("selfAssessment.result");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Honeypot: siempre vacío en humanos (el campo está oculto).
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  const hasContact = Boolean(email.trim() || phone.trim());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasContact || isPending) return;
    startTransition(async () => {
      const response = await submitSelfAssessment({
        sizeTier: assessment.sizeTier,
        sectorCode: assessment.sectorCode,
        riskFactors: [...assessment.riskFactors],
        ...(name.trim() ? { contactName: name.trim() } : {}),
        ...(email.trim() ? { contactEmail: email.trim() } : {}),
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
        ...(website ? { website } : {}),
      });
      setStatus(
        response.ok
          ? "success"
          : response.error === "validation"
            ? "validation"
            : "unavailable",
      );
    });
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-[#cfe6d8] bg-[#f1f9f4] p-[30px] max-sm:p-20"
      >
        <h2 className="mb-4 text-body-sm font-semibold text-success-green">
          {t("successTitle")}
        </h2>
        <p className="text-body-sm leading-body-sm text-ink">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-stone bg-white p-[30px] max-sm:p-20"
    >
      <div className="mb-4 flex items-baseline justify-between gap-12">
        <h2 className="text-body-sm font-semibold text-ink">{t("title")}</h2>
        <span className="rounded-tags bg-ash px-8 py-[2px] text-[11px] font-semibold text-metal">
          {t("optional")}
        </span>
      </div>
      <p className="mb-16 text-[13px] leading-[1.5] text-metal">{t("intro")}</p>

      <Field label={t("nameLabel")} htmlFor="lead-name" className="mb-12">
        <Input
          id="lead-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label={t("emailLabel")} htmlFor="lead-email" className="mb-12">
        <Input
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field
        label={t("phoneLabel")}
        htmlFor="lead-phone"
        hint={t("contactHint")}
        className="mb-16"
      >
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-describedby="lead-phone-hint"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>

      {/* Honeypot anti-bots (D8): invisible y fuera del árbol de accesibilidad
          y del orden de tabulación; el servidor descarta envíos con valor. */}
      <div aria-hidden="true" className="sr-only">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {status === "validation" ? (
        <p
          role="alert"
          className="mb-12 rounded-cards bg-[#f6e9e8] p-12 text-[13px] leading-[1.5] text-danger-red"
        >
          {t("errorValidation")}
        </p>
      ) : null}
      {status === "unavailable" ? (
        <div
          role="alert"
          className="mb-12 rounded-cards bg-[#f6f0df] p-12 text-[13px] leading-[1.5]"
        >
          <p className="font-semibold text-warning-yellow">
            {t("errorUnavailableTitle")}
          </p>
          <p className="mt-4 text-ink">
            {t("errorUnavailableText")}{" "}
            <a
              href={whatsappUrl(tResult("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-action-blue underline underline-offset-2"
            >
              {t("whatsappCta")}
              {/* target="_blank" anunciado a lectores de pantalla. */}
              <span className="sr-only"> {tCommon("opensInNewWindow")}</span>
            </a>
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full px-[18px] py-[11px]"
        disabled={!hasContact || isPending}
      >
        {isPending ? t("sending") : t("submit")}
      </Button>
      {/* Contraste AA en texto pequeño: carbon (≤13px). */}
      <p className="mt-8 text-caption leading-caption text-carbon">
        {t("privacyNote")}
      </p>
    </form>
  );
}
