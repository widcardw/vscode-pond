import { Application, Assets } from 'pixi.js'
import { addFishes, animateFishes } from './fishes'
import type { Fish } from './fishes'
import { addWaterDisplacement, animateWater, addWaterOverlay, animateWaterOverlay } from './water'
import { setupInteraction, initSplash, tickSplash } from './interaction'
import { initFood, spawnFood, tickFood } from './food'

const app = new Application()

async function init() {
  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })
  document.body.appendChild(app.canvas)

  await preload()

  // 1. Water displacement (distortion filter) — applied to the entire stage
  const water = addWaterDisplacement(app.stage, app.screen.width, app.screen.height)

  // 2. Add fishes (VS Code icons)
  const fishes: Fish[] = []
  addFishes(app, fishes)

  // 3. Water surface overlay (on top of fishes)
  const overlay = addWaterOverlay(app.stage, app.screen.width, app.screen.height)

  // 4. Food system (renders above overlay)
  initFood(app.stage)

  // 5. Mouse drag interaction + splash particles (renders on top of everything)
  setupInteraction(app.canvas, fishes, app.stage, (x, y) => {
    spawnFood(x, y)
  })
  initSplash(app.stage)

  // Tick: animate everything
  app.ticker.add((time) => {
    animateFishes(app, fishes, time)
    tickFood(fishes, app.screen.height, time.deltaTime)
    tickSplash(time.deltaTime)
    animateWater(water.sprite, time.deltaTime)
    animateWaterOverlay(overlay.tilingSprite, time.deltaTime)
  })
}

async function preload() {
  const assets = [
    { alias: 'vscode1', src: '/file_type_vscode_icon_130084.png' },
    { alias: 'vscode2', src: '/file_type_vscode_insiders_icon_130085.png' },
    { alias: 'vscode3', src: '/vscode-orange.png' },
    { alias: 'vscode4', src: '/vscode-pink.png' },
    { alias: 'overlay', src: '/wave_overlay.png' },
    { alias: 'displacement', src: '/displacement_map.png' },
  ]
  await Assets.load(assets)
}

init()
