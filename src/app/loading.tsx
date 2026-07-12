export default function Loading() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-stone-100 px-5"
    >
      <div className="text-center" role="status">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-red-900" />
        <p className="mt-4 text-sm font-bold tracking-[0.12em] text-stone-600 uppercase">
          Ouverture de la salle…
        </p>
      </div>
    </main>
  );
}
