import { Heart } from "lucide-react";
import { TitleGrid } from "../components/TitleGrid";
import { useLikedTitlesFull } from "../hooks/useLikedTitles";
import { useLanguage } from "../lib/i18n/LanguageContext";

export function LikedPage() {
  const { t } = useLanguage();
  const { data: liked, isLoading } = useLikedTitlesFull();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-amber-400" />
        <h1 className="text-xl font-semibold">{t("my_liked")}</h1>
        {liked && <span className="text-sm text-slate-500">({liked.length})</span>}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("title_loading")}</p>
      ) : !liked || liked.length === 0 ? (
        <p className="text-sm text-slate-500">{t("my_likedEmpty")}</p>
      ) : (
        <TitleGrid titles={liked} hideLike />
      )}
    </div>
  );
}
