class Solution:
    def nextHigherPriceDay(self, prices: list[int]) -> list[int]:
        answer = [-1] * len(prices)
        waiting: list[int] = []
        for i, price in enumerate(prices):
            while waiting and prices[waiting[-1]] < price:
                answer[waiting.pop()] = i
            waiting.append(i)
        return answer
