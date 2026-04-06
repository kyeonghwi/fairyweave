// Local type declarations for bookprintapi-nodejs-sdk (no .d.ts in SDK)

declare module 'bookprintapi-nodejs-sdk' {
  export function verifySignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string,
    tolerance?: number,
  ): boolean;
  export interface SweetbookClientOptions {
    apiKey: string;
    environment?: 'sandbox' | 'live';
    baseUrl?: string;
    timeout?: number;
  }

  export interface BookCreateParams {
    bookSpecUid: string;
    title: string;
    creationType?: 'TEST' | 'NORMAL';
  }

  export interface BookResult {
    bookUid?: string;
    uid?: string;
    [key: string]: unknown;
  }

  export interface PhotoUploadResult {
    url?: string;
    photoUrl?: string;
    fileUrl?: string;
    fileName?: string;
    [key: string]: unknown;
  }

  export interface OrderCreateParams {
    items: Array<{ bookUid: string; quantity: number }>;
    shipping: {
      recipientName: string;
      recipientPhone: string;
      postalCode: string;
      address1: string;
      address2?: string;
      shippingMemo?: string;
    };
    externalRef: string;
  }

  export interface OrderEstimateParams {
    items: Array<{ bookUid: string; quantity: number }>;
    shipping: {
      recipientName: string;
      recipientPhone: string;
      postalCode: string;
      address1: string;
      address2?: string;
    };
  }

  export interface OrderEstimateResult {
    creditSufficient: boolean;
    totalAmount: number;
    totalProductAmount?: number;
    totalShippingFee?: number;
    totalPackagingFee?: number;
    availableCredits?: number;
    [key: string]: unknown;
  }

  export interface OrderResult {
    orderUid?: string;
    totalProductAmount?: number;
    totalShippingFee?: number;
    totalPackagingFee?: number;
    totalAmount?: number;
    orderStatus?: number | string;
    orderStatusDisplay?: string;
    items?: Array<{
      bookUid?: string;
      bookTitle?: string;
      quantity?: number;
      pageCount?: number;
      unitPrice?: number;
      itemAmount?: number;
      [key: string]: unknown;
    }>;
    recipientName?: string;
    address1?: string;
    [key: string]: unknown;
  }

  export class SweetbookApiError extends Error {
    statusCode?: number;
    errorCode?: string;
    details?: unknown;
  }

  export class SweetbookNetworkError extends Error {}

  export class SweetbookValidationError extends Error {
    field?: string;
  }

  export class SweetbookClient {
    constructor(options: SweetbookClientOptions);
    books: {
      create(params: BookCreateParams): Promise<BookResult>;
      get(bookUid: string): Promise<Record<string, unknown>>;
      list(params?: { status?: string; limit?: number; offset?: number }): Promise<Record<string, unknown>>;
      finalize(bookUid: string): Promise<unknown>;
      delete(bookUid: string): Promise<unknown>;
    };
    photos: {
      upload(bookUid: string, file: Blob, options?: { preserveExif?: boolean }): Promise<PhotoUploadResult>;
    };
    covers: {
      create(bookUid: string, templateUid: string, parameters: Record<string, unknown>, files?: unknown): Promise<unknown>;
    };
    contents: {
      insert(bookUid: string, templateUid: string, parameters: Record<string, unknown>, options?: { breakBefore?: string; files?: unknown }): Promise<unknown>;
    };
    orders: {
      create(params: OrderCreateParams): Promise<OrderResult>;
      get(orderUid: string): Promise<OrderResult>;
      list(params?: { limit?: number; offset?: number; status?: string; from?: string; to?: string }): Promise<Record<string, unknown>>;
      estimate(params: OrderEstimateParams): Promise<OrderEstimateResult>;
      cancel(orderUid: string, cancelReason: string): Promise<Record<string, unknown>>;
      updateShipping(orderUid: string, shippingData: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
    credits: {
      getBalance(): Promise<Record<string, unknown>>;
      transactions(params?: { limit?: number; offset?: number; from?: string; to?: string }): Promise<Record<string, unknown>>;
      sandboxCharge(amount: number, description: string): Promise<unknown>;
    };
  }
}
