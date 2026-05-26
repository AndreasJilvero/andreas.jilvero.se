---
title: "A custom Fusion Cache backplane using Optimizely's Event Broker"
date: 2026-05-26T10:00:00.000Z
summary: "A practical look at implementing an IFusionCacheBackplane using the built-in IEventBroker in Optimizely to keep L1 caches in sync across instances."
keywords: "Fusion Cache, Optimizely, Episerver, Backplane, Event Broker, Azure Service Bus, Caching, .NET Core, PAAS"
---

When running Optimizely in a multi-instance PAAS environment like DXP, keeping local memory caches in sync can be a bit of a challenge. [Fusion Cache](https://github.com/ZiggyCreatures/FusionCache) is a solid library for handling L1/L2 caching, but out of the box, it needs a way to talk between instances—a backplane.

### The use case: Background updates

In my case, I had a scheduled job that imports inventory data from an external system. This job runs on a background instance, but the data it updates is cached and served by the public-facing web instances. 

When the job finished updating the database, I needed a way to tell the other instances that their cached data was now stale.

### Using the Optimizely Event Broker

Rather than setting up additional infrastructure like Redis Pub/Sub, I decided to use what was already available in the platform: `IEventBroker`. In a DXP setup, this typically uses Azure Service Bus to broadcast messages between instances.

Implementing `IFusionCacheBackplane` with the Event Broker allowed me to use the existing infrastructure to handle these notifications.

### Implementation: EventBrokerBackplane.cs

The implementation handles both the subscription to incoming events and the publishing of new ones.

```csharp
using EPiServer.Events.Clients;
using EPiServer.Events.Providers;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ZiggyCreatures.Caching.Fusion;
using ZiggyCreatures.Caching.Fusion.Backplane;

namespace MyOptimizelyApp.Infrastructure.Caching;

public class EventBrokerBackplane : IFusionCacheBackplane
{
    private static readonly Guid _raiserId = new Guid("E8B2B7D1-8A7E-4C2E-9C8D-6B7C1A2B3C4D");
    private static readonly Guid _eventId = new Guid("A1B2C3D4-E5F6-4A5B-8C9D-0E1F2A3B4C5D");

    private readonly IEventRegistry _eventRegistry;
    private readonly IEventBroker _eventBroker;

    private Action<BackplaneMessage> _incomingMessageHandler;

    public EventBrokerBackplane(IEventRegistry eventRegistry, IEventBroker eventBroker)
    {
        _eventRegistry = eventRegistry;
        _eventBroker = eventBroker;
    }

    public void Subscribe(BackplaneSubscriptionOptions options)
    {
        _incomingMessageHandler = options.IncomingMessageHandler;
        _eventBroker.EventReceived += EventReceived;
    }

    public void Unsubscribe()
    {
        _eventBroker.EventReceived -= EventReceived;
    }

    public async ValueTask PublishAsync(BackplaneMessage message, FusionCacheEntryOptions options, CancellationToken token)
    {
        if (options.SkipBackplaneNotifications)
        {
            return;
        }
        
        var messageJson = JsonSerializer.Serialize(message);
        var @event = _eventRegistry.Get(_eventId);
        
        await @event.RaiseAsync(_raiserId, messageJson, EventRaiseOption.RaiseBroadcast);
    }

    public void Publish(BackplaneMessage message, FusionCacheEntryOptions options, CancellationToken token)
    {
        if (options.SkipBackplaneNotifications)
        {
            return;
        }
        
        var messageJson = JsonSerializer.Serialize(message);
        var @event = _eventRegistry.Get(_eventId);

        @event.Raise(_raiserId, messageJson, EventRaiseOption.RaiseBroadcast);
    }

    private void EventReceived(object sender, EventReceivedEventArgs e)
    {
        if (e.EventId == _eventId && e.Param is string messageJson)
        {
            var message = JsonSerializer.Deserialize<BackplaneMessage>(messageJson);
            _incomingMessageHandler(message);
        }
    }
}
```

### Registration and Lifecycle

The backplane is registered as a **Singleton**. This is important because it needs to manage the long-running event subscription via the `IEventBroker`. 

Fusion Cache handles the initialization automatically. Once registered, it calls the `Subscribe` method as part of its internal setup, so there's no need for manual wiring in the startup code.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddSingleton<IFusionCacheBackplane, EventBrokerBackplane>();
    
    services.AddFusionCache()
        .WithDistributedCache(sp => sp.GetRequiredService<IDistributedCache>())
        .WithBackplane(x => x.GetRequiredService<IFusionCacheBackplane>());
}
```

### Practical Usage: Manual Invalidation

In the scheduled job, after the data is updated, I inject `IFusionCacheBackplane` and `IFusionCache` through the constructor to send an expiration message. 

It's necessary to provide the `SourceId` from the `_fusionCache.InstanceId`. This helps Fusion Cache realize that the message came from the current instance, avoiding an unnecessary self-invalidation loop.

```csharp
// Inside the Scheduled Job's ExecuteAsync method
var backplaneMessage = new BackplaneMessage
{
    CacheKey = "MyCustomCacheKey", 
    Action = BackplaneMessageAction.EntryExpire, // Marks as stale instead of deleting
    SourceId = _fusionCache.InstanceId 
};

await _fusionCacheBackplane.PublishAsync(backplaneMessage, new FusionCacheEntryOptions());
```

I chose `BackplaneMessageAction.EntryExpire` because it works well with Fusion Cache's fail-safe behavior. By marking the entry as stale rather than removing it, the public instances can still serve the old data if the fresh data resolution is slow or temporarily fails.

### Final thoughts

Using the built-in `IEventBroker` turned out to be a simple way to implement a backplane without adding more moving parts to the infrastructure. It’s been running reliably for our needs, keeping the caches synchronized between background processes and the web instances.
