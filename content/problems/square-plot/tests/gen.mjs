export const seed = 3104;

export default (g) => [
  [g.int(900000000, 999999999) * 1000000 + g.int(0, 999999)],
  [g.int(1, 99999999) * 10000000],
];
