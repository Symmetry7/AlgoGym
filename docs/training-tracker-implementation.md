# Training Tracker integration

AlgoGym's Training view implements the published ThemeCP / Training Tracker flow independently. It uses the level targets and performance method from [ThemeCP](https://codeforces.com/blog/entry/136704) and the reference [Training Tracker](https://github.com/C0ldSmi1e/Training-Tracker). The linked repository does not include a license; no source was copied.

The workspace supports levels 1–109, optional multiple Codeforces tags, contest bounds, four distinct unsolved problems at the exact level ratings, a 30-second start countdown, pause/resume, stop without saving, finish with Codeforces refresh, a performance estimate, local level progression, statistics/history export and deletion, and an upsolve queue. Timers use wall time and remain correct after refresh. Accepted solves are matched by the normalized catalog ID and accepted timestamp. Solves during pauses or before a session do not count toward that session.

Training history and level are scoped to the signed-in user's browser. Export JSON before clearing browser storage or switching browsers. The verified coin balance and new awards come from the server ledger through Codeforces synchronization; local training actions cannot mint coins. A failed synchronization leaves the round available for retry.

Settings now save an unchanged form with empty optional portfolio links and accept valid username changes. The profile card is a private, authenticated SVG preview with an actual high-resolution JPEG download as the sole export action.

Verification on 22 October 2026: 96 tests passed, 6 opt-in live AI tests skipped; production build and typecheck passed. Browser verification covered signed-in settings save, training controls, and profile-card preview. A browser automation download event timed out, so an actual browser download was not independently observed; JPEG encoding and filename have focused mocked Canvas tests. No new external Codeforces submission or coin award was made for acceptance testing.
