# Labbook backups

This folder is the intended target for **Labbook's automatic daily backups**.

Labbook (admin-only, in dHUB) writes a dated snapshot `labbook-YYYY-MM-DD.json` of the
entire notebook (projects, folders, experiments, pages, seminars, daily notebook, tags,
presets) once per day and on demand via the **Backup** button.

## How it works
- **In dHUB (sandboxed iframe):** Labbook calls `window.parent.lbBackup` (defined in
  `hub-shell.html`), which runs the File System Access API in the top-level document.
- **Standalone / future real-domain platform:** Labbook uses the File System Access API directly.
- **Right-click the Backup button** to choose this folder once — the browser remembers it
  (handle persisted in IndexedDB) and auto-saves here daily.
- **Fallback:** if the browser blocks folder access, the backup is downloaded instead
  (move it here, or point your browser's download folder at this directory).

## Git
The backup JSONs are data, not source — they are git-ignored (`Labbook/backups/*.json`).
Only this README and `.gitkeep` are tracked so the folder exists in the repo.
