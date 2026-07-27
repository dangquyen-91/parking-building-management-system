interface BookingHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function BookingHero({ eyebrow, title, description }: BookingHeroProps) {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg font-light leading-8 text-slate-600">
        {description}
      </p>
    </section>
  );
}
