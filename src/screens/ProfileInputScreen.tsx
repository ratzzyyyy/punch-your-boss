import { useState } from 'react';
import type { ProfileFormState, ProfileInputMode } from '../types/profile';
import './ProfileInputScreen.css';

// Components receive data from their parent via "props." Here, App.tsx
// (the parent) will pass us a function called `onSubmit`. We don't know or
// care what it does with the data — we just call it once the form is ready.
// This is "lifting state up": the child collects, the parent decides.
interface ProfileInputScreenProps {
  onSubmit: (formData: ProfileFormState) => void | Promise<void>;
}

function ProfileInputScreen({ onSubmit }: ProfileInputScreenProps) {
  // --- STATE ---
  // Each useState call gives us a value React "remembers" across re-renders,
  // plus a function to update it. Calling the update function triggers a
  // re-render using the new value.
  const [mode, setMode] = useState<ProfileInputMode>('archetype');
  const [description, setDescription] = useState('');
  const [customName, setCustomName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- HANDLERS ---

  // When the player picks a file, we store the actual File object AND
  // generate a temporary preview URL so we can show a thumbnail immediately.
  // createObjectURL() turns a File into a browser-only URL usable in <img>,
  // without uploading it anywhere — it never leaves the browser.
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setUploadedImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    // HTML forms reload the whole page on submit by default.
    // preventDefault() stops that, since we want to handle the data
    // ourselves in JavaScript instead.
    event.preventDefault();

    onSubmit({ mode, description, customName, uploadedImage });
  };

  return (
    <div className="profile-input-screen">
      <h1 className="title">PUNCH YOUR BOSS</h1>
      <p className="subtitle">Create your target. Choose your method.</p>

      {/* Mode toggle — switches which fields render below */}
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === 'archetype' ? 'mode-button active' : 'mode-button'}
          onClick={() => setMode('archetype')}
        >
          Describe Your Boss
        </button>
        <button
          type="button"
          className={mode === 'upload' ? 'mode-button active' : 'mode-button'}
          onClick={() => setMode('upload')}
        >
          Upload Your Own
        </button>
      </div>
      
      <p className="mode-hint">
        {mode === 'archetype'
          ? "We'll match your description to a comedic boss character with its own cartoon avatar — no photo needed."
          : 'Upload any photo you have the rights to use, along with a name of your choosing.'}
      </p>

      <form className="input-form" onSubmit={handleSubmit}>
        {mode === 'archetype' ? (
          <div className="form-field">
            <label htmlFor="description">
              Describe your boss's most annoying habit:
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. schedules meetings that could've been an email"
              rows={3}
            />
          </div>
        ) : (
          <>
            <div className="form-field">
              <label htmlFor="customName">Name your boss:</label>
              <input
                id="customName"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Big Steve"
              />
            </div>
            <div className="form-field">
              <label htmlFor="imageUpload">Upload an image:</label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="image-preview" />
              )}
            </div>
          </>
        )}

        <button type="submit" className="submit-button">
          Load Profile
        </button>
      </form>
    </div>
  );
}

export default ProfileInputScreen;