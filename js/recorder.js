// Recording a familiar voice for a button.
//
// Many kids respond far better to a parent's or sibling's real voice than to
// a synthetic one, so any button can carry its own recording. Microphone
// permission is requested only when a parent actually presses record.

export function isSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && globalThis.MediaRecorder);
}

/**
 * Start recording. Resolves with a handle; call `stop()` to get the audio Blob,
 * or `cancel()` to throw it away. The microphone is released either way.
 */
export async function startRecording() {
  if (!isSupported()) throw new Error('This browser cannot record audio.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg']
    .find((type) => MediaRecorder.isTypeSupported?.(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.start();

  const release = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        release();
        resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorder.stop();
    }),
    cancel: () => {
      try { recorder.stop(); } catch { /* already stopped */ }
      release();
    },
  };
}
