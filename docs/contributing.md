# Contributing

1. Read the [README](../README.md) and [architecture](architecture.md), then set up a development Supabase project from the ordered migrations. Do not point integration tests at production data.
2. Create a focused branch. Keep Next.js routes in `src/app`, client feature UI in `src/features` or the existing screen location, and secrets and provider calls in `server/`.
3. Add migrations for database changes; never edit or remove historical migrations that may have been applied.
4. Run `npm run typecheck`, `npm test`, and `npm run build`. The repository has no lint command today. Run relevant browser/integration scripts only with their documented isolated setup.
5. Open a pull request explaining the behavior, affected routes/data, migration impact, validation performed, and any untested external flow. Keep product and architecture docs aligned with implementation.

Avoid adding a second auth system, claiming unsupported provider rewards, or treating generated AI text as verified source material. Preserve third-party asset and font notices.
