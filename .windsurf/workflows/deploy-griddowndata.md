---
description: Deploy updates to griddowndata.com via the Git terminal pipeline.
---

# Deploy Grid Down Data

Use this workflow to publish changes to the `griddowndata.com` static site through version control. All commands assume the repository root is `/Users/chadgill/CascadeProjects/griddowndata.com` and that the remote `origin` is already configured.

## Prerequisites

- Git is installed and configured with your user name and email.
- You have write access to the remote repository.
- The active branch is `main` (or update the push command to match your default branch).

## Steps

1. Open a terminal in the repository root.
   ```bash
   cd /Users/chadgill/CascadeProjects/griddowndata.com
   ```

2. Check the working tree status to see which files changed.
   // turbo
   ```bash
   git status
   ```

3. Stage the updated files. Typically only `index.html` changes.
   // turbo
   ```bash
   git add index.html
   ```

   If you also updated `README.md` or the workflow file, stage them too:
   ```bash
   git add README.md .windsurf/workflows/deploy-griddowndata.md
   ```

4. Commit the changes with a descriptive message.
   // turbo
   ```bash
   git commit -m "Update griddowndata.com vault: [brief description]"
   ```

5. Push the commit to the remote `main` branch.
   // turbo
   ```bash
   git push origin main
   ```

6. Verify the deployment on your static host (Netlify, Cloudflare Pages, GitHub Pages, etc.) and confirm the live site reflects the changes.

## Rollback (if needed)

If a deployed change causes issues, revert the last commit and push again:

```bash
git revert HEAD
git push origin main
```

For a harder reset that removes the last commit from history (use with caution):

```bash
git reset --hard HEAD~1
git push origin main --force
```

## Notes

- Keep commits focused: one logical change per commit.
- Do not commit large binary assets (PDFs, `.zim` files, executables) to this repository unless your Git host and workflow can handle them. These files should be placed next to `index.html` during final packaging or deployment, not tracked in Git.
- After each release, update `README.md` if the folder structure or setup instructions changed.
