1. Checking every later day for every day is O(n²): too slow for 10^5 days.
2. Scan left to right and keep the days that are still waiting for a warmer one. What order are their temperatures in?
3. Waiting days form a stack with non-increasing temperatures. A new day answers every waiting day colder than it: pop them and record the gap.
