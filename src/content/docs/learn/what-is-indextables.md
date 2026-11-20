---
title: What is IndexTables?
description: The idea in plain words. What an index is, why scans are slow, and where IndexTables fits.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: f34083efd4f4
  class: authored
  cites: [SPARK-RD-IQ, SPARK-SYNC-CMD]
---

<div class="forwho"><b>For</b> anyone. No Spark or database background needed.</div>

## The short version

IndexTables makes it fast to find things in very large tables. It does this the way a book does: with an index.

## Finding a word in a book

Suppose you need every page of a 900-page book that mentions "lighthouse".

- **Without an index** you read all 900 pages. This is a *scan*. It always works, and it takes as long as the book is long.
- **With an index** you turn to the back, find "lighthouse: 14, 203, 677", and open three pages. The time depends on how many pages match, not on how long the book is.

Large data tables have the same two options. Most are stored for scanning: that is ideal for questions like "what were total sales last year", which need every row anyway. It is slow for questions like "show me the log lines that mention this error", which need a handful of rows out of billions.

## What IndexTables adds

IndexTables builds that back-of-the-book index for a data table, and stores it in the same kind of cloud storage the table is in. When you ask a question, the query engine looks in the index, learns which rows match, and fetches only those.

The index answers several kinds of question:

| Question | Example |
|---|---|
| Does the text contain these words? | Messages that mention "connection refused" |
| Is the value exactly this? | The orders of customer 48213 |
| Is the value in this range? | Events between 09:00 and 09:15 |
| How many, or how much? | The number of errors per service |

## Two ways to use it

**As the table itself.** You store your data in an IndexTables table. The rows and the index are kept together. This is called a *standalone* table.

**As an index over a table you already have.** Your data stays where it is, in a Delta, Iceberg or Parquet table. IndexTables builds an index that points into it, and keeps the index up to date as the table changes. This is called a *companion* table.

## Where it runs

Inside the query engine you already use: [Apache Spark](https://spark.apache.org) or [Apache DataFusion](https://datafusion.apache.org). There is no separate search service to install, pay for or keep in sync. You ask questions in ordinary SQL.

## What it is not

It is not a database server, and it is not a replacement for your analytics tables. Questions that need to read most of a table are still best answered by a scan.

## Where next

- [How an index answers a question](/learn/how-an-index-answers/), one step deeper and still in plain words.
- [Why IndexTables](/why/why-indextables/), for how it compares with the alternatives.
- [Get started with Spark](/start/spark/) or [with DataFusion](/start/datafusion/), to try it.
- Prefer to watch? [A 36-minute talk](/why/talks/) covers the same ground.
