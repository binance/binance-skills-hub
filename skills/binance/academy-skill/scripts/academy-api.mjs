/*
 * academy-api.mjs — Binance Academy Skill backend API client + learning-plan orchestrator
 *
 * Purpose
 *   Wraps the 6 backend HTTP endpoints that power the Academy AI Skill and
 * exposes them as plain async ES-module functions. Also implements the
 * 3-step "learning plan" orchestration chain (`getLearningPlan`) that the
 * skill calls for Intent 3 (customized learning path), and the concurrent
 * "search all" aggregator (`searchAll`) that runs the 4 search endpoints
 * in parallel and picks the best result by match tier.
 *
 * Environment
 *   prod → https://www.binance.com/bapi/bigdata
 *   Base URL / timeout are loaded from ../env/<env>.env, with
 *   hardcoded fallbacks if those files are absent.
 *
 * Endpoints (all POST /v1/public/bigdata/academy-skill/<name>)
 *   1. searchGlossary      — glossary term full-text search
 *   2. searchLearnEarn     — Learn & Earn course search
 *   3. searchResource      — Track/Course/Module search (step 1 of plan)
 *   4. resolveParentTrack  — reverse-lookup parent Track from a hit id (step 2)
 *   5. getTrackOutline     — expand Track → Course[] → Module[] tree (step 3)
 *   6. searchArticles      — User Education Articles search (different schema:
 *                            `language`/`docCount`/`queryType`, no `bu`)
 *
 * Article URL resolution (best-effort, script-applied)
 *   After `searchArticles` returns items, the script calls the public Academy
 *   search v2 API (GET /bapi/composite/v2/public/pgc/content/academy/search)
 *   for each item to resolve its canonical URL
 *   `{publicDomain}/{lang}/academy/articles/{slug}`. Falls back to the
 *   item's `articlePath` field, then to the original `visitUrl`. The original
 *   is preserved as `originalVisitUrl`. See `resolveArticleUrls` below.
 *
 * Response envelope (always HTTP 200 for well-formed requests):
 *   { code: "000000", message: null, data: {...}, success: true }
 *   code == "000000" → success; "000001" → backend error.
 *   HTTP 400 → malformed request (code=000002); HTTP 429 → rate limit (code=000003).
 *
 * Programmatic usage
 *   import { searchGlossary, getLearningPlan } from "<path>/academy-api.mjs";
 *   const items = await searchGlossary("prod", { query: "gas fee", lang: "en", limit: 3 });
 *   const plan  = await getLearningPlan("prod", { query: "defi", lang: "en", limit: 3 });
 *
 * CLI usage
 *   node academy-api.mjs <env> <endpoint> <jsonBody>
 *   node academy-api.mjs prod searchGlossary '{"query":"gas fee","lang":"en","limit":3}'
 *   node academy-api.mjs prod getLearningPlan '{"query":"defi","lang":"en","limit":3}'
 *   node academy-api.mjs prod searchGlossary '{"query":"bitcoin"}'
 *
 * No external dependencies — uses Node's built-in `https`/`http` module
 * (works on Node 16+; no `fetch` requirement).
 */

import { readFileSync, realpathSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

// --- Module location (used to find the sibling env/ directory) ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Environment config -------------------------------------------------------
const ENV_DIR = resolve(__dirname, "..", "env");
const ENV_CACHE = new Map();

// Hardcoded fallbacks (used only if ../env/<env>.env is missing). Mirror the
// documented contract so the client stays usable even before env files exist.
//
// searchApiBaseUrl / publicDomain:
//   - searchApiBaseUrl is the base URL for the public Academy search v2 API
//     (`/bapi/composite/v2/public/pgc/content/academy/search`), used by
//     `resolveArticleUrls` to fetch canonical article slugs.
//   - publicDomain is the public-facing domain used to build article URLs
//     (`{publicDomain}/{lang}/academy/articles/{slug}`), e.g.
//     `https://www.binance.com` on prod.
//   Both can be derived from the academy skill baseUrl by stripping
//   `/bapi/bigdata`, but are kept as explicit fallbacks for clarity and
//   in case the public domain ever diverges from the API domain.
const ENV_FALLBACKS = {
  prod: {
    baseUrl: "https://www.binance.com/bapi/bigdata",
    timeoutMs: 15000,
    searchApiBaseUrl: "https://www.binance.com/bapi/composite",
    publicDomain: "https://www.binance.com",
  },
};

/**
 * Load and cache the config for a given environment.
 * Format: simple `KEY=VALUE` lines, `#` comments and blank lines ignored.
 * Recognized keys: ACADEMY_BASE_URL, ACADEMY_TIMEOUT_MS,
 * ACADEMY_SEARCH_API_BASE_URL, ACADEMY_PUBLIC_DOMAIN.
 *
 * When `ACADEMY_SEARCH_API_BASE_URL` / `ACADEMY_PUBLIC_DOMAIN` are
 * missing from the env file, the loader derives them from
 * `ACADEMY_BASE_URL` by stripping the `/bapi/bigdata` suffix and
 * appending `/bapi/composite` (for searchApiBaseUrl) or leaving it
 * as the bare domain (for publicDomain). This means the env files
 * only need to override these when the public domain differs from
 * the API domain (rare).
 *
 * @param {string} env
 * @returns {{baseUrl: string, timeoutMs: number, searchApiBaseUrl: string, publicDomain: string}}
 */
function loadEnvConfig(env) {
  if (ENV_CACHE.has(env)) return ENV_CACHE.get(env);
  const fallback = ENV_FALLBACKS[env];
  const config = { ...fallback };
  try {
    const content = readFileSync(resolve(ENV_DIR, `${env}.env`), "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (key === "ACADEMY_BASE_URL") config.baseUrl = value;
      else if (key === "ACADEMY_TIMEOUT_MS") {
        const n = parseInt(value, 10);
        if (Number.isFinite(n) && n > 0) config.timeoutMs = n;
      }
      else if (key === "ACADEMY_SEARCH_API_BASE_URL") config.searchApiBaseUrl = value;
      else if (key === "ACADEMY_PUBLIC_DOMAIN") config.publicDomain = value;
    }
  } catch {
    // File missing/unreadable — keep fallback defaults so the client degrades
    // gracefully rather than crashing at startup.
  }
  // Derive searchApiBaseUrl / publicDomain from baseUrl when not set.
  // baseUrl looks like "https://www.binance.com/bapi/bigdata" — strip the
  // "/bapi/bigdata" suffix to get the bare domain, then append
  // "/bapi/composite" for the search API base.
  if (!config.searchApiBaseUrl && config.baseUrl) {
    const domain = config.baseUrl.replace(/\/bapi\/bigdata\/?$/, "");
    config.searchApiBaseUrl = `${domain}/bapi/composite`;
  }
  if (!config.publicDomain && config.baseUrl) {
    config.publicDomain = config.baseUrl.replace(/\/bapi\/bigdata\/?$/, "");
  }
  ENV_CACHE.set(env, config);
  return config;
}

/**
 * Validate the `env` argument.
 * @param {string} env
 * @throws {Error} If env is not "prod".
 */
function validateEnv(env) {
  if (env !== "prod") {
    throw new Error(
      `Invalid env: ${JSON.stringify(env)}. Must be "prod".`,
    );
  }
}

/**
 * Strip null/undefined fields from a shallow object. The backend treats
 * `undefined` as missing but `null` may cause issues, so drop both.
 * @param {Object} obj
 * @returns {Object}
 */
function cleanBody(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Apply minimal pre-processing to the request body before sending.
 *
 * - `query` (if present): trim leading/trailing whitespace and zero-width
 *   chars (NBSP, BOM), strip ISO control characters, truncate to 200 chars
 *   (backend limit; longer returns HTTP 400). Per the skill's query strategy
 *   (see SKILL.md "Step 2 — Query strategy"), do NOT lowercase, do NOT
 *   strip question words, do NOT translate — pass the user's words verbatim.
 *
 * @param {Object} body - Request body (mutated in-place via spread).
 * @returns {Object} The pre-processed body.
 */
function preprocessBody(body) {
  const out = { ...body };
  if (typeof out.query === "string") {
    let q = out.query;
    // Strip ISO control chars (would break plainto_tsquery and pollute logs)
    // and zero-width chars (NBSP 0x00A0, BOM 0xFEFF).
    q = q.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\uFEFF]/g, "");
    // Trim leading/trailing whitespace (incl. CJK ideographic space)
    q = q.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "");
    // Truncate to 200 chars (backend hard limit)
    if (q.length > 200) q = q.slice(0, 200);
    out.query = q;
  }
  return out;
}

/**
 * Core POST helper. Sends the JSON body, enforces a timeout, and
 * unwraps the standard response envelope.
 *
 * Uses Node's built-in `https`/`http` module rather than `fetch` so the script
 * works on Node 16+ without external dependencies or a modern runtime.
 *
 * @param {string} env - Target environment.
 * @param {string} endpoint - Endpoint name (e.g. "searchGlossary").
 * @param {Object} body - Request body.
 * @returns {Promise<any>} The parsed `data` field of the response.
 * @throws {Error} On network error, timeout, HTTP non-200, malformed JSON,
 *   or backend `code !== "000000"`.
 */
async function callApi(env, endpoint, body) {
  validateEnv(env);
  const config = loadEnvConfig(env);
  const url = `${config.baseUrl}/v1/public/bigdata/academy-skill/${endpoint}`;

  let bodyToSend = preprocessBody(body);
  bodyToSend = cleanBody(bodyToSend);

  const headers = { "Content-Type": "application/json" };

  const payload = Buffer.from(JSON.stringify(bodyToSend), "utf8");
  headers["Content-Length"] = payload.length;

  return await new Promise((resolveP, rejectP) => {
    const parsed = new URL(url);
    const isTls = parsed.protocol === "https:";
    const transport = isTls ? httpsRequest : httpRequest;
    const reqOptions = {
      method: "POST",
      hostname: parsed.hostname,
      port: parsed.port || (isTls ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers,
    };

    // Timeout: abort the socket if no response within the configured window.
    // `setTimeout` on the request fires before headers arrive; once the
    // response starts, the timer is cleared below to let the body stream.
    const timer = setTimeout(() => {
      req.destroy(new Error(`[academy-skill] Request timeout after ${config.timeoutMs}ms — env=${env} endpoint=${endpoint} url=${url}`));
    }, config.timeoutMs);

    const req = transport(reqOptions, (res) => {
      clearTimeout(timer);
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          const truncated =
            text.length > 500 ? text.slice(0, 500) + "...[truncated]" : text;
          rejectP(
            new Error(
              `[academy-skill] HTTP ${status} ${res.statusMessage ?? ""} — env=${env} endpoint=${endpoint} url=${url} body=${truncated}`,
            ),
          );
          return;
        }
        let parsedBody;
        try {
          parsedBody = JSON.parse(text);
        } catch (err) {
          const preview = text.length > 200 ? text.slice(0, 200) + "..." : text;
          rejectP(
            new Error(
              `[academy-skill] Malformed JSON response — env=${env} endpoint=${endpoint} url=${url}: ${err.message}; body=${preview}`,
            ),
          );
          return;
        }
        if (parsedBody.code !== "000000") {
          rejectP(
            new Error(
              `[academy-skill] Backend error code=${parsedBody.code} message=${parsedBody.message ?? "(none)"} — env=${env} endpoint=${endpoint} url=${url}`,
            ),
          );
          return;
        }
        resolveP(parsedBody.data);
      });
      res.on("error", (err) => {
        clearTimeout(timer);
        rejectP(
          new Error(
            `[academy-skill] Response stream error — env=${env} endpoint=${endpoint} url=${url}: ${err && err.message ? err.message : String(err)}`,
          ),
        );
      });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      if (err && err.message && err.message.startsWith("[academy-skill] Request timeout")) {
        rejectP(err);
        return;
      }
      rejectP(
        new Error(
          `[academy-skill] Network error — env=${env} endpoint=${endpoint} url=${url}: ${err && err.message ? err.message : String(err)}`,
        ),
      );
    });

    req.write(payload);
    req.end();
  });
}

// --- Public endpoint functions -----------------------------------------------

/**
 * Search Academy glossary entries by full-text query.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.query - Clean search term (required, max 200 chars).
 * @param {string} [body.lang] - Language code (max 16 chars, `^[A-Za-z0-9_-]{0,16}$`); empty = all languages.
 * @param {number} [body.limit=5] - Max results (1–10).
 * @returns {Promise<Array<Object>>} The `data.items` array (empty array if no hits or null data).
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function searchGlossary(env, body) {
  const data = await callApi(env, "searchGlossary", body);
  return data?.items ?? [];
}

/**
 * Search Academy Learn & Earn courses by full-text query.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.query - Clean search term (required, max 200 chars).
 * @param {string} [body.lang] - Language code.
 * @param {number} [body.limit=5] - Max results (1–10).
 * @returns {Promise<Array<Object>>} The `data.items` array (empty array if no hits or null data).
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function searchLearnEarn(env, body) {
  const data = await callApi(env, "searchLearnEarn", body);
  return data?.items ?? [];
}

/**
 * Search Academy structured resources (Track/Course/Module). Step 1 of the
 * learning-plan orchestration.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.query - Clean search term (required, max 200 chars).
 * @param {string} [body.lang] - Language code.
 * @param {number} [body.limit=5] - Max results (1–10).
 * @param {string[]} [body.resourceTypes] - Resource types to include (max 8,
 *   each matching `^[A-Z][A-Z0-9_]{0,63}$`). Defaults to
 *   `["ACADEMY_COURSE","ACADEMY_MODULE","ACADEMY_TRACK"]`.
 * @returns {Promise<Array<Object>>} The `data.items` array sorted by relevance desc (empty array if no hits).
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function searchResource(env, body) {
  const data = await callApi(env, "searchResource", body);
  return data?.items ?? [];
}

/**
 * Reverse-lookup the parent Track of a given resource hit. Step 2 of the
 * learning-plan orchestration (only when step 1 hits a Course or Module).
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.hitResourceId - Resource id to resolve (required, max 64 chars, `^[A-Za-z0-9_.:-]{1,64}$`).
 * @param {string} [body.lang] - Language code.
 * @returns {Promise<Array<Object>>} The `data.items` array of parent Track rows (empty array if none found).
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function resolveParentTrack(env, body) {
  const data = await callApi(env, "resolveParentTrack", body);
  return data?.items ?? [];
}

/**
 * Expand a Track into its full Course → Module tree. Step 3 of the
 * learning-plan orchestration. `lang` is REQUIRED for this endpoint —
 * omitting it returns HTTP 400 with `code=000002 "illegal parameter"`
 * (verified by direct test, 2026-08-04).
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.trackId - Track id (required, max 64 chars, `^[A-Za-z0-9_.:-]{1,64}$`).
 * @param {string} body.lang - Language code (required).
 * @returns {Promise<{trackId: string, courses: Array<Object>}|null>} The outline object, or null if data is null.
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function getTrackOutline(env, body) {
  const data = await callApi(env, "getTrackOutline", body);
  return data;
}

// --- Articles supported languages --------------------------------------------
//
// The `searchArticles` endpoint accepts a different (smaller) set of
// language codes than the 5 academy-series endpoints. Codes outside this
// list return 0 hits or backend errors. Notable absences vs. the academy
// `lang` list: `zh`, `zt` (Chinese) and `ja` (Japanese) are NOT supported
// by the articles endpoint.
//
// When the user's input language is not in the list, the script silently
// falls back to "en" for the articles call only — the LLM is then
// responsible for translating the returned English articles back to the
// user's language when formatting the card. See `getArticlesLang` below.
//
// Verified list of 41 supported language codes (2026-08-05):
const ARTICLES_SUPPORTED_LANGUAGES = new Set([
  "id", "uk", "ur-PK", "az-AZ", "ky-KG", "ka", "kk-KZ", "en", "ar", "de",
  "fr", "pt", "lt", "da", "sv", "es", "ru", "vi", "hu", "pl", "it", "hr-HR",
  "cs", "lv", "ro", "et", "el", "bg", "sk", "ph", "no", "ur", "tr", "bn",
  "he", "nl", "fi", "de-DE", "th", "de-CH", "dk",
]);

/**
 * Default `source` for `searchArticles` calls. The articles endpoint
 * covers 5 sources (Academy / Blog / Research / FAQ / Announcement),
 * but the Academy Skill is an educational content skill — Academy
 * articles are the primary content. Blog / Research / FAQ /
 * Announcement are secondary and often off-topic for knowledge Q&A.
 * When the caller does not specify a `source`, the script defaults
 * to "Binance Academy" to keep results focused. Pass an explicit
 * `source` (e.g., "Binance Blog") or `source: ""` (all sources) to
 * override.
 */
const ARTICLES_DEFAULT_SOURCE = "Binance Academy";

/**
 * Default `docCount` for `searchArticles` calls. Article bodies are
 * long-form (often 5K–50K chars of `bodyTextOnly`), and the LLM is
 * expected to distill the content into a concise summary that
 * answers the user's query (see SKILL.md "Article content
 * distillation"). Returning 1 article by default keeps the LLM
 * context budget manageable; the LLM extracts the key points
 * relevant to the user's question from that single article.
 * Callers that need more articles can pass an explicit `docCount`.
 *
 * **The script does NOT truncate `bodyTextOnly` / `content`.** The
 * LLM is responsible for summarizing the (full) article body for
 * the user's query — see SKILL.md "Format the output" rule 4.
 */

/**
 * Whitelist of article item fields returned to the caller.
 *
 * The API returns many fields the LLM does not need (internal IDs,
 * SEO metadata, catalog info, engagement metrics, timestamps, and
 * internal database table names). Stripping them:
 *   1. Avoids leaking internal schema details (e.g. `sourceTable`
 *      exposes the underlying database table name).
 *   2. Cuts token usage in the JSON response sent back to the LLM.
 *
 * The kept fields are exactly those referenced by the card templates
 * in SKILL.md / output-format.md.
 */
const ARTICLE_ITEM_WHITELIST = new Set([
  "title",
  "brief",
  "chunk",
  "highlighted",
  "content",
  "bodyTextOnly",
  "visitUrl",
  "originalVisitUrl",
  "similarity",
  "source",
  "language",
]);
// NOTE: `articlePath` is intentionally NOT in the whitelist. It was the
// URL slug returned by `searchArticles` and was meant to feed the
// articlePath-level URL fallback in `resolveArticleUrls`. In prod it is
// 0/44 populated, so keeping it in the whitelist wasted a token slot on
// every article item for a field that was always null.
// The fallback branch in `resolveArticleUrls` still reads the RAW
// `item.articlePath` (it runs BEFORE `shapeArticleItem`, so the field is
// still present on the raw item even though it's later stripped from the
// returned item) — so if the backend ever starts populating articlePath,
// the fallback still works; only the returned item no longer carries the
// (currently-empty) field.

/**
 * Strip non-whitelisted fields from an article item (in-place).
 * @param {Object} item - Article item returned by `searchArticles`.
 */
function shapeArticleItem(item) {
  if (!item || typeof item !== "object") return item;
  for (const key of Object.keys(item)) {
    if (!ARTICLE_ITEM_WHITELIST.has(key)) delete item[key];
  }
  return item;
}
const ARTICLES_DEFAULT_DOC_COUNT = 1;

/**
 * Default `queryType` for `searchArticles` calls. The articles endpoint
 * supports two retrieval modes: `vector` (semantic / cosine similarity)
 * and `fts` (full-text / bm25). `vector` is the default because:
 *
 * 1. Semantic search handles natural-language questions ("what is
 *    bitcoin", "how does staking work") far better than keyword
 *    matching — it catches paraphrases and related concepts that `fts`
 *    would miss.
 * 2. The Academy Skill is invoked via natural-language user queries,
 *    not keyword extracts, so `vector` is the better match for the
 *    skill's use case.
 * 3. `vector` returns a `chunk` field (the matched text fragment) which
 *    helps the LLM understand why the article matched; `fts` returns
 *    `highlighted` (with `<mark>` tags) instead.
 *
 * The `threshold` default differs by mode: `fts` = 0.01, `vector` = 0.7
 * — the higher vector threshold filters out low-relevance semantic
 * matches. Callers can explicitly pass `queryType: "fts"` for exact
 * keyword matching (e.g., ticker symbols, exact article titles).
 */
const ARTICLES_DEFAULT_QUERY_TYPE = "vector";

/**
 * Return the language code to use for the `searchArticles` endpoint,
 * falling back to "en" if the requested lang is not in the articles
 * supported list.
 *
 * The articles endpoint accepts a different (smaller) set of language
 * codes than the 5 academy-series endpoints (e.g., it does NOT support
 * `zh`, `zt`, or `ja`). When the user's input language is not in the
 * articles list, the script silently uses "en" for the articles call
 * so the user still gets article results; the LLM is responsible for
 * translating the returned English articles back to the user's
 * language when formatting the card.
 *
 * Special cases:
 *   - `undefined` / `null` → `"en"` (no lang specified → default English)
 *   - `""` → `""` (explicit "all languages" → preserved as-is)
 *   - supported lang (e.g., `"en"`, `"fr"`) → returned unchanged
 *   - unsupported lang (e.g., `"zh"`, `"ja"`, `"zt"`) → `"en"`
 *
 * @param {string|undefined|null} lang - The user's requested language code.
 * @returns {string} A language code in `ARTICLES_SUPPORTED_LANGUAGES`,
 *   or `""` when the input is `""` (explicit "all languages").
 */
export function getArticlesLang(lang) {
  if (lang === undefined || lang === null) return "en";
  if (lang === "") return "";
  return ARTICLES_SUPPORTED_LANGUAGES.has(lang) ? lang : "en";
}

/**
 * Search User Education Articles across Academy/Blog/Research/FAQ/Announcement.
 *
 * This endpoint has a DIFFERENT schema from the 5 academy-series endpoints:
 *   - `language` (not `lang`)
 *   - `docCount` (not `limit`; range -1 to 50, -1 = unlimited)
 *   - `queryType`: "vector" (semantic/cosine) or "fts" (full-text/bm25)
 *   - `source`: filter by "Binance Academy" / "Binance Blog" / "Binance Research" / "Binance FAQ" / "Binance Announcement"
 *   - `threshold`: similarity threshold (0-1; fts default 0.01, vector default 0.7)
 *   - No `bu` parameter (not business-unit scoped)
 *   - Supports many filter fields: `articleId`, `catalogId`, `articleCode`, `normalizedTitle`, etc.
 *
 * Article items have `similarity` (0-1) instead of `relevance` for ranking,
 * `content` (HTML body) + `bodyTextOnly` (plain text) instead of `excerpt`,
 * and `visitUrl` instead of `pageUrl`.
 *
 * **Language auto-fallback:** The `language` field is normalized via
 * `getArticlesLang`. If the caller passes a language not in
 * `ARTICLES_SUPPORTED_LANGUAGES` (e.g., `"zh"`, `"zt"`, `"ja"`), the
 * script silently replaces it with `"en"` so the user still gets article
 * results. The LLM is responsible for translating the returned English
 * articles back to the user's language when formatting the card. Pass
 * `language: ""` to explicitly request "all languages" (bypasses the
 * fallback). Use the exported `getArticlesLang(lang)` helper to predict
 * the actual language the script will use.
 *
 * **Source default:** When `source` is `undefined` / `null` (caller
 * did not specify), the script defaults to `"Binance Academy"` to
 * keep results focused on educational content. Pass an explicit
 * `source` (e.g., `"Binance Blog"`) or `source: ""` (all sources)
 * to override.
 *
 * **Doc count default:** When `docCount` is `undefined` / `null`, the
 * script defaults to `1` (not the backend's 10). Article bodies are
 * long-form and the LLM distills them — 1 article is usually enough.
 * Pass an explicit `docCount` for more.
 *
 * **No body text truncation.** The script does NOT truncate
 * `bodyTextOnly` or `content`. The LLM is responsible for
 * summarizing the (full) article body for the user's query — see
 * SKILL.md "Format the output" rule 4. Returning the full text
 * gives the LLM the context it needs to extract the key points
 * relevant to the user's question.
 *
 * **Visit URL resolution.** After fetching the articles, the script
 * calls the public Academy search API
 * (`/bapi/composite/v2/public/pgc/content/academy/search`) for each
 * item to resolve its canonical public URL. The original `visitUrl`
 * returned by `searchArticles` is replaced with
 * `{publicDomain}/{lang}/academy/articles/{slug}` where `slug` is
 * fetched from the v2 search response. If the v2 search returns no
 * result for an item's title, the original `visitUrl` is kept.
 * See `resolveArticleUrls` below.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.query - Search term (required, max 200 chars).
 * @param {string} [body.queryType] - "vector" or "fts" (default: `vector`).
 *   `vector` = semantic/cosine similarity (better for natural-language
 *   queries); `fts` = full-text/bm25 (better for exact keyword/ticker
 *   matching). The script defaults to `vector` when undefined.
 * @param {string} [body.source] - Source filter. Defaults to
 *   `"Binance Academy"` when undefined/null. Pass `""` for all sources.
 * @param {string} [body.language] - Language code. If not in
 *   `ARTICLES_SUPPORTED_LANGUAGES`, falls back to "en". Pass `""` for
 *   "all languages" (no fallback).
 * @param {number} [body.docCount] - Max results (-1 to 50). Defaults
 *   to `1` when undefined/null (NOT the backend's 10).
 * @param {number} [body.threshold] - Similarity threshold (0-1).
 * @returns {Promise<Array<Object>>} The `data.items` array of article
 *   items, with `visitUrl` replaced by the resolved canonical URL
 *   when the v2 search API returns a matching slug (see
 *   "Visit URL resolution" above).
 * @throws {Error} On network error, HTTP non-200, backend error, or malformed JSON.
 */
export async function searchArticles(env, body) {
  const bodyToSend = { ...body };
  // Reject the common `lang`-vs-`language` mistake up front. The articles
  // endpoint's language field is `language` (NOT `lang` like the 3
  // academy-series endpoints). Passing `lang` was previously silently
  // ignored — the backend returned content in whatever language it
  // defaulted to, while the script then hard-coded the URL path to `en`
  // (see `lang` below), producing misleading results (e.g. Dutch
  // articles shown under `/en/academy/articles/...`). Fail fast with a
  // clear message so the caller knows to use `language`.
  if (
    bodyToSend.lang !== undefined &&
    bodyToSend.language === undefined
  ) {
    throw new Error(
      "[academy-skill] searchArticles uses the `language` field, not `lang`. " +
        "You passed `lang` (which would be silently ignored and return " +
        "non-target-language articles). Use `language` instead — e.g. " +
        '{"query":"what is bitcoin","language":"en","docCount":3}. ' +
        "(`lang` is the field name used by searchGlossary/searchLearnEarn/" +
        "searchResource; searchArticles has a different schema.)",
    );
  }
  // Strip `lang` from the body if the caller passed it alongside
  // `language` (both fields present). The validation above only throws
  // when `lang` is present AND `language` is absent — if both are
  // present, the caller likely copied a `searchGlossary` body and added
  // `language` as a fix. Without this strip, `lang` would leak to the
  // backend as an unknown field (cleanBody keeps non-null values). The
  // articles endpoint's schema has no `lang` field, so it's junk that
  // could confuse a future strict-validating backend.
  if (bodyToSend.lang !== undefined) {
    delete bodyToSend.lang;
  }
  // Normalize the `language` field: if the caller passed a non-empty lang
  // that is not in ARTICLES_SUPPORTED_LANGUAGES, fall back to "en". An
  // empty string is preserved (explicit "all languages"), and an undefined
  // `language` is left to the backend default (the caller didn't ask for
  // any specific language filtering).
  if (
    bodyToSend.language !== undefined &&
    bodyToSend.language !== "" &&
    !ARTICLES_SUPPORTED_LANGUAGES.has(bodyToSend.language)
  ) {
    bodyToSend.language = "en";
  }
  // Default `source` to "Binance Academy" when the caller did not
  // specify one. An explicit empty string ("") is preserved — it
  // means "all sources".
  if (bodyToSend.source === undefined || bodyToSend.source === null) {
    bodyToSend.source = ARTICLES_DEFAULT_SOURCE;
  }
  // Default `docCount` to 1 when the caller did not specify one.
  // The backend default is 10, but article bodies are long-form and
  // the LLM distills them — 1 is the right default for chat cards.
  if (bodyToSend.docCount === undefined || bodyToSend.docCount === null) {
    bodyToSend.docCount = ARTICLES_DEFAULT_DOC_COUNT;
  }
  // Default `queryType` to "vector" when the caller did not specify
  // one. Semantic search handles natural-language queries better than
  // keyword matching (fts). Callers can pass `queryType: "fts"` for
  // exact keyword matching (ticker symbols, exact titles).
  if (bodyToSend.queryType === undefined || bodyToSend.queryType === null || bodyToSend.queryType === "") {
    bodyToSend.queryType = ARTICLES_DEFAULT_QUERY_TYPE;
  }
  const data = await callApi(env, "searchArticles", bodyToSend);
  const items = data?.items ?? [];
  // Resolve canonical visit URLs via the public Academy search v2 API.
  // Replaces each item's `visitUrl` with
  // `{publicDomain}/{language}/academy/articles/{slug}` when the v2
  // search returns a matching slug for the item's `title`. Falls back
  // to the original `visitUrl` on any failure (network error, 0 hits,
  // missing slug). The `language` used for the v2 search and the URL
  // path is the post-fallback value (the one actually sent to
  // `searchArticles`).
  const lang = bodyToSend.language || "en";
  await resolveArticleUrls(env, items, lang);
  // Strip internal/unused fields (e.g. `sourceTable`, SEO metadata,
  // catalog info, timestamps, engagement metrics) before returning
  // to the caller. See `ARTICLE_ITEM_WHITELIST` for the kept fields.
  for (const item of items) shapeArticleItem(item);
  return items;
}

// --- Public Academy search v2 — canonical article URL resolution -------------

/**
 * Default query parameters for the public Academy search v2 API
 * (`/bapi/composite/v2/public/pgc/content/academy/search`). Used by
 * `resolveArticleUrls` to look up the canonical slug for each article
 * returned by `searchArticles`. The URL is then built as
 * `{publicDomain}/{lang}/academy/articles/{slug}`.
 *
 * These defaults match the contract specified for the Academy Skill:
 *   - `maxRead`: 1000 (filter to articles with up to 1000 seconds reading time)
 *   - `minRead`: 0 (no minimum)
 *   - `with`: "articles" (only return article hits, not glossary/course hits)
 *   - `page`: 0 (first page, 0-indexed)
 *   - `size`: 1 (return at most 1 article per call — we only need the top hit's slug)
 */
const ACADEMY_SEARCH_V2_PATH = "/v2/public/pgc/content/academy/search";
const ACADEMY_SEARCH_V2_DEFAULTS = {
  maxRead: 1000,
  minRead: 0,
  with: "articles",
  page: 0,
  size: 1,
};

/**
 * Core GET helper. Used by `resolveArticleUrls` to call the public
 * Academy search v2 API (a GET endpoint on a different bapi path
 * `/bapi/composite/...`, not `/bapi/bigdata/...`).
 *
 * Sends the query string, enforces a timeout, and unwraps the standard
 * response envelope (same `{code, message, data, success}` shape as
 * the academy-skill endpoints).
 *
 * Unlike `callApi`, this function is fault-tolerant: on any error
 * (network, HTTP non-200, malformed JSON, backend `code !== "000000"`),
 * it returns `null` instead of throwing — the caller (`resolveArticleUrls`)
 * treats `null` as "no slug found" and falls back to the original
 * `visitUrl`. This is intentional: the URL resolution is best-effort
 * and must not break the main `searchArticles` flow when the v2
 * search API is unavailable.
 *
 * @param {string} env - Target environment.
 * @param {string} url - Full URL to GET.
 * @returns {Promise<any|null>} The parsed `data` field, or null on any error.
 */
async function callGetApiBestEffort(env, url) {
  const config = loadEnvConfig(env);
  const headers = { "Accept": "application/json" };
  return await new Promise((resolveP) => {
    const parsed = new URL(url);
    const isTls = parsed.protocol === "https:";
    const transport = isTls ? httpsRequest : httpRequest;
    const reqOptions = {
      method: "GET",
      hostname: parsed.hostname,
      port: parsed.port || (isTls ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers,
    };
    const timer = setTimeout(() => {
      req.destroy(new Error(`[academy-skill] GET timeout after ${config.timeoutMs}ms — url=${url}`));
    }, config.timeoutMs);
    const req = transport(reqOptions, (res) => {
      clearTimeout(timer);
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          resolveP(null);
          return;
        }
        try {
          const parsedBody = JSON.parse(text);
          if (parsedBody.code !== "000000") {
            resolveP(null);
            return;
          }
          resolveP(parsedBody.data);
        } catch {
          resolveP(null);
        }
      });
      res.on("error", () => resolveP(null));
    });
    req.on("error", () => resolveP(null));
    req.end();
  });
}

/**
 * Resolve canonical public URLs for a list of article items by calling
 * the public Academy search v2 API
 * (`{searchApiBaseUrl}/v2/public/pgc/content/academy/search`) for each
 * item's `title`.
 *
 * For each item:
 *   1. Build query string: `lang=<lang>&term=<title>&maxRead=1000&minRead=0&with=articles&page=0&size=1`
 *   2. GET the v2 search endpoint.
 *   3. Take `data.pages.data[0].slug` from the response.
 *   4. Build the canonical URL: `{publicDomain}/{lang}/academy/articles/{slug}`.
 *   5. Replace the item's `visitUrl` with the canonical URL.
 *
 * Fault tolerance: if any step fails (network error, HTTP non-200, 0
 * hits, missing slug), the item's original `visitUrl` is kept. The
 * URL resolution is best-effort and must not break the main
 * `searchArticles` flow.
 *
 * The calls are made in parallel (`Promise.all`) so the latency is
 * max(per-item) ≈ 200ms, not sum(per-item) ≈ N×200ms.
 *
 * @param {string} env - Target environment.
 * @param {Array<Object>} items - Article items returned by `searchArticles`. Each item's `visitUrl` may be replaced in-place.
 * @param {string} lang - The language code used for the `searchArticles` call (post-fallback). Used as the `lang` query param AND the URL path component.
 * @returns {Promise<void>} Resolves when all URL resolutions are done (or best-effort failed).
 */
async function resolveArticleUrls(env, items, lang) {
  if (!items || items.length === 0) return;
  const config = loadEnvConfig(env);

  const searchApiUrl = `${config.searchApiBaseUrl}${ACADEMY_SEARCH_V2_PATH}`;
  const publicDomain = config.publicDomain;

  // Fire all per-item v2 search calls in parallel. Each call resolves
  // to either a canonical URL (string) or null (when resolution
  // failed — fall back to the original visitUrl). Promise.allSettled
  // ensures one slow/failing call does not abort the others.
  //
  // Resolution order per item:
  //   1. Try the v2 search API with `term = item.title`. Take the slug
  //      from `data.pages.data[0].slug`.
  //   2. If the v2 search returns 0 hits OR a missing/empty slug, fall
  //      back to the item's `articlePath` field (the slug returned by
  //      `searchArticles` — usually correct but not always; the v2
  //      search is preferred when available because it is the public
  //      canonical Academy search).
  //      NOTE: in prod, `articlePath` is currently 0/44 populated,
  //      so this branch is effectively dead. It is retained as a
  //      defensive safety net — `resolveArticleUrls` runs BEFORE `shapeArticleItem` (which strips `articlePath`
  //      from the returned item per the whitelist), so this branch
  //      still reads the raw field if the backend ever starts
  //      populating it. Removing it would drop a 3-level fallback to
  //      2-level for a future backend change we can't predict.
  //   3. If neither gives a slug, leave the original `visitUrl` in place
  //      (and surface the original as `originalVisitUrl` for traceability).
  const resolutions = await Promise.allSettled(
    items.map(async (item) => {
      if (!item) return null;
      // Try the v2 search API first.
      if (item.title) {
        const params = new URLSearchParams({
          lang,
          term: item.title,
          ...ACADEMY_SEARCH_V2_DEFAULTS,
        });
        const url = `${searchApiUrl}?${params.toString()}`;
        const data = await callGetApiBestEffort(env, url);
        const v2Slug = data?.pages?.data?.[0]?.slug;
        if (v2Slug && typeof v2Slug === "string" && v2Slug.trim()) {
          return `${publicDomain}/${lang}/academy/articles/${v2Slug}`;
        }
      }
      // Fallback: use the `articlePath` (slug) returned by
      // `searchArticles`. This field is usually populated and
      // correct; the v2 search is preferred when it returns a hit
      // because it is the public canonical Academy search.
      if (item.articlePath && typeof item.articlePath === "string" && item.articlePath.trim()) {
        return `${publicDomain}/${lang}/academy/articles/${item.articlePath}`;
      }
      return null;
    }),
  );

  // Apply the resolved URLs to the items in-place. When a resolution
  // failed (rejected or resolved to null), keep the original visitUrl.
  for (let i = 0; i < items.length; i++) {
    const r = resolutions[i];
    if (r && r.status === "fulfilled" && typeof r.value === "string" && r.value) {
      items[i].originalVisitUrl = items[i].visitUrl;
      items[i].visitUrl = r.value;
    }
  }
}

// --- High-level orchestrator -------------------------------------------------

/**
 * Build a customized learning plan by chaining the 3 backend steps:
 *   1. searchResource(query, [TRACK, COURSE, MODULE]) → top hit (by relevance)
 *   2. If top hit is a Course/Module → resolveParentTrack(hitResourceId) → parent Track
 *      If top hit is already a Track → skip step 2, use hit.resourceId as trackId
 *   3. getTrackOutline(trackId, lang) → full Track → Course[] → Module[] tree
 *
 * Empty-hit cases return gracefully (no throw):
 *   - 0 searchResource hits → {topHit: null, parentTrack: null, outline: null}
 *   - 0 resolveParentTrack hits → {topHit: <hit>, parentTrack: null, outline: null}
 *   - empty outline courses → returned outline object with courses: []
 * Any other failure (network/HTTP/backend error) propagates to the caller.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body.
 * @param {string} body.query - Clean search term.
 * @param {string} [body.lang] - Language code (REQUIRED for step 3
 *   `getTrackOutline`; if omitted, step 3 returns HTTP 400).
 *   If not provided, step 1 and 2 work but step 3 fails.
 * @param {number} [body.limit] - Max searchResource hits to consider (top hit is taken).
 * @returns {Promise<{query: string, lang: string, topHit: Object|null, parentTrack: Object|null, outline: Object|null}>}
 * @throws {Error} If `body` is null/undefined, if `lang` is missing
 *   (required by `getTrackOutline`), or if any step fails.
 */
export async function getLearningPlan(env, body) {
  if (body == null) {
    throw new Error("[academy-skill] getLearningPlan: body is null or undefined");
  }
  const { query, lang, limit } = body;
  // lang is required for step 3 (getTrackOutline). Validate upfront to
  // avoid an opaque HTTP 400 from the backend after steps 1-2 succeed.
  if (!lang) {
    throw new Error("[academy-skill] getLearningPlan: 'lang' is required (getTrackOutline needs it). Pass e.g. lang='en' or lang='zh'.");
  }

  // Step 1: search across Tracks/Courses/Modules. Backend returns hits sorted
  // by relevance desc, so items[0] is the top hit.
  const resourceTypes = ["ACADEMY_TRACK", "ACADEMY_COURSE", "ACADEMY_MODULE"];
  const items = await searchResource(env, {
    query,
    lang,
    limit,
    resourceTypes,
  });

  if (!items || items.length === 0) {
    return { query, lang, topHit: null, parentTrack: null, outline: null };
  }

  const topHit = items[0];
  let parentTrack = null;
  let trackId;

  // Decision branch: a Track hit already gives us the trackId; a Course or
  // Module hit must be resolved up to its parent Track first.
  if (topHit.resourceType === "ACADEMY_TRACK") {
    trackId = topHit.resourceId;
  } else {
    // Step 2: resolve parent Track from the Course/Module hit.
    const parentItems = await resolveParentTrack(env, {
      hitResourceId: topHit.resourceId,
      lang,
    });
    if (!parentItems || parentItems.length === 0) {
      // No parent Track found — fall back to the hit's pageUrl.
      return { query, lang, topHit, parentTrack: null, outline: null };
    }
    parentTrack = parentItems[0];
    trackId = parentTrack.resourceId;
  }

  // Step 3: expand the Track into its Course → Module tree.
  const outline = await getTrackOutline(env, {
    trackId,
    lang,
  });

  return { query, lang, topHit, parentTrack, outline };
}

// --- High-level concurrent search across all content types -------------------

/**
 * Concurrently call searchGlossary, searchLearnEarn, searchResource, and
 * searchArticles with the same query, then pick the best result set by
 * match tier + relevance.
 *
 * This is the RECOMMENDED entry point for Intent 1 (Knowledge Q&A) and
 * Intent 2 (Risk Education) when the user's question might be answered by
 * any of the four content types. Running them in parallel cuts latency
 * from sum(glossary + learnEarn + resource + articles) ≈ 2.8s to
 * max(≈ 1s).
 *
 * **No cross-language fallback for glossary / learnEarn / resource.**
 * These three endpoints run strictly in the requested `lang`. If no
 * hits are returned, they contribute nothing to `best` and the caller
 * decides the next step (retry with a different `lang` explicitly, or
 * surface a no-content card). The skill MUST NOT silently swap
 * languages for these endpoints — that would mismatch the user's
 * intent.
 *
 * **Articles-only auto-fallback to `en`.** The `searchArticles`
 * endpoint accepts a smaller set of language codes (see
 * `ARTICLES_SUPPORTED_LANGUAGES`) — notably NO `zh`, `zt`, or `ja`.
 * When the requested `lang` is not in that list, `searchAll`
 * silently uses `language: "en"` for the articles call only, so the
 * user still gets article results. The response exposes
 * `articlesLangUsed` and `articlesLangFallback` so the LLM knows to
 * translate the returned English articles back to the user's language
 * when formatting the card. The other 3 endpoints are unaffected.
 *
 * Ranking logic (see `pickBestSource` / `bubbleTopByMatchTier`):
 *   - Within each endpoint, bubble the highest match-tier (then
 *     highest-relevance) item to index 0.
 *   - Cross-endpoint, pick the endpoint whose top item has the highest
 *     tier. Within the same tier, prefer Glossary > L&E > Resource >
 *     Articles (definitional sources first); within the same tier +
 *     source, higher `relevance` wins.
 *
 * Each sub-call is independently fault-tolerant: if one endpoint fails
 * (network error, HTTP non-200, backend error), the others still
 * resolve and `pickBestSource` ignores the failed one. If ALL four
 * fail, `searchAll` throws an Error listing all failures.
 *
 * @param {string} env - Target environment.
 * @param {Object} body - Request body (shared across all 4 calls).
 * @param {string} body.query - Search term (raw user input or keyword).
 * @param {string} [body.lang] - Language code. The query is run strictly
 *   against this language for glossary / learnEarn / resource — if no
 *   hits are returned for the requested `lang`, those endpoints
 *   contribute nothing to `best` and the caller decides the fallback
 *   (e.g., retry with a different `lang` explicitly, or surface a
 *   no-content card). For articles, the language is normalized via
 *   `getArticlesLang`: if `lang` is not in
 *   `ARTICLES_SUPPORTED_LANGUAGES`, the articles call uses `language:
 *   "en"` (auto-fallback) and the LLM must translate the results back
 *   to the user's language. `searchAll` does NOT auto-fallback to
 *   English for the other 3 endpoints.
 * @param {number} [body.limit] - Max results per endpoint (1-10).
 * @returns {Promise<{
 *   query: string,
 *   lang: string,
 *   glossary: Array<Object>,
 *   learnEarn: Array<Object>,
 *   resource: Array<Object>,
 *   articles: Array<Object>,
 *   best: {
 *     source: "glossary"|"learnEarn"|"resource"|"articles"|null,
 *     items: Array<Object>,
 *     reason: string,
 *     lang: string,
 *     matchTier: number
 *   },
 *   errors: { glossary?: string, learnEarn?: string, resource?: string, articles?: string },
 *   articlesLangUsed: string,
 *   articlesLangFallback: boolean,
 *   articlesSourceUsed: string,
 *   articlesDocCountUsed: number,
 *   articlesQueryTypeUsed: string
 * }>}
 */
export async function searchAll(env, body) {
  if (body == null) {
    throw new Error("[academy-skill] searchAll: body is null or undefined");
  }
  const { query, lang, limit } = body;

  const sharedBody = { query, lang, limit };
  const resourceBody = {
    ...sharedBody,
    resourceTypes: ["ACADEMY_TRACK", "ACADEMY_COURSE", "ACADEMY_MODULE"],
  };
  // Articles endpoint uses a different schema: `language` (not `lang`),
  // `docCount` (not `limit`), and supports `queryType` (vector/fts).
  // Map the shared body fields to the articles-specific schema.
  //
  // **Language auto-fallback (articles-only):** The articles endpoint
  // accepts a smaller set of language codes than the academy-series
  // endpoints (notably: NO `zh`, `zt`, `ja`). When the user's `lang` is
  // not in `ARTICLES_SUPPORTED_LANGUAGES`, the script silently uses
  // `language: "en"` so the user still gets article results. The LLM
  // is responsible for translating the returned English articles back
  // to the user's language when formatting the card. The other 3
  // endpoints keep the strict no-cross-language-fallback behavior.
  // The response exposes `articlesLangUsed` and `articlesLangFallback`
  // so the LLM knows whether to translate the articles block.
  const articlesLangUsed = getArticlesLang(lang);
  // `articlesLangFallback` is true ONLY when the user EXPLICITLY requested
  // a non-empty `lang` that the articles endpoint does not support (so the
  // script fell back to "en" and the LLM must translate the English
  // articles back to the user's language). When `lang` is undefined / null
  // / empty (the caller did not ask for any specific language), there is
  // no "user language" to translate back to, so the flag MUST be false —
  // otherwise the LLM would (per SKILL.md) try to translate English
  // articles into a language the user never specified. The prior
  // expression `articlesLangUsed !== (lang ?? "")` mis-reported true when
  // lang was undefined (articlesLangUsed="en" !== "" → true).
  const articlesLangFallback =
    lang != null && lang !== "" && articlesLangUsed !== lang;
  // Articles endpoint uses a different schema: `language` (not `lang`),
  // `docCount` (not `limit`), `source` (not in the shared body).
  //
  // **Source default:** "Binance Academy" — the Academy Skill is an
  // educational content skill; Academy articles are the primary
  // content. `searchAll` does not expose a `source` override (the
  // shared `{query, lang, limit}` schema has no room for it); callers
  // who need a different source should call `searchArticles` directly.
  //
  // **Doc count default:** `limit || 1` — when the caller passes a
  // `limit`, articles get the same count as the other 3 endpoints
  // (so `limit=3` returns 3 articles alongside 3 glossary / 3 L&E /
  // 3 resource hits). When no `limit` is passed, articles default to
  // 1 (not 5 as before) because article bodies are long-form and
  // the LLM distills them — 1 is the right default for chat cards.
  const articlesDocCountUsed = limit || ARTICLES_DEFAULT_DOC_COUNT;
  const articlesQueryTypeUsed = ARTICLES_DEFAULT_QUERY_TYPE;
  const articleBody = {
    query,
    language: articlesLangUsed,
    source: ARTICLES_DEFAULT_SOURCE,
    docCount: articlesDocCountUsed,
    queryType: articlesQueryTypeUsed,
  };

  // Parallel calls. Glossary/LearnEarn/Resource run strictly in the
  // requested `lang` — no cross-language fallback (the skill MUST NOT
  // silently swap languages for these endpoints, that would mismatch
  // the user's intent). Articles is the only endpoint that falls back
  // to "en" when the requested `lang` is unsupported, because the
  // articles endpoint's language coverage is narrower and English is
  // always available; the LLM translates the results back to the
  // user's language when formatting the card.
  const results = await runAllFour(env, sharedBody, resourceBody, articleBody);
  const best = pickBestSource(query, results.glossary, results.learnEarn, results.resource, results.articles);
  best.lang = lang || "";

  // Strip the internal `_source` stamp (set by `runAllFour`) from all
  // items before returning so it doesn't leak to the caller. The stamp is
  // only needed by `getMatchTier` (via `pickBestSource`/`bubbleTopByMatchTier`,
  // called above). We delete it in-place on the same arrays we return.
  const stripSourceStamp = (arr) => { for (const it of arr) delete it._source; };
  stripSourceStamp(results.glossary);
  stripSourceStamp(results.learnEarn);
  stripSourceStamp(results.resource);
  stripSourceStamp(results.articles);
  if (best.items) stripSourceStamp(best.items);

  return {
    query,
    lang,
    glossary: results.glossary,
    learnEarn: results.learnEarn,
    resource: results.resource,
    articles: results.articles,
    best,
    errors: results.errors,
    articlesLangUsed,
    articlesLangFallback,
    articlesSourceUsed: ARTICLES_DEFAULT_SOURCE,
    articlesDocCountUsed,
    articlesQueryTypeUsed,
  };
}

/**
 * Run the 4 endpoints in parallel and return their (ok|error) results.
 * Used internally by `searchAll` to keep the parallel dispatch logic in
 * one place.
 *
 * @returns {Promise<{
 *   glossary: Array<Object>,
 *   learnEarn: Array<Object>,
 *   resource: Array<Object>,
 *   articles: Array<Object>,
 *   errors: { glossary?: string, learnEarn?: string, resource?: string, articles?: string }
 * }>}
 */
async function runAllFour(env, sharedBody, resourceBody, articleBody) {
  const [glossaryRes, learnEarnRes, resourceRes, articlesRes] = await Promise.all([
    searchGlossary(env, sharedBody).then(
      (items) => ({ ok: true, items }),
      (err) => ({ ok: false, error: err.message }),
    ),
    searchLearnEarn(env, sharedBody).then(
      (items) => ({ ok: true, items }),
      (err) => ({ ok: false, error: err.message }),
    ),
    searchResource(env, resourceBody).then(
      (items) => ({ ok: true, items }),
      (err) => ({ ok: false, error: err.message }),
    ),
    searchArticles(env, articleBody).then(
      (items) => ({ ok: true, items }),
      (err) => ({ ok: false, error: err.message }),
    ),
  ]);

  const glossary = glossaryRes.ok ? glossaryRes.items : [];
  const learnEarn = learnEarnRes.ok ? learnEarnRes.items : [];
  const resource = resourceRes.ok ? resourceRes.items : [];
  const articles = articlesRes.ok ? articlesRes.items : [];

  // Stamp each item with its source so `getMatchTier` can reliably
  // distinguish article items from structured-source items. The prior
  // detection (`"similarity" in item`) relied on the backend always
  // returning the `similarity` field on article items — fragile, since
  // a malformed article without `similarity` would be wrongly demoted by
  // the tier-2 superset guard (articles are supposed to be exempt). The
  // `_source` stamp is set by the dispatcher (here) and read by
  // `getMatchTier`; it does not leak to the caller because `shapeArticleItem`
  // (called on articles inside `searchArticles`, BEFORE this stamping) and
  // the structured sources don't have a whitelist stripper that would
  // keep it — so we ALSO strip `_source` from all items before returning
  // (see the cleanup loop below). The stamp is internal to `searchAll`.
  for (const it of glossary) it._source = "glossary";
  for (const it of learnEarn) it._source = "learnEarn";
  for (const it of resource) it._source = "resource";
  for (const it of articles) it._source = "articles";

  const errors = {};
  if (!glossaryRes.ok) errors.glossary = glossaryRes.error;
  if (!learnEarnRes.ok) errors.learnEarn = learnEarnRes.error;
  if (!resourceRes.ok) errors.resource = resourceRes.error;
  if (!articlesRes.ok) errors.articles = articlesRes.error;

  // If all four failed, throw so the caller knows nothing succeeded.
  if (!glossaryRes.ok && !learnEarnRes.ok && !resourceRes.ok && !articlesRes.ok) {
    throw new Error(
      `[academy-skill] All 4 endpoints failed in searchAll — env=${env} query=${JSON.stringify(sharedBody.query)} errors=${JSON.stringify(errors)}`,
    );
  }

  return { glossary, learnEarn, resource, articles, errors };
}

/**
 * Normalize a string for title/slug token matching:
 *   - lowercase
 *   - turn hyphens / underscores / periods into spaces (URL slugs use them
 *     as word separators, e.g. `introduction-to-blockchain-technology`)
 *   - keep Unicode letters/numbers and whitespace; drop punctuation
 *   - collapse and trim whitespace
 *
 * The `\p{L}` / `\p{N}` Unicode property escapes preserve CJK characters
 * (so non-ASCII letters survive normalization intact). Requires the `u` flag.
 *
 * @param {string|undefined|null} s
 * @returns {string}
 */
function normalizeForMatch(s) {
  if (s == null) return "";
  return String(s)
    .toLowerCase()
    .replace(/[-_.]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip parenthetical content (synonyms / abbreviations / tickers) from a
 * raw string BEFORE `normalizeForMatch` runs. Academy titles commonly
 * append a parenthetical synonym or ticker — e.g. "Proof of Work (PoW)",
 * "Understanding Turtle (TURTLE)" — and that parenthetical is a *marker*
 * for the same concept, not a new concept token. Stripping it before
 * normalization lets the coverage guard (see `strongSubstringMatch`) treat
 * "Proof of Work (PoW)" as "Proof of Work" when comparing against
 * q="proof of work", so the synonym "(PoW)" does not count as an "extra"
 * token that would fail the guard.
 *
 * Only the parentheses themselves and their content are removed; the
 * surrounding text is preserved. Non-parenthetical punctuation is left
 * alone (it is normalized to spaces by `normalizeForMatch` afterwards).
 */
function stripParens(s) {
  if (s == null) return "";
  return String(s).replace(/\([^()]*\)/g, " ");
}

/**
 * Extract the content of parenthetical groups from a raw title and
 * normalize each group as a token string. Academy titles commonly
 * append a parenthetical abbreviation or synonym — e.g. "Proof of Work
 * (PoW)", "Understanding Turtle (TURTLE)", "Decentralized Autonomous
 * Organization (DAO)" — where the parenthetical is a SYNONYM for the
 * main title concept, not a different concept.
 *
 * `stripParens` removes these parentheticals from the main matching
 * surface (so they don't count as extra concept nouns in the superset
 * guard). But this also removes the abbreviation from the matching
 * surface — so an abbreviation-only query like q="pow" can no longer
 * match its canonical entry "Proof of Work (PoW)" (the title after
 * stripParens is "proof of work", which doesn't contain "pow").
 *
 * This helper extracts those parenthetical tokens so `getMatchTier` can
 * separately check them at tier 3 — a single-token query that matches a
 * parenthetical abbreviation IS the canonical match (the parenthetical
 * is always a synonym of the title's main concept), so tier 3 is the
 * correct level. This restores the abbreviation queries (dao, pow, pos,
 * dapp, ieo) that `stripParens` accidentally regressed.
 *
 * @param {string} s - Raw title (before normalizeForMatch).
 * @returns {string[]} Array of normalized parenthetical content strings.
 *   e.g. "Proof of Work (PoW)" → ["pow"]; "Turtle (TURTLE) (v2)" → ["turtle","v2"].
 */
function extractParenTokens(s) {
  if (s == null) return [];
  const tokens = [];
  const re = /\(([^()]*?)\)/g;
  let m;
  while ((m = re.exec(String(s))) !== null) {
    const normalized = normalizeForMatch(m[1]);
    if (normalized) tokens.push(normalized);
  }
  return tokens;
}

/**
 * Generic modifier tokens that Academy authors commonly prepend/append to
 * a title without changing its core concept — e.g. "Understanding Turtle",
 * "Introduction to Blockchain Technology", "Gas Fees Explained". When the
 * coverage guard (see `strongSubstringMatch`) checks whether a longer
 * title's extra tokens (beyond the query) are "concept-changing", these
 * modifiers are allowed: they signal educational framing, not a different
 * topic.
 *
 * This is deliberately a closed set of high-frequency framing words. It
 * does NOT include nouns that could be concepts (e.g. "wallet", "address",
 * "maximalists", "ethereum") — those change the title's meaning and must
 * fail the guard so that e.g. q="bitcoin" does NOT tier-3-match
 * "Bitcoin Maximalists".
 */
const GENERIC_MODIFIERS = new Set([
  // Articles / prepositions / conjunctions / question words
  "a", "an", "the", "of", "to", "in", "on", "and", "or", "for", "with",
  "vs", "versus", "into", "through",
  "what", "is", "are", "was", "were", "how", "does", "do", "why",
  "when", "where", "which",
  // Generic educational-title framing words (prefixes / suffixes)
  "understanding", "introduction", "intro", "guide", "overview", "primer",
  "basics", "basic", "explained", "explain", "definitive", "comprehensive",
  "complete", "essential", "essentials", "ultimate", "everything",
  "learn", "learning", "know", "need", "about", "you", "your",
  "beginner", "beginners", "intermediate", "advanced", "101",
  // Common CJK framing prefixes that Academy appends before an English
  // project name in Learn & Earn titles (e.g. "一文读懂 Turtle (TURTLE)",
  // "带你了解 Solv Protocol"). These are space-separated from the
  // English name, so they tokenize as standalone CJK tokens and are
  // pure framing — not concept nouns. Whitelisting them keeps zh L&E
  // titles at tier 3 instead of wrongly demoting them to tier 1.
  "一文读懂", "带你了解", "带你玩转", "全面了解", "深度解读", "详解", "入门",
]);

/**
 * Whether every token in `candidate` is either a query token or a generic
 * modifier. Used by `strongSubstringMatch` to guard the "candidate is a
 * superset of q" direction: when a longer title merely contains the query,
 * the title is only a STRONG (tier-3) match if its extra tokens do not add a
 * new concept. "Bitcoin Maximalists" adds "Maximalists" (a concept) → fails;
 * "Understanding Turtle" adds "Understanding" (framing) → passes.
 *
 * @param {string[]} qTokens - Tokens of the normalized query.
 * @param {string} candidate - Normalized title/slug to check.
 * @returns {boolean}
 */
function extrasAreGeneric(qTokens, candidate) {
  const qSet = new Set(qTokens);
  for (const t of candidate.split(/\s+/).filter(Boolean)) {
    if (qSet.has(t)) continue;
    if (GENERIC_MODIFIERS.has(t)) continue;
    return false;
  }
  return true;
}

/**
 * The REVERSE companion to `extrasAreGeneric`: whether every token in `q`
 * is either already in `candidate` or a generic modifier. Used by
 * `strongSubstringMatch` to guard the "candidate is a SUBSET of q"
 * direction (`q.includes(candidate)`): when a shorter title names a
 * broader/parent concept the user's query refines, the title is only a
 * STRONG (tier-3) match if the user's EXTRA words beyond the title are
 * generic (question words / framing), not concept-changing modifiers.
 *
 * "hot wallet" (q) vs "wallet" (candidate): q's extra "hot" is a concept
 * modifier → fails (so "Wallet" glossary does NOT tier-3-match "hot
 * wallet"). "what is bitcoin" (q) vs "bitcoin" (candidate): q's extras
 * "what"/"is" are generic → passes (so "Bitcoin" glossary DOES tier-3-match
 * the question "what is bitcoin").
 *
 * @param {string[]} qTokens - Tokens of the normalized query.
 * @param {string} candidate - Normalized title/slug (a subset of q) to check against.
 * @returns {boolean}
 */
function qExtrasAreGeneric(qTokens, candidate) {
  const candSet = new Set(candidate.split(/\s+/).filter(Boolean));
  for (const t of qTokens) {
    if (candSet.has(t)) continue;
    if (GENERIC_MODIFIERS.has(t)) continue;
    return false;
  }
  return true;
}

/**
 * Whether `title` is a true superset of `qTokens` that adds at least one
 * non-generic concept noun. Used by `getMatchTier` to demote tier-2
 * matches on structured sources (glossary / learnEarn / resource) where
 * the title names a MORE SPECIFIC concept than the query — e.g.
 * q="smart contract" -> "Smart Contract Wallet" adds "Wallet" (a
 * concept noun), so the glossary entry is about a *wallet*, not about
 * smart contracts in general. The item should not win at tier 2.
 *
 * A title token counts as a "non-generic extra" when it is NOT one of the
 * query tokens (exact match) AND NOT a generic modifier. Token-variant
 * substrings (e.g. query "fee" vs title "fees") are treated as extras
 * here — this is conservative (the variant might be the same concept
 * inflected), but it errs toward demoting a likely off-topic glossary
 * entry, which the LLM can recover from with a retry.
 *
 * @param {string[]} qTokens - Tokens of the normalized query.
 * @param {string} title - Normalized title to check.
 * @returns {boolean} `true` if the title adds ≥1 non-generic concept noun.
 */
function titleAddsConceptNoun(qTokens, title) {
  const qSet = new Set(qTokens);
  for (const t of title.split(/\s+/).filter(Boolean)) {
    if (qSet.has(t)) continue;
    if (GENERIC_MODIFIERS.has(t)) continue;
    return true;
  }
  return false;
}

/**
 * Whether a normalized title is a COMPARISON or ENUMERATION that lists the
 * query as one of several sibling concepts. Used by `getMatchTier`'s tier-2
 * superset demotion to EXEMPT titles like "ERC Token Standards: ERC-20,
 * ERC-721, ERC-1155" (q="erc 721" is one of three siblings) or
 * "2.2 Wallets: Hot vs. Cold Storage" (q="hot storage" is one of two
 * siblings compared with "vs"). Such titles ARE about the query (alongside
 * its siblings) — the demotion would over-fire and lose an on-topic
 * structured result.
 *
 * Detection (on the normalized title, where punctuation has become spaces
 * and "vs"/"and"/"or" survive as tokens):
 *   1. EXPLICIT COMPARISON: title contains the token "vs" (Academy uses
 *      "Hot vs. Cold Storage", "Proof of Work vs Proof of Stake", "Layer 1
 *      vs. Layer 2"). The query tokens must all appear in the title (the
 *      caller already guarantees this via the tier-2 every-token check).
 *   2. SIBLING ENUMERATION: title contains a repeated prefix pattern —
 *      e.g. "erc 20 erc 721 erc 1155" has three "erc <n>" groups. The query
 *      tokens must form one of those groups (e.g. q="erc 721" → tokens
 *      ["erc","721"], both appear consecutively in the title as one of the
 *      "erc <n>" siblings). This catches "ERC Token Standards: ERC-20,
 *      ERC-721, ERC-1155" without matching e.g. "Smart Contract Wallet"
 *      (no repeated prefix; "wallet" is a single different concept).
 *
 * We deliberately do NOT trigger on bare "and"/"or" without a repeated
 * prefix — "Smart Contract Wallet and DeFi" would wrongly pass. The
 * repeated-prefix signal is what distinguishes a sibling enumeration
 * ("erc 20, erc 721, erc 1155") from a conjunction of different concepts
 * ("smart contract and defi").
 *
 * @param {string[]} qTokens - Tokens of the normalized query.
 * @param {string} title - Normalized title to check.
 * @returns {boolean} `true` if the title is a comparison/enumeration
 *   listing the query as a sibling.
 */
function titleIsComparisonOrEnumeration(qTokens, title) {
  const tokens = title.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  // 1. Explicit "vs" comparison. Academy comparison titles use "vs" as a
  // standalone token (verified: "Hot vs. Cold Storage" normalizes to
  // "... hot vs cold storage"; "Layer 1 vs. Layer 2" -> "layer 1 vs layer
  // 2"). The query must be one of the compared sides — guaranteed by the
  // caller's tier-2 every-token-in-title precondition.
  if (tokens.includes("vs")) {
    return true;
  }

  // 2. Sibling enumeration via repeated prefix. Find prefix tokens that
  // repeat ≥ 3 times in the title (e.g. "erc" in "erc 20 erc 721 erc 1155"
  // repeats 4× — once for "ERC Token Standards", then for each sibling).
  // Then check if the query tokens form one of the [prefix, suffix] sibling
  // pairs — i.e. the query is a 2-token run whose first OR last token is a
  // repeated prefix and the other is a sibling suffix. This catches
  // "ERC Token Standards: ERC-20, ERC-721, ERC-1155" (q="erc 721" ->
  // tokens ["erc","721"], "erc" is the repeated prefix) without matching
  // e.g. "Smart Contract Wallet" (no repeated prefix; "wallet" is a
  // single different concept).
  const prefixCounts = new Map();
  for (const t of tokens) {
    prefixCounts.set(t, (prefixCounts.get(t) || 0) + 1);
  }
  const repeatedPrefixes = new Set();
  for (const [t, c] of prefixCounts) {
    if (c >= 3) repeatedPrefixes.add(t);
  }
  if (repeatedPrefixes.size === 0 || qTokens.length === 0) return false;

  // The query is a sibling if it is a 2-token run where the first or last
  // token is a repeated prefix (the other token is the sibling suffix).
  // E.g. q=["erc","721"]: "erc" is a repeated prefix → sibling match.
  if (qTokens.length === 2) {
    if (repeatedPrefixes.has(qTokens[0]) || repeatedPrefixes.has(qTokens[1])) {
      return true;
    }
  }
  return false;
}

/**
 * Tier-3 substring match with a coverage guard against high-confidence
 * false positives.
 *
 * The bare `title.includes(q) || q.includes(title)` rule produced false
 * positives where a SHORT query (e.g. "bitcoin") matched any LONGER title
 * that merely contained it (e.g. "Bitcoin Maximalists", "Smart Contract
 * Wallet", "BTC Wallet Address") — and tier-3 means "format the card, do
 * not fall back", so the wrong answer was presented with max confidence.
 *
 * The guard:
 *   - `candidate.includes(q)` (candidate is a SUPERSET of q): require
 *     `extrasAreGeneric` — every extra token in the candidate (beyond q)
 *     must be a generic modifier, not a concept noun. This rejects
 *     "Bitcoin Maximalists" (extra "Maximalists") while accepting
 *     "Understanding Turtle" (extra "Understanding") and
 *     "Proof of Work" (no extras, after paren-stripping "(PoW)").
 *   - `q.includes(candidate)` (candidate is a SUBSET of q): the candidate
 *     names a broader/parent concept the user's query refines. Require
 *     `qExtrasAreGeneric` — every extra token in q (beyond the candidate)
 *     must be a generic modifier, not a concept-changing word. This
 *     rejects "wallet" as a tier-3 match for "hot wallet" (q's extra
 *     "hot" is a concept modifier) and "fork" for "hard fork" / "soft
 *     fork" (q's extra "hard"/"soft" are concept modifiers — and the two
 *     are SEMANTIC OPPOSITES, so letting both tier-3-match the same "Fork"
 *     entry silently merges them). It accepts "bitcoin" as a tier-3 match
 *     for "what is bitcoin" (q's extras "what"/"is" are generic question
 *     words). The reverse check is essential — checking candidate's
 *     extras (the original `extrasAreGeneric`) would be a no-op here
 *     because candidate's tokens are necessarily all in q when
 *     candidate ⊂ q. A minimum length (>= 3) avoids trivial 1-2 char
 *     matches.
 *
 * @param {string} q - Normalized query.
 * @param {string[]} qTokens - Tokens of the normalized query.
 * @param {string} candidate - Normalized title or slug to check.
 * @returns {boolean} `true` if this candidate is a tier-3 strong match.
 */
function strongSubstringMatch(q, qTokens, candidate) {
  if (!candidate) return false;
  if (candidate.includes(q)) {
    // candidate is a SUPERSET of q (longer title contains the query):
    // require candidate's extra tokens (beyond q) to be generic.
    return extrasAreGeneric(qTokens, candidate);
  }
  if (q.includes(candidate) && candidate.length >= 3) {
    // candidate is a SUBSET of q (shorter title is contained in the
    // query): require q's extra tokens (beyond the candidate) to be
    // generic. The reverse check (`qExtrasAreGeneric`) is essential —
    // `extrasAreGeneric(qTokens, candidate)` would be a no-op here
    // (candidate's tokens are necessarily all in q when candidate ⊂ q,
    // so it would always return true).
    return qExtrasAreGeneric(qTokens, candidate);
  }
  return false;
}

/**
 * Compute a 0–3 "match tier" describing how strongly an item's title
 * (or URL slug / resourceKey) matches the user's query.
 *
 *   Tier 3 (STRONG): substring match in either direction, with a coverage
 *                    guard against high-confidence false positives.
 *                    The bare substring rule let a short query (e.g.
 *                    "bitcoin") tier-3-match any longer title that merely
 *                    contained it (e.g. "Bitcoin Maximalists"). Now a
 *                    longer title is a tier-3 match only if its extra
 *                    tokens (beyond the query) are generic modifiers
 *                    (Understanding / Introduction / of / to / ...),
 *                    not concept nouns (Maximalists / Wallet / Address).
 *                    Parenthetical synonyms like "(PoW)" / "(TURTLE)" are
 *                    stripped before the check.
 *                    Examples:
 *                      q="proof of work", title="Proof of Work (PoW)" → match
 *                        (paren "(PoW)" stripped; no extra concept tokens)
 *                      q="blockchain technology", slug="introduction-to-blockchain-technology"
 *                        → match (extras "introduction"/"to" are generic)
 *                      q="Turtle", title="Understanding Turtle (TURTLE)" → match
 *                        (paren stripped; extra "understanding" is generic)
 *                      q="bitcoin", title="Bitcoin Maximalists" → NO match
 *                        (extra "maximalists" is a concept noun)
 *
 *   Tier 2 (MEDIUM): every whitespace-separated query token appears
 *                    (as a substring) in the normalized title OR slug.
 *                    Useful when query word order differs from title
 *                    but all concepts are present.
 *                    Example: q="51 attack", title="51% Attack"
 *                      → normalized "51 attack" tokens ["51","attack"]
 *                        both in "51 attack" → match
 *                    For structured sources (glossary / learnEarn /
 *                    resource), a TRUE-SUPERSET demotion fires when the
 *                    candidate adds a non-generic concept noun beyond
 *                    the query (e.g. q="smart contract" -> "Smart
 *                    Contract Wallet" adds "Wallet") — the item falls
 *                    through to tier 1 so the LLM retries. Articles are
 *                    exempt (long-form titles legitimately add context
 *                    nouns, e.g. "How Do Gas Fees Work on Ethereum?").
 *
 *   Tier 1 (WEAK):   at least one query token (length ≥ 3) appears in
 *                    the normalized title OR slug. The single-token
 *                    check is a weak signal — the entry mentions the
 *                    concept but isn't titled with it. The length-3
 *                    guard avoids matching on stop words like "of", "the".
 *
 *   Tier 0 (NONE):   no token overlap with title or slug. The hit
 *                    exists only because the backend's full-text index
 *                    matched the long `content` field — these are often
 *                    tangentially related and should lose to higher
 *                    tiers.
 *
 * Why title/slug and not excerpt/content:
 *   - `content` is long HTML that triggers high ts_rank scores for
 *     tangential mentions (e.g., query "blockchain technology" →
 *     glossary "Actively Validated Services (AVS)" with relevance 0.34
 *     even though AVS is about EigenLayer, not blockchain technology).
 *   - `excerpt` is short plain text but is often empty for Resource
 *     Modules (only `title` is populated).
 *   - `title` + `slug` are short, on-topic, and stable across
 *     languages (slugs are always English even for zh content).
 *
 * @param {string} query - The query string sent to the backend.
 * @param {Object} item - One hit item (glossary / learnEarn / resource / articles).
 *   Article items use `title` and `articlePath` (as slug equivalent).
 * @returns {number} 0, 1, 2, or 3.
 */
function getMatchTier(query, item) {
  const q = normalizeForMatch(query);
  if (!q) return 0;

  // Strip parenthetical content (synonyms/abbreviations/tickers) from the
  // raw title BEFORE normalization so e.g. "Proof of Work (PoW)" is treated
  // as "Proof of Work" — the "(PoW)" is a synonym marker, not an extra
  // concept token. (Slugs never contain parens, so they are not stripped.)
  const rawTitle = item.title || item.courseTitle || item.trackTitle || "";
  const title = normalizeForMatch(stripParens(rawTitle));
  // For articles, `articlePath` serves as the slug (URL path / slug).
  const slug = normalizeForMatch(
    item.slug || item.resourceKey || item.courseKey || item.moduleKey || item.articlePath || "",
  );

  const qTokens = q.split(/\s+/).filter(Boolean);

  // Tier 3 (STRONG): substring match with a coverage guard against
  // high-confidence false positives. The bare `title.includes(q) ||
  // q.includes(title)` rule let a short query (e.g. "bitcoin") match any
  // longer title that merely contained it (e.g. "Bitcoin Maximalists",
  // "Smart Contract Wallet", "BTC Wallet Address"), and tier-3 means
  // "format the card, do not fall back" — so the wrong answer was
  // presented with max confidence. `strongSubstringMatch` adds a
  // coverage guard: a longer title is a tier-3 match only if its extra
  // tokens (beyond the query) are generic modifiers (Understanding /
  // Introduction / of / to / ...) rather than concept-changing words
  // (Maximalists / Wallet / Address).
  if (title && strongSubstringMatch(q, qTokens, title)) return 3;
  if (slug && strongSubstringMatch(q, qTokens, slug)) return 3;

  // Tier 3 (parenthetical abbreviation): Academy titles commonly append
  // a parenthetical synonym/abbreviation — e.g. "Proof of Work (PoW)",
  // "Decentralized Autonomous Organization (DAO)", "Understanding Turtle
  // (TURTLE)". `stripParens` (above) removes these from `title` so they
  // don't count as extra concept nouns in the superset guard. But this
  // also removes the abbreviation from the matching surface — so a
  // single-token abbreviation query like q="pow" can no longer match
  // "Proof of Work (PoW)" (the stripped title "proof of work" doesn't
  // contain "pow"). This check restores that match at tier 3: a single-
  // token query that matches a parenthetical abbreviation IS the
  // canonical entry (the parenthetical is always a synonym, not a
  // different concept), so tier 3 is correct. Without this, dao/pow/pos/
  // dapp/ieo regress to tier 0 (canonical entry doesn't rank at all).
  if (qTokens.length === 1) {
    const parenTokens = extractParenTokens(rawTitle);
    for (const pt of parenTokens) {
      if (pt === q || pt.includes(q) || q.includes(pt)) return 3;
    }
  }

  // Tier 2: every query token appears in title or slug (as substring).
  // Only meaningful for multi-token queries (single-token already
  // handled by Tier 3 substring check).
  //
  // Superset demotion for structured sources: when a structured item
  // (glossary / learnEarn / resource — detected by the ABSENCE of the
  // articles-only `similarity` field) has a title or slug
  // that is a TRUE SUPERSET of q (every q token is present, AND the
  // candidate adds at least one non-generic concept noun beyond q), the
  // candidate is about a MORE SPECIFIC / different concept than the user
  // asked for. Demote it to tier 1 so the LLM retries instead of
  // formatting the wrong card at tier 2 (which the `>= 2 -> format the
  // card` threshold would otherwise accept without fallback).
  //
  // Example: q="smart contract" -> glossary title "Smart Contract Wallet"
  // AND slug "smart-contract-wallet" both add "Wallet" (a concept noun)
  // -> both demoted; falls through to tier 1. The slug check needs the
  // SAME guard — without it the slug would bypass the title demotion
  // and still return 2.
  //
  // Articles are EXEMPT (detected via `similarity` in item): article
  // titles are long-form and legitimately add context nouns — e.g.
  // q="gas fee" -> "How Do Gas Fees Work on Ethereum?" (extras "work" /
  // "ethereum" are concept nouns, but the article IS about gas fees).
  // Demoting articles would regress the most common good article
  // matches.
  if (qTokens.length > 1) {
    // Detect article items. Prefer the explicit `_source` stamp set by
    // `runAllFour` (reliable — set by the dispatcher regardless of which
    // fields the backend returned). Fall back to the `similarity` field
    // presence check (for direct callers of `getMatchTier` that didn't go
    // through `runAllFour`, or for items missing the stamp). The fallback
    // is the historical detection and is fragile (a malformed article
    // without `similarity` would be wrongly demoted), but it's the best
    // available without the stamp.
    const isArticle = item._source === "articles" || (!item._source && "similarity" in item);
    if (title && qTokens.every((t) => title.includes(t))) {
      // Articles are exempt (long-form titles legitimately add context).
      // Structured sources return 2 only when the title does NOT add a
      // non-generic concept noun beyond the query. Comparison /
      // enumeration titles ("Hot vs. Cold Storage", "ERC Token Standards:
      // ERC-20, ERC-721, ERC-1155") are also exempt — they list the query
      // as one of several sibling concepts, so they ARE about the query.
      if (
        isArticle ||
        !titleAddsConceptNoun(qTokens, title) ||
        titleIsComparisonOrEnumeration(qTokens, title)
      ) {
        return 2;
      }
    }
    if (slug && qTokens.every((t) => slug.includes(t))) {
      if (
        isArticle ||
        !titleAddsConceptNoun(qTokens, slug) ||
        titleIsComparisonOrEnumeration(qTokens, slug)
      ) {
        return 2;
      }
    }
  }

  // Tier 1: at least one query token (length >= 3) appears in title or slug.
  // The length guard avoids spurious matches on short stop-word tokens
  // like "of", "is", "the" (which would otherwise match many
  // titles).
  if (title && qTokens.some((t) => t.length >= 3 && title.includes(t))) return 1;
  if (slug && qTokens.some((t) => t.length >= 3 && slug.includes(t))) return 1;

  return 0;
}

/**
 * Pick the best result set among the 3 endpoints' responses.
 *
 * Two-stage ranking (verified 2026-08-04):
 *
 *   Stage A (within each endpoint): bubble the highest match-tier item
 *   to the front. Among same-tier items, the higher `relevance` wins.
 *   This ensures that when a glossary has 5 hits and the top-1 by
 *   relevance is off-topic (e.g., "Nakamoto Consensus" for query
 *   "proof of work") but a lower-relevance hit has an exact title
 *   match ("Proof of Work (PoW)"), the title-matched hit is bubbled
 *   to the front and becomes the endpoint's candidate.
 *
 *   Stage B (across endpoints): pick the endpoint whose candidate
 *   has the highest match-tier. Within the same tier, prefer higher
 *   `relevance`. Within the same tier AND same relevance, prefer
 *   Glossary > L&E > Resource (definitional sources first).
 *
 * Why match-tier beats raw relevance across endpoints:
 *   Academy's `ts_rank` is computed from the long `content` field
 *   (HTML body). Long entries that mention a concept extensively
 *   (e.g., "Nakamoto Consensus" for query "proof of work") score
 *   higher than the entry that IS the concept (e.g., "Proof of Work
 *   (PoW)" with shorter content). Using title/slug match as the
 *   primary signal restores the "the entry titled with the term IS
 *   the canonical answer" intuition from the original picker.
 *
 * Examples (verified, 2026-08-04):
 *   - q="blockchain technology" → glossary top "Actively Validated
 *     Services (AVS)" (rel 0.34, tier 0); resource top "Introduction
 *     to Blockchain Technology" (rel 0.16, tier 3 — slug contains
 *     "blockchain technology").
 *     Resource wins because tier 3 > tier 0, even though AVS had
 *     higher raw relevance. The user gets the Module that IS about
 *     blockchain technology, not the AVS glossary entry that merely
 *     mentions blockchain.
 *   - q="proof of work" → glossary has 5+ hits. Top by relevance is
 *     "Nakamoto Consensus" (rel 0.96, tier 0). Lower-relevance hit
 *     "Proof of Work (PoW)" (rel 0.87, tier 3) is bubbled to the
 *     front by Stage A. Stage B then sees glossary candidate "Proof
 *     of Work (PoW)" with tier 3 — wins over resource candidate
 *     "Blockchain consensus mechanisms: PoW and PoS" (tier 2 because
 *     title contains both "proof of work" tokens).
 *   - q="Turtle" → glossary has 0 hits (no entry for Turtle).
 *     L&E top "Understanding Turtle (TURTLE)" (tier 3). L&E wins.
 *   - q="proof of work" (exact term) → glossary top "Proof of Work"
 *     (tier 3). Glossary wins.
 *
 * The `reason` field in the response shows each endpoint's candidate,
 * its tier, and its relevance for traceability.
 *
 * @param {string} query - The query string (used for tier computation).
 * @param {Array<Object>} glossary
 * @param {Array<Object>} learnEarn
 * @param {Array<Object>} resource
 * @param {Array<Object>} [articles] - (optional) Article hits from searchArticles
 * @returns {{source: string|null, items: Array<Object>, reason: string, matchTier: number}}
 *   `matchTier` is the winner's tier (0–3) — the LLM uses this to
 *   decide if a fallback retry is needed (tier 0 = no title/slug overlap,
 *   strongly consider retrying with a clean keyword).
 */
function pickBestSource(query, glossary, learnEarn, resource, articles = []) {
  // Stage A: for each non-empty endpoint, bubble the highest-tier
  // (then highest-relevance) item to the front of its list.
  const candidates = [];
  if (glossary.length > 0) {
    const { top, items, relevance, matchTier } = bubbleTopByMatchTier(query, glossary);
    candidates.push({ source: "glossary", top, items, relevance, matchTier });
  }
  if (learnEarn.length > 0) {
    const { top, items, relevance, matchTier } = bubbleTopByMatchTier(query, learnEarn);
    candidates.push({ source: "learnEarn", top, items, relevance, matchTier });
  }
  if (resource.length > 0) {
    const { top, items, relevance, matchTier } = bubbleTopByMatchTier(query, resource);
    candidates.push({ source: "resource", top, items, relevance, matchTier });
  }
  if (articles.length > 0) {
    const { top, items, relevance, matchTier } = bubbleTopByMatchTier(query, articles);
    candidates.push({ source: "articles", top, items, relevance, matchTier });
  }

  // If all endpoints returned 0 hits, return null.
  if (candidates.length === 0) {
    return {
      source: null,
      items: [],
      reason: "All endpoints returned 0 hits",
      matchTier: -1,
    };
  }

  // Stage B: sort candidates by (matchTier DESC, source priority, relevance DESC).
  //
  // Source priority within the same tier (Glossary > L&E > Resource > Articles)
  // reflects the original picker's Rule 1: glossary entries are
  // definitional — the entry titled "Proof of Work (PoW)" IS the
  // canonical Academy content for the concept "Proof of Work", while a
  // Module like "Blockchain consensus mechanisms: PoW and PoS" covers
  // the concept as part of a broader learning path. Articles rank lowest
  // because they are longer-form and less focused for Q&A, but they
  // can win when no structured content (glossary/resource/L&E) matches.
  const sourcePriority = { glossary: 4, learnEarn: 3, resource: 2, articles: 1 };
  candidates.sort(
    (a, b) =>
      b.matchTier - a.matchTier ||
      sourcePriority[b.source] - sourcePriority[a.source] ||
      b.relevance - a.relevance,
  );

  const winner = candidates[0];
  const top = winner.top;
  const title =
    top.title || top.courseTitle || top.trackTitle || top.resourceKey || "?";

  // Build a short summary so the caller can see the tier+relevance of
  // each endpoint's candidate (useful for debugging / future tuning).
  const relevanceSummary = candidates
    .map((c) => {
      const cTitle =
        c.top.title || c.top.courseTitle || c.top.trackTitle || c.top.resourceKey || "?";
      return `${c.source}="${cTitle}"(tier=${c.matchTier},rel=${c.relevance.toFixed(4)})`;
    })
    .join(", ");

  return {
    source: winner.source,
    items: winner.items,
    reason: `${winner.source} "${title}" won on tier=${winner.matchTier}, relevance=${winner.relevance.toFixed(4)} — candidates: ${relevanceSummary}`,
    matchTier: winner.matchTier,
  };
}

/**
 * Find the highest match-tier (then highest-relevance) item in an
 * array and bubble it to index 0.
 *
 * Why match-tier first: `relevance` reflects full-text `ts_rank` over
 * the long `content` field — so the highest-relevance item can be a
 * tangentially related entry that merely mentions the query tokens
 * extensively in its body.
 *
 * Sorting by `matchTier` first ensures that an exact title match
 * (e.g., "Proof of Work (PoW)" for query "proof of work") wins over
 * a higher-relevance but off-topic hit ("Nakamoto Consensus"). The
 * relevance score then serves as the secondary sort key, breaking
 * ties among same-tier items.
 *
 * @param {string} query - The query string (used for tier computation).
 * @param {Array<Object>} items
 * @returns {{top: Object, items: Array<Object>, relevance: number, matchTier: number}}
 *   `top` is the highest-tier (then highest-relevance) item;
 *   `items` is a new array with `top` moved to index 0 and the rest
 *   in original order; `relevance` is `top.relevance` or `top.similarity`
 *   (for articles) or 0 if neither is present/non-numeric;
 *   `matchTier` is `getMatchTier(query, top)`.
 */
function bubbleTopByMatchTier(query, items) {
  // Article items use `similarity` instead of `relevance`; normalize to a
  // single `relevance` value for consistent ranking across endpoint types.
  const getRel = (item) => {
    if (typeof item?.relevance === "number") return item.relevance;
    if (typeof item?.similarity === "number") return item.similarity;
    return 0;
  };
  let topIdx = 0;
  let topTier = getMatchTier(query, items[0]);
  let topRel = getRel(items[0]);
  for (let i = 1; i < items.length; i++) {
    const tier = getMatchTier(query, items[i]);
    const rel = getRel(items[i]);
    // Higher tier wins; ties broken by higher relevance.
    if (tier > topTier || (tier === topTier && rel > topRel)) {
      topTier = tier;
      topRel = rel;
      topIdx = i;
    }
  }
  const top = items[topIdx];
  const reordered = [
    top,
    ...items.slice(0, topIdx),
    ...items.slice(topIdx + 1),
  ];
  return { top, items: reordered, relevance: topRel, matchTier: topTier };
}

/**
 * Strip HTML tags and collapse whitespace/HTML entities from a
 * string. Used by the LLM (or the test harness) when formatting
 * API responses that contain HTML in the `content` / `excerpt` /
 * `courseDescription` fields.
 *
 * The PRD §5 requires the skill to "paraphrase, do not paste" Academy
 * content. The LLM should call this helper first to get plain text,
 * then paraphrase. Returning HTML-stripped plain text makes the
 * prose-generation step simpler and prevents accidental
 * raw-HTML leakage into chat cards.
 *
 * Behavior:
 *   - Replace `<br>`, `</p>`, `</li>`, `</h1>`..`</h6>`, `</div>`
 *     with a newline so paragraph/list/heading breaks survive as line
 *     breaks (not lost in whitespace collapse).
 *   - Drop all other tags.
 *   - Decode the common HTML entities (&nbsp;, &amp;, &lt;, &gt;,
 *     &quot;, &#x27;, &ldquo;, &rdquo;, &mdash;, &ndash;).
 *   - Collapse runs of spaces/tabs to a single space; trim each line;
 *     collapse 3+ newlines to 2.
 *
 * Not a full HTML parser — Academy content uses a small, predictable
 * subset of HTML (`<h2>`, `<p>`, `<a>`, `<ul>`, `<ol>`, `<li>`,
 * `<strong>`, `<u>`, `<br>`). For untrusted input, use a real parser.
 *
 * @param {string|undefined|null} s
 * @returns {string} Plain text, with HTML removed.
 */
export function stripHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|li|h[1-6]|div|tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- CLI entry point ---------------------------------------------------------

const ENDPOINTS = {
  searchGlossary,
  searchLearnEarn,
  searchResource,
  searchArticles,
  resolveParentTrack,
  getTrackOutline,
  getLearningPlan,
  searchAll,
};

/**
 * Parse CLI args and run the requested endpoint. Arg layout:
 *   node academy-api.mjs [env] <endpoint> [jsonBody]
 * `env` defaults to "prod" when omitted.
 */
async function main() {
  const args = process.argv.slice(2);

  // The "qa" environment has been removed; only "prod" is supported now.
  // If the user passes the legacy "qa" first arg, fail with a clear hint
  // instead of the generic "Unknown endpoint" error.
  if (args.length >= 1 && args[0] === "qa") {
    console.error(
      'The "qa" environment has been removed. Use "prod" (the default) instead.\n' +
        "Usage: node academy-api.mjs [prod] <endpoint> [jsonBody]\n" +
        "Endpoints: " +
        Object.keys(ENDPOINTS).join(", "),
    );
    process.exitCode = 1;
    return;
  }

  // Allow `env` to be omitted (default "prod"); detect by checking the first
  // positional arg against the known env value.
  let env = "prod";
  let endpoint;
  let bodyArg;
  if (args.length >= 1 && args[0] === "prod") {
    env = args[0];
    endpoint = args[1];
    bodyArg = args[2];
  } else {
    endpoint = args[0];
    bodyArg = args[1];
  }

  if (!endpoint) {
    console.error(
      "Usage: node academy-api.mjs [prod] <endpoint> [jsonBody]\n" +
        "Endpoints: " +
        Object.keys(ENDPOINTS).join(", "),
    );
    process.exitCode = 1;
    return;
  }

  const fn = ENDPOINTS[endpoint];
  if (!fn) {
    console.error(
      `Unknown endpoint: ${endpoint}. Valid: ${Object.keys(ENDPOINTS).join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  let body;
  try {
    body = bodyArg ? JSON.parse(bodyArg) : {};
  } catch (err) {
    console.error(`Failed to parse jsonBody: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await fn(env, body);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

// Run only when invoked directly via `node academy-api.mjs ...`.
// Use realpathSync to handle macOS /var -> /private/var symlink and
// other filesystem symlinks; otherwise resolve() returns the
// pre-symlink path while __filename resolves through it, and the
// equality check fails (CLI silently exits without running main()).
const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(__filename);
  } catch {
    return resolve(process.argv[1]) === __filename;
  }
})();
if (isMain) {
  main();
}
