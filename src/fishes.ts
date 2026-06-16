import { Container, Sprite } from 'pixi.js'

// Extend Sprite with fish-specific properties
export interface Fish extends Sprite {
  direction: number
  speed: number
  turnSpeed: number
  baseScale: number
  // Flip animation state
  flipTimer: number         // remaining time in flip animation (frame units)
  flipDuration: number      // total duration of the flip
  originalSpeed: number     // speed before flip started
  flipStartScale: number    // scale.x value at the moment flip window begins
  flipStartRotation: number // sprite rotation when flip window begins
  flipTriggered: boolean    // whether direction has been flipped in this cycle
  inFlipWindow: boolean     // true during the card-flip phase (scale.x animation)
  flipCooldown: number      // frames before another flip can trigger
  flipTargetDirection: number | null  // if set, flip toward this direction instead of +π
  flipEndSpeed: number | null         // if set, speed after flip ends instead of originalSpeed
  // Flee state
  fleeCooldown: number      // frames before this fish can flee again
  fleeBoost: number         // remaining frames of speed boost when fleeing
  // Food-chase state
  isChasingFood: boolean
  foodTargetX: number
  foodTargetY: number
  chaseTimer: number        // remaining frames of chase (gives up after timeout)
  savedSpeed: number        // speed before chase started
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

    // Flip animation init
    fish.flipTimer = 0
    fish.flipDuration = 0
    fish.originalSpeed = fish.speed
    fish.flipStartScale = baseScale
    fish.flipStartRotation = 0
    fish.flipTriggered = false
    fish.inFlipWindow = false
    fish.flipCooldown = 0
    fish.flipTargetDirection = null
    fish.flipEndSpeed = null
    fish.fleeCooldown = 0
    fish.fleeBoost = 0
    fish.isChasingFood = false
    fish.foodTargetX = 0
    fish.foodTargetY = 0
    fish.chaseTimer = 0
    fish.savedSpeed = fish.speed

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
    // Tick cooldowns
    if (fish.flipCooldown > 0) fish.flipCooldown -= delta
    if (fish.fleeCooldown > 0) fish.fleeCooldown -= delta

    // Decay flee speed boost back to original (skip during flip)
    if (fish.fleeBoost > 0 && fish.flipTimer <= 0) {
      fish.fleeBoost -= delta
      if (fish.fleeBoost <= 0) {
        fish.fleeBoost = 0
      }
      // Exponential decay: boosted speed → original speed smoothly
      fish.speed = fish.originalSpeed + (fish.speed - fish.originalSpeed) * 0.88
    }

    // ── Chase timer decay ──────────────────────────────────────────
    if (fish.isChasingFood) {
      fish.chaseTimer -= delta
      if (fish.chaseTimer <= 0) {
        // Give up: return to normal behavior
        fish.isChasingFood = false
        fish.speed = fish.savedSpeed
      }
    }

    const isFlipping = fish.flipTimer > 0
    fish.inFlipWindow = false

    // ── Flip animation ──────────────────────────────────────────────
    if (isFlipping) {
      fish.flipTimer -= delta
      const progress = 1 - fish.flipTimer / fish.flipDuration  // 0 → 1

      const isFleeFlip = fish.flipEndSpeed !== null

      // Speed curve: for random flips only (flee flips keep their boosted speed)
      if (!isFleeFlip) {
        if (progress < 0.35) {
          // Decelerate
          const t = progress / 0.35
          fish.speed = fish.originalSpeed * (1 - t * t)
        } else if (progress < 0.55) {
          fish.speed = 0
        } else {
          // Accelerate
          const t = (progress - 0.55) / 0.45
          fish.speed = fish.originalSpeed * (t * t)
        }
      }

      if (progress >= 0.35 && progress < 0.55) {
        // ── Card-flip window ────────────────────────────────────────
        fish.inFlipWindow = true

        // Normalised progress within the flip window [0, 1]
        const flipT = (progress - 0.35) / 0.2

        // Animate scale.x from flipStartScale → 0 → −flipStartScale
        fish.scale.x = fish.flipStartScale * Math.cos(flipT * Math.PI)
        fish.scale.y = fish.baseScale

        // Keep rotation frozen during the flip
        fish.rotation = fish.flipStartRotation

        // Flip movement direction at the visual midpoint
        if (!fish.flipTriggered && flipT >= 0.5) {
          if (fish.flipTargetDirection !== null) {
            fish.direction = fish.flipTargetDirection
            fish.flipTargetDirection = null
            // Boost speed at the same moment — no premature rush
            if (fish.flipEndSpeed !== null) {
              fish.speed = fish.flipEndSpeed
            }
          } else {
            fish.direction += Math.PI
          }
          fish.flipTriggered = true
        }
      }

      if (fish.flipTimer <= 0) {
        fish.speed = fish.flipEndSpeed !== null ? fish.flipEndSpeed : fish.originalSpeed
        fish.flipEndSpeed = null
        fish.flipCooldown = 120  // ~2s cooldown before another flip can trigger
      }
    } else if (!fish.isChasingFood) {
      // Only trigger a new flip when cooldown has elapsed
      if (fish.flipCooldown <= 0 && Math.random() < 0.0002 * delta) {
        fish.originalSpeed = fish.speed
        fish.flipDuration = 40 + Math.random() * 30  // ~0.7–1.2s at 60fps
        fish.flipTimer = fish.flipDuration
        fish.flipStartScale = fish.scale.x  // capture current scale.x for smooth transition
        fish.flipStartRotation = fish.rotation
        fish.flipTriggered = false
      }
    }

    // ── Normal movement ─────────────────────────────────────────────
    // Skip turnSpeed during chase (direction is set by tickFood)
    if (!isFlipping && fish.fleeBoost <= 0 && !fish.isChasingFood) {
      fish.direction += fish.turnSpeed * 0.01
    }
    fish.x += Math.sin(fish.direction) * fish.speed * delta
    fish.y += Math.cos(fish.direction) * fish.speed * delta

    // ── Rotation & scale (skipped during the card-flip window) ──────
    if (!fish.inFlipWindow) {
      let rotation = -fish.direction + Math.PI / 2

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
    }

    // ── Screen edge wrap ────────────────────────────────────────────
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
