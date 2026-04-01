import { SweetbookClient } from 'bookprintapi-nodejs-sdk';

function createClient(): SweetbookClient {
  const apiKey = process.env.SWEETBOOK_API_KEY;
  const coverTemplateUid = process.env.SWEETBOOK_COVER_TEMPLATE_UID;
  const contentTemplateUid = process.env.SWEETBOOK_CONTENT_TEMPLATE_UID;
  const env = (process.env.SWEETBOOK_ENV ?? 'sandbox') as 'sandbox' | 'live';

  if (!apiKey) {
    throw new Error('[SweetbookClient] SWEETBOOK_API_KEY is required but not set');
  }
  if (!coverTemplateUid) {
    throw new Error('[SweetbookClient] SWEETBOOK_COVER_TEMPLATE_UID is required but not set');
  }
  if (!contentTemplateUid) {
    throw new Error('[SweetbookClient] SWEETBOOK_CONTENT_TEMPLATE_UID is required but not set');
  }

  return new SweetbookClient({ apiKey, environment: env });
}

// Lazy singleton — created on first use so dotenv.config() in index.ts runs first
let _client: SweetbookClient | undefined;
export const sweetbookClient = new Proxy({} as SweetbookClient, {
  get(_target, prop) {
    if (!_client) _client = createClient();
    return (_client as Record<string | symbol, unknown>)[prop];
  },
});
