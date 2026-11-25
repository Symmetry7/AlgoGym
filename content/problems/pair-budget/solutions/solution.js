function countAffordablePairs(prices, budget) {
  let lo = 0;
  let hi = prices.length - 1;
  let pairs = 0;
  while (lo < hi) {
    if (prices[lo] + prices[hi] <= budget) {
      pairs += hi - lo;
      lo++;
    } else {
      hi--;
    }
  }
  return pairs;
}
