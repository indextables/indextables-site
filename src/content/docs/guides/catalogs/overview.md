---
title: Catalogs at a glance
description: Which catalogs IndexTables works with, what each supports, and where to find a complete example.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 2a83ad99b7a1
  class: derived
  cites: [SPARK-CAT-ENT, SPARK-CAT-RES, SPARK-CAT-UNS, SPARK-CAT-CMP, SPARK-CAT-CRED, SPARK-OPS-CAT, DF-AD-FAC, DF-AD-CAT]
engine: [spark, datafusion]
---

A catalog lets you use a table by name instead of by storage path. IndexTables works with catalogs in four distinct ways. Find your catalog in the table, then follow the link.

## Your catalog, what works, and an example

| Your catalog | What works | Example |
|---|---|---|
| Spark's built-in session catalog (in-memory) | Register, create, read, write and drop tables by name | [Use tables by name](/guides/catalogs/tables-by-name/) |
| Hive Metastore | The same, persisted in the metastore | [Hive Metastore and Glue](/guides/catalogs/hive-and-glue/) |
| AWS Glue Data Catalog | The same, persisted in Glue; one table under several names and regions | [Hive Metastore and Glue](/guides/catalogs/hive-and-glue/) |
| Delta's `DeltaCatalog` as the session catalog | IndexTables tables beside Delta tables in the same catalog | [Beside Delta and Iceberg](/guides/catalogs/delta-and-iceberg/) |
| Iceberg's `SparkSessionCatalog` as the session catalog | IndexTables tables beside Iceberg tables in the same catalog | [Beside Delta and Iceberg](/guides/catalogs/delta-and-iceberg/) |
| Unity Catalog | Credentials for reading and writing by path. Registering IndexTables tables is refused | [Unity Catalog](/guides/catalogs/unity-catalog/) |
| Iceberg REST catalog | Source of Iceberg tables for companions, with catalog-issued credentials | [Catalog sources for companions](/guides/catalogs/catalog-sources/) |
| Glue or Hive Metastore holding Iceberg tables | Source of Iceberg tables for companions | [Catalog sources for companions](/guides/catalogs/catalog-sources/) |
| Any catalog holding the source table of a companion | Query the companion under the source table's name | [Companion lookup catalog](/guides/catalogs/companion-lookup/) |
| DataFusion session | `CREATE EXTERNAL TABLE`, and a read-only catalog provider | [DataFusion](/guides/catalogs/datafusion/) |
| A named Iceberg catalog (`SparkCatalog`), or another named V2 catalog | Registering IndexTables tables is refused | [What is not supported](/guides/catalogs/not-supported/) |

## The four ways, briefly

**1. Tables by name in the Spark session catalog.** An IndexTables table gets an entry in `spark_catalog`. The entry holds the table's location and pins its identity; the schema and partitioning always come from the table's own transaction log. This works when the session catalog is Spark's built-in one, Delta's or Iceberg's, backed by memory, Hive Metastore or Glue.

**2. Catalogs as a source of credentials.** Unity Catalog can issue short-lived storage credentials for a path. IndexTables uses them to read and write a table by path. The table is not registered in Unity Catalog.

**3. Catalogs as a source of tables to index.** A companion build names an Iceberg or Delta table in a catalog. IndexTables resolves it there, and uses the credentials the catalog issues.

**4. The companion lookup catalog.** A read-only catalog that maps a source table's name to its companion, so that `SELECT … FROM idx.prod.logs.events` searches the companion of `prod.logs.events`.

## What a catalog entry is, and is not

- An entry is a **name and a location**. Dropping an entry never deletes data.
- The **table's log is the authority** for schema, partitioning and table properties. An entry cannot disagree with it.
- **Entry properties are not settings.** `spark.indextables.*` keys in an entry's properties are refused, so settings are never silently read from, or ignored in, a catalog.
- **Credentials are for the location.** Reading by name needs permission to look the name up, and storage credentials for the root, exactly as reading by path does.
