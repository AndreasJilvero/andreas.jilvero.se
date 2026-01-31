---
title: "How to configure Filebeat, Logstash and Kibana for parsed logging"
date: 2024-02-04T12:37:00.000Z
summary: "Learn how to read IIS server logs and structured Serilog logs using Filebeat, and ship them via Logstash to Elasticsearch"
---

### Intro

I was trying to set up logging in a setup that included Filebeat, Logstash and Kibana on top of Elasticsearch. The logging was made up of both application logs via Serilog and IIS request logs. I couldn't find any good documentation for this scenario, so this post will attempt to summarize the process.

### Prerequisites

The context of this blog post is that the application logs are [structured](https://www.structlog.org/en/stable/why.html) via JSON and that the IIS server logs use the format W3C.

Also, make sure you have the following applications. I recommend that you select the ZIP downloads - not the MSI versions - if it's your personal computer.

[Filebeat](https://www.elastic.co/downloads/beats/filebeat)

[Logstash](https://www.elastic.co/downloads/logstash)

[Elasticsearch](https://www.elastic.co/downloads/elasticsearch)

[Kibana](https://www.elastic.co/downloads/kibana)

### Step 1 - Elasticsearch

Start Elasticsearch by running:

```
C:\Temp\elasticsearch-8.12.0> .\bin\elasticsearch.bat -E xpack.security.enabled=false
```

This will start Elasticsearch running on [http://localhost:9200/](http://localhost:9200/). In Elasticsearch 8.0 and later, security is enabled automatically which translates to both HTTPS and authentication. This command disables those features.

### Step 2 - Kibana

Start Kibana by running:

```
C:\Temp\kibana-8.12.0> .\bin\kibana.bat
```

By default, Kibana will connect to Elasticsearch on [http://localhost:9200/](http://localhost:9200/) and serve it's UI on [http://localhost:5601/](http://localhost:5601/). You should be able to access both endpoints in the browser.

Take note of [existing indexes](http://localhost:5601/app/management/data/index_management/indices) and [ingest pipelines](http://localhost:5601/app/management/ingest/ingest_pipelines/), as they will change after we've started Logstash and Filebeat.

### Step 3 - Logstash

Start Logstash by running:

```
C:\Temp\logstash-8.12.0> .\bin\logstash.bat -f .\config\logstash-sample.conf
```

This will spin up a Logstash instance listening for data on port 5044 and sending data to Elasticsearch on [http://localhost:9200](http://localhost:9200), as configured in `logstash-sample.conf`. Also, an index template called [ecs-logstash](http://localhost:5601/app/management/data/index_management/templates/ecs-logstash) will be created.

### Step 4 - Filebeat

This section is inspired by [this example using Kafka instead of Logstash](https://www.elastic.co/guide/en/logstash/current/use-filebeat-modules-kafka.html).

First we need to setup filebeat using the following command:

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe -e setup
```

I think this step adds dashboards in Kibana. The `-e` flag adds verbose output to console.

Next step is to enable the module IIS:

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe modules enable iis
```

The only thing this does - I think - is that it removes the suffix `.disabled` for the file `modules.d\iis.yml.disabled`.

Then, set up pipelines in Elasticsearch using command:

```
C:\Temp\filebeat-8.12.0-windows-x86_64> .\filebeat.exe -e setup --pipelines --modules iis -M "iis.access.enabled=true"
```

But, what we wanted was to send data through Logstash. Therefore, we need to follow [this guide](https://www.elastic.co/guide/en/logstash/current/use-ingest-pipelines.html).

Open `filebeat.yml` and comment out the Elasticsearch output and enable Logstash instead.

```yaml
#output.elasticsearch:
  # hosts: ["localhost:9200"]
output.logstash:
  hosts: ["localhost:5044"]
```

In the same file, we should also enable `filestream` input. Make sure the following settings are set accordingly:

```yaml
- type: filestream
  enabled: true
  paths:
    - C:\Develop\YourProject.Website\App_Data\*.log
```

Last step is to also modify `modules.d\iis.yml`. Make sure the following settings has been set accordingly:

```yaml
- module: iis
  access:
    enabled: true
    var.paths:
    - C:\inetpub\logs\LogFiles\W3SVC2\*.log
```

So, if we would start filebeat now, we would have two providers of logs - filestream input and IIS logs. We need a way treat these files differently, therefore we need to configure Logstash once more.

### Step 5 - Back to Logstash

If we once again check the [ingest pipelines](http://localhost:5601/app/management/ingest/ingest_pipelines), we can now see that we have more pipelines. The interesting ones are:

filebeat-8.12.0-iis-access-pipeline

logs@json-pipeline

In order to direct the different logs to these two pipelines, we need to modify `config\logstash-sample.conf`.

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

This will direct the logs to the two different ingest pipelines. You might need to change the GROK pattern used in the IIS pipeline. In order to debug your IIS logs with the GROK patterns, you can use the [Grok Debugger](http://localhost:5601/app/dev_tools#/grokdebugger), provided by Kibana.

You should now be able to see your logs in the [Discover](http://localhost:5601/app/discover#/) view, and once you got those GROK patterns going, you should be able to create out-of-the-box IIS dashboards.

I should mention that [this guide](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-22-04) describes the process well as well.
