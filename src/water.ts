import { Container, DisplacementFilter, Sprite, Texture, TilingSprite } from 'pixi.js'

const TILE_SIZE = 256

// ─── Displacement map (underwater distortion) ──────────────────────────────

/** Generate a tileable displacement map with layered wave patterns */
function generateWaterDisplacementMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TILE_SIZE
  canvas.height = TILE_SIZE
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(TILE_SIZE, TILE_SIZE)

  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const nx = x / TILE_SIZE
      const ny = y / TILE_SIZE

      // Layered sine waves at different frequencies + angles for natural water ripples
      const w1 = Math.sin(nx * 8 * Math.PI + ny * 3 * Math.PI)
      const w2 = Math.sin(nx * 5 * Math.PI - ny * 7 * Math.PI) * 0.7
      const w3 = Math.sin((nx + ny) * 6 * Math.PI) * 0.5
      const w4 = Math.sin(nx * 11 * Math.PI - ny * 4 * Math.PI) * 0.3
      const value = (w1 + w2 + w3 + w4) / 4

      // Map from [-1, 1] to [0, 255] — centered at 128 = no displacement
      const pixel = Math.round((value + 1) * 127.5)

      const idx = (y * TILE_SIZE + x) * 4
      imageData.data[idx] = pixel      // R → horizontal displacement
      imageData.data[idx + 1] = pixel  // G → vertical displacement
      imageData.data[idx + 2] = 128    // B unused
      imageData.data[idx + 3] = 255    // A
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export interface WaterEffect {
  sprite: Sprite
  filter: DisplacementFilter
}

/**
 * Create and add a water-wave displacement filter to the stage.
 * The displacement map is generated programmatically (no external asset needed).
 */
export function addWaterDisplacement(stage: Container, _screenWidth: number, _screenHeight: number): WaterEffect {
  const mapCanvas = generateWaterDisplacementMap()
  const texture = Texture.from(mapCanvas)

  // Make the displacement texture tile seamlessly
  texture.baseTexture.wrapMode = 'repeat'

  // The sprite whose texture is used as the displacement map
  const sprite = new Sprite(texture)

  const filter = new DisplacementFilter({
    sprite,
    scale: { x: 20, y: 20 },
  })

  stage.filters = [filter]

  return { sprite, filter }
}

/** Slowly scroll the displacement sprite to simulate flowing water */
export function animateWater(sprite: Sprite, delta: number) {
  // Scroll diagonally at a slow pace — feels like gentle current + surface ripple
  sprite.x -= delta * 0.12
  sprite.y -= delta * 0.06
}

// ─── Water surface overlay (tiling sprite from public/wave_overlay.png) ──

export interface WaterOverlay {
  tilingSprite: TilingSprite
}

/**
 * Create and add a water surface overlay (TilingSprite) on top of the stage.
 * Uses the preloaded 'overlay' asset from public/wave_overlay.png.
 */
export function addWaterOverlay(stage: Container, screenWidth: number, screenHeight: number): WaterOverlay {
  const texture = Texture.from('overlay')
  texture.baseTexture.wrapMode = 'repeat'

  const tilingSprite = new TilingSprite({
    texture,
    width: screenWidth,
    height: screenHeight,
  })

  stage.addChild(tilingSprite)

  // Lower the overlay opacity so it's more subtle
  tilingSprite.alpha = 0.3

  return { tilingSprite }
}

export function animateWaterOverlay(tilingSprite: TilingSprite, delta: number) {
  tilingSprite.tilePosition.x -= delta * 0.5
  tilingSprite.tilePosition.y -= delta * 0.3
}
