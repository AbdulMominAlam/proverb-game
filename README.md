# Proverbial

> *"Not my circus, not my monkeys."*
>
> Huh? (It's Polish, and it means *not my problem*.)

**Proverbial** is a daily puzzle about the world's best sayings, translated word for word
into gloriously odd English. Every day, everyone gets the same proverb. Your job: work out
what on earth it means, then guess where it's from.

🎯 **[Play it at playproverbial.com](https://playproverbial.com)**

## How it works

1. **Read** the literal translation. Squint at it a bit.
2. **Guess the meaning** in your own words. No multiple choice and no exact wording needed:
   a small AI model running right in your browser judges how close your guess is. You get
   5 tries and 3 hints, and it tells you if you're cold, warm, or very close.
3. **Guess the country** on the world map. Each wrong guess lights up a heat map showing how
   far off you are. You get 10 tries.
4. **Share** your result without spoilers, and keep your streak alive tomorrow.

```
Proverbial #12
🧠 🟥🟧🟩 (1 hint)
🌍 🟧🟨✅
https://playproverbial.com
```

## Run it yourself

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build into dist/
```

It's a static site with no backend: no accounts, no servers, and your guesses never
leave your device. Deploy `dist/` anywhere, for example Vercel.

Dev-only tricks: `?day=N` plays puzzle #N and `?reset` wipes your saved progress and stats.

## Renaming the game

The name, URL, tagline and description live in `src/config.js` (`GAME_NAME`, `SITE_URL`,
`SITE_TAGLINE`, `SITE_DESCRIPTION`). The app and `index.html` pick them up automatically.
The link-preview image and icons are generated files, so regenerate them after a change:

```sh
npm run share-images   # writes public/og-image.png, favicon.svg, favicon.ico, apple-touch-icon.png
```

## Adding proverbs

The world has a lot of proverbs. Here's how to add them without breaking anyone's day.

Puzzle #N is always entry N in `src/data/proverbs.json` (puzzle #1 is the first entry), so the
order of the list is the schedule.

- **Append to the end only.** Never reorder or remove entries: that would change past puzzles
  and today's puzzle for people mid-game.
- **Mix up the languages.** Any 5 consecutive entries should all be in different languages.
- **Keep a week or more in hand.** In dev, the console warns when fewer than 7 proverbs remain
  after today.

If the list runs out, the game shows a "check back tomorrow" screen and streaks carry over that
day. The entries you append next still count from the missed day, so the first ones fill the
missed slots and are never shown.
