import { Container, Graphics } from 'pixi.js'
import type { Fish } from './fishes'

// ─── Food pellet ──────────────────────────────────────────────────────────

interface FoodPellet {
  x: number
  y: number
  vy: number
  radius: number
  active: boolean
}

const pellets: FoodPellet[] = []
let gfx: Graphics | null = null
let _screenHeight = 0

const EAT_RADIUS = 25
const ATTRACT_RADIUS = 220
const ATTRACT_RADIUS_SQ = ATTRACT_RADIUS * ATTRACT_RADIUS
const CHASE_DURATION = 360  // ~6s before giving up (slower speed needs more time)

export function initFood(stage: Container) {
  gfx = new Graphics()
  stage.addChild(gfx)
}

export function spawnFood(x: number, y: number) {
  pellets.push({
    x,
    y,
    vy: 0.9 + Math.random() * 0.3,
    radius: 4 + Math.random() * 2,
    active: true,
  })
}

export function tickFood(fishes: Fish[], screenHeight: number, delta: number) {
  if (!gfx) return

  _screenHeight = screenHeight

  gfx.clear()

  for (let pi = pellets.length - 1; pi >= 0; pi--) {
    const pellet = pellets[pi]

    // Fall down
    pellet.y += pellet.vy * delta

    // Remove if off-screen (below bottom)
    if (pellet.y > _screenHeight + 30) {
      pellets.splice(pi, 1)
      // Also release any fish chasing this pellet
      for (const fish of fishes) {
        if (fish.isChasingFood) {
          fish.isChasingFood = false
          fish.speed = fish.savedSpeed
        }
      }
      continue
    }

    // Draw pellet — small golden-brown sphere (fish food)
    gfx.circle(pellet.x, pellet.y, pellet.radius)
    gfx.fill({ color: 0xc99a3b, alpha: 0.9 })
    // Lighter highlight
    gfx.circle(pellet.x - 1, pellet.y - 1, pellet.radius * 0.4)
    gfx.fill({ color: 0xe8c56a, alpha: 0.5 })

    // Attract nearby fish
    for (const fish of fishes) {
      if (!pellet.active) break

      // Skip fish already busy
      if (fish.flipTimer > 0) continue
      if (fish.fleeCooldown > 0) continue
      if (fish.isChasingFood) continue
      if (fish.fleeBoost > 0) continue

      const dx = pellet.x - fish.x
      const dy = pellet.y - fish.y
      const distSq = dx * dx + dy * dy

      if (distSq < ATTRACT_RADIUS_SQ) {
        // Only about half the fish react to the food
        if (Math.random() > 0.5) continue

        // Start chasing!
        fish.isChasingFood = true
        fish.foodTargetX = pellet.x
        fish.foodTargetY = pellet.y
        fish.savedSpeed = fish.speed
        fish.chaseTimer = CHASE_DURATION
        // Set direction and speed immediately so the fish turns
        // toward the food on the very first frame
        fish.direction = Math.atan2(dx, dy)
        // Gentle speed boost — no more mad rush
        fish.speed = fish.savedSpeed * 2
      }
    }

    // Update fish that are chasing this pellet
    for (const fish of fishes) {
      if (!fish.isChasingFood || fish.chaseTimer <= 0) continue

      // Update target position to follow the falling pellet
      fish.foodTargetX = pellet.x
      fish.foodTargetY = pellet.y

      const dx = pellet.x - fish.x
      const dy = pellet.y - fish.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Steer toward food
      fish.direction = Math.atan2(dx, dy)
      // Gentle speed boost (capped at 2x)
      fish.speed = Math.min(fish.savedSpeed * 2, fish.speed + 0.1)

      // Check if close enough to eat
      if (dist < EAT_RADIUS) {
        // Eat the food!
        pellet.active = false
        pellets.splice(pi, 1)
        fish.isChasingFood = false
        fish.speed = fish.savedSpeed
        // Small visual burst when food is eaten
        gfx.circle(pellet.x, pellet.y, 12)
        gfx.fill({ color: 0xf0d080, alpha: 0.6 })
        gfx.circle(pellet.x, pellet.y, 6)
        gfx.fill({ color: 0xfff0b0, alpha: 0.8 })
        // Release other fish chasing this pellet
        for (const other of fishes) {
          if (other !== fish && other.isChasingFood) {
            other.isChasingFood = false
            other.speed = other.savedSpeed
          }
        }
        break
      }
    }
  }
}

/** Call from resize handler to prevent stale screen height */
export function updateFoodScreenHeight(h: number) {
  _screenHeight = h
}
