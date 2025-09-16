
# Monopoly – Mouse Only (4 players)

A fully playable, point-and-click Monopoly clone built with **Vite + React + TypeScript** and **Tailwind**.  
Deployed to **GitHub Pages** at `https://dacrap123.github.io/monopoly/` once you push to `main`.

## Quick start
```bash
npm i
npm run dev         # http://localhost:5173
npm run build       # output in dist/
npm run preview
```

## Notes
- No typing, no drag-and-drop. All actions are buttons/menus.
- State persists in `localStorage`.
- Restart button wipes state after confirmation.
- Bottom-right: your owned properties as cards with action buttons.
- Full 11×11 visual board with tile colors and token badges.
- Buy/Auction, Rent (props/rails/utils), Houses/Hotels (even-build), Mortgage/Unmortgage,
  Chance/Chest, Jail, Trading, Bankruptcy & win detection.

## Deploy to GitHub Pages
1. Run `npm run build` to regenerate the production bundle.
2. Commit the updated contents of the tracked `docs/` directory (mirrors `dist/`).
3. In repo **Settings → Pages**, set **Source** to `main` and **Branch folder** to `/docs`.
