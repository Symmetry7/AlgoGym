# Institution directory

AlgoGym imports a normalized snapshot into its own Supabase college directory; search never depends on a third-party autocomplete service.

Source under review: [Indian Educational Institutions Data](https://github.com/arpitagarwala/indian-institutions-data), an independent MIT-licensed repository that extracts the official [AISHE directory](https://dashboard.aishe.gov.in/). AISHE institution codes, names, state and district identify records. This is a directory snapshot, not a claim of exhaustive coverage or current accreditation.

Run `node scripts/import-colleges.mjs` for validation only. It records the pinned commit, source checksum, counts and ambiguous institution codes in ignored `.local-backups/college-source-review.json`. After review, pass `--apply --source-ref=<reviewed-full-commit>` to import. The importer is idempotent by source identity, retains existing IDs/statuses, reports rejected records, and does not delete institutions. Same-name/source collisions are excluded from automatic import and require review. Future source updates must be reviewed before import; approved aliases are stored separately.

Institution requests remain pending until an authorized reviewer links them to a canonical record or approves a new one. User college selection does not establish society membership or institution accreditation.

## User-suggested hosted API review — 17 October 2026

[Indian Colleges API](https://colleges-api.onrender.com/) documents name, state and district searches over approximately 43,000 institutions sourced from data.gov.in AISHE data. Its [source repository](https://github.com/PriyanKishoreMS/colleges-api) is a possible supplementary source, subject to dataset/license and freshness review.

Live checks returned HTTP 200 for its documentation, but `/colleges?limit=1`, `/colleges?search=kalinga&limit=3`, and the capitalized search all returned `{"colleges":null,"count":0,"currentPage":1,"pages":1}`. This is not reliable evidence of an empty Indian college directory; treat it as unavailable data. Do not replace the working canonical Supabase directory with these empty responses or introduce a runtime dependency on the hosted service. The documented record shape also lacks a stable AISHE identifier, so any future import requires reviewed identity matching, never automatic duplicate creation.

The current Supabase import contains 71,238 validated institutions. Missing-college requests remain the supported fallback. These counts describe snapshots and do not establish completeness or accreditation.
