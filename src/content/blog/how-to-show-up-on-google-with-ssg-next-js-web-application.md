---
title: "How to show up on Google with SSG Next.js web application"
date: 2022-12-08T14:43:00.000Z
summary: "Reflecting on the challenges and solutions for getting a Next.js static site indexed by Google."
keywords: "Next.js, SSG, static site generation, Google indexing, SEO, sitemap, Google Search Console"
---

This blog is built with Next.js and statically generated at build time. For a while after launch, the blog posts simply did not appear in Google search results — not even when searching for the exact title. This post explains why that happened and how I fixed it.

### Why SPAs are hard for Google to index

Next.js apps start out as single-page applications (SPAs): the server sends a minimal HTML shell, and JavaScript takes over to render the page in the browser. Googlebot can execute JavaScript, but it does so in a separate pass that is delayed and lower priority than HTML parsing. Pages that depend entirely on client-side rendering often end up indexed late, indexed incompletely, or not indexed at all.

The fix is to make the site a true multi-page application (MPA), where each page is a standalone HTML document. Google can crawl and index HTML directly, without waiting for JavaScript to run.

### Disabling client-side JavaScript in Next.js

Next.js provides a flag to strip all client-side JavaScript from a page's output. Add this export to each page file:

```javascript
export const config = {
  unstable_runtimeJS: false
}
```

With this flag set, Next.js will render the page to static HTML and not include any client-side bundle for that page. The result is a fully static HTML document, equivalent to what you would get from a traditional server-rendered site.

### Exporting the site

After setting the flag on all pages, build and export the site:

```sh
next build && next export
```

This produces an `out` folder containing a complete static site — one `.html` file per page, all assets inlined or referenced by relative paths. Deploy the contents of `out` to your hosting provider.

### Submitting to Google Search Console

Once deployed, go to [Google Search Console](https://search.google.com/search-console/), add and verify your site, and submit your sitemap. Even after doing this, indexing takes time — typically days, sometimes over a week. You can request individual URL indexing via the URL Inspection tool to speed things up slightly, but there is no way to force immediate crawling.

### What to check if pages are still not indexed

A few things worth verifying if pages remain missing from search results:

- **robots.txt is not blocking crawlers.** Make sure your `robots.txt` allows `User-agent: *` and does not accidentally disallow `/`.
- **Canonical URLs are correct.** If the same content is accessible at multiple URLs (e.g. with and without trailing slash), set a canonical tag to tell Google which one is authoritative.
- **The sitemap includes all pages.** Use a sitemap generator and verify the sitemap is referenced in `robots.txt`.
- **The page has indexable content.** A page with very little text may be crawled but not indexed, or ranked so low it effectively does not appear.

For a thorough explanation of how static Next.js sites work and why this approach matters, [this post by Matt Greer](https://mattgreer.dev/blog/how-i-built-this-static-site-with-nextjs/) is worth reading.
