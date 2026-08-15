import type { ProfileFormState } from '../types/profile';
import type { BossProfile } from '../types/boss';
import { matchArchetype } from '../data/archetypes';

// How long we pretend the "network request" takes. A real API call would
// take some unpredictable amount of time — we simulate that here so our
// loading screen gets properly tested now, rather than surprising us later
// when we swap in a real API.
const SIMULATED_DELAY_MS = 1200;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// This is our "adapter" — the one place in the app that knows how to turn
// raw form input into a finished BossProfile. Everything else only ever
// talks to this function's return value, never to the form data directly.
// Plug in a real API later, and this is the only file that changes.
export async function createBossProfile(formData: ProfileFormState): Promise<BossProfile> {
  await wait(SIMULATED_DELAY_MS);

  if (formData.mode === 'upload') {
    const name = formData.customName.trim() || 'Mystery Boss';

    if (!formData.uploadedImage) {
      // Throwing here lets whoever CALLS this function decide how to show
      // the error — a service file shouldn't do any UI work itself.
      throw new Error('Please upload an image before loading your boss.');
    }

    const imageUrl = URL.createObjectURL(formData.uploadedImage);

    return {
      name,
      avatar: { type: 'image', url: imageUrl },
      taunts: ['You call that a punch?', 'Is that all you got?', 'My inbox hits harder.'],
    };
  }

  // Archetype mode
  const archetype = matchArchetype(formData.description);
  return {
    name: archetype.name,
    avatar: archetype.avatar,
    taunts: archetype.taunts,
  };
}