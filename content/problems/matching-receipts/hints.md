1. For receipt `i`, the only partner that works has value `target − amounts[i]`.
2. Walk the receipts in order and remember how many times each value has appeared so far.
3. Each receipt pairs with every earlier receipt of the complementary value. Count those before you record the current receipt, so it never pairs with itself.
