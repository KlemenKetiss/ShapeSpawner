import {
  MIN_SPAWN_RATE,
  MAX_SPAWN_RATE,
  MIN_GRAVITY_LEVEL,
  MAX_GRAVITY_LEVEL,
  GRAVITY_PER_LEVEL,
} from '../config/constants';

export type ControlsOptions = {
  spawnValueId: string;
  gravityValueId: string;
  spawnMinusId: string;
  spawnPlusId: string;
  gravityMinusId: string;
  gravityPlusId: string;
};

export type Controls = {
  getSpawnRate: () => number;
  getGravity: () => number;
  bind: () => void;
  /** Removes button listeners so controls don't retain references (call on teardown). */
  unbind: () => void;
};

const DEFAULT_SPAWN_RATE = 1;
/** Default gravity level (1–20); level 8 = 800. */
const DEFAULT_GRAVITY_LEVEL = 8;
const SPAWN_RATE_STEP = 1;
/** Radix for parsing integer strings (decimal). */
const RADIX_DECIMAL = 10;

export function createControls(options: ControlsOptions): Controls {
  const spawnValueEl = document.getElementById(options.spawnValueId);
  const gravityValueEl = document.getElementById(options.gravityValueId);
  const spawnMinusBtn = document.getElementById(options.spawnMinusId);
  const spawnPlusBtn = document.getElementById(options.spawnPlusId);
  const gravityMinusBtn = document.getElementById(options.gravityMinusId);
  const gravityPlusBtn = document.getElementById(options.gravityPlusId);

  if (!spawnValueEl || !gravityValueEl) {
    throw new Error('Missing spawn or gravity value elements.');
  }

  const getSpawnRate = (): number => {
    const n = parseFloat(spawnValueEl.textContent ?? String(DEFAULT_SPAWN_RATE));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_SPAWN_RATE;
  };

  const getGravityLevel = (): number => {
    const n = parseInt(gravityValueEl.textContent ?? String(DEFAULT_GRAVITY_LEVEL), RADIX_DECIMAL);
    const level = Number.isFinite(n) ? Math.round(n) : DEFAULT_GRAVITY_LEVEL;
    return Math.max(MIN_GRAVITY_LEVEL, Math.min(MAX_GRAVITY_LEVEL, level));
  };

  const getGravity = (): number => getGravityLevel() * GRAVITY_PER_LEVEL;

  const onSpawnMinus = (): void => {
    const v = Math.max(MIN_SPAWN_RATE, Math.floor(getSpawnRate()) - SPAWN_RATE_STEP);
    spawnValueEl.textContent = String(v);
  };
  const onSpawnPlus = (): void => {
    const v = Math.min(MAX_SPAWN_RATE, Math.floor(getSpawnRate()) + SPAWN_RATE_STEP);
    spawnValueEl.textContent = String(v);
  };
  const onGravityMinus = (): void => {
    const level = Math.max(MIN_GRAVITY_LEVEL, getGravityLevel() - 1);
    gravityValueEl.textContent = String(level);
  };
  const onGravityPlus = (): void => {
    const level = Math.min(MAX_GRAVITY_LEVEL, getGravityLevel() + 1);
    gravityValueEl.textContent = String(level);
  };

  const bind = (): void => {
    spawnMinusBtn?.addEventListener('click', onSpawnMinus);
    spawnPlusBtn?.addEventListener('click', onSpawnPlus);
    gravityMinusBtn?.addEventListener('click', onGravityMinus);
    gravityPlusBtn?.addEventListener('click', onGravityPlus);
  };

  const unbind = (): void => {
    spawnMinusBtn?.removeEventListener('click', onSpawnMinus);
    spawnPlusBtn?.removeEventListener('click', onSpawnPlus);
    gravityMinusBtn?.removeEventListener('click', onGravityMinus);
    gravityPlusBtn?.removeEventListener('click', onGravityPlus);
  };

  return { getSpawnRate, getGravity, bind, unbind };
}
