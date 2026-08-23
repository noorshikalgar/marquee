import { useCountries } from "../hooks/useMeta";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";

export function CountryPicker() {
  const { data: countries } = useCountries();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const preferredCountry = settings?.preferredCountry ?? "";

  return (
    <select
      value={preferredCountry}
      onChange={(e) => updateSettings.mutate({ preferredCountry: e.target.value })}
      className="w-full rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-amber-400"
    >
      <option value="">No preference</option>
      {countries?.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
