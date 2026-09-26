# Grow Cambodia — Kampot local promotion and advertising proposal

Status: APPROVED FOR PLANNING; NOT IMPLEMENTED. Recorded 2026-09-26. Parent context: Grow Cambodia / smalltownOS; preserve the existing app, repository, database, community-owned local-economy direction and no-Lovable-agent-credits constraint. Do not treat this document as a request to turn on ads or change the database without a separate implementation review.

## Purpose
Promote Kampot's food, farms, farm visits, local produce, restaurants and events while allowing local businesses to pay for clearly identified promotion. Examples supplied by Seth: La Plantation, BO Farm, Baby Bird; restaurants can sponsor content ("Brought to you by…") or announce events ("Party tonight"). These are illustrative leads, not confirmed customers or endorsements.

## Community experience
- Keep ordinary community posts separate from paid advertisements. Clearly mark every paid placement **Sponsored** and identify the paying business.
- Potential placements: Community feed; farm profiles/discovery and farm visits; local food/events; restaurant listings; sponsored educational stories/videos.
- Farm visit promotion can link to a farm profile with tour/tasting/product information, opening hours, contact and booking link when verified.
- Do not overwhelm the Community feed; set placement limits and frequency caps during implementation design.
- Future related feature: a user can open a farm seen in the Community feed, visit its farm page and add posts there, subject to permissions/moderation. This is a separate unfinished feature.

## Admin advertising module — requirements
- Global advertising on/off switch, **off by default**; turning it off hides all paid placements without deleting campaign records.
- Per-placement enable/disable: Community feed, farm profiles/discovery, events/local food, restaurant listings.
- Per-campaign on/off, approval/rejection, preview, scheduling (start/end), and expiry.
- Campaign fields: advertiser/business and contact, promotion type, headline/copy, image/video, destination link or in-app profile, placement, dates, price/currency, payment status, moderation/approval status and audit history.
- Admin approval before first publication and after material changes; advertiser self-service and payment integration are later decisions, not part of this checkpoint.
- Ads must remain visibly labeled Sponsored; sponsorship attribution such as "Brought to you by [business]" must not obscure that disclosure.
- Admin can view active, pending, expired, paused and rejected campaigns and basic impressions/clicks once measurement is implemented.

## Phasing and safeguards
1. Review existing auth/admin roles, routes, content/feed data model, moderation and business/farm profile models before schema changes. Do not create a second app or database.
2. Design advertiser permissions, RLS, asset storage, moderation, payments and placement limits; ensure a global off switch is enforced on the server/data delivery path, not only visually.
3. Build admin campaign management and sponsored rendering with advertising off by default. Test no ads when disabled, approvals, date boundaries, ownership and disclosure.
4. Pilot Kampot farm visits, food discovery and local events; restaurants use the same advertising system. Pricing, booking, billing, launch and any actual advertiser agreements remain undecided.

## Resume checkpoint
Next time this feature is selected: load AI OS rules and this project's current GitHub checkpoint first, inspect existing app/DB, then prepare a scoped implementation plan before modifying live data. The Community screen cleanup and flower PWA icon work are separate prior tasks.
