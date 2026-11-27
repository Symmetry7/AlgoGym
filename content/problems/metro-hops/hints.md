1. Every segment costs the same, one hop. Which search finds the fewest hops in an unweighted graph?
2. Build an adjacency list first, so each station's neighbours are one lookup away.
3. Breadth-first search from `source` reaches stations in order of distance. Mark a station when you queue it, not when you take it out.
