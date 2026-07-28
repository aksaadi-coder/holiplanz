/**
 * Publishes the real height of the visible area as `--app-h`, and undoes the
 * stray document scroll iOS leaves behind after the keyboard.
 *
 * Why a JS measurement rather than a CSS unit. The shell has to be exactly as
 * tall as what the user can see, and no viewport unit gets that right in every
 * mode this app runs in:
 *
 * - `100vh`  — the *largest* viewport. Correct only while Safari's toolbar is
 *              hidden; the bottom sits behind the toolbar the rest of the time.
 * - `100svh` — the *smallest*. Reserves room for a toolbar that has collapsed,
 *              so the shell sits ~85px short in Safari. Tried; reverted.
 * - `100dvh` — correct in Safari, and correct on Android. But installed to the
 *              iPhone home screen and launched full-screen, with a translucent
 *              status bar, it comes up around 60px short of the screen, leaving
 *              a strip of paper under the tab bar. That was the last symptom
 *              standing.
 *
 * `visualViewport.height` is what all three of those units are approximating,
 * and it is right in all of them — browser, standalone, either orientation. So
 * measure it and let CSS use the number. `100dvh` stays as the fallback for the
 * first paint before this runs.
 *
 * The keyboard is deliberately excluded. iOS shrinks the visual viewport while
 * it's open; shrinking the shell to match would slide the tab bar up mid-typing
 * and reflow the screen underneath. Holding the full height instead lets the
 * keyboard overlay the app, which is how a native app behaves, and the browser
 * still scrolls the focused field into view.
 *
 * Deliberately not a React effect: it's a property of the document, it must
 * outlive any particular screen, and there is nothing to re-run on a re-render.
 */

/** How much shorter the visual viewport gets before we call it a keyboard.
 *  Comfortably above any browser toolbar, comfortably below any keyboard. */
const KEYBOARD_THRESHOLD_PX = 120;

function keyboardIsOpen(): boolean {
  const vv = window.visualViewport;
  return Boolean(vv) && window.innerHeight - vv!.height > KEYBOARD_THRESHOLD_PX;
}

function visibleHeight(): number {
  const vv = window.visualViewport;
  return Math.round(vv ? vv.height : window.innerHeight);
}

export function pinShellToViewport(): void {
  const apply = () => {
    // While the keyboard is up, keep the last full-height value.
    if (keyboardIsOpen()) return;
    document.documentElement.style.setProperty("--app-h", `${visibleHeight()}px`);

    // iOS scrolls the document to lift a focused input above the keyboard —
    // it does that even here, where body is overflow:hidden and there is
    // nothing to scroll — and doesn't always scroll back. Left alone, the whole
    // shell sits that far up with background showing beneath it.
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
  };

  apply();

  const vv = window.visualViewport;
  window.addEventListener("resize", apply);
  vv?.addEventListener("resize", apply);
  // Safari settles both the toolbar and the keyboard over an animation that
  // fires no final event, so re-check once it has finished.
  window.addEventListener("orientationchange", () => setTimeout(apply, 350));
  window.addEventListener("focusout", () => {
    requestAnimationFrame(apply);
    setTimeout(apply, 350);
  });
  // Returning from the background can restore a different chrome state.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) setTimeout(apply, 100);
  });
}
