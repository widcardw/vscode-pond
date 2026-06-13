import { Container, DisplacementFilter, Sprite, Texture, TilingSprite } from 'pixi.js'

export interface WaterEffect {
  sprite: Sprite
  filter: DisplacementFilter
}

/**
 * Create and add a water-wave displacement filter to the stage.
 * The displacement map is generated programmatically (no external asset needed).
 */
export function addWaterDisplacement(stage: Container, _screenWidth: number, _screenHeight: number): WaterEffect {
  const texture = Texture.from('displacement')

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
