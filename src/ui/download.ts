// Trigger a client-side file download with no network and no popup — just a
// Blob URL and a synthetic anchor click. Works over file:// and stays within the
// "no runtime server" / Kolibri-friendly constraints. Returns false if the
// environment blocks it (e.g. a locked-down sandbox), so callers can fall back
// to an on-screen copy.

export function downloadText(filename: string, text: string, mime: string): boolean {
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoke on the next tick so the download has time to start.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}
