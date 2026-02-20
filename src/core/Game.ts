import { Application, Container, Graphics } from 'pixi.js';
import {
  PLAYFIELD_WIDTH,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_RECT,
  PLAYFIELD_BG_COLOR,
  APP_BG_COLOR,
  MASK_FILL_COLOR,
  FULL_OPACITY,
  MS_PER_SECOND,
} from '../config/constants';
import { ShapeSpawner } from './ShapeSpawner';
import { fitPlayfieldToView } from './Viewport';
import { updateHud } from '../ui/Hud';

export type GameOptions = {
  container: HTMLElement;
  getSpawnRate: () => number;
  getGravity: () => number;
  hudCountId?: string;
  hudAreaId?: string;
};

export class Game {
  private readonly container: HTMLElement;
  private readonly hudCountId: string | undefined;
  private readonly hudAreaId: string | undefined;
  private app!: Application;
  private playfield!: Container;
  private spawner!: ShapeSpawner;
  private readonly getSpawnRate: () => number;
  private readonly getGravity: () => number;

  constructor(options: GameOptions) {
    this.container = options.container;
    this.hudCountId = options.hudCountId;
    this.hudAreaId = options.hudAreaId;
    this.getSpawnRate = options.getSpawnRate;
    this.getGravity = options.getGravity;
  }

  async init(): Promise<void> {
    const app = new Application();
    await app.init({
      background: APP_BG_COLOR,
      resizeTo: this.container,
      antialias: true,
    });
    this.container.appendChild(app.canvas);
    this.app = app;

    this.playfield = new Container();
    app.stage.addChild(this.playfield);

    const playfieldBackground = new Graphics();
    playfieldBackground
      .rect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT)
      .fill({ color: PLAYFIELD_BG_COLOR, alpha: FULL_OPACITY });
    this.playfield.addChild(playfieldBackground);

    const maskGraphics = new Graphics();
    maskGraphics
      .rect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT)
      .fill({ color: MASK_FILL_COLOR, alpha: FULL_OPACITY });
    this.playfield.addChild(maskGraphics);

    const shapesContainer = new Container();
    shapesContainer.mask = maskGraphics;
    this.playfield.addChild(shapesContainer);

    this.spawner = new ShapeSpawner({
      shapesContainer,
      playfieldRect: PLAYFIELD_RECT,
      getSpawnRate: this.getSpawnRate,
      getGravity: this.getGravity,
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (event: { global: { x: number; y: number } }) => {
      const local = this.playfield.toLocal(event.global);
      const removed = this.spawner.removeShapeAt(local.x, local.y);
      if (!removed) {
        const inPlayfield =
          local.x >= 0 &&
          local.x <= PLAYFIELD_WIDTH &&
          local.y >= 0 &&
          local.y <= PLAYFIELD_HEIGHT;
        if (inPlayfield) {
          this.spawner.spawnOneAt(local.x, local.y);
        }
      }
    });

    const hudCountEl = this.hudCountId ? document.getElementById(this.hudCountId) : null;
    const hudAreaEl = this.hudAreaId ? document.getElementById(this.hudAreaId) : null;

    this.app.ticker.add((ticker) => {
      this.spawner.update(ticker.deltaMS / MS_PER_SECOND);
      if (hudCountEl && hudAreaEl) {
        // I added this scale parameter to display the area in actual screen px² otherwise it would just be logical units².
        const rect = this.container.getBoundingClientRect();
        const scale =
          rect.width > 0 && rect.height > 0
            ? Math.min(rect.width / PLAYFIELD_WIDTH, rect.height / PLAYFIELD_HEIGHT)
            : undefined;
        updateHud(this.spawner.getActiveShapes(), PLAYFIELD_RECT, {
          countEl: hudCountEl,
          areaEl: hudAreaEl,
          scale,
        });
      }
    });

    const handleResize = () => {
      fitPlayfieldToView(this.container, this.playfield, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
  }

  getSpawner(): ShapeSpawner {
    return this.spawner;
  }
}
