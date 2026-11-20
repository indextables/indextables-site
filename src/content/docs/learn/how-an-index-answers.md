---
title: How an index answers a question
description: What happens between your query and the answer, without the jargon.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: 57ccca3fb62c
  class: derived
  cites: [CORE-SF-BUN, CORE-LOG-SNAP, CORE-LOG-PRUNE, CORE-CACHE-L2, CORE-FM-TOK]
---

<div class="forwho"><b>For</b> readers who want the mechanism, not the code.</div>

## The parts

**Splits.** The index is stored as many files called *splits*. Each split covers a batch of rows and holds everything needed to search them. A split is never changed after it is written.

**The transaction log.** A small set of files that lists which splits currently make up the table. Adding data adds splits to the list; nothing is edited in place. Readers see one consistent version of the list for the whole query.

**Your query engine.** Spark or DataFusion. It decides which splits to look at and combines the results.

## What happens when you ask

Take the question "messages that mention *timeout* for service *checkout* in the last hour".

1. **Read the list.** The engine reads the transaction log to learn which splits exist.
2. **Rule out splits by what is known about them.** The log records, for each split, facts such as the range of timestamps inside it. Splits that cannot contain the last hour are skipped without being opened.
3. **Look up the remaining splits' indexes.** Each remaining split is asked for rows where the message contains "timeout" and the service is "checkout". The index returns row positions directly.
4. **Fetch only the matching rows.** For a standalone table the rows are in the split. For a companion table they are read from the original Delta, Iceberg or Parquet file, at the positions the index gave.
5. **Combine.** The engine gathers the results from all splits and returns them.

If the question is "how many?", step 4 is skipped: the count comes from the index.

## Why text needs special treatment

To find a word inside a sentence, the index must store the sentence as separate words. This is called *tokenizing*. A column can be indexed in one of two ways:

| Indexed as | Good for | Example |
|---|---|---|
| The whole value | Exact match: IDs, codes, status values | `status = 'FAILED'` |
| Separate words | Searching inside text | `message indexquery 'timeout'` |

You choose per column when you write the table. See [field types](/guides/tables/field-types/).

## Why the second query is faster than the first

Splits live in cloud storage, which is slow to reach compared with local disk. The first time a split is used, the parts that were needed are kept on the machine's local disk. Later queries reuse them. You can also fill this cache ahead of time, which is called *prewarming*.

## Where next

- [Standalone and companion tables](/concepts/standalone-and-companion/)
- [Splits and the transaction log](/concepts/splits-and-the-transaction-log/), the technical version of this page
- [Glossary](/learn/glossary/)
