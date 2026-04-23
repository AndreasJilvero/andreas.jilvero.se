---
title: "How to show up on Google with SSG Next.js web application"
date: 2022-12-08T14:43:00.000Z
summary: "Reflecting on the challenges and solutions for getting a Next.js static site indexed by Google."
---

This web application is statically generated SPA, built using Next.js. For some reason, my blog posts would not show up on Google, even though using a sitemap generator and adding that sitemap to Google Search Console.

I had a hunch that the SPA factor might be the failing piece, so I investigated turning it into a MPA - which is how the site works anyway. The goal is to disable all client-side javascript.

This is done via two steps.

Add the snippet below to all next.js pages

Run `next export` after build

Deploy the `out` folder to your hosting provider

```javascript
export const config = {
  unstable_runtimeJS: false
}
```

Now you just need to give it time. Even if you trigger a indexing event via Google Search Console, you will still need to wait days to see the effect.

This [blog post](https://mattgreer.dev/blog/how-i-built-this-static-site-with-nextjs/) explains it all in a good manner!
