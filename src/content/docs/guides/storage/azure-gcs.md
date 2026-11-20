---
title: Azure and Google Cloud Storage
description: Reading tables on Azure Blob Storage, ADLS and GCS. Writes to these stores are planned.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: 103b240c6de3
  class: derived
  cites: [CORE-STO-LOC, CORE-STO-CFG, CORE-STO-CRED, SPARK-CFG-STO]
engine: [spark, datafusion]
---

| | Azure Blob / ADLS | Google Cloud Storage |
|---|---|---|
| Read tables | Yes | Yes |
| Write, merge, purge | Planned | Planned |
| Unity Catalog credentials | Not yet | Not yet |

Writes, uploads and deletes on Azure and GCS are disabled until they have been validated against the real services. Today, write tables on S3-compatible storage or local disk; tables can be read from Azure and GCS.

## Azure

Locations: `abfss://container@account.dfs.core.windows.net/path`. The `abfs`, `wasb` and `wasbs` schemes are also accepted. The location must identify the storage account.

| Authentication | Keys (`spark.indextables.azure.`) |
|---|---|
| Account key | `accountName`, `accountKey` |
| Connection string | `connectionString` |
| Service principal | `tenantId`, `clientId`, `clientSecret` |
| Bearer token | `bearerToken` |
| Environment | None set: the process's `AZURE_*` environment variables are used |

```python
spark.conf.set("spark.indextables.azure.accountName", "mystorageaccount")
spark.conf.set("spark.indextables.azure.tenantId", tenant_id)
spark.conf.set("spark.indextables.azure.clientId", client_id)
spark.conf.set("spark.indextables.azure.clientSecret", client_secret)

spark.read.format("indextables") \
     .load("abfss://logs@mystorageaccount.dfs.core.windows.net/events")
```

Existing `fs.azure.*` Hadoop settings are used when no IndexTables key overrides them.

Companion sources on Azure accept an account key or a connection string under `companion.parquet.azure.*`. Other forms for sources are deferred.

## Google Cloud Storage

Locations: `gs://bucket/path`.

```python
spark.conf.set("spark.indextables.gcp.credentialsFile", "/secrets/gcs-key.json")

spark.read.format("indextables").load("gs://my-bucket/events")
```

Give a service-account key **file**. An inline key under `gcp.serviceAccountKey` is refused with an error, so that an ignored key can never cause a different identity to be used silently.

Existing `fs.gs.*` Hadoop settings are used when no IndexTables key overrides them.

## Not supported

HDFS is not supported.
