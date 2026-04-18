export default function EventCardSkeleton() {
  return (
    <article className="social-event-card" aria-hidden="true">
      <div className="social-event-card-media">
        <div className="social-event-card-placeholder">
          <div className="social-event-card-placeholder-glow" />
        </div>
      </div>
      <div className="social-event-card-content">
        <div className="h-6 w-3/4 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 w-2/3 rounded-full bg-slate-200 animate-pulse" />
      </div>
    </article>
  );
}
