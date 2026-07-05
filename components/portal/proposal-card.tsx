"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, StatusBadge, type StatusBadgeVariant } from "@/components/ui";
import { acceptProposal, type AcceptProposalError } from "@/lib/actions/proposals";
import type { ClientDashboardProposal } from "@/lib/portal/load-dashboard.server";

/**
 * Tarjeta "Tu propuesta" del portal del cliente (spec company-portal-phase2,
 * tarea 3): muestra plan + monto (CLP) + estado de la propuesta más reciente
 * publicada por el consultor, y permite aceptarla ('sent' -> 'accepted') vía
 * la server action `acceptProposal` (el cliente no tiene UPDATE directo en
 * RLS — ver comentario en lib/actions/proposals.ts). Mismo patrón de
 * CertificateActions: useTransition + revalidatePath del server refresca la
 * tarjeta tras aceptar.
 */

const STATUS_VARIANT: Record<ClientDashboardProposal["status"], StatusBadgeVariant> = {
  draft: "neutral",
  sent: "warning",
  accepted: "active",
  paid: "positive",
  expired: "negative",
};

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function ProposalCard({ proposal }: { proposal: ClientDashboardProposal }) {
  const t = useTranslations("portal.dashboard.proposal");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<AcceptProposalError | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptProposal(proposal.id);
      if (!result.ok) setError(result.error);
      // ok → revalidatePath("/portal") del server refresca esta tarjeta.
    });
  }

  return (
    <Card className="flex flex-col gap-12">
      <p className="text-caption leading-caption tracking-caption text-carbon">{t("title")}</p>
      <div>
        <StatusBadge variant={STATUS_VARIANT[proposal.status]}>
          {t(`status.${proposal.status}`)}
        </StatusBadge>
      </div>
      <p className="text-body-sm text-ink">{proposal.plan}</p>
      <p className="text-[26px] font-semibold leading-[1.15] tracking-[-0.8px] text-ink">
        {clpFormatter.format(proposal.amountClp)}
      </p>

      {proposal.status === "sent" ? (
        <div className="flex flex-col gap-8">
          <Button onClick={handleAccept} disabled={isPending} className="self-start">
            {isPending ? t("accepting") : t("accept")}
          </Button>
          {error ? (
            <p role="alert" className="text-caption text-danger-red">
              {t(`errors.${error}`)}
            </p>
          ) : null}
        </div>
      ) : null}

      {proposal.status === "accepted" ? (
        <p className="text-caption leading-caption tracking-caption text-carbon">
          {t("paymentComingSoon")}
        </p>
      ) : null}
    </Card>
  );
}
