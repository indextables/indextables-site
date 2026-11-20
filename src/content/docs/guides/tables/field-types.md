---
title: Choose how columns are indexed
description: Field kinds, indexing modes, tokenizers and field options, and how to set them when you write.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: ca2531bc00e1
  class: derived
  cites: [CORE-FM-TYPE, CORE-FM-MODE, CORE-FM-TOK, CORE-FM-OPT, CORE-FM-CFG, CORE-FM-APP]
  docs: [core/field-model/field-model-design.md#Indexing modes, core/field-model/field-model-design.md#Tokenizers and token length]
engine: [spark]
---

How a column is indexed decides which questions the index can answer about it. You choose when the table is first written. Later appends must use the same choices, and read options never change how existing data was indexed.

## The one decision that matters most

For each string column, decide whether people will search **inside** it or match it **whole**.

| Index as | Set | Answers | Typical columns |
|---|---|---|---|
| Whole value (the default) | nothing | `=`, `IN`, ranges, grouping | IDs, status codes, hostnames |
| Words | `typemap.<column> = text` | Words and phrases anywhere in the value | Messages, titles, descriptions |

```python
(df.write.format("indextables")
  .option("spark.indextables.indexing.typemap.message", "text")
  .save(root))
```

## Default mapping

Without any option, a column is indexed by its type:

| Column type | Indexed as |
|---|---|
| String | `string`: the whole value as one term |
| Byte, short, int, long | 64-bit integer |
| Float, double | 64-bit float |
| Boolean | Boolean |
| Date, timestamp | Datetime. Searchable to the second; stored and compared to the microsecond |
| Binary | Bytes |
| Struct, array, map | JSON, searchable by path such as `metadata.city` |
| Variant (Spark 4.2) | JSON for search, plus the original value for exact read-back. See [Variant](/guides/tables/variant/) |
| Decimal | The decimal text |

Null, interval and user-defined types are rejected with an error naming the column.

Partition columns are not indexed as fields. Their values are recorded in the transaction log and used to skip whole files. See [partitioning](/guides/tables/partitioning/).

## Indexing modes

Set a mode with `spark.indextables.indexing.typemap.<column>`.

| Mode | For | Effect |
|---|---|---|
| `string` | String | Whole value, one term. The default |
| `text` | String | Tokenized into words |
| `json` | String holding a JSON object | Parsed and indexed by path |
| `ip` | String | An IP address, searchable by range |

Companion tables accept further modes designed to keep the index small over long strings. See [companion overview](/guides/companions/overview/).

## Tokenizers

A tokenizer breaks text into the words the index stores. The same tokenizer analyses your query, so the two always agree. Set one with `spark.indextables.indexing.tokenizer.<column>`.

| Tokenizer | Splits on | Lowercases | Use for |
|---|---|---|---|
| `default` | Anything that is not a letter or digit | Yes | Natural language, log messages |
| `whitespace` | Whitespace only | No | Text where punctuation matters, such as paths or URLs |
| `raw` | Nothing: the whole value is one token | No | Same as `string` mode |

No tokenizer stems words: `connect` does not match `connection`. Use a wildcard (`connect*`) for that.

Very long tokens are dropped from the index, not truncated. The limit is set per column with `indexing.tokenlength.<column>` or for the table with `indexing.text.maxTokenLength`.

## Field options

| Option | Effect |
|---|---|
| `indexing.fastfields` / `indexing.nonfastfields` | Which columns have fast data, used for range filters, sorting and aggregates |
| `indexing.storeonlyfields` | Columns kept for retrieval but not searchable |
| `indexing.indexonlyfields` | Columns searchable but not stored |
| `indexing.indexrecordoption.<column>` | What the index records per term: `basic`, `freq` or `position`. Phrase search needs `position` |

Every column of a standalone table must be recoverable from the index, so a column that is neither stored nor fast is rejected.

Defaults for all of these are in the [configuration reference](/reference/configuration/).

## Validation

The whole configuration is checked before any row is written. Every problem is reported in one error, including options that name a column that does not exist or a partition column.
