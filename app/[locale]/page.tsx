import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-base text-text-muted">{t("subtitle")}</p>
    </div>
  );
}
