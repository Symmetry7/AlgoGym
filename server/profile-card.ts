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
  const short = (text: string, length: number) => escapeXML(text.length > length ? `${text.slice(0, length - 1)}…` : text);
  const platforms = (data.platforms ?? []).slice(0, 5);
  const initial = escapeXML(data.name.trim().charAt(0).toUpperCase() || "A");
  const portrait = photoData
    ? `<image href="${escapeXML(photoData)}" x="66" y="169" width="108" height="108" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)"/>`
    : `<circle cx="120" cy="223" r="54" fill="#40334f"/><text x="120" y="241" text-anchor="middle" font-size="48" fill="#e3d5f5">${initial}</text>`;
  const stat = (x: number, label: string, count: number | null, accent = false) => `<text x="${x}" y="463" font-size="12" letter-spacing="1.8" fill="${accent ? "#847196" : "#8f879c"}">${label}</text><text x="${x}" y="526" font-size="${value(count).length > 6 ? 36 : 48}" letter-spacing="-2" font-weight="600" fill="${accent ? "#251d30" : "#f1ece6"}">${escapeXML(value(count))}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720" viewBox="0 0 1080 720" role="img" aria-label="AlgoGym coding profile card" font-family="Arial,Helvetica,sans-serif">
    <defs>
      <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#241c30"/><stop offset="1" stop-color="#131019"/></linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eee4fa"/><stop offset="1" stop-color="#cdbbe7"/></linearGradient>
      <clipPath id="portrait"><circle cx="120" cy="223" r="54"/></clipPath>
      <clipPath id="card"><rect width="1080" height="720" rx="28"/></clipPath>
    </defs>
    <g clip-path="url(#card)">
      <rect width="1080" height="720" fill="url(#surface)"/>
      <circle cx="1010" cy="181" r="224" fill="none" stroke="#b6a0d2" stroke-opacity=".09"/>
      <circle cx="1010" cy="181" r="173" fill="none" stroke="#b6a0d2" stroke-opacity=".1"/>
      <circle cx="1010" cy="181" r="122" fill="none" stroke="#b6a0d2" stroke-opacity=".12"/>
      <path d="M1010 0v405M790 181h290" stroke="#b6a0d2" stroke-opacity=".08"/>
      <rect x="1" y="1" width="1078" height="718" rx="27" fill="none" stroke="#4c3e5c"/>
      ${logoData ? `<image href="data:image/png;base64,${escapeXML(logoData)}" x="60" y="44" width="188" height="63"/>` : `<text x="64" y="86" font-size="30" font-weight="700" fill="#f1ece6">AlgoGym</text>`}
      <text x="1016" y="76" text-anchor="end" font-size="11" letter-spacing="2.8" fill="#bcb0cb">THE CODER CARD</text>
      <path d="M64 126h952" stroke="#413549"/>
      <circle cx="120" cy="223" r="60" fill="none" stroke="#a58bbd" stroke-width="1.5"/>
      ${portrait}
      <text x="202" y="217" font-size="${data.name.length > 26 ? 29 : 36}" font-weight="600" letter-spacing="-1" fill="#f4eee8">${short(data.name, 37)}</text>
      <text x="202" y="250" font-size="16" fill="#bba4d4">${short(data.username ? `@${data.username}` : "AlgoGym member", 42)}</text>
      <text x="66" y="326" font-size="15" fill="#aaa0b5">${short(data.college ?? "Competitive programming", 70)}</text>
      <text x="66" y="363" font-size="11" letter-spacing="2.4" fill="#81738e">PRACTICE. PROGRESS. REPEAT.</text>
      <rect x="64" y="414" width="220" height="144" rx="16" fill="url(#accent)"/>
      ${stat(86, "TOTAL SOLVES", data.solves, true)}
      ${stat(322, "ACTIVE DAYS", data.activeDays)}
      <path d="M540 437v98M775 437v98" stroke="#413549"/>
      ${stat(568, "COINS", data.chakra)}
      ${stat(803, "CODEFORCES RATING", data.rating)}
      <text x="66" y="603" font-size="10" letter-spacing="1.8" fill="#857791">CONNECTED</text>
      ${platforms.length ? platforms.map((platform, index) => `<g transform="translate(${180 + index * 160},584)"><rect width="148" height="29" rx="14.5" fill="#2b2336" stroke="#44364f"/><text x="74" y="19" text-anchor="middle" font-size="11" fill="#c8bdd3">${short(platform, 19)}</text></g>`).join("") : `<text x="180" y="603" font-size="12" fill="#aaa0b5">Your next chapter starts here</text>`}
      <path d="M64 641h952" stroke="#413549"/>
      <text x="66" y="679" font-size="12" fill="#ada0ba">${short(data.publicURL ?? "ALGOGYM / YOUR PERSONAL PROGRESS", 100)}</text>
      ${faviconData ? `<image href="data:image/png;base64,${escapeXML(faviconData)}" x="986" y="657" width="30" height="30"/>` : `<text x="1016" y="680" text-anchor="end" font-size="13" fill="#baa2d3">AG / 01</text>`}
    </g>
  </svg>`;
}
