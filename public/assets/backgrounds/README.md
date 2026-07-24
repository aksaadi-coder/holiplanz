# Destination background photos

Drop city / country photos here to power the blurred background that reacts to
the destination the user types on the Home screen.

## How to add one

1. Add an image file to this folder, e.g. `paris.jpg`.
   - Landscape orientation, ideally ~1200px wide, compressed under ~300 KB.
   - `.jpg`, `.png`, or `.webp` all work.
2. Register it in [`src/data/destinationBackgrounds.ts`](../../../src/data/destinationBackgrounds.ts):

   ```ts
   { image: "paris.jpg", match: ["paris", "france"] },
   ```

   `match` is a list of lowercase keywords. If the destination the user types
   contains any of them, this photo is used. Put cities above countries so the
   more specific photo wins.

The filename in the data file must match the file here EXACTLY, including
capitalization — the app is case-sensitive once deployed to Vercel/Linux.

## Currently included

- `Japan.png` — Mount Fuji / Japan (also the default fallback)
- `London.png` — London / Big Ben
- `Paris.png` — Paris / Eiffel Tower

## Default

`Japan.png` is the fallback shown when the typed destination matches nothing.
To change the default, update `DEFAULT_BACKGROUND` in the data file.
