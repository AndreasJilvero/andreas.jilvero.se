---
title: "How to pause traffic using YARP reverse proxy"
date: 2023-04-24T11:37:00.000Z
summary: "Discover the process of configuring YARP as a reverse proxy, enabling the capability to temporarily pause and resume traffic directed towards the destination."
keywords: "YARP, reverse proxy, .NET, ASP.NET Core, traffic management, pause traffic, load balancing, C#"
---

YARP is a .NET Core reverse proxy that you typically use as a layer on top of a web application. This blog post will demonstrate how YARP can pause traffic while there's downtime for the underlying web application - for example, while doing a deploy.

Setting up YARP in a .NET Core project is fairly straight forward. Let's start with the usual files Program.cs and Startup.cs.

```csharp
using Web.Proxy;

var app = Host.CreateDefaultBuilder(args)
    .ConfigureWebHostDefaults(builder => builder.UseStartup<Startup>())
    .Build();

app.Run();

```

```csharp
using Web.Proxy.Infrastructure;

namespace Web.Proxy;

public class Startup
{
    public IConfiguration Configuration { get; }

    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        // Add the reverse proxy to capability to the server
        var proxyBuilder = services.AddReverseProxy();

        // Initialize the reverse proxy from the "ReverseProxy" section of configuration
        proxyBuilder.LoadFromConfig(Configuration.GetSection("ReverseProxy"));
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseHttpLogging();

        // Enable endpoint routing, required for the reverse proxy
        app.UseRouting();

        // Register the reverse proxy routes
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapReverseProxy();
        });
    }
}

```

YARP can be configured either by code or by - as in this case - appsettings.json. This is controlled by executing the following line of code:

```csharp
proxyBuilder.LoadFromConfig(Configuration.GetSection("ReverseProxy"))
```

The appsettings.json can look like this:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ReverseProxy": {
    "Routes": {
      "route": {
        "ClusterId": "cluster",
        "Match": {
          "Path": "{**catch-all}"
        }
      }
    },
    "Clusters": {
      "cluster": {
        "Destinations": {
          "cluster/destination": {
            "Address": "http://localhost:1337/"
          }
        }
      },
      "paused": {
        "Destinations": {}
      }
    }
  }
}

```

Now, let's imagine the following deployment sequence:

1. Deployment package is downloaded and unzipped to a target folder
2. Physical path of the IIS web site is changed to the new folder

This generally means that IIS responds with 503 due to the changed physical path for a short period of time.

So, the web site is down and any requests are lost. A reverse proxy on top could provide a way to take care of those requests while the web site is down. That would require us to change the deployment sequence slightly:

1. Deployment package is downloaded and unzipped to a target folder
2. Pause traffic in the reverse proxy
3. Physical path of the IIS web site is changed to the new folder
4. When the web site is up and running, resume traffic

In order to pause traffic in YARP we need to make use of the following middleware.

```csharp
public class PauseMiddleware
{
    private readonly RequestDelegate _next;

    public PauseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext httpContext)
    {
        var reverseProxyFeature = httpContext.GetReverseProxyFeature();

        if (reverseProxyFeature.AvailableDestinations.Count == 0)
        {
            var configProvider = httpContext.RequestServices.GetRequiredService<IProxyConfigProvider>();
            var proxyStateLookup = httpContext.RequestServices.GetRequiredService<IProxyStateLookup>();
            var taskCompletionSource = new TaskCompletionSource();
            var config = configProvider.GetConfig();

            // Wait for the config to change
            config.ChangeToken.RegisterChangeCallback(SignalChange, taskCompletionSource);
            await taskCompletionSource.Task;

            // Re-assign request to working cluster instead of paused cluster
            if (!proxyStateLookup.TryGetCluster("cluster", out var clusterState))
            {
                throw new Exception("Could not find cluster.");
            }

            httpContext.ReassignProxyRequest(clusterState);
        }

        await _next(httpContext);
    }

    private static void SignalChange(object obj)
    {
        var taskCompletionSource = (TaskCompletionSource) obj;

        try
        {
            taskCompletionSource.SetResult();
        }
        catch (ObjectDisposedException)
        {
        }
    }
}
```

We also need to change Program.cs and Startup.cs slightly.

```csharp
using Web.Proxy;

var app = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration(builder => builder.AddJsonFile("paused.json", optional: true, reloadOnChange: true))
    .ConfigureWebHostDefaults(builder => builder.UseStartup<Startup>())
    .Build();

app.Run();

```

```csharp
app.UseEndpoints(endpoints =>
{
    endpoints.MapReverseProxy(proxyPipeline =>
    {
        proxyPipeline.UseMiddleware<PauseMiddleware>();
    });
});
```

As you can see, the reverse proxy application now also listens for a configuration file called paused.json. The content of that file is simply:

```json
{
  "ReverseProxy": {
    "Routes": {
      "route": {
        "ClusterId": "paused"
      }
    }
  }
}
```

So, when this file exists in the reverse proxy web application folder, it takes precedence. The effect is that the setting `ReverseProxy.Routes.route.ClusterId` changes from `cluster` to `paused`. As we can see in appsettings.json, this cluster has no destinations - which, in combination with `PauseMiddleware`, effectively pauses traffic until destinations once again are available.

That's it!

This solution relies on kind of toggling the existence of the paused.json file. When this file is available, all traffic will be paused - and vice versa. The actual toggling depends on your deployment solution and each option can't be covered in this post.
