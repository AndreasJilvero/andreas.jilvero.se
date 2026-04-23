---
title: "Is AsyncBlockComponent safe to use in Optimizely CMS 12?"
date: 2026-01-31T13:43:14Z
summary: "Exploring why AsyncBlockComponent might not be the true async solution you were looking for in Optimizely CMS 12."
keywords: "AsyncBlockComponent, Optimizely CMS 12, async, deadlock, content area rendering, Episerver, .NET"
---

With later versions of Optimizely CMS 12, developers were introduced to an abstraction called `AsyncBlockComponent`. According to the documentation, it "Provides the base implementation for asynchronous block components."

On the surface, this sounds like exactly what we need for modern, performant web applications where we want to avoid blocking threads while waiting for external resources—like fetching product recommendations from a REST API.

However, there is a significant catch that might lead to deadlocks and downtime if you are using the default and preferred method for rendering content areas.

### The Async Illusion

While your block component can inherit from `AsyncBlockComponent` and implement an `InvokeComponentAsync` method, the way these blocks are typically rendered in Optimizely is via `Html.PropertyFor(m => m.MyContentArea)`.

The problem is that `Html.PropertyFor` is a synchronous method. It does not return a `Task`, and it cannot be awaited. This creates a mismatch between the asynchronous nature of the block and the synchronous nature of the rendering pipeline.

### Under the Hood: GetAwaiter().GetResult()

If we dig into the internal rendering logic of Optimizely CMS 12, we can see how it handles this mismatch. The `RenderContentData` method, which is responsible for rendering content within a content area, eventually reaches this point:

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

As you can see, the asynchronous call `RenderContentDataAsync` is being forced to run synchronously using `.GetAwaiter().GetResult()`.

### The Risk of Deadlocks

Using `.GetAwaiter().GetResult()` (or `.Result` or `.Wait()`) on asynchronous code is a well-known anti-pattern in .NET that can easily lead to thread pool starvation and deadlocks, especially under high load.

In an environment like ASP.NET Core, where you want to stay "async all the way," this synchronous block in the middle of your rendering pipeline defeats the purpose of writing asynchronous code in your block components.

### Conclusion

It is **not safe** to use `AsyncBlockComponent` in Optimizely CMS 12 when you are also using `Html.PropertyFor` to render content areas.

Even though your block component can run async code internally, the CMS rendering pipeline still blocks on the result. If you need true end-to-end asynchronicity, you might need to look beyond the standard MVC rendering patterns for content areas, but for most projects sticking to the standard `BlockComponent` and synchronous execution is likely the safer bet to avoid unexpected stability issues.
