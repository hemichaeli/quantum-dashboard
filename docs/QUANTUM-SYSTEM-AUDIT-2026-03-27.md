# QUANTUM System Audit Report

**Date**: 2026-03-27
**System**: Real Estate Intelligence Dashboard (Pinuy Binuy / Israeli Urban Renewal)
**Methodology**: 5-agent parallel swarm audit (Architecture, Data, Frontend, Integrations, Security/Costs)

---

## Executive Summary

QUANTUM is a functional, feature-rich real estate intelligence platform with 19 dashboard pages, 1,000+ listings, and 700+ complexes. However, the audit identified **5 critical (P0)**, **14 high-priority (P1)**, and **7 medium-priority (P2)** findings across architecture, security, cost optimization, and integrations.

**The three highest-impact actions are:**

1. **Fix security vulnerabilities** (P0) -- SQL injection via scraped data, XSS in frontend, verify dashboard authentication exists
2. **Decouple the monolith** (P0) -- Split scraper/bot/dashboard into separate Railway services to eliminate cascading failures
3. **Implement tiered AI model strategy** (P1) -- Reduce monthly AI costs from ~$250 to ~$85 (63% savings)

---

## P0 -- Critical (Address This Week)

### Security

| # | Finding | Risk | Effort |
|---|---------|------|--------|
| 1 | **SQL injection via scraped data** -- Verify ALL database inserts from scraped data use parameterized queries (`$1, $2`), never string concatenation | Data breach/destruction | 1-2 days audit |
| 2 | **XSS via scraped data display** -- Never use `innerHTML` with scraped data. Use `textContent` + DOMPurify. Add CSP headers | Session hijacking | 1-2 days |
| 3 | **Dashboard authentication** -- Verify login exists. If the dashboard is publicly accessible, anyone can view phone numbers and trigger API calls | Full data exposure | 2-3 days if missing |
| 4 | **Run first security scan** -- `audit-status.json` shows `lastScan: null`. No security scan has ever been run | Unknown attack surface | 2 hours |

### Architecture

| # | Finding | Risk | Effort |
|---|---------|------|--------|
| 5 | **Monolithic single-process deployment** -- Scraper crash kills dashboard and WhatsApp bot. Scraper blocks Express event loop. Deploy changes restart everything | Downtime cascade | 2-3 days |
| 6 | **Enable PgBouncer connection pooling** -- Append `?pgbouncer=true` to Railway connection string. Critical before splitting into multiple services | Connection exhaustion | 1 hour |
| 7 | **Add database indexes** -- `CREATE INDEX` on city, status, price, date columns. Queries will degrade at 5,000+ listings | Dashboard slowdown | 2-4 hours |

---

## P1 -- High Priority (Address Within 2 Weeks)

### AI Cost Optimization (Estimated savings: ~$165/month, 63% reduction)

| # | Action | Current Cost | Target Cost | Savings |
|---|--------|-------------|-------------|---------|
| 8 | **Tiered SSI scoring**: Rule-based pre-filter (free) -> Haiku screening ($0.003/property) -> Sonnet deep analysis (top 30% only) | $100-120/mo | $25-35/mo | 70% |
| 9 | **Batch SSI processing**: Group 5-10 properties per API call by neighborhood. Nightly batch job instead of on-demand | (included above) | (included above) | 40-50% token savings |
| 10 | **Replace Perplexity with tiered enrichment waterfall**: DB cache -> cross-portal dedup -> B144 directory -> Brave Search + GPT-4o-mini -> Lusha -> Perplexity (last resort) | $50-80/mo | $10-20/mo | 75% |
| 11 | **Query deduplication by complex/project** before enrichment calls | -- | -- | 30-50% fewer API calls |

**Multi-Model Routing:**

| Use Case | Model | Rationale |
|----------|-------|-----------|
| SSI pre-screening | Haiku | Structured, low complexity |
| SSI deep analysis | Sonnet | Good reasoning, 6x cheaper than Opus |
| Morning reports | Haiku | Templated output |
| Market narratives | Sonnet | Needs nuance |
| Phone enrichment | Brave Search + GPT-4o-mini | 50% cheaper than Perplexity |
| Data validation | Gemini | Competitive pricing for structured extraction |

### Architecture & Reliability

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 12 | **Extract scraper into Railway cron service** -- No HTTP listener, runs on schedule (`0 */6 * * *`), writes to DB, exits. Reduces Railway cost (pay only during scrape). | 2-3 days | Eliminates process crash cascade |
| 13 | **Extract WhatsApp bot into separate Railway service** -- Independent webhook listener, own env vars, own deploy cycle | 2-3 days | Webhook reliability |
| 14 | **Add circuit breakers for external APIs** -- Use `opossum` library. 5 failures in 60s = circuit open, fail fast | 1 day | Prevents cascading failures |
| 15 | **Add health check endpoints** (`GET /health`) to all services with DB + external API connectivity checks | 2 hours | Railway auto-restart on failure |

### Data Strategy

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 16 | **Add Bright Data residential proxies** (Israeli IPs) for Yad2 scraping. ~$2-5/scrape cycle. Largest IL IP pool | 1 day | Scraping resilience |
| 17 | **Implement session pool** -- 20-30 authenticated Yad2 sessions, rotate every 15-25 requests, quarantine blocked sessions for 48h | 2-3 days | Phone extraction reliability |
| 18 | **Israeli phone validation** -- Regex: mobile `^(\\+972|0)(5[0-9])\\d{7}$`, landline `^(\\+972|0)([2-4,8-9])\\d{7}$`. Reject obviously invalid numbers before DB insert | 2 hours | Data quality |

### Frontend (Fixes all 3 known bugs)

| # | Action | Effort | Fixes |
|---|--------|--------|-------|
| 19 | **Centralized state store** (`state-store.js`) -- Single ES module with `getState()`, `setState()`, `subscribe()`. Persists to sessionStorage. Every page imports it | 1-2 days | "No complex selected" bug |
| 20 | **Fetch wrapper** (`api-client.js`) -- Wraps all `fetch()` with `AbortController` timeout (30s), `.catch()` that always hides spinners, retry with backoff | 1-2 days | Loading state hangs |

### Compliance

| # | Action | Effort | Risk |
|---|--------|--------|------|
| 21 | **WhatsApp opt-in compliance** -- WhatsApp Business API requires explicit opt-in. Cold outreach to scraped numbers = account suspension. Implement opt-in flow | 1-2 days | Account suspension |

---

## P2 -- Medium Priority (Address Within 1 Month)

### Integrations

| # | Action | Recommendation |
|---|--------|---------------|
| 22 | **Google Calendar** -- Use full API (not iframe), phased: Phase 1 (OAuth + read-only, 2 weeks) -> Phase 2 (create events from CRM, 2 weeks) -> Phase 3 (availability checking, 2 weeks) |
| 23 | **Multi-platform messaging via InforU** -- Consolidate WhatsApp + SMS under InforU (Israeli provider). Send from QUANTUM's own number. Build abstraction layer (Strategy pattern): MessageIntent -> MessageRouter -> InforU (WhatsApp + SMS) + Resend (Email) |
| 24 | **Hebrew SMS via InforU** -- UCS-2 encoding = 70 chars/segment. 200-char Hebrew message = 3 segments (~0.15-0.24 NIS). WhatsApp is cheaper for Hebrew outreach (~0.15-0.25 NIS/template msg with richer content). InforU handles both channels via single API |

### Frontend Enhancements

| # | Action | Effort |
|---|--------|--------|
| 25 | **Do NOT migrate to React/Vue** -- 19-page rewrite is 2-4 months. Bugs are fixable with vanilla JS patterns. Alpine.js optional for future features only | -- |
| 26 | **Toast notification system** -- Replace `alert()` with consistent toasts (top-right, auto-dismiss, color-coded) | 0.5 days |
| 27 | **Tailwind CSS purge** -- If not using content config, CSS bundle may be ~3MB. Purge reduces to 10-30KB | 0.5 days |

### Monitoring

| # | Action | Effort |
|---|--------|--------|
| 28 | **Per-model + per-feature AI cost tracking** -- Tag every API call by model and feature (SSI, enrichment, reports). Daily budget caps at 2x average | 1 day |
| 29 | **External uptime monitor** -- UptimeRobot (free) hitting `/health` every 5 minutes | 1 hour |

---

## Architecture: Target State

```
                    +------------------+
                    |   Cloudflare CDN |  (static assets)
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v----------+     +------------v-----------+
    |  quantum-dashboard |     |  quantum-messaging     |
    |  (Express.js API)  |     |  (InforU + Resend)     |
    |  - REST endpoints  |     |  - WhatsApp via InforU |
    |  - AI orchestration|     |  - SMS via InforU      |
    |  - Auth/sessions   |     |  - Email via Resend    |
    +--------+-----------+     +------------+-----------+
             |                              |
             |    +------------------+      |
             +--->|  PostgreSQL      |<-----+
             |    |  (PgBouncer)     |      |
             |    |  Schema-separated|      |
             |    +------------------+      |
             |                              |
    +--------v-----------+                  |
    |  quantum-scraper   |------------------+
    |  (Railway cron)    |
    |  - Every 6 hours   |
    |  - Rate-limited    |
    |  - Idempotent      |
    +--------------------+
```

**Railway Cost Estimate (post-split):**

| Service | Est. Monthly Cost |
|---------|------------------|
| Dashboard API | $5-20 |
| Messaging Service (InforU webhooks) | $5-10 |
| Scraper (cron) | $2-5 |
| PostgreSQL | $5-20 |
| **Total infra** | **$17-55** |
| **AI APIs (optimized)** | **$70-103** |
| **Grand total** | **$87-158/mo** |

---

## Data Enrichment: Recommended Pipeline

| Tier | Method | Cost/Contact | Hit Rate | Notes |
|------|--------|-------------|----------|-------|
| 1 | Yad2 direct (improved scraper + Bright Data) | ~$0.001 | 40-60% | Free if scraper works |
| 2 | Madlan/Komo cross-reference | ~$0.001 | 15-25% | Same listing, different portal |
| 3 | B144 business directory | ~$0.002 | 20-30% | Agent/developer contacts |
| 4 | Lusha API (Israeli company) | ~$0.15 | 50-70% | For identified names |
| 5 | Brave Search + GPT-4o-mini | ~$0.004 | 30-50% | Replaces Perplexity |
| 6 | Manual research queue | ~$1.00 | 90%+ | High-value listings only |

**Estimated total for 1,000 listings: ~$111 with 95%+ coverage**

---

## Execution Roadmap

### Week 1: Security & Quick Wins
- Audit parameterized queries and XSS vectors in deployed code
- Verify dashboard authentication exists
- Enable PgBouncer, add database indexes
- Add Israeli phone validation
- Run first security scan

### Week 2: Decouple & Stabilize
- Extract scraper into Railway cron service
- Implement `state-store.js` and `api-client.js` (fixes all 3 frontend bugs)
- Add circuit breakers for external APIs
- Implement WhatsApp opt-in flow

### Week 3-4: Cost Optimization
- Implement tiered SSI scoring (Haiku pre-screen -> Sonnet deep analysis)
- Add query deduplication by complex/project
- Switch Perplexity fallback to Brave Search + GPT-4o-mini
- Add per-model cost tracking and daily budget caps

### Month 2: Integrations
- Extract messaging into separate Railway service with InforU integration (WhatsApp + SMS from QUANTUM's number)
- Google Calendar API Phase 1 (OAuth + read-only sync)
- Messaging abstraction layer: MessageIntent -> MessageRouter -> InforU (WhatsApp/SMS) + Resend (Email)
- Add Bright Data proxies + session pool for scraping

### Month 3: Polish
- Google Calendar Phases 2-3
- Zoho CRM sync hardening
- Data retention policies
- Alpine.js evaluation for future frontend features

---

## Legal Notes (Consult Israeli Technology Lawyer)

- **Privacy**: Storing phone numbers triggers Israeli Privacy Protection Law obligations. Database registration may be required above 10,000 records.
- **Scraping**: Yad2 ToS prohibits scraping. Violation = breach of contract (civil, not criminal in Israel). Low risk at 1,000 listings, medium at 10,000+.
- **WhatsApp**: Cold outreach to scraped numbers violates WhatsApp Business Policy. Implement opt-in flow.
- **SMS (Hok HaSpam)**: InforU enforces Israeli Communications Law — proof of opt-in required for marketing SMS. Build opt-in flow before going live.
- **Data retention**: Implement 24-month max retention for personal data, 90-day for AI logs.

---

## Messaging Provider: InforU (inforu.co.il)

**Decision**: Consolidate WhatsApp + SMS under InforU. Send from QUANTUM's own number.

### Why InforU

- Israeli company — native Hebrew/RTL, local compliance, direct carrier routes (Cellcom, Partner, Pelephone, HOT Mobile)
- Single REST API for both WhatsApp Business + SMS
- Branded Sender ID — recipients see QUANTUM's number, not a random shortcode
- Handles Meta Business verification for WhatsApp templates
- Enforces Israeli Communications Law (Hok HaSpam) compliance

### Architecture

```
MessageIntent (contact, template, channel_preference)
    |
    v
MessageRouter (selects channel: cost, preference, availability)
    |
    +---> InforU WhatsApp  (primary for Hebrew outreach, ~0.15-0.25 NIS/template msg)
    +---> InforU SMS       (fallback, same API, QUANTUM's number, ~0.05-0.08 NIS/segment)
    +---> Resend Email     (existing, ~$0.001/msg)
    |
    v
DeliveryTracker (unified webhook from InforU for both channels)
```

### Cost Comparison (Israeli Market)

| Channel | Cost per Message | Hebrew Limits | Rich Content | Delivery Tracking |
|---------|-----------------|---------------|-------------|-------------------|
| InforU WhatsApp | ~0.15-0.25 NIS/template | 4096 chars | Images, buttons, docs | Delivered + Read |
| InforU SMS | ~0.05-0.08 NIS/segment | 70 chars/segment (UCS-2) | None | Delivered |
| Resend Email | ~$0.001 | Unlimited | Full HTML | Delivered + Opened |

**Recommendation**: Default to WhatsApp for Hebrew outreach (cheaper per-message, richer content, read receipts). Use SMS only as fallback when WhatsApp delivery fails or contact has no WhatsApp.

### Implementation Steps

1. Register QUANTUM's phone number with InforU
2. Set up InforU API credentials (store in Railway env vars)
3. Submit WhatsApp message templates to InforU for Meta approval
4. Build messaging abstraction layer (MessageRouter + providers)
5. Add contact-level channel preference in CRM (default: WhatsApp)
6. Implement opt-in flow in dashboard (required by both WhatsApp Business Policy and Hok HaSpam)
7. Add unified delivery tracking with InforU webhooks

---

*Report generated by 5-agent parallel swarm audit. Updated 2026-03-27 with InforU messaging provider decision. Individual agent reports available in task output files.*
