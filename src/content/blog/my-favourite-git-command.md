---
title: "My favourite git command"
date: 2022-01-13T22:11:00.000Z
summary: "A quick tip on how to recover changes from a branch created off the wrong base using a simple git checkout command."
keywords: "git, git checkout, recover changes, wrong base branch, git tips, developer productivity"
---

Every developer has done it: you start work on a feature, make a bunch of changes, commit some of them — and then realise the branch was created off `master` when it should have been off `develop`, or vice versa.

The naive fix is to copy your changes manually, create the correct branch, and paste everything back. There is a better way.

### The command

Create the correct branch from the right base, check it out, then pull the changes from the faulty branch:

```sh
git checkout feature/faulty-branch -- .
```

Run this while you are on `feature/correct-branch`. Git will copy all tracked file changes from `feature/faulty-branch` into your working tree, staged and ready to commit. No manual copying, no risk of missing a file.

### What it actually does

`git checkout <branch> -- <path>` checks out the contents of `<path>` from `<branch>` into your current working tree. Using `.` means "everything from the repo root". The changes land as staged modifications — you can review them with `git diff --cached` before committing.

Note that this copies file state, not commit history. You get the changes but not the individual commits. If you need to preserve commit history, `git rebase --onto` is the right tool, but for most day-to-day "wrong branch" mistakes this is faster and less error-prone.

### The full workflow

```sh
# 1. Create the correct branch from the right base
git checkout develop
git checkout -b feature/correct-branch

# 2. Pull changes from the faulty branch
git checkout feature/faulty-branch -- .

# 3. Review and commit
git diff --cached
git commit -m "your message"

# 4. Clean up the faulty branch when ready
git branch -d feature/faulty-branch
```

This has saved me a surprising amount of time over the years. Simple, fast, and easy to remember.
