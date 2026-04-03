import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { sweetbookClient, getTemplatesForSpec } from '../services/sweebookClient';
import { bookStore } from '../services/bookStore';
import { BOOK_SPECS } from '../types/story';
import type { BookSpecUid } from '../types/story';
import {
  SweetbookApiError,
  SweetbookNetworkError,
  SweetbookValidationError,
} from 'bookprintapi-nodejs-sdk';

const router = Router();

// Generate a valid 512x512 solid-color PNG at startup.
// Sweetbook's image processor rejects trivially small images with HTTP 500.
function buildPlaceholderPng(): Buffer {
  const W = 512, H = 512;
  const rowSize = 1 + W * 3; // filter byte + RGB per pixel
  const raw = Buffer.alloc(rowSize * H);
  for (let y = 0; y < H; y++) {
    const off = y * rowSize;
    raw[off] = 0; // filter: none
    for (let x = 0; x < W; x++) {
      const px = off + 1 + x * 3;
      raw[px] = 220; raw[px + 1] = 220; raw[px + 2] = 220;
    }
  }
  const compressed = deflateSync(raw);

  function crc32(buf: Buffer): number {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const FALLBACK_PNG = buildPlaceholderPng();

function dataUriToFile(dataUri: string, filename: string): File {
  const commaIdx = dataUri.indexOf(',');
  const header = dataUri.slice(0, commaIdx);
  const data = dataUri.slice(commaIdx + 1);
  const mimeType = header.match(/:(.*?)(?:;|$)/)?.[1] ?? 'image/png';

  // Sweetbook print API requires raster images — substitute a 512x512 PNG for SVG placeholders
  if (mimeType === 'image/svg+xml') {
    return new File([FALLBACK_PNG], filename, { type: 'image/png' });
  }

  const isBase64 = header.includes(';base64');
  const buffer = isBase64
    ? Buffer.from(data, 'base64')
    : Buffer.from(decodeURIComponent(data), 'utf-8');
  return new File([buffer], filename, { type: mimeType });
}

// Extract photo reference from photos.upload response.
// API returns fileName (stored reference), not a URL.
function extractPhotoRef(photo: Record<string, unknown>): string {
  const ref = (photo.fileName ?? photo.url ?? photo.photoUrl ?? photo.fileUrl) as string | undefined;
  if (!ref) {
    throw new Error(
      `photos.upload response missing reference field. Got keys: ${Object.keys(photo).join(', ')}`
    );
  }
  return ref;
}

// Shared 5-step Sweetbook book creation flow:
// 1. Create book → 2. Upload photos → 3. Cover → 4. Content pages (+blank padding) → 5. Finalize
// Returns bookUid on success. Rolls back (deletes draft) on failure.
async function createSweetbookBook(
  bookTitle: string,
  pages: { pageNumber: number; text: string; imagePrompt: string }[],
  imageUrls: string[],
  logPrefix: string,
  bookSpecUid: BookSpecUid = 'SQUAREBOOK_HC',
  coverImageDataUri?: string,
): Promise<string> {
  const { coverTemplateUid, contentTemplateUid } = await getTemplatesForSpec(bookSpecUid);
  const blankTemplateUid = process.env.SWEETBOOK_BLANK_TEMPLATE_UID || '2mi1ao0Z4Vxl';
  const { minPages } = BOOK_SPECS[bookSpecUid];

  // Step 1: Create book
  const bookResult = await sweetbookClient.books.create({
    bookSpecUid,
    title: bookTitle,
    creationType: 'TEST',
  }).catch((err: unknown) => {
    console.error(`[${logPrefix}] Step 1 (books.create) failed:`, err);
    throw err;
  });

  const bookUid = (bookResult.bookUid ?? bookResult.uid) as string | undefined;
  if (!bookUid) {
    throw Object.assign(new Error('books.create returned no bookUid'), { raw: bookResult });
  }
  console.log(`[${logPrefix}] Step 1 done. bookUid=${bookUid}`);

  try {
    // Step 2: Upload images sequentially (content + cover)
    const photoRefs: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const file = dataUriToFile(imageUrls[i], `photo_${i + 1}.png`);
      const photo = await sweetbookClient.photos.upload(bookUid, file) as Record<string, unknown>;
      photoRefs.push(extractPhotoRef(photo));
      console.log(`[${logPrefix}] Step 2: uploaded photo ${i + 1}/${imageUrls.length}`);
    }

    // Upload cover image (separate from content photos)
    let coverPhotoRef: string;
    if (coverImageDataUri) {
      const coverFile = dataUriToFile(coverImageDataUri, 'cover.png');
      const coverPhoto = await sweetbookClient.photos.upload(bookUid, coverFile) as Record<string, unknown>;
      coverPhotoRef = extractPhotoRef(coverPhoto);
      console.log(`[${logPrefix}] Step 2: uploaded cover photo`);
    } else {
      coverPhotoRef = photoRefs[0];
    }

    // Step 3: Create cover using dedicated cover image
    const year = new Date().getFullYear().toString();
    await sweetbookClient.covers.create(bookUid, coverTemplateUid, {
      coverPhoto: coverPhotoRef, title: bookTitle, dateRange: year,
    });
    console.log(`[${logPrefix}] Step 3: cover created`);

    // Step 4: Insert content pages
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < pages.length; i++) {
      await sweetbookClient.contents.insert(bookUid, contentTemplateUid, {
        photo1: photoRefs[i],
        date: today,
        title: `${i + 1}화`,
        diaryText: pages[i].text,
      }, { breakBefore: 'page' });
    }
    console.log(`[${logPrefix}] Step 4: ${pages.length} pages inserted`);

    // Step 4b: Pad to minimum page count for this bookSpec
    const blankCount = Math.max(0, minPages - pages.length);
    for (let i = 0; i < blankCount; i++) {
      await sweetbookClient.contents.insert(bookUid, blankTemplateUid, {}, { breakBefore: 'page' });
    }
    if (blankCount > 0) {
      console.log(`[${logPrefix}] Step 4b: added ${blankCount} blank pages`);
    }

    // Step 5: Finalize
    await sweetbookClient.books.finalize(bookUid);
    console.log(`[${logPrefix}] Step 5: book finalized. bookUid=${bookUid}`);

    return bookUid;
  } catch (err: unknown) {
    console.error(`[${logPrefix}] Step 2-5 failed, rolling back:`, err);
    await sweetbookClient.books.delete(bookUid).catch((deleteErr: unknown) => {
      console.error(`[${logPrefix}] Rollback delete failed (ignored):`, deleteErr);
    });
    throw err;
  }
}

// Extract pricing and status fields from an order result
function extractOrderResponse(orderResult: Record<string, unknown>) {
  const items = orderResult.items as Array<Record<string, unknown>> | undefined;
  return {
    orderUid: orderResult.orderUid as string | undefined,
    totalProductAmount: orderResult.totalProductAmount as number | undefined,
    totalShippingFee: orderResult.totalShippingFee as number | undefined,
    totalPackagingFee: orderResult.totalPackagingFee as number | undefined,
    totalAmount: orderResult.totalAmount as number | undefined,
    orderStatusDisplay: orderResult.orderStatusDisplay as string | undefined,
    pageCount: items?.[0]?.pageCount as number | undefined,
    unitPrice: items?.[0]?.unitPrice as number | undefined,
  };
}

// Call POST /orders/estimate before creating an order to verify sufficient credits.
// Throws a 402 error with a Korean message if credits are insufficient.
async function checkCreditSufficiency(
  bookUid: string,
  shipping: { recipientName: string; recipientPhone: string; postalCode: string; address1: string; address2?: string },
): Promise<void> {
  const estimateResult = await sweetbookClient.orders.estimate({
    items: [{ bookUid, quantity: 1 }],
    shipping,
  }) as Record<string, unknown>;

  const creditSufficient = estimateResult.creditSufficient as boolean | undefined;
  if (creditSufficient === false) {
    const totalAmount = estimateResult.totalAmount as number | undefined;
    const available = estimateResult.availableCredits as number | undefined;
    const err = Object.assign(
      new Error(
        `크레딧 잔액이 부족합니다. Sweetbook 파트너 포털에서 충전 후 다시 시도해주세요. (필요: ${totalAmount ?? '?'}원, 현재: ${available ?? '?'}원)`
      ),
      { statusCode: 402 },
    );
    throw err;
  }
}

// Map Sweetbook SDK errors to HTTP responses
function handleSweetbookError(err: unknown, res: Response): void {
  if ((err as { statusCode?: number }).statusCode === 402) {
    res.status(402).json({ error: (err as Error).message });
    return;
  }
  if (err instanceof SweetbookApiError) {
    res.status(err.statusCode ?? 500).json({ error: err.message, details: err.details });
  } else if (err instanceof SweetbookValidationError) {
    res.status(400).json({ error: err.message, field: err.field });
  } else if (err instanceof SweetbookNetworkError) {
    res.status(502).json({ error: 'Sweetbook API network error', message: (err as Error).message });
  } else {
    res.status(500).json({ error: 'Sweetbook operation failed', message: (err as Error).message });
  }
}

// GET /api/sweetbook/book-specs — return available book specifications (local data, no API call)
router.get('/sweetbook/book-specs', (_req: Request, res: Response) => {
  const specs = Object.entries(BOOK_SPECS).map(([uid, spec]) => ({
    uid,
    name: spec.name,
    minPages: spec.minPages,
    maxPages: spec.maxPages,
  }));
  res.json({ specs });
});

// POST /api/sweetbook/books
// Body: { bookId: string }
// Response: { bookUid: string }
router.post('/sweetbook/books', async (req: Request, res: Response) => {
  const { bookId } = req.body as { bookId?: string };

  if (!bookId) {
    res.status(400).json({ error: 'bookId is required' });
    return;
  }

  const record = bookStore.get(bookId);
  if (!record) {
    res.status(404).json({ error: `Book not found: ${bookId}` });
    return;
  }

  try {
    const bookUid = await createSweetbookBook(record.title, record.pages, record.imageUrls, '/api/sweetbook/books', record.bookSpecUid, record.coverImageUrl);
    res.json({ bookUid });
  } catch (err: unknown) {
    handleSweetbookError(err, res);
  }
});

// POST /api/sweetbook/orders
// Body: { bookUid, recipientName, recipientPhone, postalCode, address1, address2?, shippingMemo? }
// Response: { orderUid: string }
router.post('/sweetbook/orders', async (req: Request, res: Response) => {
  const {
    bookUid,
    recipientName,
    recipientPhone,
    postalCode,
    address1,
    address2,
    shippingMemo,
  } = req.body as {
    bookUid?: string;
    recipientName?: string;
    recipientPhone?: string;
    postalCode?: string;
    address1?: string;
    address2?: string;
    shippingMemo?: string;
  };

  const missing = ['bookUid', 'recipientName', 'recipientPhone', 'postalCode', 'address1'].filter(
    (field) => !req.body[field]
  );
  if (missing.length > 0) {
    res.status(400).json({ error: 'Missing required fields', missing });
    return;
  }

  console.log(`[/api/sweetbook/orders] Creating order for bookUid=${bookUid}`);

  try {
    await checkCreditSufficiency(bookUid!, {
      recipientName: recipientName!,
      recipientPhone: recipientPhone!,
      postalCode: postalCode!,
      address1: address1!,
      ...(address2 ? { address2 } : {}),
    });

    const externalRef = randomUUID();

    const orderResult = await sweetbookClient.orders.create({
      items: [{ bookUid: bookUid!, quantity: 1 }],
      shipping: {
        recipientName: recipientName!,
        recipientPhone: recipientPhone!,
        postalCode: postalCode!,
        address1: address1!,
        ...(address2 ? { address2 } : {}),
        ...(shippingMemo ? { shippingMemo } : {}),
      },
      externalRef,
    }) as Record<string, unknown>;

    const orderResponse = extractOrderResponse(orderResult);
    if (!orderResponse.orderUid) {
      res.status(500).json({ error: 'orders.create returned no orderUid', raw: orderResult });
      return;
    }

    console.log(`[/api/sweetbook/orders] Order created. orderUid=${orderResponse.orderUid}, externalRef=${externalRef}`);
    res.json(orderResponse);
  } catch (err: unknown) {
    console.error('[/api/sweetbook/orders] Error:', err);
    handleSweetbookError(err, res);
  }
});

// POST /api/sweetbook/books-from-data
// Body: { pages, imageUrls, request, shipping }
// Creates book + order in one call (for dummy books and direct-data ordering)
// Response: { bookUid: string, orderUid: string }
router.post('/sweetbook/books-from-data', async (req: Request, res: Response) => {
  const { pages, imageUrls, request: bookRequest, shipping, bookSpecUid: rawSpec, title: rawTitle, coverImageUrl } = req.body as {
    pages?: { pageNumber: number; text: string; imagePrompt: string }[];
    imageUrls?: string[];
    request?: { childName: string; age: number; theme: string; moral: string };
    bookSpecUid?: string;
    title?: string;
    coverImageUrl?: string;
    shipping?: {
      recipientName: string;
      recipientPhone: string;
      postalCode: string;
      address1: string;
      address2?: string;
      shippingMemo?: string;
    };
  };

  if (!pages || !imageUrls || !bookRequest || !shipping) {
    res.status(400).json({ error: 'pages, imageUrls, request, and shipping are all required' });
    return;
  }
  if (!shipping.recipientName || !shipping.recipientPhone || !shipping.postalCode || !shipping.address1) {
    res.status(400).json({ error: 'Missing required shipping fields' });
    return;
  }

  const bookSpecUid: BookSpecUid = (rawSpec && rawSpec in BOOK_SPECS) ? rawSpec as BookSpecUid : 'SQUAREBOOK_HC';
  const bookTitle = rawTitle || `${bookRequest.childName}의 동화책`;

  try {
    const bookUid = await createSweetbookBook(bookTitle, pages, imageUrls, '/api/sweetbook/books-from-data', bookSpecUid, coverImageUrl);

    // Verify credits before placing order
    await checkCreditSufficiency(bookUid, {
      recipientName: shipping.recipientName,
      recipientPhone: shipping.recipientPhone,
      postalCode: shipping.postalCode,
      address1: shipping.address1,
      ...(shipping.address2 ? { address2: shipping.address2 } : {}),
    });

    // Create order
    const externalRef = randomUUID();
    const orderResult = await sweetbookClient.orders.create({
      items: [{ bookUid, quantity: 1 }],
      shipping: {
        recipientName: shipping.recipientName,
        recipientPhone: shipping.recipientPhone,
        postalCode: shipping.postalCode,
        address1: shipping.address1,
        ...(shipping.address2 ? { address2: shipping.address2 } : {}),
        ...(shipping.shippingMemo ? { shippingMemo: shipping.shippingMemo } : {}),
      },
      externalRef,
    }) as Record<string, unknown>;

    const orderResponse = extractOrderResponse(orderResult);
    if (!orderResponse.orderUid) {
      res.status(500).json({ error: 'orders.create returned no orderUid', raw: orderResult });
      return;
    }

    console.log(`[/api/sweetbook/books-from-data] Order created. orderUid=${orderResponse.orderUid}`);
    res.json({ bookUid, ...orderResponse });
  } catch (err: unknown) {
    handleSweetbookError(err, res);
  }
});

// GET /api/sweetbook/orders/:orderUid — query order status
router.get('/sweetbook/orders/:orderUid', async (req: Request, res: Response) => {
  const { orderUid } = req.params;

  try {
    const result = await sweetbookClient.orders.get(orderUid) as Record<string, unknown>;
    const items = result.items as Array<Record<string, unknown>> | undefined;
    res.json({
      orderUid: result.orderUid,
      orderStatus: result.orderStatus,
      orderStatusDisplay: result.orderStatusDisplay,
      totalProductAmount: result.totalProductAmount,
      totalShippingFee: result.totalShippingFee,
      totalAmount: result.totalAmount,
      recipientName: result.recipientName,
      address1: result.address1,
      items: items?.map((item) => ({
        bookTitle: item.bookTitle,
        quantity: item.quantity,
        pageCount: item.pageCount,
        unitPrice: item.unitPrice,
      })),
    });
  } catch (err: unknown) {
    console.error(`[/api/sweetbook/orders/${orderUid}] Error:`, err);
    handleSweetbookError(err, res);
  }
});

export const sweebookRouter = router;
