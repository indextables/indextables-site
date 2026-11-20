---
title: Variant columns
description: Store and search semi-structured values with Spark 4.2 Variant columns.
sidebar: { order: 4 }
lid:
  reviewed: a865437
  fingerprint: 4c83ff36abe0
  class: derived
  cites: [CORE-FM-TYPE-031, CORE-FM-TYPE-032, CORE-FM-TYPE-033, CORE-FM-JSON-015, CORE-QRY-IQ-037, CORE-QRY-IQ-038, CORE-FM-CAP-028]
  docs: [core/field-model/field-model-design.md#Variant columns]
engine: [spark]
---

A Variant column holds a self-describing value per row: an object, an array or a primitive. IndexTables indexes top-level Variant columns of standalone tables on Spark 4.2.

## Write and search

```python
df = spark.sql("""
  SELECT 1 AS id, parse_json('{"user": {"city": "Lisbon"}, "tags": ["a", "b"]}') AS payload
""")
df.write.format("indextables").mode("append").save(root)
```

```sql
SELECT id FROM t WHERE payload indexquery 'user.city:Lisbon';
```

The column is indexed as JSON, so paths inside it are searched with `indexquery`. The original value is stored beside the index and reads back exactly as written.

## Addressing paths

| Value | Path |
|---|---|
| Key `city` inside `user` | `payload.user.city` |
| A key that contains a dot, `a.b` | `payload.a\.b` |
| A top-level value that is not an object | `payload.payload` |

String leaves are matched whole by default. Set `typemap.<column> = text` to tokenize them.

## Limits

- **Top-level columns only.** A Variant nested inside a struct, array or map is refused at write.
- **Spark 4.2 only.** Spark 3.5 fails reads and writes of such a table, naming the column.
- **Search, not SQL extraction.** `variant_get` and related functions are evaluated by Spark, not pushed to the index. Aggregates, sorting and grouping on a Variant path are not pushed either.
- **Not in companions.** A companion build fails on a Variant column unless you exclude it with `EXCLUDE COLUMNS`. An excluded column is still readable from the source.
- **Some leaves are not indexed**: binary values, and `NaN` or infinite floats. They are still stored and read back.
