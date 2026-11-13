import { POSITIONING } from '@/content/profile';

/** Homepage hero: one fixed headline and a first-person subline (#442). */
export function HeroHeadline() {
  const { eyebrow, headline, subline } = POSITIONING;

  return (
    <>
      <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {eyebrow}
      </span>

      <div className="space-y-4 sm:space-y-6">
        <h1 className="mx-auto max-w-[22ch] text-3xl font-extrabold tracking-tight leading-tight text-balance sm:text-5xl lg:text-6xl">
          {headline.lead}{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {headline.accent}
          </span>
        </h1>

        <p className="mx-auto max-w-[720px] text-base text-muted-foreground sm:text-lg">{subline}</p>
      </div>
    </>
  );
}
