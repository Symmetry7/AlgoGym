function isNoisyPalindrome(text) {
  const keep = (ch) => /[a-z0-9]/i.test(ch);
  let lo = 0;
  let hi = text.length - 1;
  while (lo < hi) {
    if (!keep(text[lo])) lo++;
    else if (!keep(text[hi])) hi--;
    else if (text[lo].toLowerCase() !== text[hi].toLowerCase()) return false;
    else {
      lo++;
      hi--;
    }
  }
  return true;
}
