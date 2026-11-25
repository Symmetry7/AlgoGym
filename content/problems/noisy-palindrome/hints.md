1. Copying the cleaned text and reversing it works, but you can do it with no extra memory.
2. Put one pointer at each end. Skip characters that aren't letters or digits, then compare the two characters ignoring case.
3. Stop when the pointers meet.
