export function waitForPrintMapTiles(maxWaitMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".print-day-map img"));
    if (imgs.length === 0) {
      resolve();
      return;
    }
    let remaining = imgs.length;
    let settled = false;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0 && !settled) {
        settled = true;
        resolve();
      }
    };
    imgs.forEach((img) => {
      if (img.complete) {
        done();
      } else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve();
      }
    }, maxWaitMs);
  });
}
