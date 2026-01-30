---
title: "Using master keys to control Episerver cache"
date: 2023-04-13T11:37:00.000Z
summary: "Learn an simple and efficient way to make use of Episervers abstractions for caching and cache invalidation"
---

The art of implementing a good caching solution is to determine when to invalidate it. In theory, the more you finetune invalidation - the better your performance will be. In other terms, more work equals better performance. However, code always comes at a cost - *the best code is the code that does not exist*. Thankfully, there is a sweet spot where you don't need to put in too much effort in order to get great performance gains.

In Episerver or Optimizely CMS, the caching layer is made available using the interfaces `IObjectInstanceCache` and `ISynchronizedObjectInstanceCache`. The difference between these two is that the synchronized cache also accounts for multiple instances running the same application - that is, cache invalidation is replicated to all other instances as well.

Both interfaces expose this method:

```csharp
T ReadThrough<T>(string key, Func<T> readValue, Func<T, CacheEvictionPolicy> evictionPolicy)
```

It works like this;

If there is no cached value given the provided `key`, `readValue` will be executed and put in the cache. `evictionPolicy` will control how the cache is invalidated.

The `CacheEvictionPolicy` allows to provide absolute or sliding timeout as well as dependent cache keys and **master keys** - which is the main focus of this blog post.

Master keys allow us to specify just one key in order to invalidate lots of cache entries. This can be a bad thing, but in order to find the sweet spot - it's a blessing. It's very important to understand the difference to invalidate cache by key or by master key. Invalidating by key would require lots of work and would also require the developer to somehow keep track of all cached entries. Invalidating by master key takes just one line of code. Let's see how we can use it in a repository.

```csharp
public class InventoryService
{
    public const string InventoryMasterCacheKey = "inventory";

    private readonly IObjectInstanceCache _cache;
    private readonly IInventoryRepository _inventoryRepository;

    public InventoryService(IObjectInstanceCache cache, IInventoryRepository inventoryRepository)
    {
        _cache = cache;
        _inventoryRepository = inventoryRepository;
    }

    public Inventory GetInventory(string sku)
    {
        var cacheKey = CreateCacheKey(sku);

        return _cache.ReadThrough(cacheKey,
            () => InnerGetInventory(sku),
            () => new CacheEvictionPolicy(new string[0], new[] { InventoryMasterCacheKey }));
    }

    public void Save(IEnumerable<Inventory> entries)
    {
        _inventoryRepository.Save(entries);

        _cache.Remove(InventoryMasterCacheKey);
    }

    public void OnOrderPlaced(VariationContent variant)
    {
        _inventoryRepository.Reduce(variant.Code);

        var cacheKey = CreateCacheKey(variant.Code);

        _cache.Remove(cacheKey);
    }

    public static string CreateCacheKey(string sku)
    {
        return $"inventory-{sku}";
    }

    private Inventory InnerGetInventory(string sku)
    {
        // some expensive lookup
    }
}
```

Let's explain the code quickly. This is kind of a repository that simply returns inventory based on some `sku`. However, this is a expensive operation and thus there's a need to apply caching.

We make use of one regular cache key that's specific per `sku` and one master key. So, whenever the cache key is already in the cache, the cached value will be returned.

Now to the interesting part - cache invalidation. **This does not need to be tricky.** The first thing you need to realize is that applied caching will improve your performance incredibly much. That means that we can be somewhat lazy when it comes to invalidation.

In the example above, there are two invalidations. One when all inventory are replaced following a inventory import, and one following a placed order when the inventory needs to be reduced. So, the master key invalidation will evict all inventory entries from the cache regardless of the `sku`, and the regular cache key will only evict that specific cache entry for the provided `sku`.

It's not uncommon to see caching solutions that rely on absolute timeouts - for example, invalidating a cached entry five minutes after it was put in the cache. This will lead to many missed cache hits. My solution - on the other hand - relies on knowing exactly when to invalidate the cache in order to maximize cache hits.

We have now very successfully implemented a caching solution that will work, solid as a rock. If you're worried about memory going through the roof - the Episerver framework **should** take care of that.

Thank you for your time!
