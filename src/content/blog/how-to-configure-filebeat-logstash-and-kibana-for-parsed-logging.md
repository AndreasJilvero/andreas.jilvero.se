---
title: "How to configure Filebeat, Logstash and Kibana for parsed logging"
date: 2024-02-04T12:37:00.000Z
summary: "Learn how to read IIS server logs and structured Serilog logs using Filebeat, and ship them via Logstash to Elasticsearch"
keywords: "Filebeat, Logstash, Kibana, Elasticsearch, ELK stack, IIS logs, Serilog, structured logging, .NET logging"
---

Setting up the ELK stack (Elasticsearch, Logstash, Kibana) with Filebeat for a .NET application that produces both IIS access logs and structured Serilog application logs is not well-documented. Most guides cover one or the other, not both together. This post summarises what it takes to get both log sources flowing into Elasticsearch, correctly parsed, and visible in Kibana.

### Prerequisites

The setup assumes:

- Application logs are structured JSON written by Serilog.
- IIS server logs use the W3C format (the default).
- You are running on Windows and want to test locally before deploying.

Download the ZIP versions of each tool — not the MSI installers — so you can run multiple versions side by side without polluting your system:

- [Filebeat](https://www.elastic.co/downloads/beats/filebeat)
- [Logstash](https://www.elastic.co/downloads/logstash)
- [Elasticsearch](https://www.elastic.co/downloads/elasticsearch)
- [Kibana](https://www.elastic.co/downloads/kibana)

### Step 1 - Start Elasticsearch with security disabled

Elasticsearch 8.x enables security (HTTPS + authentication) by default. For local development, disable it to keep things simple:

```
C:\Temp\elasticsearch-8.12.0> .\bin\elasticsearch.bat -E xpack.security.enabled=false
```

Elasticsearch will be available at `http://localhost:9200`. You should see a JSON response with cluster details when you open that URL in a browser.

### Step 2 - Start Kibana and note existing state

```
C:\Temp\kibana-8.12.0> .\bin\kibana.bat
```

Kibana connects to Elasticsearch on `http://localhost:9200` by default and serves its UI on `http://localhost:5601`. Before going further, open the Kibana UI and note the current state of [indexes](http://localhost:5601/app/management/data/index_management/indices) and [ingest pipelines](http://localhost:5601/app/management/ingest/ingest_pipelines/). You will want to compare this after Logstash and Filebeat are running to confirm that data is flowing correctly.

### Step 3 - Start Logstash with the sample configuration

Logstash ships with a sample config that listens for Beats input on port 5044 and forwards to Elasticsearch:

```
C:\Temp\logstash-8.12.0> .\bin\logstash.bat -f .\config\logstash-sample.conf
```

This creates an index template called `ecs-logstash` in Elasticsearch. Logstash is now ready to receive data from Filebeat.

### Step 4 - Configure Filebeat for both IIS and application logs

Filebeat needs to be set up to read two distinct log sources and forward both to Logstash.

**Initial setup** — run once to install Kibana dashboards:

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe -e setup
```

**Enable the IIS module** — this renames `modules.d\iis.yml.disabled` to `modules.d\iis.yml`:

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe modules enable iis
```

**Set up Elasticsearch ingest pipelines for IIS parsing:**

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe -e setup --pipelines --modules iis -M "iis.access.enabled=true"
```

This creates the `filebeat-8.12.0-iis-access-pipeline` ingest pipeline in Elasticsearch, which knows how to parse W3C-formatted IIS log lines.

**Switch Filebeat output from Elasticsearch to Logstash.** Open `filebeat.yml` and make this change:

```yaml
#output.elasticsearch:
  # hosts: ["localhost:9200"]
output.logstash:
  hosts: ["localhost:5044"]
```

**Configure the filestream input** for your Serilog application logs. In the same `filebeat.yml`:

```yaml
- type: filestream
  enabled: true
  paths:
    - C:\Develop\YourProject.Website\App_Data\*.log
```

**Configure the IIS module** to point at your IIS log directory. Open `modules.d\iis.yml`:

```yaml
- module: iis
  access:
    enabled: true
    var.paths:
    - C:\inetpub\logs\LogFiles\W3SVC2\*.log
```

### Step 5 - Route the two log sources to their correct pipelines

With both the filestream input and the IIS module active, Filebeat is now sending two distinct types of log data to Logstash. You need Logstash to route them to the right ingest pipelines for correct parsing.

Check the [ingest pipelines](http://localhost:5601/app/management/ingest/ingest_pipelines/) in Kibana — you should now see:

- `filebeat-8.12.0-iis-access-pipeline` — for parsing W3C IIS logs
- `logs@json-pipeline` — for parsing structured JSON logs

Update `config\logstash-sample.conf` to route based on whether a pipeline is specified in the Beats metadata:

```yaml
input {
  beats {
    port => 5044
  }
}

output {
  stdout { codec => rubydebug }

  if [@metadata][pipeline] {
    elasticsearch {
      hosts => ["http://localhost:9200"]
      index => "%{[@metadata][beat]}-%{[@metadata][version]}"
      manage_template => false
      action => "create"
      pipeline => "%{[@metadata][pipeline]}"
    }
  } else {
    elasticsearch {
      hosts => ["http://localhost:9200"]
      index => "%{[@metadata][beat]}-%{[@metadata][version]}"
      manage_template => false
      action => "create"
      pipeline => "logs@json-pipeline"
    }
  }
}
```

IIS logs — which have a known pipeline attached by the module — are routed to the IIS ingest pipeline. Application logs — which have no pipeline metadata — fall through to `logs@json-pipeline`, which parses the JSON fields from Serilog.

### Verifying and debugging

Once everything is running, open the [Discover](http://localhost:5601/app/discover#/) view in Kibana and look for incoming log entries. If IIS logs are not parsing correctly, use the [Grok Debugger](http://localhost:5601/app/dev_tools#/grokdebugger) in Kibana to test your GROK pattern against a sample log line. The IIS W3C format is standard, but the exact field order can vary between IIS versions and configurations.

With correct GROK patterns in place you will also get access to out-of-the-box IIS dashboards in Kibana that give you request volume, error rates, and top URLs at a glance.

For a broader introduction to the ELK stack setup, the [DigitalOcean tutorial on installing the Elastic Stack on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-22-04) covers the concepts well even if you are on Windows.
