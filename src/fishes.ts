import { Container, Sprite } from 'pixi.js'

// Extend Sprite with fish-specific properties
export interface Fish extends Sprite {
  direction: number
  speed: number
  turnSpeed: number
  baseScale: number
}

const FISH_ASSETS = ['vscode1', 'vscode2', 'vscode3', 'vscode4']
const FISH_COUNT = 40

export function addFishes(app: { screen: { width: number; height: number }; stage: Container }, fishes: Fish[]) {
  const fishContainer = new Container()
  app.stage.addChild(fishContainer)

  for (let i = 0; i < FISH_COUNT; i++) {
    const assetName = FISH_ASSETS[i % FISH_ASSETS.length]
    const fish = Sprite.from(assetName) as Fish

    fish.anchor.set(0.5)

    // Movement properties
    fish.direction = Math.random() * Math.PI * 2
    fish.speed = 1.5 + Math.random() * 2
    fish.turnSpeed = (Math.random() - 0.5) * 0.8

    // Position randomly across the screen
    fish.x = Math.random() * app.screen.width
    fish.y = Math.random() * app.screen.height

    // Random scale — store as baseScale for the flip logic in animation
    const baseScale = 0.07 + Math.random() * 0.1
    fish.scale.set(baseScale)
    fish.baseScale = baseScale

    fishContainer.addChild(fish)
    fishes.push(fish)
  }
}

export function animateFishes(app: { screen: { width: number; height: number } }, fishes: Fish[], time: { deltaTime: number }) {
  const delta = time.deltaTime

  const stagePadding = 100
  const boundWidth = app.screen.width + stagePadding * 2
  const boundHeight = app.screen.height + stagePadding * 2

  for (const fish of fishes) {
    // Update direction (brownian-style movement)
    fish.direction += fish.turnSpeed * 0.01

    // Move
    fish.x += Math.sin(fish.direction) * fish.speed * delta
    fish.y += Math.cos(fish.direction) * fish.speed * delta

    // Calculate rotation so the RIGHT side of the icon (= fish head) faces movement direction
    // rotation = 0 means the sprite's right side faces east (default)
    let rotation = -fish.direction + Math.PI / 2

    // Keep the sprite upright (not upside-down) by flipping horizontally when needed.
    // Use >= / <= to avoid a visual snap at the exact boundary.
    const baseScale = fish.baseScale
    if (rotation >= Math.PI / 2) {
      rotation -= Math.PI
      fish.scale.x = -baseScale
      fish.scale.y = baseScale
    } else if (rotation <= -Math.PI / 2) {
      rotation += Math.PI
      fish.scale.x = -baseScale
      fish.scale.y = baseScale
    } else {
      fish.scale.x = baseScale
      fish.scale.y = baseScale
    }
    fish.rotation = rotation

    // Wrap around screen edges
    if (fish.x < -stagePadding) {
      fish.x += boundWidth
    }
    if (fish.x > app.screen.width + stagePadding) {
      fish.x -= boundWidth
    }
    if (fish.y < -stagePadding) {
      fish.y += boundHeight
    }
    if (fish.y > app.screen.height + stagePadding) {
      fish.y -= boundHeight
    }
  }
}
