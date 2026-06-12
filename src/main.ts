import { Application, Assets } from 'pixi.js'
import { addFishes, animateFishes } from './fishes'
import type { Fish } from './fishes'
import { addWaterDisplacement, animateWater } from './water'

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

  // Add water displacement (wave distortion) — applied to the entire stage
  const water = addWaterDisplacement(app.stage, app.screen.width, app.screen.height)

  // Add fishes (VS Code icons)
  const fishes: Fish[] = []
  addFishes(app, fishes)

  // Tick: animate fishes + water
  app.ticker.add((time) => {
    animateFishes(app, fishes, time)
    animateWater(water.sprite, time.deltaTime)
  })
}

async function preload() {
  const assets = [
    { alias: 'vscode1', src: '/file_type_vscode_icon_130084.png' },
    { alias: 'vscode2', src: '/file_type_vscode_insiders_icon_130085.png' },
    { alias: 'vscode3', src: '/vscode-orange.png' },
    { alias: 'vscode4', src: '/vscode-pink.png' },
  ]
  await Assets.load(assets)
}

init()
