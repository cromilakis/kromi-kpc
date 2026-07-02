import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Field, Input, Logo } from "@/components/ui";

/**
 * /login — placeholder VISUAL del login del prototipo (sección isLogin):
 * card centrada sobre #fbfbfc con logo + tagline, campos deshabilitados y
 * botón inactivo. SIN lógica: la autenticación se implementa en la spec auth
 * (Fase C). Acceso discreto desde el footer de la landing (RFC §11).
 * Desviaciones normalizadas por .kromi/design.md: H1 serif a 28px (el
 * prototipo usa 26px; serif solo >= 28px) y tagline en Inter itálica.
 */
export default async function LoginPage() {
  const t = await getTranslations("login");
  const tCommon = await getTranslations("common");

  return (
    /* Landmark <main> con id="main" (destino del skip-link del layout). */
    <main
      id="main"
      className="flex min-h-screen flex-1 items-center justify-center bg-[#fbfbfc] p-32 max-sm:p-16"
    >
      <div className="w-full max-w-[400px]">
        <div className="mb-28 flex items-center justify-center gap-[10px]">
          {/* Texto accesible del logo: appName + appFullName (D10). */}
          <Logo
            alt={`${tCommon("appName")} — ${tCommon("appFullName")}`}
            height={40}
            priority
          />
          <span className="text-[17px] font-medium italic tracking-[-0.2px] text-ink">
            {tCommon("tagline")}
          </span>
        </div>

        <div className="rounded-xl border border-stone bg-white p-32 shadow-[rgba(28,40,64,0.1)_0px_12px_32px_-12px,rgba(28,40,64,0.06)_0px_4px_8px_-4px]">
          <h1 className="mb-4 font-serif text-heading-sm font-medium leading-heading-sm tracking-heading-sm text-ink">
            {t("title")}
          </h1>
          <p className="mb-24 text-body-sm tracking-[-0.1px] text-metal">
            {t("subtitle")}
          </p>

          {/* Campos deshabilitados: placeholder visual, sin lógica de auth. */}
          <Field label={t("userLabel")} htmlFor="login-user" className="mb-[14px]">
            <Input
              id="login-user"
              name="user"
              placeholder={t("userPlaceholder")}
              disabled
            />
          </Field>
          <Field label={t("passwordLabel")} htmlFor="login-password" className="mb-8">
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              disabled
            />
          </Field>

          <Button className="mt-20 w-full px-[18px] py-[11px]" disabled>
            {t("submit")}
          </Button>
          <Link
            href="/"
            className="mt-8 block w-full rounded-buttons p-8 text-center text-[13px] font-medium text-metal transition-colors hover:bg-ash hover:text-ink"
          >
            {t("backToSite")}
          </Link>
        </div>

        {/* Contraste AA en texto pequeño: carbon (lead no alcanzaba 4.5:1). */}
        <p className="mx-auto mt-16 text-center text-caption text-carbon">
          {t("placeholderNote")}
        </p>
      </div>
    </main>
  );
}
