"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input } from "@/components/ui";
import {
  inviteCompanyMember,
  type InviteCompanyMemberError,
} from "@/lib/actions/company-members";

/**
 * Invitar acceso del cliente (ficha de empresa, solo consultor): captura el
 * correo del contacto y llama a la server action `inviteCompanyMember`
 * (crea el usuario de auth por invitación + fila `company_members`). Mismo
 * patrón de `AssignRiskForm`: useTransition + estado local (la action no
 * recibe FormData, recibe argumentos tipados).
 */
export function CompanyMemberInviteForm({ companyId }: { companyId: string }) {
  const t = useTranslations("app.companies.detail.clientAccess");

  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<InviteCompanyMemberError | null>(null);
  const [invited, setInvited] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setInvited(false);
    setError(null);
    startTransition(async () => {
      const result = await inviteCompanyMember(companyId, email.trim());
      if (result.ok) {
        setInvited(true);
        setEmail("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-12">
      <Field label={t("emailLabel")} htmlFor="client-access-email" hint={t("hint")}>
        <Input
          id="client-access-email"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
          value={email}
          disabled={isPending}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <div className="flex items-center gap-12">
        <Button type="submit" variant="secondary" disabled={isPending || !email.trim()}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
        {invited && !isPending ? (
          <p role="status" className="text-caption text-success-green">
            {t("success")}
          </p>
        ) : null}
        {error && !isPending ? (
          <p role="alert" className="text-caption text-danger-red">
            {t(`errors.${error}`)}
          </p>
        ) : null}
      </div>
    </form>
  );
}
