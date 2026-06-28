---
title: "Is AsyncBlockComponent Safe to Use in Optimizely CMS 12?"
date: 2026-01-31T13:43:14Z
summary: "AsyncBlockComponent in Optimizely CMS 12 looks like a true async solution, but a hidden GetAwaiter().GetResult() call in the rendering pipeline can cause deadlocks under load. Here's what you need to know."
keywords: "AsyncBlockComponent, Optimizely CMS 12, async deadlock, AsyncBlockComponent deadlock, Episerver async block, content area rendering, InvokeComponentAsync, GetAwaiter GetResult deadlock, .NET async anti-pattern, thread pool starvation Optimizely"
---

If you search for **AsyncBlockComponent Optimizely CMS 12**, chances are you ran into a stability issue or are trying to decide whether it is safe to use. The short answer is: it depends on how you render your content areas — and the default approach carries a real deadlock risk.

## What Is AsyncBlockComponent?

With later versions of Optimizely CMS 12, developers were given an abstraction called `AsyncBlockComponent`. According to the documentation, it "provides the base implementation for asynchronous block components."

On the surface, this sounds like exactly what you need for modern, performant web applications — for example, fetching product recommendations from a REST API without blocking threads. But there is a significant catch.

## The Async Illusion

Your block component can inherit from `AsyncBlockComponent` and implement an `InvokeComponentAsync` method. However, the way blocks are typically rendered in Optimizely is via `Html.PropertyFor(m => m.MyContentArea)`.

The problem is that `Html.PropertyFor` is a **synchronous** method. It does not return a `Task` and cannot be awaited. This creates a fundamental mismatch between the async nature of your block and the sync nature of the rendering pipeline.

## Under the Hood: GetAwaiter().GetResult()

Digging into the internal rendering logic of Optimizely CMS 12 reveals how this mismatch is resolved. The `RenderContentData` method, responsible for rendering content within a content area, eventually reaches this code:

```csharp
public static void RenderContentData(
  this IHtmlHelper html,
  IContentData contentData,
  bool isContentInContentArea,
  TemplateModel templateModel,
  IContentRenderer contentRenderer)
{
  html.ViewContext.HttpContext.RequestServices.GetRequiredService<HtmlGenerator>()
    .RenderContentDataAsync(contentData, html.ViewContext, isContentInContentArea, templateModel, (string) null, contentRenderer)
    .GetAwaiter().GetResult();
}
```

The asynchronous call `RenderContentDataAsync` is forced to run synchronously via `.GetAwaiter().GetResult()`.

## The Deadlock Risk

Using `.GetAwaiter().GetResult()` (or `.Result` or `.Wait()`) on async code is a well-known anti-pattern in .NET that can cause **thread pool starvation and deadlocks**, especially under high load.

In ASP.NET Core, staying async all the way down is essential for scalability. This synchronous block in the middle of the rendering pipeline defeats the entire purpose of writing asynchronous block components. Under sustained traffic, you may see requests start to queue up as threads are exhausted waiting for tasks that can never complete — a classic deadlock scenario.

## Conclusion

It is **not safe** to use `AsyncBlockComponent` in Optimizely CMS 12 when you are also using `Html.PropertyFor` to render content areas.

Even though your block component can run async code internally, the CMS rendering pipeline blocks on the result. For most projects, sticking to the standard `BlockComponent` with synchronous execution is the safer bet to avoid unexpected stability issues. If you genuinely need true end-to-end async rendering, you will need to move away from the standard MVC content area rendering pattern entirely.

---

## Frequently Asked Questions

**Can I use AsyncBlockComponent in Optimizely CMS 12?**
You can, but it does not give you true async rendering. The CMS rendering pipeline calls `.GetAwaiter().GetResult()` internally, so your async code runs synchronously regardless.

**Will AsyncBlockComponent cause a deadlock?**
It can, particularly under high load. The `.GetAwaiter().GetResult()` pattern inside Optimizely's `RenderContentData` creates the conditions for thread pool starvation and deadlocks in ASP.NET Core.

**What is the safe alternative to AsyncBlockComponent?**
Use the standard `BlockComponent` base class and keep your block logic synchronous, or offload async work to background services. This avoids the sync-over-async anti-pattern entirely.

**Does Html.PropertyFor support async rendering in Optimizely CMS 12?**
No. `Html.PropertyFor` is synchronous and blocks on any async work underneath it, making truly async content area rendering impossible with the default rendering pipeline.
