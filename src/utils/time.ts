export interface TimeDifference {
  destinationTime: string;
  diffHours: number;
}

function offsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60000;
}

export function getTimeDifference(timezone: string): TimeDifference | null {
  try {
    const now = new Date();
    const destOffset = offsetMinutes(timezone, now);
    const localOffset = -now.getTimezoneOffset();
    const diffHours = Math.round(((destOffset - localOffset) / 60) * 2) / 2;

    const destinationTime = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    return { destinationTime, diffHours };
  } catch {
    return null;
  }
}
