---
title: Versions and compatibility
description: Supported Spark, Scala, Java and platform versions, storage backends, and compatibility with tables written by 0.5.x.
sidebar: { order: 5 }
lid:
  reviewed: a865437
  fingerprint: 5eadf16e28ec
  class: derived
  cites: [SPARK-NB-PKG, SPARK-NB-LOAD, CORE-TF-PROT, CORE-STO-LOC, DF-AD-DEP]
  docs: [high-level-design.md#Wire compatibility at the latest format]
engine: [spark, datafusion]
---

IndexTables is at version `0.1.0-SNAPSHOT`. The versions below are those the build pins and tests.

## Engines

| Engine | Version | Artifact |
|---|---|---|
| Apache Spark | 3.5.9, Scala 2.12 | `io.indextables:indextables-spark-3.5_2.12` |
| Apache Spark | 4.2.0, Scala 2.13 | `io.indextables:indextables-spark-4.2_2.13` |
| Apache DataFusion | The version pinned by the crate's workspace | `indextables-datafusion` |

Spark Connect is supported on both Spark versions.

## Runtime

| | |
|---|---|
| Java | 17 |
| Operating systems | Linux and macOS |
| Architectures | `x86_64` and `aarch64` |

## Storage

| Backend | Locations | Read | Write |
|---|---|---|---|
| Local file system | `/absolute/path`, `file:///…` | Yes | Yes |
| S3 and S3-compatible | `s3://`, `s3a://` | Yes | Yes |
| Azure Blob Storage, ADLS | `abfss://`, `abfs://`, `wasbs://`, `wasb://` | Yes | Planned |
| Google Cloud Storage | `gs://` | Yes | Planned |
| HDFS | | No | No |

## Source formats for companions

| Source | Supported |
|---|---|
| Parquet directories | Yes |
| Delta Lake | Reader version up to 3; deletion vectors; column mapping in `name` and `id` modes |
| Apache Iceberg | Parquet data files; position, equality and Puffin deletes; REST, Glue and Hive Metastore catalogs |

## Tables written by 0.5.x

The compatibility baseline is the released IndexTables 0.5.5.

| | |
|---|---|
| Tables written by 0.5.5 | Read and extended in place |
| Tables in the 0.5.4 form | Read and extended. Concurrent writers using the 0.5.4 commit scheme are not supported |
| Older protocols; JSON or Parquet checkpoints | Not supported |
| Tables written here, read by 0.5.5 | Yes, except where a table uses a feature 0.5.5 lacks: recorded row-level deletes, Variant columns |

Compatibility means the formats, verified with tables written by 0.5.5 and with round trips through a 0.5.5 process. It does not mean identical behavior; deliberate differences are listed in [Migrate from 0.5.x](/guides/migrate/from-0-5/).

## Feature availability

See [availability](/reference/availability/), computed from the product's requirements.
