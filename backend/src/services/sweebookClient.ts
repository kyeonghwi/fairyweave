import { SweetbookClient } from 'bookprintapi-nodejs-sdk';
import type { BookSpecUid } from '../types/story';

function createClient(): SweetbookClient {
  const apiKey = process.env.SWEETBOOK_API_KEY;
  const env = (process.env.SWEETBOOK_ENV ?? 'sandbox') as 'sandbox' | 'live';

  if (!apiKey) {
    throw new Error('[SweetbookClient] SWEETBOOK_API_KEY is required but not set');
  }

  return new SweetbookClient({ apiKey, environment: env });
}

// Lazy singleton — created on first use so dotenv.config() in index.ts runs first
let _client: SweetbookClient | undefined;
export const sweetbookClient = new Proxy({} as SweetbookClient, {
  get(_target, prop) {
    if (!_client) _client = createClient();
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// --- Template resolution ---
// Fetches template UIDs from SweetBook API per bookSpecUid, with env var fallback.

interface TemplateCache {
  coverTemplateUid: string;
  contentTemplateUid: string;
}

const _templateCacheMap = new Map<string, TemplateCache>();

async function fetchTemplatesForSpec(bookSpecUid: string): Promise<TemplateCache> {
  const client = sweetbookClient as unknown as { _baseUrl: string; _apiKey: string };
  const baseUrl = client._baseUrl.replace(/\/+$/, '');
  const resp = await fetch(
    `${baseUrl}/templates?bookSpecUid=${bookSpecUid}`,
    { headers: { Authorization: `Bearer ${client._apiKey}` } },
  );

  if (!resp.ok) {
    throw new Error(`GET /templates?bookSpecUid=${bookSpecUid} returned ${resp.status}`);
  }

  const body = await resp.json() as { data?: { items?: Array<Record<string, unknown>> } };
  const items = body.data?.items ?? [];

  const cover = items.find((t) => t.templateKind === 'cover');
  const content = items.find((t) => t.templateKind === 'content');

  const coverUid = cover?.templateUid as string | undefined;
  const contentUid = content?.templateUid as string | undefined;

  if (!coverUid || !contentUid) {
    throw new Error(
      `Template lookup incomplete for ${bookSpecUid}: cover=${coverUid}, content=${contentUid}. ` +
      `Found ${items.length} templates: ${items.map((t) => `${t.templateUid}(${t.templateKind})`).join(', ')}`,
    );
  }

  return { coverTemplateUid: coverUid, contentTemplateUid: contentUid };
}

export async function initTemplates(): Promise<void> {
  const coverOverride = process.env.SWEETBOOK_COVER_TEMPLATE_UID;
  const contentOverride = process.env.SWEETBOOK_CONTENT_TEMPLATE_UID;

  // If both env vars are set, use them as SQUAREBOOK_HC default
  if (coverOverride && contentOverride) {
    _templateCacheMap.set('SQUAREBOOK_HC', { coverTemplateUid: coverOverride, contentTemplateUid: contentOverride });
    console.log('[SweetbookClient] SQUAREBOOK_HC templates loaded from env vars');
    return;
  }

  // Pre-fetch SQUAREBOOK_HC at startup (default spec)
  try {
    const templates = await fetchTemplatesForSpec('SQUAREBOOK_HC');
    _templateCacheMap.set('SQUAREBOOK_HC', templates);
    console.log(`[SweetbookClient] SQUAREBOOK_HC templates cached: cover=${templates.coverTemplateUid}, content=${templates.contentTemplateUid}`);
  } catch (err) {
    if (coverOverride && contentOverride) {
      _templateCacheMap.set('SQUAREBOOK_HC', { coverTemplateUid: coverOverride, contentTemplateUid: contentOverride });
      console.warn('[SweetbookClient] Template API lookup failed, using env fallback:', (err as Error).message);
    } else {
      throw new Error(
        `[SweetbookClient] Template lookup failed and env vars not set. ` +
        `Set SWEETBOOK_COVER_TEMPLATE_UID and SWEETBOOK_CONTENT_TEMPLATE_UID, ` +
        `or fix: ${(err as Error).message}`,
      );
    }
  }
}

export async function getTemplatesForSpec(bookSpecUid: BookSpecUid): Promise<TemplateCache> {
  const cached = _templateCacheMap.get(bookSpecUid);
  if (cached) return cached;

  // Lazy-fetch templates for this spec
  const templates = await fetchTemplatesForSpec(bookSpecUid);
  _templateCacheMap.set(bookSpecUid, templates);
  console.log(`[SweetbookClient] ${bookSpecUid} templates cached: cover=${templates.coverTemplateUid}, content=${templates.contentTemplateUid}`);
  return templates;
}

// Backwards-compatible sync getter for SQUAREBOOK_HC (used if already initialized)
export function getTemplates(): TemplateCache {
  const cached = _templateCacheMap.get('SQUAREBOOK_HC');
  if (!cached) {
    throw new Error('[SweetbookClient] Templates not initialized — call initTemplates() first');
  }
  return cached;
}
