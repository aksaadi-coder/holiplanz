/**
 * Keeps the app shell pinned to the viewport after the on-screen keyboard.
 *
 * The bug this exists for, on iPhone: focusing a field — the start-date and
 * days inputs on Home are the ones that trigger it — makes Safari scroll the
 * document to reveal the input above the keyboard. It does that even here,
 * where `body` is `overflow: hidden` and there is nothing to scroll. When the
 * keyboard closes, that scroll is not always undone. The shell is exactly one
 * viewport tall, so a document scrolled down by N pixels leaves it sitting N
 * pixels high, with a strip of body background showing under the tab bar — and
 * it stays that way on every screen after, until the app is reopened.
 *
 * Resetting the scroll puts it back. Two rules make that safe:
 *
 * - Only when the keyboard is *closed*. Resetting while it's open would undo
 *   the scroll Safari performed to keep the focused field visible, and hide
 *   what the user is typing behind the keyboard.
 * - Only when there is actually a stray offset, so this is a no-op on every
 *   platform that doesn't have the problem.
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

export function pinShellToViewport(): void {
  const reset = () => {
    if (keyboardIsOpen()) return;
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
  };

  // Safari does its scrolling *after* the blur, and again when the keyboard
  // finishes animating out — so check on the next frame and once more after.
  window.addEventListener("focusout", () => {
    requestAnimationFrame(reset);
    setTimeout(reset, 350);
  });

  // Fires as the keyboard opens and closes; the guard above ignores the open.
  window.visualViewport?.addEventListener("resize", reset);
  window.addEventListener("orientationchange", () => setTimeout(reset, 350));
}
