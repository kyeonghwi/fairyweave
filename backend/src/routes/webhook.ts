import { Router, Request, Response } from 'express';
import { verifySignature } from 'bookprintapi-nodejs-sdk';
import { sweetbookClient } from '../services/sweebookClient';
import { orderTracker, WebhookEvent } from '../services/orderTracker';

const router = Router();

const WEBHOOK_SECRET = process.env.SWEETBOOK_WEBHOOK_SECRET;

// POST /api/webhooks/sweetbook — receive Sweetbook webhook events
// Requires raw body for HMAC-SHA256 signature verification
router.post('/webhooks/sweetbook', (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET) {
    console.warn('[webhook] SWEETBOOK_WEBHOOK_SECRET not set — skipping signature verification');
  }

  // Raw body is attached by express.raw() middleware in index.ts
  const rawBody = (req as Request & { rawBody?: string }).rawBody;
  if (!rawBody) {
    res.status(400).json({ error: 'Missing raw body' });
    return;
  }

  // Verify signature if secret is configured
  if (WEBHOOK_SECRET) {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const timestamp = req.headers['x-webhook-timestamp'] as string | undefined;

    if (!signature) {
      res.status(401).json({ error: 'Missing X-Webhook-Signature header' });
      return;
    }

    const isValid = verifySignature(rawBody, signature, WEBHOOK_SECRET, timestamp);
    if (!isValid) {
      console.error('[webhook] Signature verification failed');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  // Parse and store the event
  try {
    const payload = JSON.parse(rawBody) as {
      event_uid: string;
      event_type: string;
      created_at: string;
      data: Record<string, unknown>;
    };

    const event: WebhookEvent = {
      eventUid: payload.event_uid,
      eventType: payload.event_type,
      createdAt: payload.created_at,
      data: payload.data,
      receivedAt: new Date().toISOString(),
    };

    orderTracker.recordEvent(event);
    console.log(`[webhook] ${event.eventType} for order ${event.data.order_uid}`);

    // Respond 200 quickly — Sweetbook expects response within 5 seconds
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] Failed to parse payload:', err);
    res.status(400).json({ error: 'Invalid JSON payload' });
  }
});

// GET /api/webhooks/events — list received webhook events (for debugging/dashboard)
router.get('/webhooks/events', (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({
    events: orderTracker.getEvents(limit),
    trackedOrders: orderTracker.size,
  });
});

// GET /api/webhooks/events/:orderUid — get events for a specific order
router.get('/webhooks/events/:orderUid', (req: Request, res: Response) => {
  const state = orderTracker.getOrder(req.params.orderUid);
  if (!state) {
    res.status(404).json({ error: 'No webhook events found for this order' });
    return;
  }
  res.json(state);
});

// PUT /api/webhooks/config — register/update webhook configuration
router.put('/webhooks/config', async (req: Request, res: Response) => {
  const { url, events } = req.body as { url?: string; events?: string[] };

  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  try {
    const client = sweetbookClient as unknown as { _baseUrl: string; _apiKey: string };
    const baseUrl = client._baseUrl.replace(/\/+$/, '');
    const resp = await fetch(`${baseUrl}/webhooks/config`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${client._apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, events: events ?? ['order.paid', 'order.confirmed', 'order.status_changed', 'order.shipped', 'order.cancelled'] }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      res.status(resp.status).json({ error: `Book Print API returned ${resp.status}`, details: body });
      return;
    }

    res.json(await resp.json());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/webhooks/config — get current webhook configuration
router.get('/webhooks/config', async (_req: Request, res: Response) => {
  try {
    const client = sweetbookClient as unknown as { _baseUrl: string; _apiKey: string };
    const baseUrl = client._baseUrl.replace(/\/+$/, '');
    const resp = await fetch(`${baseUrl}/webhooks/config`, {
      headers: { Authorization: `Bearer ${client._apiKey}` },
    });

    if (!resp.ok) {
      res.status(resp.status).json({ error: `Book Print API returned ${resp.status}` });
      return;
    }

    res.json(await resp.json());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export const webhookRouter = router;
