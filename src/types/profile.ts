// The player can create a boss in one of two ways.
// This "union type" means `mode` can ONLY ever be one of these two exact
// strings. If we typo 'achetype' anywhere else in the code, TypeScript
// will refuse to compile until we fix it — that's the safety net in action.
export type ProfileInputMode = 'archetype' | 'upload';

// This interface describes the *shape* of the data our input form collects.
// Not every field is used in every mode:
//   - 'archetype' mode uses `description`
//   - 'upload' mode uses `customName` and `uploadedImage`
// Bundling them into one type is a simple starting point. Once we build the
// real profile service in Phase 3, we'll likely split this into two more
// precise types — but simple-and-working beats perfect-and-delayed for now.
export interface ProfileFormState {
  mode: ProfileInputMode;
  description: string;
  customName: string;
  uploadedImage: File | null;
}