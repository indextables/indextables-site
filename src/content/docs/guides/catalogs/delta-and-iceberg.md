---
title: Beside Delta and Iceberg
description: Use IndexTables tables in the same session catalog as Delta or Iceberg tables, and join them by name.
sidebar: { order: 4 }
lid:
  reviewed: a865437
  fingerprint: 9591af215f19
  class: derived
  cites: [SPARK-CAT-RES-014, SPARK-CAT-RES-009, SPARK-CAT-RES-018, SPARK-CAT-UNS, SPARK-CAT-COMPAT]
engine: [spark]
---

Most lakehouse sessions already replace Spark's session catalog with Delta's or Iceberg's. IndexTables works under both without replacing them. Keep your catalog class and its options, and add the IndexTables extension to the list.

## Which catalog class to set

| Your session catalog | `spark.sql.catalog.spark_catalog` |
|---|---|
| Spark built-in, Spark 3.5 | Leave unset |
| Spark built-in, Spark 4.2 | `io.indextables.spark.catalog.IndexTablesSessionCatalog` |
| Delta | `org.apache.spark.sql.delta.catalog.DeltaCatalog` (unchanged) |
| Iceberg | `org.apache.iceberg.spark.SparkSessionCatalog` (unchanged) |

On Spark 4.2 with the built-in catalog, the wrapper refuses to start when the IndexTables extension is missing from `spark.sql.extensions`, and says which setting to add.

Another session-catalog class can be allowed by listing it in `spark.indextables.catalog.allowedSessionCatalogClasses`. Any class not supported or listed is refused before anything is written.

## With Delta

```python
spark = (SparkSession.builder
  .config("spark.sql.extensions",
          "io.delta.sql.DeltaSparkSessionExtension,"
          "io.indextables.extensions.IndexTablesSparkExtensions")
  .config("spark.sql.catalog.spark_catalog",
          "org.apache.spark.sql.delta.catalog.DeltaCatalog")
  .getOrCreate())
```

```sql
-- A Delta table and an IndexTables table in the same database
CREATE TABLE sales.orders (order_id STRING, customer_id STRING, total DECIMAL(10,2)) USING delta;

CREATE TABLE sales.order_events USING indextables
LOCATION 's3://my-bucket/order_events';

-- Find orders by searching their events, then join
SELECT o.order_id, o.total, e.message
FROM sales.order_events e
JOIN sales.orders o ON o.order_id = e.order_id
WHERE e.message indexquery '"payment declined"';
```

The search runs in the index; the join is ordinary Spark.

## With Iceberg

```python
spark = (SparkSession.builder
  .config("spark.sql.extensions",
          "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions,"
          "io.indextables.extensions.IndexTablesSparkExtensions")
  .config("spark.sql.catalog.spark_catalog",
          "org.apache.iceberg.spark.SparkSessionCatalog")
  .config("spark.sql.catalog.spark_catalog.type", "hive")
  .getOrCreate())
```

```sql
CREATE TABLE logs.events USING indextables
LOCATION 's3://my-bucket/events';

SELECT * FROM logs.events WHERE message indexquery 'timeout';
```

## Session catalog, not named catalogs

IndexTables tables can be registered only in the session catalog, `spark_catalog`. A named Iceberg catalog, such as one configured as `spark.sql.catalog.prod = org.apache.iceberg.spark.SparkCatalog`, cannot hold them, and a `CREATE TABLE prod.db.t USING indextables …` is refused with an error saying so.

Tables in named catalogs can still be **sources for companions**. See [catalog sources for companions](/guides/catalogs/catalog-sources/).

## Index the Delta or Iceberg table itself

If the goal is to search a Delta or Iceberg table without copying it, build a [companion](/guides/companions/overview/) instead of a separate IndexTables table.
