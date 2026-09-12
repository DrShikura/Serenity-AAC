// "Things I said before". Re-saying a sentence she has built once should cost
// one tap, not thirty — daily requests repeat constantly.

import { loadHistory, clearHistory } from './storage.js';

export async function openHistory(sheet, scrim, { onSpeak, onRestore }) {
  const entries = await loadHistory();

  sheet.innerHTML = `
    <h2>Things I said before</h2>
    <p class="hint">Tap one to say it again, or press “put it back” to keep building on it.</p>
    <div class="history-list" id="list">
      ${entries.length
        ? entries.map((e, i) => `
            <div style="display:flex;gap:8px;align-items:stretch">
              <button data-say="${i}" style="flex:1 1 auto">${escapeHtml(e.text)}</button>
              <button class="btn btn--quiet" data-restore="${i}" title="Put it back in the bar">↩︎</button>
            </div>`).join('')
        : '<p class="hint">Nothing yet. Sentences she says will show up here.</p>'}
    </div>
    <div class="sheet__actions">
      ${entries.length ? '<button class="btn btn--warn" id="wipe" type="button">Clear the list</button>' : ''}
      <button class="btn btn--go" id="close" type="button">Done</button>
    </div>`;

  const close = () => { scrim.hidden = true; sheet.replaceChildren(); };

  sheet.querySelector('#list').addEventListener('click', (e) => {
    const say = e.target.closest('[data-say]');
    if (say) { onSpeak(entries[Number(say.dataset.say)]); return; }
    const restore = e.target.closest('[data-restore]');
    if (restore) { onRestore(entries[Number(restore.dataset.restore)]); close(); }
  });

  sheet.querySelector('#close').addEventListener('click', close);
  sheet.querySelector('#wipe')?.addEventListener('click', async () => {
    await clearHistory();
    close();
  });

  scrim.hidden = false;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
