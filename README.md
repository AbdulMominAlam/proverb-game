# Proverbial

A daily proverb guessing game. Each day everyone gets the same proverb from another language, shown as a literal English translation. Work out what it means, then guess which country it comes from.

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
