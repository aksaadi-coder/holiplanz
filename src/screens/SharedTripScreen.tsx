import { useEffect, useLayoutEffect, useState } from "react";
import { decodeShare, sharePayloadFromLocation, type SharedTrip } from "../utils/shareLink";
import { resolveBackground } from "../data/destinationBackgrounds";
import { DayMiniMap } from "../components/shared/DayMiniMap";
import { Value } from "../components/ui/primitives";


/**
 * A shared trip, as the person on the other end of the link sees it.
 *
 * Everything here is drawn from the link itself — the trip never touched a
 * server on the way over, and there is nothing to look up. That also fixes
 * what this page is: a snapshot of the plan at the moment it was sent, read
 * only, with no way in to the sender's account.
 *
 * It is a standalone page, not a screen inside the app: no tab bar, no
 * membership, no session. A guest may never have opened Holiplanz, so the
 * only thing asked of them is at the very bottom, once they've read the trip.
 */
export function SharedTripScreen() {
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "broken">("loading");
  // The whole trip is in the fragment, so two different shared links differ
  // only after the '#' — which a browser treats as staying on the same page.
  // Without this, pasting a second link into a tab already showing a first one
  // would leave the first trip on screen.
  const [payload, setPayload] = useState(sharePayloadFromLocation);

  useEffect(() => {
    const onHashChange = () => setPayload(sharePayloadFromLocation());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Hand the page back to the document. The app pins html/body/#root to one
  // screen and hides body overflow, because every screen in it scrolls
  // internally; this page is a long document and has to scroll as one. See
  // hp-doc-scroll in styles/shared.css.
  useLayoutEffect(() => {
    document.documentElement.classList.add("hp-doc-scroll");
    return () => document.documentElement.classList.remove("hp-doc-scroll");
  }, []);

  useEffect(() => {
    let live = true;
    decodeShare(payload).then((decoded) => {
      if (!live) return;
      setTrip(decoded);
      setState(decoded ? "ready" : "broken");
    });
    return () => {
      live = false;
    };
  }, [payload]);

  if (state === "loading") {
    return <div className="hp-shared hp-shared-plain" />;
  }

  if (state === "broken" || !trip) {
    return (
      <div className="hp-shared hp-shared-plain">
        <div className="hp-shared-empty">
          <p className="hp-shared-wordmark">holiplanz</p>
          <h1>This link didn't open</h1>
          <p>
            A shared trip travels inside its own link, so it only works whole — if it was cut short
            on the way here, ask for it again.
          </p>
          <a className="hp-shared-cta" href="/">
            Plan a trip of your own →
          </a>
        </div>
      </div>
    );
  }

  const facts: [string, string][] = [
    ...(trip.st ? ([["Staying", trip.st]] as [string, string][]) : []),
    ...(trip.ts ? ([["Trip style", trip.ts]] as [string, string][]) : []),
    ...(trip.cu ? ([["Currency", trip.cu]] as [string, string][]) : []),
    ...(trip.pl || trip.la
      ? ([["Plug · Language", [shortPlug(trip.pl), trip.la].filter(Boolean).join(" · ")]] as [
          string,
          string,
        ][])
      : []),
  ];

  return (
    <div className="hp-shared">
      <img className="hp-shared-hero" src={resolveBackground(trip.de)} alt="" />

      <div className="hp-shared-body">
        <div className="hp-shared-head">
          <span className="hp-shared-wordmark">holiplanz</span>
          {/* Every figure on this page came out of the link as text and is
              never recomputed, but a translator would still rewrite them in
              place. See Value in ui/primitives. */}
          <span className="hp-shared-num" translate="no">
            {trip.no}
          </span>
        </div>

        <h1 className="hp-shared-title" translate="no">
          {trip.ti}
        </h1>
        <p className="hp-shared-meta" translate="no">
          {tripLine(trip)}
        </p>
        <p className="hp-shared-by">
          Shared by <Value>{trip.by}</Value> · view only
        </p>

        {trip.days.map((day) => (
          <section className="hp-shared-day" key={day.n}>
            <p className="hp-label hp-shared-daylabel">
              {/* "DAY 2 · FUJI & HAKONE" — the number and the place are one
                  phrase, so they travel together. */}
              <Value>{`Day ${day.n}${day.t ? ` · ${day.t}` : ""}`}</Value>
            </p>

            <DayMiniMap stops={day.s} hotel={day.h} />

            <ol className="hp-shared-stops">
              {day.s.map((stop, i) => (
                <li key={`${day.n}-${i}`}>
                  <span className="hp-shared-time" translate="no">
                    {stop.t}
                  </span>
                  <span className="hp-shared-stop">
                    <b translate="no">{stop.n}</b>
                    {stop.d && <span>{stop.d}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {facts.length > 0 && (
          <div className="hp-shared-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <p className="hp-label">{label}</p>
                <b translate="no">{value}</b>
              </div>
            ))}
          </div>
        )}

        <div className="hp-shared-foot">
          <a className="hp-shared-cta" href="/">
            Plan yours at holiplanz.app
          </a>
          <span className="hp-shared-stamp" translate="no">
            ✈ {stampLabel(trip)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Just the socket letters. The model answers this one at length — "Type A and
 * Type B, 100V, 50Hz (eastern Japan) / 60Hz (western Japan)" — which is true
 * and useless in a corner of a page someone is skimming. The voltage lecture
 * is a job for Trip info, in the app, where there's room to want it.
 */
function shortPlug(plug: string | undefined): string {
  if (!plug) return "";
  const types = [...plug.matchAll(/Type\s+([A-Z])\b/g)].map((m) => m[1]);
  if (types.length === 0) return plug.split(/[,(]/)[0].trim();
  return `Type ${[...new Set(types)].join("/")}`;
}

/** "12–19 Jul 2026 · 7 days · Tokyo → Kyoto → Osaka", dropping whatever the
 *  trip doesn't have rather than leaving a stray separator behind. */
function tripLine(trip: SharedTrip): string {
  return [dateRange(trip), `${trip.nd} ${trip.nd === 1 ? "day" : "days"}`, trip.ro.join(" → ")]
    .filter(Boolean)
    .join(" · ");
}

function dateRange(trip: SharedTrip): string {
  if (!trip.sd) return "";
  const start = new Date(trip.sd);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, trip.nd - 1));
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  const span =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${month(end)}`
      : `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)}`;
  return `${span} ${end.getFullYear()}`;
}

/** "JAPAN · JUL 2026" — the country and the month it happens. */
function stampLabel(trip: SharedTrip): string {
  const parts = trip.de.split(",").map((s) => s.trim());
  const place = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toUpperCase();
  const when = trip.sd ? new Date(trip.sd) : null;
  const date =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase()
      : "";
  return date ? `${place} · ${date}` : place;
}
