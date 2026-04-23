---
title: "Combining enums and Visitor pattern"
date: 2022-01-16T15:46:00.000Z
summary: "Explore a clean architectural pattern by combining C# Enums with the Visitor Pattern to avoid messy switch statements."
---

I often find myself in situations where I need specific logic based on some state, for example the value of an `enum`. The `enum` type enables us to define a limited selection of constants in a key value fashion.

In this example, I will try to create a more usable enum while still preserving the limited selection of values. The scenario is a product type `enum` and the extra thing I want to enable is different size sorting based on the product type.

The different product types are clothes and shoes.

Let's start off with creating a `class` that will act as a `enum`.

```csharp
public abstract class ExtendedEnum
{
    protected ExtendedEnum(int id, string name)
    {
        Id = id;
        Name = name;
    }

    public int Id { get; }
    public string Name { get; }
}
```

Now let's implement our product type.

```csharp
public class ProductType : ExtendedEnum
{
    public static ProductType Clothing = new ProductType(1, "Clothing");
    public static ProductType Shoes = new ProductType(2, "Shoes");

    public ProductType(int id, string name) : base(id, name)
    {
    }
}
```

There are some ways in which we can apply custom logic depending on product type. One way could be to simply add one or more `Func<>` to the `ProductType` constructor, but if there are complex dependencies this will not be feasible.

A more dynamic way to apply custom logic is to use the visitor pattern. I will show you that this also allow you to still use dependency injection and testable code.

This is the only overhead, but start off with creating specific classes for `Clothing` and `Shoes`.

```csharp
public class ClothingProductType : ProductType
{
    public ClothingProductType() : base(1, "Clothing")
    {
    }
}

public class ShoesProductType : ProductType
{
    public ShoesProductType() : base(2, "Shoes")
    {
    }
}
```

Also, change `ProductType.cs` into a abstract class and change the static properties.

```csharp
public abstract class ProductType : ExtendedEnum
{
    public static ProductType Clothing = new ClothingProductType();
    public static ProductType Shoes = new ShoesProductType();

    public ProductType(int id, string name) : base(id, name)
    {
    }
}
```

Next step is to introduce a visitor interface ...

```csharp
public interface IProductTypeVisitor
{
    void Visit(ClothingProductType productType);
    void Visit(ShoesProductType productType);
}
```

...  and a method to apply it to a product type.

```csharp
public abstract class ProductType : ExtendedEnum
{
    ...

    public abstract void Accept(IProductTypeVisitor visitor);
}
```

This will force you to implement `void Accept(IProductTypeVisitor visitor)` on every implementation of `ProductType`. This is actually great, because typically, people seem to use `switch` statements in order to do stuff based on the enum value. However, these `switch` statements needs maintenance as new product types are added.

Now let's implement the product type visitor.

```csharp
public class ProductTypeVisitor : IProductTypeVisitor
{
    private static readonly List<string> ClothingSizes = new List<string>()
    {
        "XS",
        "S",
        "M",
        "L",
        "XL"
    };

    private readonly IEnumerable<string> _sizes;

    public ProductTypeVisitor(IEnumerable<string> sizes)
    {
        _sizes = sizes;
    }

    public IEnumerable<string> SortedSizes { get; private set; }

    public void Visit(ClothingProductType productType)
    {
        SortedSizes = _sizes.OrderBy(x => ClothingSizes.IndexOf(x));
    }

    public void Visit(ShoesProductType productType)
    {
        SortedSizes = _sizes.OrderBy(int.Parse);
    }
}
```

That's it! We are now able to use ProductTypeVisitor wherever we'd like, for example in a product controller.

```csharp
public class ProductController : Controller
{
    public ActionResult Index(int productId)
    {
        var product = GetProduct(productId);
        var productTypeVisitor = new ProductTypeVisitor(product.Sizes);
        product.ProductType.Accept(productTypeVisitor);

        var viewModel = new ProductViewModel
        {
            Sizes = productTypeVisitor.SortedSizes,
            ...
        }
    }
}
```

There are many benefits by using this pattern. A product is often a domain entity and in a onion architecture - domain entities are placed in the core. Outside the layer, there's usually a data layer and on top of that, there's a presentation layer. The implementation of `IProductTypeVisitor` can be in any of these layers, and thus, we can let it have **any** dependency it needs. It's just a matter of resolving these dependencies like you usually do - maybe in a controller constructor - and pass that dependency as a argument to the `ProductTypeVisitor` constructor.

But hey, don't take only my word for it - [a lot of people are using this pattern](https://stackoverflow.com/a/859751/1458495).
