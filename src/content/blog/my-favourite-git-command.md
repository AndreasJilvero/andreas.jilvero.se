---
title: "My favourite git command"
date: 2022-01-13T22:11:00.000Z
summary: ""
---

From time to time, it so happens that I create a feature branch based on the wrong branch (for example, `master` vs `develop`).

Whenever I do so, I create a new branch correctly and use this command to get all my changes (although not with history).

```sh
C:\dev\app [feature/correct-branch]> git checkout feature/faulty-branch -- .
```
