# Agent notes

This is a Quarto website. Source lives on `main`; the built site is published to `gh-pages`. Live URL: https://www.dmlbl.com

The repo is on WSL Debian (`/home/dleybel/dmitriyleybel.github.io`). Cursor’s Windows shell cannot sandbox the UNC path and mangles `&&` / heredocs. Do all git and Quarto work in WSL:

```bash
wsl -d Debian -- bash -lc 'cd /home/dleybel/dmitriyleybel.github.io && …'
```

Quarto is `/home/dleybel/.local/bin/quarto` (1.9.x). `gh` is already authenticated as `DmitriyLeybel`.

## Fast commit + publish

1. Inspect with `git diff --name-only` (not just `git status`). `.gitattributes` forces LF; if status is still noisy, `git diff --ignore-cr-at-eol --stat` shows the real edits.
2. Commit only real content. Checkpoints, `from.cmd` / `to.cmd`, `_site`, and `.quarto` are gitignored. Delete any leftover `_do_*.sh` helpers; do not commit them.
3. Commit on `main`. If the Windows shell will eat a heredoc, write a tiny bash script in the repo, run it, delete it.
4. Working tree must be clean before publish (`git restore --worktree --staged .` for leftover CRLF ghosts). Then:

   ```bash
   git push origin main
   quarto publish gh-pages --no-prompt --no-browser
   ```

   Do not pass `--no-render` unless `_site` is already a fresh render of the commit being published.
5. Confirm `origin/main` and `origin/gh-pages` moved. Pages can take a few minutes; hard-refresh https://www.dmlbl.com

## Do not

- Re-audit the whole tree for “what changed” when `git diff --name-only` already lists the real files.
- Commit 10k-line notebook diffs that are only line endings (`git diff --ignore-cr-at-eol --stat` should go quiet).
- Run git/Quarto from PowerShell against `\\wsl.localhost\…`.
