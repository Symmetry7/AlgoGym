1. Trying every pair is O(n²). Start with the widest tank: the first and last panels.
2. Moving a wall inwards makes the tank narrower. Which wall can't be part of any better tank with a narrower width?
3. The shorter wall already limits the height; pairing it with anything closer only loses width. Move the shorter wall.
