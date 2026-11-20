---
title: Iceberg companions
description: Build a companion over an Iceberg table in a REST, Glue or Hive Metastore catalog, with incremental sync and row-level deletes.
sidebar: { order: 4 }
lid:
  reviewed: a865437
  fingerprint: 21429dba91ab
  class: derived
  cites: [SPARK-SYNC-ICE, SPARK-SYNC-INC, SPARK-SYNC-WM, SPARK-SYNC-DEL, SPARK-SYNC-PART, CORE-SRD-ICE, CORE-SRD-DEL, CORE-SRD-PART]
engine: [spark]
---

```sql
BUILD INDEXTABLES COMPANION FOR ICEBERG 'analytics.events'
  CATALOG 'prod' TYPE 'rest'
  WAREHOUSE 's3://my-bucket/warehouse'
  AT LOCATION 's3://my-bucket/indexes/events';
```

The source is named as `namespace.table`. The catalog it lives in is given on the command or in configuration.

## Catalogs

| `TYPE` | Catalog | Tested |
|---|---|---|
| `rest` | Iceberg REST catalog, including Unity Catalog's Iceberg endpoint | End to end |
| `glue` | AWS Glue | Catalog construction only |
| `hms` | Hive Metastore | Catalog construction only |

Catalog settings are taken, in order, from the command's `CATALOG`, `TYPE` and `WAREHOUSE` clauses, then the values stored in the companion by its first build, then session configuration:

| Key (`spark.indextables.iceberg.`) | Meaning |
|---|---|
| `catalogType` | `rest`, `glue` or `hms` |
| `uri` | Catalog endpoint |
| `warehouse` | Warehouse location or name |
| `token` | Bearer token for a REST catalog |
| `credential` | OAuth client credential for a REST catalog |
| `s3Endpoint`, `s3PathStyleAccess` | For S3-compatible storage |

Full examples for each catalog are in [catalog sources for companions](/guides/catalogs/catalog-sources/).

## Credentials

When the catalog issues storage credentials, they are used to read the table's metadata and manifests, and are refreshed by reloading the table. Source credentials you configure explicitly take precedence, and build tasks read data files with the configured source credentials.

## Keeping it current

Run the same command again. The companion remembers the snapshot it last covered and applies only the changes since. It reconciles against the whole table instead when that snapshot has expired, or when more manifests differ than `companion.sync.iceberg.maxIncrementalManifests`.

```sql
BUILD INDEXTABLES COMPANION FOR ICEBERG 'analytics.events'
  CATALOG 'prod' TYPE 'rest'
  FROM SNAPSHOT 8123456789012345678
  AT LOCATION 's3://my-bucket/indexes/events';
```

`FROM SNAPSHOT` means "apply only the changes after this snapshot". The snapshot must be an ancestor of the current one. It is not time travel: a companion always reflects the current table.

## Deletes

Position deletes, equality deletes and Iceberg v3 deletion vectors are honoured; no deleted row is returned. See [row-level deletes](/guides/companions/deletes/).

## Partitioning

Only identity partition fields become partition columns of the companion. A table partitioned only by transforms, such as `days(ts)`, is indexed as unpartitioned; queries still work, and time filters are answered by the index and file statistics.

A partition spec that evolved is supported as long as the live files' specs share the same identity columns.

## Limits

- **No time travel.** A companion of an older snapshot is not offered.
- **Parquet data files only.** A live data file in another format fails the sync, naming the file.
- **Parquet delete files only.** An applicable Avro or ORC delete file fails the sync, naming the file.
- A `variant` data column must be excluded with `EXCLUDE COLUMNS`; a `variant` partition column fails.
- Very large table metadata is bounded by `iceberg.maxMetadataBytes`.
- Tables whose equality deletes change often, as with change-data-capture writers, cause older files to be re-indexed on most syncs.
