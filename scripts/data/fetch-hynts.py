"""Crawl hynts.in's public question listings and write metadata only to data/hynts-catalog.json.

Kept per question: title, section, sheet (company / role / topic / DSA sheet), difficulty, category, topic,
platform, position, tags and observedAt, plus the source URL as provenance (never shown in the product).
Answers and explanations embedded in the pages are never read out (see `row()` below: a field whitelist).

Polite by construction: robots.txt obeyed (it disallows /_astro/, /api/, /admin/ and *.json, so only the HTML pages
are read), one request at a time, at least 1 s apart, a generic User-Agent, plain HTTP (no browser impersonation,
stealth or proxies). If a page answers with a block or challenge, it is reported and skipped, never worked around.

Run from the repo root with the Scrapling venv:
    C:/Users/KIIT/.venvs/scrapling/Scripts/python.exe scripts/data/fetch-hynts.py          # live crawl
    C:/Users/KIIT/.venvs/scrapling/Scripts/python.exe scripts/data/fetch-hynts.py --dev    # cache pages in data/raw/hynts/ (git-ignored) and replay them
    C:/Users/KIIT/.venvs/scrapling/Scripts/python.exe scripts/data/fetch-hynts.py --self-test
Then: node scripts/data/import-hynts.mjs (staging).
"""
import html as htmllib
import json
import logging
import re
import sys
from datetime import date
from urllib.parse import urlparse

ORIGIN = "https://hynts.in"
UA = "Mozilla/5.0 (compatible; metadata-indexer/1.0)"
OUT = "data/hynts-catalog.json"

INDEX_PAGES = ["/preparation", "/preparation/company-wise-dsa-sheet", "/preparation/dsa-sheets", "/preparation/role-wise", "/preparation/most-asked-questions"]

# Question-listing sections by sitemap path. Playlists (videos), notes, templates and jobs carry no questions.
SECTIONS = [
    (r"^/preparation/company-wise-dsa-sheet/([^/]+)$", "company", lambda s: re.sub(r"-dsa-interview-questions$", "", s)),
    (r"^/preparation/dsa-sheets/([^/]+)$", "dsa-sheet", None),
    (r"^/preparation/(package-wise-dsa-sheet)$", "dsa-sheet", None),  # linked from /preparation, not in the sitemap
    (r"^/preparation/(20-essential-dsa-patterns)$", "pattern", None),
    (r"^/preparation/role-wise/([^/]+)$", "role", None),
    (r"^/preparation/most-asked-questions/([^/]+)$", "topic", str.lower),
    (r"^/preparation/(sql-sheet)$", "sql", None),
    (r"^/preparation/(hr-questions)$", "hr", None),
    (r"^/preparation/(system-design-sheet)$", "system-design", None),
]

DIFFICULTY = {"easy": "Easy", "basic": "Easy", "beginner": "Easy", "medium": "Medium", "intermediate": "Medium", "hard": "Hard", "advanced": "Hard"}
PLATFORM = {"leetcode": "LeetCode", "geeksforgeeks": "GeeksforGeeks", "gfg": "GeeksforGeeks", "tuf": "TakeUForward", "takeuforward": "TakeUForward",
            "codingninjas": "Coding Ninjas", "codestudio": "Coding Ninjas", "naukri": "Coding Ninjas", "interviewbit": "InterviewBit",
            "hackerrank": "HackerRank", "codechef": "CodeChef", "codeforces": "Codeforces", "spoj": "SPOJ"}


def section_of(path):
    for pattern, section, slug_of in SECTIONS:
        m = re.match(pattern, path)
        if m:
            return section, (slug_of(m.group(1)) if slug_of else m.group(1))
    return None


def unwrap(v):
    """Astro serialises island props as [type, value] pairs; strip them to plain JSON."""
    if isinstance(v, list) and len(v) == 2 and isinstance(v[0], int) and not isinstance(v[0], bool):
        return unwrap(v[1])
    if isinstance(v, list):
        return [unwrap(x) for x in v]
    if isinstance(v, dict):
        return {k: unwrap(x) for k, x in v.items()}
    return v


def islands(page_html):
    for m in re.finditer(r"<astro-island([^>]*)>", page_html):
        raw = re.search(r' props="([^"]*)"', m.group(1))
        if raw:
            yield unwrap(json.loads(htmllib.unescape(raw.group(1))))


def clean(s):
    return re.sub(r"\s+", " ", s).strip() if isinstance(s, str) else ""


def row(q, position, **extra):
    """One metadata row. Only these fields are kept, so answer and explanation prose never leaves this function."""
    title = clean(q.get("question_name") or q.get("title") or q.get("question") or q.get("name"))
    if not title:
        return None
    url = q.get("platform_link") or q.get("problemUrl") or q.get("url") or q.get("link") or q.get("leetcode") or q.get("gfg")
    platform = q.get("platform_name") or q.get("platform") or ("leetcode" if q.get("leetcode") else "gfg" if q.get("gfg") else None)
    r = {
        "position": position,
        "title": title,
        "difficulty": DIFFICULTY.get(clean(q.get("difficulty")).lower()),
        "category": clean(q.get("category")) or None,
        "platform": PLATFORM.get(re.sub(r"[^a-z]", "", str(platform).lower()), str(platform)) if platform else None,
        "url": url if isinstance(url, str) and re.match(r"^https?://", url) else None,
        "tags": [clean(t) for t in q.get("tags") or [] if clean(t)],
    }
    if q.get("type") in ("HLD", "LLD"):
        r["level"] = q["type"]
    r.update({k: v for k, v in extra.items() if v})  # extra may override category
    return r


def extract(props):
    """Rows from one island: `sections[].problems` (DSA sheets, patterns) or a flat question list (everything else)."""
    if isinstance(props.get("sections"), list):
        rows = []
        for s in props["sections"]:
            for p in s.get("problems") or []:
                r = row(p, len(rows) + 1, category=clean(s.get("topic")), subcategory=clean(s.get("subTopic")))
                if r:
                    rows.append(r)
        return rows
    if isinstance(props.get("packages"), list):  # package-wise sheet: questions grouped by salary band, then topic
        band = {p.get("id"): clean(p.get("label")) for p in props["packages"]}
        rows = [row(q, i + 1, category=band.get(q.get("package")), subcategory=clean(q.get("topic"))) for i, q in enumerate(props.get("questions") or [])]
        return [r for r in rows if r]
    for v in props.values():
        if isinstance(v, list) and v and isinstance(v[0], dict) and ({"question_name", "title", "question"} & v[0].keys()):
            rows = [row(q, i + 1) for i, q in enumerate(v)]
            return [r for r in rows if r]
    return []


def sheet_from_page(page_html, section, slug, source_url, observed_at):
    for props in islands(page_html):
        items = extract(props)
        if items:
            title = props.get("companyName") or props.get("title") or props.get("roleTitle") or None
            return {"section": section, "slug": slug, "title": clean(title) or None, "sourceUrl": source_url, "observedAt": observed_at, "items": items}
    return None


def self_test():
    page = '<astro-island component-export="X" props="{&quot;companyName&quot;:[0,&quot;Acme&quot;],&quot;questions&quot;:[1,[[0,{&quot;index&quot;:[0,1],&quot;question_name&quot;:[0,&quot;Two  Sum&quot;],&quot;answer&quot;:[0,&quot;SECRET PROSE&quot;],&quot;platform_name&quot;:[0,&quot;LeetCode&quot;],&quot;platform_link&quot;:[0,&quot;https://leetcode.com/problems/two-sum/&quot;],&quot;difficulty&quot;:[0,&quot;Beginner&quot;],&quot;tags&quot;:[1,[[0,&quot;Array&quot;]]]}]]]}"></astro-island>'
    s = sheet_from_page(page, "company", "acme", "u", "2026-11-28")
    assert s["title"] == "Acme" and len(s["items"]) == 1, s
    q = s["items"][0]
    assert q == {"position": 1, "title": "Two Sum", "difficulty": "Easy", "category": None, "platform": "LeetCode", "url": "https://leetcode.com/problems/two-sum/", "tags": ["Array"]}, q
    assert "SECRET" not in json.dumps(s)
    sec = extract({"sections": [{"topic": "Arrays", "subTopic": "", "problems": [{"title": "A", "platform": "gfg", "difficulty": "Medium"}, {"title": ""}]}]})
    assert sec == [{"position": 1, "title": "A", "difficulty": "Medium", "category": "Arrays", "platform": "GeeksforGeeks", "url": None, "tags": []}], sec
    pk = extract({"packages": [{"id": "3-5", "label": "3 – 5 LPA"}], "questions": [{"id": 1, "title": "Two Sum", "difficulty": "Easy", "package": "3-5", "topic": "Arrays", "leetcode": "https://leetcode.com/problems/two-sum/"}]})
    assert pk == [{"position": 1, "title": "Two Sum", "difficulty": "Easy", "category": "3 – 5 LPA", "platform": "LeetCode", "url": "https://leetcode.com/problems/two-sum/", "tags": [], "subcategory": "Arrays"}], pk
    assert section_of("/preparation/most-asked-questions/postgreSQL-questions") == ("topic", "postgresql-questions")
    assert section_of("/preparation/company-wise-dsa-sheet/tcs-dsa-interview-questions") == ("company", "tcs")
    assert section_of("/preparation/dsa-playlists/x") is None
    print("self-test passed")


def main():
    from scrapling.fetchers import FetcherSession
    from scrapling.spiders import Request, Response, Spider

    dev = "--dev" in sys.argv
    blocked, seen, order = [], set(), {}

    class HyntsSpider(Spider):
        name = "hynts"
        start_urls = [f"{ORIGIN}/sitemap.xml"]
        allowed_domains = {"hynts.in"}
        robots_txt_obey = True
        concurrent_requests = 1
        concurrent_requests_per_domain = 1
        download_delay = 1.0
        development_mode = dev
        development_cache_dir = "data/raw/hynts"
        logging_level = logging.INFO  # DEBUG would print every scraped sheet

        def configure_sessions(self, manager):
            # Plain HTTP with a generic User-Agent: no browser impersonation or generated browser headers.
            manager.add("default", FetcherSession(impersonate=None, stealthy_headers=False, headers={"User-Agent": UA}, retries=2))

        async def parse(self, response: Response):
            # Question pages from the sitemap, plus the section index pages, which link a few pages the sitemap misses.
            paths = [urlparse(loc.strip()).path for loc in re.findall(r"<loc>([^<]+)</loc>", response.body.decode("utf-8", "replace"))]
            for req in self.requests_for(paths):
                yield req
            for index in INDEX_PAGES:
                yield Request(f"{ORIGIN}{index}/", callback=self.parse_index)

        async def parse_index(self, response: Response):
            for req in self.requests_for(re.findall(r'href="(/preparation/[^"#?]*)"', response.body.decode("utf-8", "replace"))):
                yield req

        def requests_for(self, paths):
            for path in paths:
                hit = section_of(path.rstrip("/"))
                if hit and hit not in seen:  # the sitemap lists some pages twice
                    seen.add(hit)
                    order[hit] = len(order)  # hynts.in's own order (sitemap first), kept in the output
                    yield Request(f"{ORIGIN}{path.rstrip('/')}/", callback=self.parse_page, meta={"section": hit[0], "slug": hit[1]})

        async def parse_page(self, response: Response):
            section, slug = response.meta["section"], response.meta["slug"]
            if response.status != 200:
                blocked.append(f"{section}/{slug}: HTTP {response.status}")
                return
            sheet = sheet_from_page(response.body.decode("utf-8", "replace"), section, slug, response.url, date.today().isoformat())
            if not sheet:
                blocked.append(f"{section}/{slug}: no question list on the page")
                return
            print(f"{section}/{slug}: {len(sheet['items'])}")
            yield sheet

    result = HyntsSpider().start()
    sheets = sorted(result.items, key=lambda s: (s["section"], order[(s["section"], s["slug"])]))
    if not sheets:
        sys.exit("No sheets fetched; nothing written.")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"source": ORIGIN, "note": "Metadata only (titles, sheet, difficulty, platform, position). No answers or explanations. sourceUrl and url are provenance and are never shown in the product.", "sheets": sheets}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    counts = {}
    for s in sheets:
        counts[s["section"]] = counts.get(s["section"], 0) + len(s["items"])
    print(json.dumps({"sheets": len(sheets), "rows": counts, "skipped": blocked, "requests": result.stats.requests_count, "robotsDisallowed": result.stats.robots_disallowed_count}))


if __name__ == "__main__":
    self_test() if "--self-test" in sys.argv else main()
