# Proverbial

A daily proverb guessing game. Each day everyone gets the same proverb from another language, shown as a literal English translation. Work out what it means, then guess which country it comes from.

Play at [playproverbial.com](https://playproverbial.com).

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build into dist/
```

It's a static site with no backend. Deploy `dist/` anywhere, for example Vercel.

## Renaming the game

The name, URL, tagline and description live in `src/config.js` (`GAME_NAME`, `SITE_URL`,
`SITE_TAGLINE`, `SITE_DESCRIPTION`). The app and `index.html` pick them up automatically.
The link-preview image and icons are generated files, so regenerate them after a change:

```sh
npm run share-images   # writes public/og-image.png, favicon.svg, favicon.ico, apple-touch-icon.png
```

## Adding proverbs

Puzzle #N is always entry N in `src/data/proverbs.json` (puzzle #1 is the first entry), so the
order of the list is the schedule.

- Append new proverbs to the end only. Never reorder or remove entries: that would change
  past puzzles and today's puzzle for people mid-game.
- Don't let a language repeat within 5 days: any 5 consecutive entries should all be in
  different languages.
- Keep a week or more in hand. In dev, the console warns when fewer than 7 proverbs remain
  after today.

If the list runs out, the game shows a "check back tomorrow" screen and streaks carry over that
day. The entries you append next still count from the missed day, so the first ones fill the
missed slots and are never shown.
