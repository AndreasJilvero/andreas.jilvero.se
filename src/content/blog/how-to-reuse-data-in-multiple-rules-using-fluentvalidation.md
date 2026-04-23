---
title: "How to reuse data in multiple rules using FluentValidation"
date: 2023-04-16T11:37:00.000Z
summary: "Discover a method of caching costly lookups performed in multiple validators within the scope of a request"
keywords: "FluentValidation, .NET, C#, validation rules, caching, request scoped, ASP.NET Core validation"
---

[FluentValidation](https://github.com/FluentValidation/FluentValidation) is a popular .NET library for validating models. Beyond keeping validation logic clean and testable, it separates validation concerns from business logic in a way that encourages good architecture.

One problem that comes up repeatedly in real projects: multiple validation rules need the same external value — something fetched from a database or an external API. Fetching that value once per rule is wasteful and can make a single validation call surprisingly expensive.

### The problem

Imagine validating a return order number. You need to check two things: that the order exists, and that its status is at least "delivered". Both rules need the same order object loaded from the database. The naive implementation fetches the order twice:

```csharp
RuleFor(x => x)
    .Must(orderNumber => _repository.Load(orderNumber) != null)
        .WithMessage("Order was not found.")
    .Must(orderNumber => _repository.Load(orderNumber)?.OrderStatus == OrderStatus.Completed)
        .WithMessage("Order has not yet been delivered.");
```

Two database calls for one validation request. With more rules, this gets worse quickly.

### The solution: PreValidate

FluentValidation provides a lifecycle hook called `PreValidate` that runs before any rules are evaluated. This is the right place to perform expensive lookups and store the results in the validation context, which all rules can then read.

```csharp
public class ReturnOrderValidator : AbstractValidator<string>
{
    private const string OrderContextKey = nameof(OrderContextKey);

    private readonly IPurchaseOrderRepository _purchaseOrderRepository;

    public ReturnOrderValidator(IPurchaseOrderRepository purchaseOrderRepository)
    {
        _purchaseOrderRepository = purchaseOrderRepository;

        RuleFor(x => x)
            .Must((model, _, context) => context.GetContext<IPurchaseOrder>(OrderContextKey) != null)
                .WithMessage("Order was not found.")
            .Must((model, _, context) => context.GetContext<IPurchaseOrder>(OrderContextKey).OrderStatus == OrderStatus.Completed)
                .WithMessage("Order has not yet been delivered.");
    }

    protected override bool PreValidate(ValidationContext<string> context, ValidationResult result)
    {
        var order = _purchaseOrderRepository.Load(context.InstanceToValidate);
        context.SetContext(OrderContextKey, order);
        return base.PreValidate(context, result);
    }
}
```

The order is now fetched exactly once and stored in `RootContextData` under a typed key. Each rule reads from the context rather than calling the repository directly.

### Extension methods for clean context access

`RootContextData` is a `Dictionary<string, object>`, so reading from it requires a cast. A pair of extension methods keeps this clean:

```csharp
public static class FluentValidationExtensions
{
    public static T GetContext<T>(this IValidationContext validationContext, string key) where T : class
    {
        return validationContext.RootContextData[key] as T;
    }

    public static void SetContext<T>(this IValidationContext validationContext, string key, T value) where T : class
    {
        validationContext.RootContextData[key] = value;
    }
}
```

This pattern scales well. If you add a third rule that also needs the order, it reads from the same context entry — no additional database calls.

### When to use this pattern

This is most valuable when:

- You have two or more rules that need the same external value.
- The lookup is expensive (database query, HTTP call, cache miss).
- The validator is registered as a scoped or transient service, so the context is fresh per request.

It is not necessary for simple validators that only look at properties of the model being validated, since those rules have no external dependencies to de-duplicate.

### A note on async

The `PreValidate` method is synchronous. If your lookup is inherently async (e.g. an HTTP call), you have a few options: make the lookup sync via `.GetAwaiter().GetResult()` (acceptable for short-lived operations in a web context), use a custom `IAsyncValidator` implementation, or pre-load the value before passing the model to the validator and include it as part of the context model itself. The right choice depends on how your validators are wired up.
