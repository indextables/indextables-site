---
title: What is not supported
description: Every catalog and statement IndexTables refuses, why, and what to do instead.
sidebar: { order: 9 }
lid:
  reviewed: a865437
  fingerprint: 47c55032a983
  class: derived
  cites: [SPARK-CAT-UNS, SPARK-CAT-ALT, SPARK-CAT-DDL, SPARK-CAT-WR, DF-AD-CAT]
engine: [spark, datafusion]
---

IndexTables refuses what it cannot do correctly, before changing anything, with an error that names the table and the alternative. This page collects those refusals for catalogs.

## Catalogs

| Catalog | Refused | Do instead |
|---|---|---|
| Unity Catalog (Databricks or open source), including as `spark_catalog` | Registering an IndexTables table | Read and write by path with [Unity Catalog credentials](/guides/catalogs/unity-catalog/) |
| A named Iceberg catalog (`SparkCatalog`, REST and others) | Registering an IndexTables table | Register in the session catalog; use the Iceberg catalog as a [companion source](/guides/catalogs/catalog-sources/) |
| Any other named V2 catalog | Registering an IndexTables table | Register in the session catalog |
| An unrecognised class installed as `spark_catalog` | Creating, replacing or writing by name | List the class in `spark.indextables.catalog.allowedSessionCatalogClasses` if it behaves as a session catalog |
| Polaris generic tables; Unity Catalog external volumes | Not available; deferred upstream | Read and write by path |
| DataFusion catalog provider | Registering or dropping tables through it | Change your entry source |

## Statements on tables by name

The full table, with reasons, is in [Use tables by name](/guides/catalogs/tables-by-name/#what-is-refused). In short:

- `TRUNCATE TABLE`, `ANALYZE TABLE`, `MSCK REPAIR TABLE`
- `ALTER TABLE` column and partition forms
- `CREATE TABLE` without a location, `CREATE TABLE … LIKE`, bucketing, sort order, partition transforms, column defaults and constraints
- `REPLACE TABLE` with a column list and no `AS SELECT`
- `DROP TABLE`, `RENAME` and `DROP DATABASE … CASCADE` on **managed** entries
- `writeTo(t).append()`, `overwrite(…)` and `overwritePartitions()` on existing entries
- Replacing a table of another format with an IndexTables table, or the reverse, in one statement
- `spark.indextables.*` and `indextables.*` keys as entry properties

## Why refuse instead of approximate

A catalog statement that half-works is worse than one that fails. Spark's own `TRUNCATE TABLE` would delete the transaction log. `ANALYZE TABLE` would store statistics that go stale. Dropping a managed entry would delete a table other sessions are using. In each case the refusal happens before any file or entry is changed.
