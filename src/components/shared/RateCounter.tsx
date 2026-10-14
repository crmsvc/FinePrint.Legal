interface RateCounterProps {
  remaining: number;
  limit: number;
}

export function RateCounter({ remaining, limit }: RateCounterProps) {
  const atLimit = remaining <= 0;

  return (
    <div className="text-center text-xs text-muted-foreground print:hidden">
      {atLimit ? (
        <p>
          You&apos;ve used all {limit} free analyses for today. Bookmark us
          &mdash; your limit resets tomorrow!
        </p>
      ) : (
        <p>
          {remaining} of {limit} free analysis{limit !== 1 ? "es" : ""}{" "}
          remaining today
        </p>
      )}
    </div>
  );
}
