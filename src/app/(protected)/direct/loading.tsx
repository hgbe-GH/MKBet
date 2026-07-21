import { AsyncState } from "@/components/astryx/async-state";

export default function DirectLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <AsyncState
        description="Préparation de ton contexte, des actions et des marchés."
        kind="loading"
        title="Chargement d’Aujourd’hui"
      />
    </div>
  );
}
