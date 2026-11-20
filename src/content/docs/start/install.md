---
title: Install
description: Artifacts, supported Spark versions, platforms and how to build from source.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 8b1f1202e5e8
  class: derived
  cites: [SPARK-NB-PKG, SPARK-NB-LOAD, DF-AD-DEP]
engine: [spark, datafusion]
---

IndexTables is at version `0.1.0-SNAPSHOT`. Artifacts are built from source until the first release is published.

## Spark

| Spark | Scala | Artifact (`io.indextables`) | Maven profile |
|---|---|---|---|
| 3.5.9 | 2.12 | `indextables-spark-3.5_2.12` | `spark-3.5` (default) |
| 4.2.0 | 2.13 | `indextables-spark-4.2_2.13` | `spark-4.x` |

These are the versions the build is pinned to and tested with. They are not a promise of compatibility with every Spark 4 release.

The jar bundles a native library. Native builds cover Linux and macOS on `x86_64` and `aarch64`.

Put the jar and its dependencies on the driver and executor classpaths, and enable the session extension:

```text
spark.sql.extensions=io.indextables.extensions.IndexTablesSparkExtensions
```

The extension adds the `indexquery` operator and the IndexTables SQL commands. Configure it before the session is created.

## DataFusion

The adapter is the Rust crate `indextables-datafusion`, in `native/datafusion` of the product repository. It is built against a pinned DataFusion version; use the version the workspace pins. See [Get started with DataFusion](/start/datafusion/).

## Build from source

Requirements: JDK 17, Maven, and a Rust toolchain.

```bash
git clone https://github.com/indextables/indextables
cd indextables
(cd native && cargo build --workspace --locked)
mvn -B -Pspark-3.5 install -DskipTests   # Spark 3.5
mvn -B -Pspark-4.x install -DskipTests   # Spark 4.2
```

The product repository's README has the full build and test instructions.

## Coming from 0.5.x

The Maven coordinates, the extension class and several settings changed. Tables written by 0.5.5 remain readable. See [Migrate from 0.5.x](/guides/migrate/from-0-5/).
