---
title: "How to reuse data in multiple rules using FluentValidation"
date: 2023-04-16T11:37:00.000Z
summary: "Discover a method of caching costly lookups performed in multiple validators within the scope of a request"
---

In web projects, I often use [FluentValidation](https://github.com/FluentValidation/FluentValidation) to validate models in .NET Core backend. Not only is it a good way to validate models, it also kind of forces the developer to separate validation from other logic.

However, when using FluentValidation I always find myself in a situation where I need to use the same *external* value in multiple validation rules. By *external* I mean *not in the current context*. This can be some value from the database or from a rest API, and it would be expensive to fetch this value for every evaluated rule.

In order to resolve this, we can make use of a lifecycle event - `PreValidate`. This method executes before all rules are evaluated, which enables us to pre-cache any expensive lookup.

Let's look into some code. This is a validator that validates a order number provided as a `string`. It will validate that the order exists and that its status is at least delivered.

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

In order to easily access the validation context, I use these extension methods.

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

That's it!
