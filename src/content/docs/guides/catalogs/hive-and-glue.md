---
title: Hive Metastore and Glue
description: Persist IndexTables table names in a Hive Metastore or the AWS Glue Data Catalog, including shared names across regions.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 3ebc49ba9d44
  class: derived
  cites: [SPARK-CAT-ENT, SPARK-CAT-RES, SPARK-CAT-COMPAT, SPARK-CAT-CRED]
engine: [spark]
---

Spark's session catalog stores its entries in memory by default, so names last only for the session. Backed by a Hive Metastore or by Glue, entries persist and are shared by every cluster that uses the metastore.

Nothing about IndexTables changes: the statements in [Use tables by name](/guides/catalogs/tables-by-name/) work the same way. Only the Spark session set-up differs.

## Hive Metastore

```python
spark = (SparkSession.builder
  .config("spark.sql.extensions", "io.indextables.extensions.IndexTablesSparkExtensions")
  .config("spark.sql.catalogImplementation", "hive")
  .config("spark.hadoop.hive.metastore.uris", "thrift://metastore.internal:9083")
  .enableHiveSupport()
  .getOrCreate())

spark.sql("""
  CREATE TABLE logs.events USING indextables
  LOCATION 's3://my-bucket/events'
""")
```

On Spark 4.2 with the built-in catalog, also set `spark.sql.catalog.spark_catalog` to `io.indextables.spark.catalog.IndexTablesSessionCatalog`.

## AWS Glue Data Catalog

On EMR, enable the Glue Data Catalog as the Hive metastore for Spark in the cluster's configuration; Spark then uses Glue wherever it would use a Hive Metastore. Elsewhere, configure the Glue client factory:

```text
spark.sql.catalogImplementation=hive
spark.hadoop.hive.metastore.client.factory.class=com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory
```

This is the standard Spark-on-Glue set-up and is not specific to IndexTables. The Glue example is not run in this project's continuous integration.

## What is stored in the metastore

| Field | Value |
|---|---|
| Provider | `indextables` |
| Table type | External |
| Location | The table's root |
| Property `indextables.tableId` | The identity of the table the entry was created for. Written by IndexTables; it cannot be edited |
| Schema | Empty. The schema is always read from the table's transaction log |

Because the stored schema is empty, tools that read the metastore directly, without Spark and the IndexTables extension, see the name and location but no columns.

## One table, several names

Any number of entries may point to the same location, in one metastore or several. Each is only a name. Dropping one leaves the table and the other names intact.

## Shared metastores across regions

A metastore shared by clusters in several regions can hold one entry per regional replica of a table. For companion tables, the [companion lookup catalog](/guides/catalogs/companion-lookup/) selects a regional index root automatically from properties on the source table.

## Permissions

Reading a table by name needs both:

- permission in the metastore to look the name up, and
- storage credentials for the table's location, exactly as for a read by path.

Neither substitutes for the other. See [S3 credentials](/guides/storage/s3/).

## Older clusters

IndexTables 0.5.5 on Spark 3.5 cannot read these entries by name; it fails with Spark's own error. Clusters still running 0.5.5 should keep reading by path.
