// A simple boxing-ring backdrop: a vertical gradient floor, two posts, and
// three ropes. This is deliberately its own small function rather than a
// method on BoxingCharacter — the ring has nothing to do with any
// specific boss, so it doesn't belong inside a class about one.
export function drawRingBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const floorGradient = ctx.createLinearGradient(0, 0, 0, height);
  floorGradient.addColorStop(0, '#2d2d54');
  floorGradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, 0, width, height);

  // Ring posts along both edges.
  ctx.fillStyle = '#8899aa';
  ctx.fillRect(8, 30, 14, height - 60);
  ctx.fillRect(width - 22, 30, 14, height - 60);

  // Turnbuckles capping each post.
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.arc(15, 30, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - 15, 30, 10, 0, Math.PI * 2);
  ctx.fill();

  // Three ropes, running behind the character at roughly torso height.
  ctx.strokeStyle = '#ff4757';
  ctx.lineWidth = 5;
  [240, 280, 320].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(22, y);
    ctx.lineTo(width - 22, y);
    ctx.stroke();
  });
}