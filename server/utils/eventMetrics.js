const getDateKey = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString().slice(0, 10);
};

const ensureDailyMetricsShape = (event) => {
  if (!event.analytics) {
    event.analytics = { daily: [] };
  }

  if (!Array.isArray(event.analytics.daily)) {
    event.analytics.daily = [];
  }
};

const getOrCreateDailyMetric = (event, dateKey = getDateKey()) => {
  ensureDailyMetricsShape(event);

  let metric = event.analytics.daily.find((item) => item.dateKey === dateKey);
  if (!metric) {
    metric = {
      dateKey,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      ticketsSold: 0,
      revenue: 0,
    };
    event.analytics.daily.push(metric);
  }

  return metric;
};

const recordEventMetrics = (event, delta = {}, dateKey = getDateKey()) => {
  const metric = getOrCreateDailyMetric(event, dateKey);
  const keys = ["views", "likes", "comments", "shares", "ticketsSold", "revenue"];

  keys.forEach((key) => {
    const nextValue = Number(delta[key] || 0);
    if (!nextValue) return;
    metric[key] = Math.max(0, Number(metric[key] || 0) + nextValue);
  });

  return event;
};

const buildTimeline = (event, days = 14) => {
  const today = new Date();
  const source = Array.isArray(event?.analytics?.daily) ? event.analytics.daily : [];
  const metricsByDate = new Map(source.map((item) => [item.dateKey, item]));
  const timeline = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const pointDate = new Date(today);
    pointDate.setDate(today.getDate() - offset);
    const dateKey = getDateKey(pointDate);
    const metric = metricsByDate.get(dateKey) || {};

    timeline.push({
      dateKey,
      label: pointDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      views: Number(metric.views || 0),
      likes: Number(metric.likes || 0),
      comments: Number(metric.comments || 0),
      shares: Number(metric.shares || 0),
      ticketsSold: Number(metric.ticketsSold || 0),
      revenue: Number(metric.revenue || 0),
    });
  }

  return timeline;
};

module.exports = {
  buildTimeline,
  getDateKey,
  getOrCreateDailyMetric,
  recordEventMetrics,
};
