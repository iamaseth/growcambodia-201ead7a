# Timeline — canonical Grow Cambodia project

## Consolidation decision (2026-09-26)
Timeline is the single AI OS project for Grow Cambodia. Crop ID is a module/workflow inside Timeline, not a separate app. Resume command: `$continue dev timeline`; `$continue dev crop id` should route to Timeline's Plant ID module, not another project.

Canonical code: https://github.com/iamaseth/growcambodia-201ead7a
Canonical Lovable project: https://lovable.dev/projects/441035ed-b074-4d59-a725-477c7c8230f9
Published URL: https://growcambodia.lovable.app
Legacy/reference repository: https://github.com/iamaseth/growcambodia-bf5948b7 — retain as read-only historical reference until deployment and data verification; do not delete or merge its main branch wholesale.

## Repository audit
Both default-branch trees were enumerated in full (neither GitHub tree was truncated). Every file path in the legacy bf5948b7 repository is present in canonical 201ead7a. 112 files have identical Git blob SHAs. 13 shared files differ (plus bun.lock and generated routeTree.gen.ts). No source files or migrations exist only in the legacy repository. The canonical repo contains newer modules and migrations; do not overwrite these with older legacy versions.

Shared changed files needing behavior-level regression review before any selective port: package.json, src/components/update-card.tsx, src/components/update-composer.tsx, src/integrations/supabase/client.ts, src/integrations/supabase/types.ts, src/lib/analyze-update.functions.ts, src/lib/date-format.ts, src/lib/db.ts, src/routes/__root.tsx, src/routes/index.tsx, src/routes/log.$logId.tsx. Generated src/routeTree.gen.ts and bun.lock also differ. Canonical update-card has diary mode, community/report features; canonical db has community post types. Canonical analyze-update uses stored image context. Preserve newer behavior.

## Unified product scope — preserve all modules
- Plant ID: camera/photo, image compression, Pl@ntNet/AI identification, GBIF taxonomy, confidence, alternatives, original image, GPS, persisted identification history.
- Cambodia/SE Asia plant knowledge: curated profiles, general care, local growing advice, plant library, community knowledge, identification observations, opt-in sharing/corrections.
- Contextual AI: ask multiple follow-up questions immediately after identification; later persist threads and attach to plant and timeline, include photo and history context.
- My Plants/My Crops, farms and team membership, crop guide, plant logs, growth-stage diary, multi-photo timeline, map/GPS, visits and scheduling, submissions and review.
- Social/community feed, comments, likes, reporting, moderation/admin feed, admin chat, community sharing, user authentication/roles.
- PWA/mobile-first interface, private photo storage and signed URLs, database RLS.

## Remaining work (NOT completed by repository consolidation)
1. Verify canonical Lovable project is synced to the latest canonical GitHub commit; a previous publish request returned pending, and the later Lovable build request failed because the workspace had no credits. Do not claim the new chat UI is live until visually and functionally verified.
2. Build/lint and run end-to-end photo -> identify -> first AI question -> second follow-up, including signed-in and signed-out behavior.
3. Inspect actual production DB/migrations and storage before modifying schema or migrating any user data. The legacy repository has no unique migration file, but that does NOT establish that the two live databases or user records are identical.
4. Persist contextual AI conversations linked to identification, garden plant and diary entries; current PlantAIChat keeps messages only in local component state.
5. Check legacy differing files for any valuable behavior not retained; selectively port only verified missing behavior with tests.
6. After verified app and data continuity, retire the duplicate AI OS dashboard entry, redirect Crop ID continuation to Timeline and archive the legacy repo only after explicit confirmation. Never delete user data or repository by default.

Do not create a second app, database, or duplicate dashboard project for Crop ID.
