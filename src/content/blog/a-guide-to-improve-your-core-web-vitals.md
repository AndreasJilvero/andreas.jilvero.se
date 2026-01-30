---
title: "A practical guide to improve your core web vitals"
date: 2022-04-09T18:15:00.000Z
summary: "Embark on the journey of optimizing the performance of a multi-page web application and learn about the low-hanging fruits that you can adapt"
---

It goes without saying, having a fast website will improve the customer experience. All your KPIs will be better with a fast website. Okay, enough of motivation - let's get practical.

By the way, I've written this from the perspective of a website that has been developed for some years and has the legacy issues that time simply implies. To those that use modern tools like React and Next.js, this is not for you, but remember - client rendering is expensive!

### Doing the investigation

So you've either taken interest in web performance, or you've been given the task to improve the web performance of your website. Where do you begin?

Start off by running the website through the Google Chrome tool [Lighthouse](https://developers.google.com/web/tools/lighthouse). This will give you a bunch of metrics - FCP, LCP and CLS amongst others. Export the result and store it somewhere safe. When you've finished all the steps in this guide, you will run Lighthouse again and find that you're now a certified web performance ninja.

### Getting the team onboard

Surprisingly, not everyone loves web performance. It's up to you to make sure that the team around you is engaged in your work. If they don't know and understand what you do, what will happen the day you bid farewell? The website will slowly become slow again. Also, they won't know what a hero you are for making the Internet fast.

### Setting up metrics tracking

Before you begin doing ANY work, you should have a decent way to track metrics over time. You really want to be able to measure the effect of every effort. If you can't make management pay for decent tools like [treo.sh](https://treo.sh/) or [speedcurve.com](https://www.speedcurve.com/), at least set up a free solution like [speedlify](https://www.speedlify.dev/). You will forget to use Lighthouse before and after every deploy.

### Getting to work

Okay, let the fun part begin. Soon. The goal is reduce the amount of things happening on page load. Practically, this means reduce the amount of things happening in your <head> tag as this will get the highest priority. In order to find high priority resources, we will start off by using WebPageTest and from there, we will do actual changes, sorted by impact.

#### WebPageTest

Start off by running your website through [webpagetest.org](https://www.webpagetest.org/) and make sure to learn how to interpret the waterfall image. In practice, what you want to do is to find at what time the website renders and remove anything that happens before render.

Let's break it down somewhat. The orange icon with a white cross are render blocking resources - they prevent the browser from rendering. This is typically CSS and Web fonts. Lighthouse is great at identifying [render blocking resources](https://web.dev/render-blocking-resources/).

Anything that happens early in the waterfall are high priority resources. If any of these resources are not deemed important, you should try to move them down the waterfall. More on that later.

#### Web fonts (high impact)

If you have web fonts, and they're implemented in a render blocking way, this is a major low hanging fruit but with a trade-off. In order to please core web vitals, you should start off by making sure the font is not render blocking. For that, you can use the onload hack as described at the bottom on [The Fastest Google Fonts](https://csswizardry.com/2020/05/the-fastest-google-fonts/):

```css
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="$CSS&display=swap" />
<link rel="stylesheet" href="$CSS&display=swap" media="print" onload="this.media='all'" />
```

Upon this, you should make sure that your font families utilize `font-display: swap` and that you have a fallback font.

However, now you've introduced a new problem - your CLS metrics will decline, if you're not really lucky. When the fallback font is replaced with the web font, it's likely that they don't allocate the same space, which makes the website layout shift. To mitigate this, you will need to adjust the fallback font into allocating the same space as the web font. This can be done with [Font style matcher](https://meowni.ca/font-style-matcher/). If you want extra control over the loading of web fonts, you can use [Font face observer](https://github.com/bramstein/fontfaceobserver) to detect when a web font is available.

[Another interesting approach](https://furbo.org/2018/03/28/system-fonts-in-css/) - if you can live without a specific font - is to use whatever font that's on your system. This means Segoe UI for Windows, Roboto for Android and San Francisco for iOS. If you choose this path, you don't need to think about loading web fonts asynchronously and there will be no negative CLS impact.

#### Anti-flicker snippet (high impact)

The anti-flicker snippet is a utility from Google Tag Manager that hides your entire page until your A/B tests has loaded (or for a maximum of 4 seconds). Does it sound bad? It does, because it is. If your FCP and LCP is happening at the same time, it's because the snippet delays rendering of your website for such a long time for this to happen.

Either way, using the anti flicker snippet will worsen all your metrics except CLS. Actually, with the anti-flicker snippet, your CLS will be perfect because the snippet hides the page while it loads so... it's not a good thing.

As with web fonts, there's a trade-off. The benefit of using the snippet is that **some** user doesn't see the wrong version of a A/B test, but the drawback is that **all** users experience a slower website. Is it a reasonable trade-off? No.

#### Third party tracking scripts (high impact)

Every third party tracking scripts will have a small negative effect on your website. I found that the overall Lighthouse score would improve by 10-20% by removing all third party scripts (Google Analytics, Facebook Pixel and so on). However, the sales team will hate you and honestly, I don't think it's worth that hassle.

#### Defer non critical CSS (low-high impact)

Google has [excellent documentation](https://web.dev/defer-non-critical-css/) for this scenario.

#### Code splitting (low-high impact)

Now comes the tedious work. If you still have one large bundle for JS and another for CSS, you're doing it wrong. When I started working on my current assignment, our combined asset size (CSS + JS) was at 1.4 MiB - crazy! Unless you want to refactor everything, you will need to start splitting code. I only have experience from doing so using Webpack, but every bundler should be able to do it.

The art of [code splitting](https://webpack.js.org/guides/code-splitting/) is about breaking out code that only runs under certain criterias, for example on a certain page or if a certain component is on the page. A good way to start is by identifying "page types" - that is, pages that share a lot of functionality in a way that it makes sense to create a specific JS and CSS bundle for that page only. These bundles are called [entry points](https://webpack.js.org/guides/code-splitting/#entry-points).

The other way of doing code splitting is by using [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports). If the DOM contains a certain element or component, you can conditionally load a chunk of JS or CSS.

Both these methods will move code out of the main bundle into smaller pieces.

However, when you've started creating multiple files for your JS, you need to make sure that code is not duplicated. This is mitigated by using the [SplitChunksPlugin](https://webpack.js.org/guides/code-splitting/#prevent-duplication).

#### Drop IE 11 browser support (low-medium impact)

IE 11 usage is very low these days. There's a good chance (risk) that you use a bunch of polyfills that only a small percentage of your users use. If you really need a polyfill - fine, include it in your main bundle or use a cool tool like [polyfill.io](https://polyfill.io/v3/). Otherwise, import it [dynamically](https://webpack.js.org/guides/code-splitting/#dynamic-imports) or omit it completely.

Polyfill.io is really smart about how they include polyfills. They use the user agent to figure out what polyfills actually are needed.

#### Reduce usage of third party domains (low-medium impact)

Let's go back to the waterfall on WebPageTest. See those requests that are prepended with a green-yellow-purple bar? What these say, is that the client has to connect to a new domain and therefore has to do DNS lookup, TCP connection and SSL handshake - which is a penalty in time. If the request is highly prioritized, try to move this dependency from a third party domain to your own domain.

For the same reason, you should also serve your render blocking assets and your LCP from your own domain.

You can use [RequestMap](https://requestmap.webperf.tools/) in order to visualize what third party domains you depend on.

#### Reduce client code (low-high impact)

Google has excellent tools when it comes to finding unused code - [JS](https://web.dev/unused-javascript/) or [CSS](https://web.dev/unused-css-rules/). By using the code coverage tool, you will be able to find code that doesn't need to be in your main bundles. If a certain bundle contains a lot of unused code, that's a indication that you should either remove or load it dynamically, if it's needed.

#### Use lazy loading wisely (low-medium impact)

Lazy loading is almost always a good thing - why should the browser bother spending performance on things outside the viewport. The viewport is a key factor here - **never** lazy load your LCP. Lazy loading your LCP is exactly like telling the browser not to prioritize your most important content.

#### Remove jQuery (low impact)

Everyone seems to hate jQuery these days, but for all the wrong reasons. jQuery is not a bad library, and it's far from the largest chunk of JS either. Also, the hassle of removing jQuery is often just too much work. I don't think it's worth the large effort.

This [Twitter thread](https://twitter.com/TheRealNooshu/status/1509487050122276864) is a very interesting subject.

#### Other things that all in all has high impact

These things probably goes without saying, but having a good host/server will improve your [TTFB](https://web.dev/time-to-first-byte/). Also, your website backend plays a large role here.

[Serving assets via a CDN](https://web.dev/content-delivery-networks/) will ensure fast deliveries and global presence. It's likely that there's a shorter distance between the CDN and the user, than between the web server and the user.

Using [caching for static assets](https://web.dev/uses-long-cache-ttl/) is crucial so that the browser doesn't download things in vain.

[Serve optimized images](https://web.dev/uses-optimized-images/). I'm personally not sold on WebP just yet - it just seems that everyone still use JPEG.

Using hints like [preconnect and preload](https://web.dev/preload-critical-assets/) will improve your performance. However, use them wisely - adding a preload means down-prioritizing something else.

### Wrapping up

If you've done all these things - congratulations. You are probably some months older, because that's the time it takes to do these things. You've probably run Lighthouse a thousand times since you started, but you should definitely see those metrics skyrocket.

If not, send me a mail and I will see if I can spot some obvious flaw.

Also, to keep your interest up about web performance - make sure to follow [Harry Roberts](https://twitter.com/csswizardry) and [Simon Hearne](https://twitter.com/SimonHearne), they are the real GOATs of this area.
