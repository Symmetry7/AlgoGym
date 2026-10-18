export function escapeXML(value: unknown) {
  return String(value ?? "").replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );
}
export function renderProfileCard(
  data: {
    name: string;
    username: string | null;
    college: string | null;
    solves: number | null;
    activeDays: number | null;
    chakra: number;
    rating: number | null;
    publicURL: string | null;
  },
  logoData: string,
) {
  const count = (value: number | null) =>
    value === null ? "—" : value.toLocaleString("en-US");
  const metrics = [
    ["VERIFIED SOLVES", count(data.solves)],
    ["ACTIVE DAYS", count(data.activeDays)],
    ["CHAKRA", count(data.chakra)],
    ["CF RATING", count(data.rating)],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="620" viewBox="0 0 1000 620" role="img" aria-label="AlgoGym coding profile"><defs><clipPath id="logo"><rect x="56" y="38" width="165" height="40" rx="2"/></clipPath></defs><rect width="1000" height="620" rx="22" fill="#0b0d12"/><rect x="1" y="1" width="998" height="618" rx="21" fill="none" stroke="#303344"/><image href="data:image/png;base64,${logoData}" x="-6" y="10" width="288" height="96" clip-path="url(#logo)"/><text x="945" y="62" text-anchor="end" font-family="Arial,sans-serif" font-size="11" letter-spacing="2" fill="#9ba4b7">CODING PORTFOLIO</text><line x1="56" y1="102" x2="944" y2="102" stroke="#252a36"/><text x="56" y="175" font-family="Arial,sans-serif" font-size="36" font-weight="600" fill="#e8edf5">${escapeXML(data.name.slice(0, 36))}</text><text x="56" y="209" font-family="Arial,sans-serif" font-size="16" fill="#b395ef">${escapeXML(data.username ? "@" + data.username : "AlgoGym member")}</text><text x="56" y="249" font-family="Arial,sans-serif" font-size="14" fill="#98a2b3">${escapeXML((data.college ?? "Independent practice. Shared progress.").slice(0, 94))}</text>${metrics.map(([label, value], index) => `<g transform="translate(${56 + (index % 2) * 450},${285 + Math.floor(index / 2) * 106})"><rect width="436" height="92" rx="8" fill="#151820" stroke="#252a36"/><text x="20" y="28" font-family="Arial,sans-serif" font-size="10" letter-spacing="1.4" fill="#98a2b3">${label}</text><text x="20" y="67" font-family="Arial,sans-serif" font-size="30" font-weight="600" fill="${index === 2 ? "#b395ef" : "#e8edf5"}">${escapeXML(value)}</text></g>`).join("")}<text x="56" y="548" font-family="Arial,sans-serif" font-size="11" fill="#98a2b3">Verified solves and activity use synchronized Codeforces evidence. Ratings are provider-specific.</text><text x="56" y="579" font-family="Arial,sans-serif" font-size="12" fill="#b395ef">${escapeXML(data.publicURL ?? "Train smarter. Solve more. Rise together.")}</text><text x="944" y="579" text-anchor="end" font-family="Arial,sans-serif" font-size="10" fill="#737d90">${new Date().toISOString().slice(0, 10)}</text></svg>`;
}
