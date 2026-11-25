function nextHigherPriceDay(prices) {
  const answer = new Array(prices.length).fill(-1);
  const waiting = [];
  for (let i = 0; i < prices.length; i++) {
    while (waiting.length && prices[waiting[waiting.length - 1]] < prices[i]) {
      answer[waiting.pop()] = i;
    }
    waiting.push(i);
  }
  return answer;
}
