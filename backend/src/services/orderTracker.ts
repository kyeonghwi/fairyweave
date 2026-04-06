// In-memory store for webhook events — tracks order status changes from Sweetbook webhooks.
// Production would use a database; this is sufficient for the hackathon scope.

export interface WebhookEvent {
  eventUid: string;
  eventType: string;
  createdAt: string;
  data: Record<string, unknown>;
  receivedAt: string;
}

interface OrderState {
  orderUid: string;
  latestStatus: string;
  events: WebhookEvent[];
}

const _orders = new Map<string, OrderState>();
const _allEvents: WebhookEvent[] = [];

const MAX_EVENTS = 500;

export const orderTracker = {
  /** Record a webhook event and update order state */
  recordEvent(event: WebhookEvent): void {
    const orderUid = event.data.order_uid as string | undefined;
    if (!orderUid) return;

    // Append to global event log (capped)
    _allEvents.push(event);
    if (_allEvents.length > MAX_EVENTS) _allEvents.shift();

    // Update per-order state
    const existing = _orders.get(orderUid);
    const newStatus = (event.data.new_status ?? event.data.order_status ?? event.eventType) as string;

    if (existing) {
      existing.latestStatus = newStatus;
      existing.events.push(event);
    } else {
      _orders.set(orderUid, {
        orderUid,
        latestStatus: newStatus,
        events: [event],
      });
    }
  },

  /** Get state for a specific order */
  getOrder(orderUid: string): OrderState | undefined {
    return _orders.get(orderUid);
  },

  /** Get all recorded events (most recent first) */
  getEvents(limit = 50): WebhookEvent[] {
    return _allEvents.slice(-limit).reverse();
  },

  /** Get tracked order count */
  get size(): number {
    return _orders.size;
  },
};
