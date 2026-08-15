import type { BossAvatar } from '../types/boss';
import { ParticleSystem } from './ParticleSystem';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 400;

const HEAD_RADIUS = 70;
const HEAD_CENTER_X = CANVAS_WIDTH / 2;
const HEAD_CENTER_Y_BASE = 150;

const HIT_REACTION_DURATION_MS = 200;
const HIT_HEAD_SNAP_DISTANCE = 15;
const HIT_HEAD_LIFT_DISTANCE = 10;
const HIT_FLASH_MAX_OPACITY = 0.5;
const GLOVE_EXTENSION_DISTANCE = 35;

const BASE_PARTICLE_COUNT = 6;
const PARTICLE_COLORS = ['#ffdd59', '#ff6b6b', '#ffffff'];

// Exported so other files — the special-move pattern list, the screen
// component tracking punch history — share this exact type instead of
// each redefining their own 'left' | 'right' union.
export type PunchSide = 'left' | 'right';

interface HitReaction {
  offsetX: number;
  offsetY: number;
  flashOpacity: number;
  gloveExtension: number;
}

const NO_REACTION: HitReaction = { offsetX: 0, offsetY: 0, flashOpacity: 0, gloveExtension: 0 };

export class BoxingCharacter {
  private avatar: BossAvatar;
  private image: HTMLImageElement | null = null;
  private imageLoaded = false;

  private lastHitTime: number | null = null;
  private lastHitSide: PunchSide | null = null;

  private particles = new ParticleSystem();

  constructor(avatar: BossAvatar) {
    this.avatar = avatar;

    if (avatar.type === 'image') {
      const img = new Image();
      img.onload = () => {
        this.imageLoaded = true;
      };
      img.src = avatar.url;
      this.image = img;
    }
  }

  triggerPunchReaction(side: PunchSide, comboLevel: number = 1) {
    this.lastHitTime = performance.now();
    this.lastHitSide = side;

    const impactX = HEAD_CENTER_X + (side === 'left' ? -HEAD_RADIUS * 0.6 : HEAD_RADIUS * 0.6);
    const impactY = HEAD_CENTER_Y_BASE;
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

    const particleCount = BASE_PARTICLE_COUNT + comboLevel * 2;
    this.particles.spawnBurst(impactX, impactY, particleCount, color);
  }

  /** A bigger, showier burst — used specifically when a special-move
   * sequence lands, separate from the regular per-punch burst so it
   * visually reads as a bigger moment than an ordinary hit. */
  triggerSpecialMoveBurst() {
    this.particles.spawnBurst(HEAD_CENTER_X, HEAD_CENTER_Y_BASE, 24, '#ffdd59');
  }

  draw(ctx: CanvasRenderingContext2D, elapsedMs: number) {
    const bobOffset = Math.sin(elapsedMs / 400) * 8;
    const reaction = this.getHitReaction();

    const headCenterX = HEAD_CENTER_X + reaction.offsetX;
    const headCenterY = HEAD_CENTER_Y_BASE + bobOffset + reaction.offsetY;

    this.drawBody(ctx, bobOffset);
    this.drawHead(ctx, headCenterX, headCenterY, reaction.flashOpacity);
    this.drawGloves(ctx, bobOffset, this.lastHitSide, reaction.gloveExtension);

    this.particles.draw(ctx, performance.now());
  }

  private getHitReaction(): HitReaction {
    if (this.lastHitTime === null || this.lastHitSide === null) {
      return NO_REACTION;
    }

    const timeSinceHit = performance.now() - this.lastHitTime;
    if (timeSinceHit > HIT_REACTION_DURATION_MS) {
      return NO_REACTION;
    }

    const progress = timeSinceHit / HIT_REACTION_DURATION_MS;
    const strength = 1 - progress;
    const knockDirection = this.lastHitSide === 'left' ? 1 : -1;

    return {
      offsetX: HIT_HEAD_SNAP_DISTANCE * strength * knockDirection,
      offsetY: -HIT_HEAD_LIFT_DISTANCE * strength,
      flashOpacity: HIT_FLASH_MAX_OPACITY * strength,
      // Reuses the SAME progress/strength curve already computed above
      // for the head snap — one shared decay driving a second effect,
      // instead of a brand-new timer just for the glove.
      gloveExtension: GLOVE_EXTENSION_DISTANCE * strength,
    };
  }

  private drawBody(ctx: CanvasRenderingContext2D, bobOffset: number) {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(HEAD_CENTER_X - 60, 220 + bobOffset, 120, 140, 20);
    ctx.fill();
  }

  private drawHead(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    flashOpacity: number
  ) {
    ctx.fillStyle = '#f0c27b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, HEAD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (this.avatar.type === 'emoji') {
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.avatar.symbol, centerX, centerY);
    } else if (this.imageLoaded && this.image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, HEAD_RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        this.image,
        centerX - HEAD_RADIUS,
        centerY - HEAD_RADIUS,
        HEAD_RADIUS * 2,
        HEAD_RADIUS * 2
      );
      ctx.restore();
    }

    ctx.strokeStyle = '#2c2c54';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, HEAD_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${flashOpacity})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, HEAD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGloves(
    ctx: CanvasRenderingContext2D,
    bobOffset: number,
    thrownSide: PunchSide | null,
    gloveExtension: number
  ) {
    ctx.fillStyle = '#d63447';
    const gloveY = 260 + bobOffset;

    // The glove on the side that just threw a punch moves inward/upward
    // toward the head, scaled by the same decaying gloveExtension value —
    // the untouched glove stays put (its extension is 0).
    const leftExtension = thrownSide === 'left' ? gloveExtension : 0;
    const rightExtension = thrownSide === 'right' ? gloveExtension : 0;

    ctx.beginPath();
    ctx.arc(
      HEAD_CENTER_X - 90 + leftExtension,
      gloveY - leftExtension * 0.5,
      30,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      HEAD_CENTER_X + 90 - rightExtension,
      gloveY - rightExtension * 0.5,
      30,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}