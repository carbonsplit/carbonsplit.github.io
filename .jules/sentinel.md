# Sentinel's Journal

## 2026-09-02 - Upstream Schema Discrepancy in Client-Side Stats Validation
**Vulnerability:** Unchecked client-side data consumption can cause unhandled exceptions or rendering crashes if incoming payloads vary from expected schemas.
**Learning:** An earlier attempt (PR #2) enforced rigid non-null validation requiring `consistency` and `consistencyMax`. However, the background data extraction pipeline (`gff-sync/daily_update.py`) does not populate those fields in `public/data/stats.json`. Enforcing strict required checks on missing fields broke real-time data sync and prevented merging.
**Prevention:** Always verify upstream data generators (`gff-sync`) and sample production payloads before declaring schema constraints. Treat optional or evolving metrics defensively.
