---
title: "How to use CacheTagHelper with content areas in Optimizely"
date: 2022-11-30T21:51:21.173Z
summary: "Improve performance in Optimizely CMS by effectively using the CacheTagHelper with Content Areas."
keywords: "CacheTagHelper, Optimizely, Episerver, content areas, output caching, ASP.NET Core, performance"
---

#### Update (2022-12-31)

Since writing this post, I've come up with the following solution to efficiently collect cache dependencies for a rendered content area:

[https://github.com/AndreasJilvero/Jileo.Optimizely.Caching](https://github.com/AndreasJilvero/Jileo.Optimizely.Caching)

#### Original post

Upgrading your Optimizely web application from .NET Framework to .NET Core should provide a huge performance win. However, the [ContentOutputCacheAttribute](https://world.optimizely.com/csclasslibraries/cms/EPiServer.Web.Mvc.ContentOutputCacheAttribute?version=11) did not make the cut and was not migrated by Optimizely. If your web application was reliant on this, chances are you had some bottlenecks that will remain even after the upgrade. Not being able to use the output cache attribute will make those bottlenecks come alive once more.

To once again (shame on you!) hide those bottlenecks, we can pretty easily make use of the [CacheTagHelper](https://learn.microsoft.com/en-us/aspnet/core/mvc/views/tag-helpers/built-in/cache-tag-helper?view=aspnetcore-7.0) that .NET Core provides. An unrealistically simple example of this would be:

```csharp
<cache>
    @Html.PropertyFor(m => m.ContentArea)
</cache>
```

You've now "solved" one problem (the bottleneck), but gained one new - cache invalidation.

In order to re-evaluate the code block within the cache nodes - you need to add `vary-by-*` conditions. Since we're caching a content area, we need to make sure the cache is invalidated whenever visitor groups are applied or when content is published.

Let's first use `vary-by` to depend on visitor group setup of the content area.

```csharp
public static string GetContentAreaCacheDiscriminator(this IHtmlHelper htmlHelper, ContentArea contentArea)
{
    var httpContext = htmlHelper.ViewContext.HttpContext;

    if (contentArea == null)
    {
        return httpContext.Request.GetDisplayUrl();
    }

    var requiredRoles = string.Join(",", contentArea.Items.Select(x => x.ContentGroup));

    return $"{httpContext.Request.GetDisplayUrl()}-{requiredRoles}";
}
```

... and in the Razor view ...

```csharp
<cache vary-by="@Html.GetContentAreaCacheDiscriminator(Model.ContentArea)">
    @Html.PropertyFor(m => m.ContentArea)
</cache>
```

The `ContentGroup` property of every `ContentAreaItem` in the content area keeps track of what users can see the content.

Very nice!

The ability to re-evaluate the content area whenever some nested block is published is more tricky. The only simple-ish way I can come up with is listening to the publish event, increment some counter and include that counter in the cache discriminator method.

It would look something like this:

```csharp
public static class AtomicState
{
    public static int Counter = 0;

    public static void Increment() => Interlocked.Increment(ref Counter);
}

[InitializableModule, ModuleDependency(typeof(FrameworkInitialization))]
public class ContentEventsInitializableModule : IInitializableModule
{
    private IContentEvents _contentEvents;

    public void Initialize(InitializationEngine context)
    {
        _contentEvents = context.Locate.Advanced.GetRequiredService<IContentEvents>();

        _contentEvents.PublishedContent += OnPublished;
    }

    public void Uninitialize(InitializationEngine context)
    {
        _contentEvents.PublishedContent -= OnPublished;
    }

    private static void OnPublished(object sender, ContentEventArgs e)
    {
        AtomicState.Increment();
    }
}
```

Now we must make use of AtomicState.Counter in our cache discriminator method, so just add it to the return statement:

```csharp
return $"{httpContext.Request.GetDisplayUrl()}-{AtomicState.Counter}-{requiredRoles}";
```

Since `AtomicState.Counter` will be read zero or more times per request, we must make it thread safe - which in this case is achieved with `Interlocked.Increment(...)`.

If you wan't more granular control over what cache to invalidate, you need to check the published event for what content type was published and you need another counter for the specific case.

That's it. Thank you for your time! 😏
