import { useEffect, useRef, useState } from "react";

/**
 * A live readout of everything that decides where the bottom of the app sits.
 *
 * This exists because the tab bar sitting high on iPhone has now survived two
 * fixes made from the symptom alone, and there's no iOS Safari on the machine
 * this was written on — no simulator, no device. Rather than guess a third
 * time, this puts the actual numbers on screen so one screenshot settles it.
 *
 * Opt-in via `?debug=viewport`, so it can't appear for anyone else. Remove it
 * once the bug is closed.
 *
 * How to read it: `app` should equal `inner`, and `bar→bottom` should equal
 * the tab bar's own safe-area padding and nothing more. Whichever line
 * disagrees with the others is the culprit — a short `dvh` means the unit is
 * wrong, a non-zero `scrollY` means the document is scrolled, a large
 * `safe-bottom` means the inset is doing it.
 */
export function ViewportDebug() {
  const [, force] = useState(0);
  const probes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bump = () => force((n) => n + 1);
    const vv = window.visualViewport;
    window.addEventListener("resize", bump);
    window.addEventListener("scroll", bump, true);
    window.addEventListener("focusin", bump);
    window.addEventListener("focusout", bump);
    vv?.addEventListener("resize", bump);
    vv?.addEventListener("scroll", bump);
    // Also on a timer: some of these settle after an animation with no event.
    const id = setInterval(bump, 400);
    return () => {
      window.removeEventListener("resize", bump);
      window.removeEventListener("scroll", bump, true);
      window.removeEventListener("focusin", bump);
      window.removeEventListener("focusout", bump);
      vv?.removeEventListener("resize", bump);
      vv?.removeEventListener("scroll", bump);
      clearInterval(id);
    };
  }, []);

  const vv = window.visualViewport;
  const app = document.querySelector(".app")?.getBoundingClientRect();
  const bar = document.querySelector(".hp-tabbar")?.getBoundingClientRect();
  const node = probes.current;
  const px = (el: Element | null | undefined) => (el ? Math.round((el as HTMLElement).offsetHeight) : "—");

  const rows: [string, string | number][] = [
    ["inner", `${window.innerWidth}×${window.innerHeight}`],
    ["visual", vv ? `${Math.round(vv.width)}×${Math.round(vv.height)}` : "n/a"],
    ["vv offsetTop", vv ? Math.round(vv.offsetTop) : "n/a"],
    ["vv pageTop", vv ? Math.round(vv.pageTop) : "n/a"],
    ["scrollY", Math.round(window.scrollY)],
    ["100dvh", px(node?.children[0])],
    ["100svh", px(node?.children[1])],
    ["100lvh", px(node?.children[2])],
    ["safe-bottom", px(node?.children[3])],
    ["app h", app ? Math.round(app.height) : "—"],
    ["app top", app ? Math.round(app.top) : "—"],
    ["bar→bottom", bar ? Math.round(window.innerHeight - bar.bottom) : "no bar"],
    ["standalone", window.matchMedia("(display-mode: standalone)").matches ? "yes" : "no"],
  ];

  return (
    <>
      {/* Off-screen probes: the only way to read what these units actually
          resolve to on the device. */}
      <div ref={probes} aria-hidden style={{ position: "fixed", left: -9999, top: 0, width: 1 }}>
        <div style={{ height: "100dvh" }} />
        <div style={{ height: "100svh" }} />
        <div style={{ height: "100lvh" }} />
        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </div>

      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          left: 0,
          zIndex: 99999,
          pointerEvents: "none",
          background: "rgba(22, 20, 16, 0.88)",
          color: "#f6f4f1",
          font: "600 11px/1.45 ui-monospace, Menlo, monospace",
          padding: "6px 9px",
          borderRadius: "0 0 8px 0",
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 10,
        }}
      >
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "contents" }}>
            <span style={{ opacity: 0.65 }}>{label}</span>
            <span style={{ textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
