1. Looking ahead from every day is O(n²) when prices keep falling.
2. Walk the days in order and keep the days that are still waiting for a higher price. What order are their prices in?
3. The waiting prices never increase from bottom to top of a stack. A new day answers every waiting day with a lower price, popping them from the top.
