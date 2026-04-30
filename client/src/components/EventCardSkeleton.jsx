export default function EventCardSkeleton() {
  return (
    <div className="events-loading">
      <div className="event-card-skeleton">
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-details"></div>
          <div className="skeleton-details short"></div>
        </div>
      </div>
    </div>
  );
}
