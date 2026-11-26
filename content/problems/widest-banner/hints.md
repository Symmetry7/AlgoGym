1. Every best banner is as tall as one of the shops it covers. For shop `i` as the shortest, how far can the banner stretch left and right?
2. It stretches until the first shorter shop on each side. Finding "the nearest shorter shop" for every shop is a job for a stack.
3. Keep a stack of shops with increasing heights. When a shorter shop arrives, each popped shop now knows both its limits: the new shop on the right and the shop below it on the stack on the left.
