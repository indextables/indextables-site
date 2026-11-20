---
title: Glossary
description: The terms used on this site, in one or two sentences each.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 40c22213f1bc
  class: derived
  cites: [CORE-SF-BUN, CORE-TF-LAYOUT, CORE-CF-MAN, SPARK-RD-MODE, SPARK-RD-IQ, SPARK-CAT-ENT, CORE-CACHE-L2]
---

| Term | Meaning |
|---|---|
| **Aggregate pushdown** | Computing counts, sums, minimums and maximums inside the index instead of returning rows for the engine to add up. |
| **Catalog entry** | A name in a catalog that points to a table's location, so a table can be used as `db.table` instead of by path. |
| **Checkpoint** | A compact record of the table's state at one version, so readers need not replay the whole transaction log. |
| **Companion table** | An index over an existing Delta, Iceberg or Parquet table. Rows stay in the source files. |
| **Exact mode** | A read mode that always returns every matching row. |
| **Fast field** | A column stored in a form the index can read quickly by row, used for filters, sorting and aggregates. |
| **Fast mode** | The default read mode. It may limit the number of rows returned to a client and reports when it does. It never limits the input to a write, cache, join or aggregate. |
| **IndexQuery** | The search operator: `column indexquery 'query'`. The query uses a search syntax with terms, phrases and boolean operators. |
| **L2 cache** | A cache of index data on an executor's local disk that persists across restarts. |
| **Merge** | Combining many small splits into fewer large ones. |
| **Prewarm** | Filling the local cache before queries arrive. |
| **Pushdown** | Handing a filter or aggregate to the index instead of evaluating it in the engine. |
| **Root** | The storage path under which a table's splits and transaction log live. |
| **Snapshot** | The set of splits that make up the table at one version. A query reads one snapshot. |
| **Split** | An immutable index file covering a batch of rows. |
| **Standalone table** | A table whose rows and index are both stored by IndexTables. Upstream documents call this a standard table. |
| **Sync** | Bringing a companion up to date with changes in its source table. |
| **Tokenizer** | The rule that breaks text into searchable words. |
| **Transaction log** | The versioned record, under `_transaction_log/`, of which splits make up the table. |
| **Watermark** | The source version or snapshot a companion was last synced to. |
