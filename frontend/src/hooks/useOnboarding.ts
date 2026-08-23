import { useAuth } from "../lib/AuthContext";
import { useSettings, useUpdateSettings } from "./useSettings";

export function useOnboarding() {
  const { user } = useAuth();
  const { data: settings } = useSettings({ enabled: !!user });
  const updateSettings = useUpdateSettings();

  const showOnboarding = !!user && !!settings && settings.onboardingComplete !== "true";
  const showTour = !!user && !!settings && settings.onboardingComplete === "true" && settings.tourComplete !== "true";

  function completeOnboarding() {
    updateSettings.mutate({ onboardingComplete: "true" });
  }

  function completeTour() {
    updateSettings.mutate({ tourComplete: "true" });
  }

  return { showOnboarding, showTour, completeOnboarding, completeTour };
}
