export function escapeXML(value: unknown) {
  return String(value ?? "").replace(/[<>&"']/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[char]!);
}

type CardData = {
  name: string;
  username: string | null;
  college: string | null;
  solves: number | null;
  activeDays: number | null;
  chakra: number;
  rating: number | null;
  publicURL: string | null;
  platforms?: string[];
};

export function renderProfileCard(data: CardData, logoData: string, photoData?: string, faviconData?: string) {
  const value = (count: number | null) => count === null ? "—" : count.toLocaleString("en-US");
  const platforms = (data.platforms ?? []).slice(0, 5);
  const initial = escapeXML(data.name.trim().charAt(0).toUpperCase() || "A");
  const portrait = photoData
    ? `<image href="${escapeXML(photoData)}" x="254" y="182" width="212" height="212" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)"/>`
    : `<circle cx="360" cy="288" r="106" fill="#2c2931"/><text x="360" y="320" text-anchor="middle" font-family="Arial,sans-serif" font-size="84" fill="#fff">${initial}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1000" viewBox="0 0 720 1000" role="img" aria-label="AlgoGym coding profile card">
    <defs><linearGradient id="warm" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7aa69"/><stop offset=".54" stop-color="#f56a34"/><stop offset="1" stop-color="#e84843"/></linearGradient><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffdf9"/><stop offset="1" stop-color="#f7f4ef"/></linearGradient><clipPath id="portrait"><circle cx="360" cy="288" r="106"/></clipPath></defs>
    <rect width="720" height="1000" rx="34" fill="#111117"/>
    <rect x="14" y="14" width="692" height="972" rx="27" fill="url(#paper)"/>
    <path d="M14 42Q14 14 42 14h636q28 0 28 28v126H14Z" fill="#111117"/>
    ${logoData ? `<image href="data:image/png;base64,${logoData}" x="38" y="53" width="233" height="78"/>` : `<text x="48" y="104" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#fff">AlgoGym</text>`}
    <text x="662" y="97" text-anchor="end" font-family="Arial,sans-serif" font-size="13" letter-spacing="2" fill="#e7d8d1">CODING CARD</text>
    <path d="M14 805h692v153q0 28-28 28H42q-28 0-28-28Z" fill="url(#warm)"/>
    <circle cx="360" cy="288" r="113" fill="#f39a5e"/>${portrait}
    ${faviconData ? `<circle cx="454" cy="364" r="31" fill="#fff"/><image href="data:image/png;base64,${faviconData}" x="431" y="341" width="46" height="46"/>` : ""}
    <text x="360" y="454" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="#15151a">${escapeXML(data.name.slice(0, 32))}</text>
    <text x="360" y="488" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#d05f2e">${escapeXML(data.username ? `@${data.username}` : "AlgoGym member")}</text>
    <text x="360" y="523" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#76737a">${escapeXML((data.college ?? "Competitive programming").slice(0, 70))}</text>
    <rect x="48" y="560" width="304" height="146" rx="16" fill="#fff" stroke="#e6e1df"/><rect x="368" y="560" width="304" height="146" rx="16" fill="#fff" stroke="#e6e1df"/>
    <text x="68" y="598" font-family="Arial,sans-serif" font-size="14" fill="#a67563">TOTAL SOLVES</text><text x="68" y="663" font-family="Arial,sans-serif" font-size="58" font-weight="600" fill="#17171b">${escapeXML(value(data.solves))}</text>
    <text x="388" y="598" font-family="Arial,sans-serif" font-size="14" fill="#79777d">ACTIVE DAYS</text><text x="388" y="663" font-family="Arial,sans-serif" font-size="58" font-weight="600" fill="#17171b">${escapeXML(value(data.activeDays))}</text>
    <text x="48" y="751" font-family="Arial,sans-serif" font-size="14" fill="#77757a">CONNECTED PLATFORMS</text>
    ${platforms.map((platform, index) => `<g transform="translate(${48 + index * 126},771)"><rect width="118" height="28" rx="14" fill="#eae7e6"/><text x="59" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#333036">${escapeXML(platform)}</text></g>`).join("")}
    <text x="48" y="856" font-family="Arial,sans-serif" font-size="15" fill="#fff">COINS</text><text x="48" y="911" font-family="Arial,sans-serif" font-size="49" font-weight="700" fill="#fff">${escapeXML(value(data.chakra))}</text>
    <text x="672" y="856" text-anchor="end" font-family="Arial,sans-serif" font-size="15" fill="#fff">CODEFORCES RATING</text><text x="672" y="911" text-anchor="end" font-family="Arial,sans-serif" font-size="49" font-weight="700" fill="#fff">${escapeXML(value(data.rating))}</text>
    <text x="48" y="956" font-family="Arial,sans-serif" font-size="12" fill="#fff">${escapeXML(data.publicURL ?? "algogym.vercel.app")}</text>
  </svg>`;
}
