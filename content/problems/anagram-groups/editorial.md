## Approach: canonical key in a hash set

For each word, build a key that ignores letter order: either the word's letters sorted, or its 26 letter counts written out. Two words share a key exactly when they are anagrams. Add each key to a set and return its size.

## Complexity

| | |
| --- | --- |
| Time | O(n · L log L) with sorting (L ≤ 12), or O(n · (L + 26)) with counts |
| Space | O(n · L) for the set |

## Common mistakes

- Keys that are not unique, such as the sum of letter codes: `"ad"` and `"bc"` have the same sum but are different groups (hidden test).
- Comparing every pair of words: O(n²) comparisons time out on 5 × 10^4 words.
