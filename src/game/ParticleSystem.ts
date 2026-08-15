// A single particle: a small dot that flies outward from an impact point
// and fades away. We store WHEN and WHERE it was born plus its velocity,
// then calculate its current position fresh every frame — the same
// "analytical, not mutated" technique used for the hit-reaction fade in
// BoxingCharacter.ts.
interface Particle {
  spawnTime: number;
  startX: number;
  startY: number;
  velocityX: number; // pixels per millisecond
  velocityY: number;
  color: string;
  radius: number;
}

const PARTICLE_LIFETIME_MS = 500;
const GRAVITY = 0.0025; // pixels per ms^2 — a slight downward arc over time

export class ParticleSystem {
  private particles: Particle[] = [];

  /** Spawns `count` particles bursting outward from (x, y) in random
   * directions and speeds, so each burst looks organic rather than
   * identical every time. */
  spawnBurst(x: number, y: number, count: number, color: string) {
    const now = performance.now();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.15;

      this.particles.push({
        spawnTime: now,
        startX: x,
        startY: y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3,
      });
    }
  }

  /** Draws every still-alive particle and prunes expired ones. Call once
   * per frame from the main render loop. */
  draw(ctx: CanvasRenderingContext2D, now: number) {
    // Filtering before drawing means we never render something fully
    // faded out, and keeps this array from growing forever.
    this.particles = this.particles.filter((p) => now - p.spawnTime < PARTICLE_LIFETIME_MS);

    for (const particle of this.particles) {
      const elapsed = now - particle.spawnTime;
      const progress = elapsed / PARTICLE_LIFETIME_MS;
      const alpha = 1 - progress;

      const x = particle.startX + particle.velocityX * elapsed;
      const y =
        particle.startY + particle.velocityY * elapsed + 0.5 * GRAVITY * elapsed * elapsed;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1; // always reset shared context state after using it
  }
}