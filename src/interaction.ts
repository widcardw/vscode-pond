import { Container, Graphics } from 'pixi.js'
import type { Fish } from './fishes'

// ─── Drag state (shared with splash system) ───────────────────────────────

export let isDragging = false
export let cursorX = 0
export let cursorY = 0

// Track pointer movement speed (for splash intensity)
let prevCursorX = 0
let prevCursorY = 0
// Click vs drag detection
let pointerDownX = 0
let pointerDownY = 0
let hasMoved = false
const CLICK_THRESHOLD = 5

// ─── Fish flee logic ──────────────────────────────────────────────────────

const FLEE_RADIUS = 200
const FLEE_RADIUS_SQ = FLEE_RADIUS * FLEE_RADIUS
const SPEED_MULTIPLIER = 5
const FLEE_COOLDOWN_FRAMES = 120  // ~2s before a fish can flee again
const FLEE_BOOST_FRAMES = 45      // ~0.75s of boosted speed
const FLEE_SCAN_INTERVAL = 4      // only scan every N frames during drag

let fleeFrameCount = 0

export function setupInteraction(canvas: HTMLCanvasElement, fishes: Fish[], _stage: Container, onClick?: (x: number, y: number) => void) {
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true
    cursorX = e.clientX
    cursorY = e.clientY
    prevCursorX = cursorX
    prevCursorY = cursorY
    pointerDownX = cursorX
    pointerDownY = cursorY
    hasMoved = false
    fleeFrameCount = 0
    // Don't flee yet — wait to distinguish click from drag
  })

  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return
    prevCursorX = cursorX
    prevCursorY = cursorY
    cursorX = e.clientX
    cursorY = e.clientY

    // Check if moved enough to be considered a drag
    const dist = Math.hypot(cursorX - pointerDownX, cursorY - pointerDownY)
    if (dist > CLICK_THRESHOLD) {
      hasMoved = true
      fleeFrameCount++
      if (fleeFrameCount % FLEE_SCAN_INTERVAL === 0) {
        triggerFlee(cursorX, cursorY, fishes)
      }
    }
  })

  const endDrag = () => {
    if (isDragging && !hasMoved && onClick) {
      // It was a click (no significant movement) — spawn food
      onClick(cursorX, cursorY)
    }
    isDragging = false
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointerleave', endDrag)
}

function triggerFlee(mx: number, my: number, fishes: Fish[]) {
  for (const fish of fishes) {
    if (fish.flipTimer > 0) continue
    if (fish.fleeCooldown > 0) continue

    const dx = fish.x - mx
    const dy = fish.y - my
    const distSq = dx * dx + dy * dy

    if (distSq < FLEE_RADIUS_SQ) {
      const fleeDir = Math.atan2(dx, dy)  // direction away from mouse

      // Angle diff between current direction and flee direction
      let diff = fleeDir - fish.direction
      // Normalise to [-π, π]
      if (diff > Math.PI) diff -= 2 * Math.PI
      if (diff < -Math.PI) diff += 2 * Math.PI

      if (Math.abs(diff) > 2 * Math.PI / 3) {
        // ── Sharp turn (> 120°) — use a short card-flip around the bisector ──
        fish.flipTimer = 0
        fish.flipCooldown = 90

        // Angle bisector of current direction and flee direction
        const bisector = fish.direction + diff / 2
        // Convert bisector to sprite rotation
        const bisectorRotation = -bisector + Math.PI / 2

        fish.flipDuration = 18  // ~0.3s at 60fps
        fish.flipTimer = fish.flipDuration
        fish.flipStartScale = fish.scale.x
        fish.flipStartRotation = bisectorRotation
        fish.flipTriggered = false
        fish.flipTargetDirection = fleeDir
        // Speed will be boosted at the flip midpoint (when direction changes)
        fish.flipEndSpeed = fish.originalSpeed * SPEED_MULTIPLIER

        fish.fleeCooldown = FLEE_COOLDOWN_FRAMES
        fish.fleeBoost = FLEE_BOOST_FRAMES
      } else {
        // ── Gentle turn (≤ 120°) — instant direction change ──
        fish.flipTimer = 0
        fish.flipCooldown = 90
        fish.speed = fish.originalSpeed * SPEED_MULTIPLIER
        fish.direction = fleeDir
        fish.fleeCooldown = FLEE_COOLDOWN_FRAMES
        fish.fleeBoost = FLEE_BOOST_FRAMES
      }
    }
  }
}

// ─── Drag splash particles ────────────────────────────────────────────────

interface SplashParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number    // remaining frames
  maxLife: number
  radius: number  // starting radius
}

const MAX_PARTICLES = 100
const particles: SplashParticle[] = []
let gfx: Graphics | null = null

/** Call once per frame from the ticker to spawn + animate splash particles */
export function tickSplash(delta: number) {
  if (!gfx) return

  // Spawn new particles while dragging
  if (isDragging) {
    // Mouse movement speed factor: 0 (still) → 1 (fast)
    const dist = Math.hypot(cursorX - prevCursorX, cursorY - prevCursorY)
    const speedFactor = Math.min(1, dist / 12)

    // Number of particles scales with mouse speed (0–4)
    const count = Math.ceil(speedFactor * 4)
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break
      const maxLife = 22 + Math.random() * 18  // ~22–40 frames
      particles.push({
        x: cursorX + (Math.random() - 0.5) * 24,
        y: cursorY + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 4.5 * speedFactor,
        vy: ((Math.random() - 0.5) * 4.5 - 0.6) * speedFactor,
        life: maxLife,
        maxLife,
        radius: (3 + Math.random() * 5) * speedFactor,
      })
    }
  }

  // Clear and redraw
  gfx.clear()

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= delta
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }

    // Move
    p.x += p.vx * delta
    p.y += p.vy * delta
    p.vy += 0.04 * delta  // slight gravity

    // Fade & shrink
    const t = 1 - p.life / p.maxLife
    const alpha = (1 - t) * 0.6
    const radius = p.radius * (1 - t * 0.7)

    gfx.circle(p.x, p.y, radius)
    gfx.fill({ color: 0xaaccff, alpha })
  }
}

/** Create the Graphics layer for splash particles */
export function initSplash(stage: Container) {
  gfx = new Graphics()
  // Place above the water overlay (highest z-order)
  stage.addChild(gfx)
}
