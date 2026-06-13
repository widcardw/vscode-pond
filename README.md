# VSCode Pond

A PixiJS v8 fish pond animation where VS Code icons swim like fish across a deep ocean background with water ripple distortion effects.

## Preview

The page displays VS Code logo icons swimming across a dark blue gradient canvas, with subtle water-wave displacement distortion for a submerged feel.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
pnpm build
pnpm preview
```

## How It Works

- Built with [PixiJS](https://pixijs.com/) v8 rendering engine, with the official tutorial [Fish Pond](https://pixijs.com/8.x/tutorials/fish-pond) ([repo](https://github.com/youyoumu/fish-pond))
- Icons from `public/` are loaded as sprites and animated with smooth brownian-style movement
- A programmatically generated displacement map creates the underwater wave distortion
- CSS radial gradient provides the deep ocean background (canvas is transparent)

## Project Structure

```
vscode-pond/
├── index.html            # Entry HTML
├── src/
│   ├── main.ts           # App init, asset preloading, ticker setup
│   ├── fishes.ts         # Fish creation and swimming animation
│   ├── water.ts          # Displacement map generation and water effect
│   └── style.css         # Full-screen canvas + ocean background
├── public/               # VS Code icon PNGs (served as fish sprites)
└── vite.config.ts
```
