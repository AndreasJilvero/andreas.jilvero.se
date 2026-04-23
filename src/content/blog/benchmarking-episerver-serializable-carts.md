---
title: "Benchmarking Episerver serializable carts"
date: 2022-09-01T20:15:00.000Z
summary: "Comparing performance between traditional and serializable carts in Episerver Commerce (Optimizely)."
keywords: "Episerver Commerce, Optimizely Commerce, serializable carts, benchmarking, performance, BenchmarkDotNet, .NET"
---

Episerver Commerce (now Optimizely Commerce) introduced serializable carts as a replacement for the traditional cart system. The main selling point was significantly better read performance, since serializable carts are stored as a serialized blob rather than normalized across multiple database tables.

I ran a benchmark comparison between the two approaches back when the feature was still new. The results were striking enough that they influenced the architecture decisions on several projects I have worked on since.

### What are serializable carts?

The traditional Episerver cart model stores each cart line item, shipment, and order form as separate rows across several related tables. Reading a cart requires multiple joins and round-trips. Serializable carts flip this model: the entire cart is stored as a single serialized JSON blob in one row, making reads much cheaper.

The trade-off is that writes become slightly more expensive (the entire cart is re-serialized on every save), and querying across cart contents is harder since the data is opaque to SQL.

### Benchmark results

The benchmark was conducted using [BenchmarkDotNet](https://benchmarkdotnet.org/) against a local SQL Server instance with realistic cart data. The scenario was loading a cart with a single line item, repeated across many iterations.

| Cart type | Mean | Allocated |
|---|---|---|
| Traditional | ~15 ms | ~120 KB |
| Serializable | ~2 ms | ~30 KB |

Serializable carts were roughly **7x faster** for reads and used significantly less memory. For high-traffic e-commerce sites where cart reads vastly outnumber writes, this is a meaningful difference.

The full benchmark writeup is available on the Optimizely community blog:
[Benchmarking Episerver serializable carts](https://world.optimizely.com/blogs/andreas-j/dates/2017/6/benchmarking-episerver-serializable-carts2/)

### Should you migrate?

If you are on Optimizely Commerce and still using traditional carts, the performance numbers alone make a strong case for migrating. The main things to validate before switching:

- Any code that queries cart contents directly via SQL will break, since the data is no longer queryable in the traditional sense.
- Custom cart providers or extensions that depend on the normalized table structure need to be updated.
- The migration itself is well-supported by Optimizely and can typically be done with minimal downtime.

For greenfield projects there is no reason to start with the traditional cart system.
