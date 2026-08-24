import { Link, useParams } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { TitleGrid } from "../components/TitleGrid";
import { PersonDetailSkeleton } from "../components/skeletons/TitleDetailSkeleton";
import { usePerson } from "../hooks/usePerson";
import { useLanguage } from "../lib/i18n/LanguageContext";

export function PersonPage() {
  const { t } = useLanguage();
  const { personId } = useParams<{ personId: string }>();
  const { data: person, isLoading, isError } = usePerson(Number(personId));

  if (isLoading) return <PersonDetailSkeleton />;
  if (isError || !person) return <div className="px-4 py-12 text-center text-red-400">Couldn't load this person.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <BackButton />

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-base-800 ring-1 ring-hairline/10">
          {person.profileUrl && (
            <img src={person.profileUrl} alt={person.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-2xl font-bold text-slate-50">{person.name}</h1>
          {person.knownForDepartment && <p className="text-sm text-amber-400">{person.knownForDepartment}</p>}
          {person.birthday && <p className="text-sm text-slate-500">Born {person.birthday}</p>}
          {person.biography && (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 line-clamp-6">{person.biography}</p>
          )}
        </div>
      </div>

      {person.crewCredits.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">{t("person_directingWriting")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {person.crewCredits.map((credit) => (
              <CreditCard key={`${credit.title.mediaType}-${credit.title.tmdbId}-${credit.role}`} credit={credit} />
            ))}
          </div>
        </section>
      )}

      {person.actingCredits.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">{t("person_acting")}</h2>
          <TitleGrid titles={person.actingCredits.map((c) => c.title)} />
        </section>
      )}
    </div>
  );
}

function CreditCard({ credit }: { credit: { title: { mediaType: string; tmdbId: number; title: string; posterUrl: string | null }; role: string } }) {
  return (
    <Link to={`/title/${credit.title.mediaType}/${credit.title.tmdbId}`} className="block">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-base-800 ring-1 ring-hairline/5 transition hover:ring-amber-400/50">
        {credit.title.posterUrl && (
          <img src={credit.title.posterUrl} alt={credit.title.title} className="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-1.5 truncate text-sm font-medium text-slate-100">{credit.title.title}</p>
      <p className="truncate text-xs text-amber-400">{credit.role}</p>
    </Link>
  );
}
