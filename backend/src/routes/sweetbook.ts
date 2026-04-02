import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { sweetbookClient } from '../services/sweebookClient';
import { bookStore } from '../services/bookStore';
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

  console.log(`[/api/sweetbook/books] Starting 5-step flow for bookId=${bookId}`);

  // Step 1: Create book
  const bookTitle = `${record.request.childName}의 동화책`;
  const bookResult = await sweetbookClient.books.create({
    bookSpecUid: 'SQUAREBOOK_HC',
    title: bookTitle,
    creationType: 'TEST',
  }).catch((err: unknown) => {
    console.error('[/api/sweetbook/books] Step 1 (books.create) failed:', err);
    throw err;
  });

  const bookUid = (bookResult.bookUid ?? bookResult.uid) as string | undefined;
  if (!bookUid) {
    res.status(500).json({ error: 'books.create returned no bookUid', raw: bookResult });
    return;
  }

  console.log(`[/api/sweetbook/books] Step 1 done. bookUid=${bookUid}`);

  try {
    // Step 2: Upload all 16 images sequentially → collect photo URLs
    const coverTemplateUid = process.env.SWEETBOOK_COVER_TEMPLATE_UID!;
    const contentTemplateUid = process.env.SWEETBOOK_CONTENT_TEMPLATE_UID!;

    const photoRefs: string[] = [];
    for (let i = 0; i < record.imageUrls.length; i++) {
      const file = dataUriToFile(record.imageUrls[i], `photo_${i + 1}.png`);
      const photo = await sweetbookClient.photos.upload(bookUid, file) as Record<string, unknown>;
      const photoRef = extractPhotoRef(photo);
      photoRefs.push(photoRef);
      console.log(`[/api/sweetbook/books] Step 2: uploaded photo ${i + 1}/${record.imageUrls.length} → ${photoRef}`);
    }

    // Step 3: Create cover using first image
    // Template 79yjMH3qRPly requires: coverPhoto, title, dateRange
    const year = new Date().getFullYear().toString();
    await sweetbookClient.covers.create(
      bookUid,
      coverTemplateUid,
      { coverPhoto: photoRefs[0], title: bookTitle, dateRange: year }
    );
    console.log(`[/api/sweetbook/books] Step 3: cover created`);

    // Step 4: Insert 16 content pages
    // Template 2R8uMwVgTrpc requires: photo1, date, title, diaryText
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < record.pages.length; i++) {
      await sweetbookClient.contents.insert(
        bookUid,
        contentTemplateUid,
        {
          photo1: photoRefs[i],
          date: today,
          title: `${i + 1}화`,
          diaryText: record.pages[i].text,
        },
        { breakBefore: 'page' }
      );
    }
    console.log(`[/api/sweetbook/books] Step 4: ${record.pages.length} pages inserted`);

    // Step 4b: Pad to minimum 24 pages with blank pages (SQUAREBOOK_HC minimum)
    const BLANK_TEMPLATE_UID = '2mi1ao0Z4Vxl';
    const contentPageCount = record.pages.length; // 16
    const minPages = 24;
    const blankCount = Math.max(0, minPages - contentPageCount);
    for (let i = 0; i < blankCount; i++) {
      await sweetbookClient.contents.insert(bookUid, BLANK_TEMPLATE_UID, {}, { breakBefore: 'page' });
    }
    if (blankCount > 0) {
      console.log(`[/api/sweetbook/books] Step 4b: added ${blankCount} blank pages to reach 24-page minimum`);
    }

    // Step 5: Finalize
    await sweetbookClient.books.finalize(bookUid);
    console.log(`[/api/sweetbook/books] Step 5: book finalized. bookUid=${bookUid}`);

    res.json({ bookUid });
  } catch (err: unknown) {
    // Rollback: delete the draft book (best-effort)
    console.error('[/api/sweetbook/books] Step 2-5 failed, rolling back:', err);
    await sweetbookClient.books.delete(bookUid).catch((deleteErr: unknown) => {
      console.error('[/api/sweetbook/books] Rollback delete failed (ignored):', deleteErr);
    });

    if (err instanceof SweetbookApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.message, details: err.details });
    } else if (err instanceof SweetbookValidationError) {
      res.status(400).json({ error: err.message, field: err.field });
    } else if (err instanceof SweetbookNetworkError) {
      res.status(502).json({ error: 'Sweetbook API network error', message: (err as Error).message });
    } else {
      res.status(500).json({ error: 'Book creation failed', message: (err as Error).message });
    }
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

  // Validate required fields
  const missing = ['bookUid', 'recipientName', 'recipientPhone', 'postalCode', 'address1'].filter(
    (field) => !req.body[field]
  );
  if (missing.length > 0) {
    res.status(400).json({ error: 'Missing required fields', missing });
    return;
  }

  console.log(`[/api/sweetbook/orders] Creating order for bookUid=${bookUid}`);

  try {
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

    const orderUid = orderResult.orderUid as string | undefined;
    if (!orderUid) {
      res.status(500).json({ error: 'orders.create returned no orderUid', raw: orderResult });
      return;
    }

    console.log(`[/api/sweetbook/orders] Order created. orderUid=${orderUid}, externalRef=${externalRef}`);
    res.json({ orderUid });
  } catch (err: unknown) {
    console.error('[/api/sweetbook/orders] Error:', err);
    if (err instanceof SweetbookApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.message, details: err.details });
    } else if (err instanceof SweetbookValidationError) {
      res.status(400).json({ error: err.message, field: err.field });
    } else if (err instanceof SweetbookNetworkError) {
      res.status(502).json({ error: 'Sweetbook API network error', message: (err as Error).message });
    } else {
      res.status(500).json({ error: 'Order creation failed', message: (err as Error).message });
    }
  }
});

// POST /api/sweetbook/books-from-data
// Body: { pages, imageUrls, request, shipping }
// Creates book + order in one call (for dummy books and direct-data ordering)
// Response: { bookUid: string, orderUid: string }
router.post('/sweetbook/books-from-data', async (req: Request, res: Response) => {
  const { pages, imageUrls, request: bookRequest, shipping } = req.body as {
    pages?: { pageNumber: number; text: string; imagePrompt: string }[];
    imageUrls?: string[];
    request?: { childName: string; age: number; theme: string; moral: string };
    shipping?: {
      recipientName: string;
      recipientPhone: string;
      postalCode: string;
      address1: string;
      address2?: string;
      shippingMemo?: string;
    };
  };

  // Validate required fields
  if (!pages || !imageUrls || !bookRequest || !shipping) {
    res.status(400).json({ error: 'pages, imageUrls, request, and shipping are all required' });
    return;
  }
  if (!shipping.recipientName || !shipping.recipientPhone || !shipping.postalCode || !shipping.address1) {
    res.status(400).json({ error: 'Missing required shipping fields' });
    return;
  }

  const bookTitle = `${bookRequest.childName}의 동화책`;
  console.log(`[/api/sweetbook/books-from-data] Starting flow for "${bookTitle}"`);

  // Step 1: Create book
  const bookResult = await sweetbookClient.books.create({
    bookSpecUid: 'SQUAREBOOK_HC',
    title: bookTitle,
    creationType: 'TEST',
  }).catch((err: unknown) => {
    console.error('[/api/sweetbook/books-from-data] Step 1 (books.create) failed:', err);
    throw err;
  });

  const bookUid = (bookResult.bookUid ?? bookResult.uid) as string | undefined;
  if (!bookUid) {
    res.status(500).json({ error: 'books.create returned no bookUid', raw: bookResult });
    return;
  }
  console.log(`[/api/sweetbook/books-from-data] Step 1 done. bookUid=${bookUid}`);

  try {
    // Step 2: Upload images sequentially
    const coverTemplateUid = process.env.SWEETBOOK_COVER_TEMPLATE_UID!;
    const contentTemplateUid = process.env.SWEETBOOK_CONTENT_TEMPLATE_UID!;

    const photoRefs: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const file = dataUriToFile(imageUrls[i], `photo_${i + 1}.png`);
      console.log(`[/api/sweetbook/books-from-data] Step 2: uploading photo ${i + 1}/${imageUrls.length} (type=${file.type}, size=${file.size})`);
      try {
        const photo = await sweetbookClient.photos.upload(bookUid, file) as Record<string, unknown>;
        photoRefs.push(extractPhotoRef(photo));
        console.log(`[/api/sweetbook/books-from-data] Step 2: uploaded photo ${i + 1}/${imageUrls.length}`);
      } catch (uploadErr: unknown) {
        const apiErr = uploadErr as { details?: unknown; statusCode?: number; message?: string };
        console.error(`[/api/sweetbook/books-from-data] Photo upload ${i + 1} failed:`, apiErr.statusCode, apiErr.message, JSON.stringify(apiErr.details));
        throw uploadErr;
      }
    }

    // Step 3: Create cover
    const year = new Date().getFullYear().toString();
    await sweetbookClient.covers.create(bookUid, coverTemplateUid, {
      coverPhoto: photoRefs[0], title: bookTitle, dateRange: year,
    });
    console.log(`[/api/sweetbook/books-from-data] Step 3: cover created`);

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
    console.log(`[/api/sweetbook/books-from-data] Step 4: ${pages.length} pages inserted`);

    // Step 4b: Pad to 24-page minimum
    const BLANK_TEMPLATE_UID = '2mi1ao0Z4Vxl';
    const blankCount = Math.max(0, 24 - pages.length);
    for (let i = 0; i < blankCount; i++) {
      await sweetbookClient.contents.insert(bookUid, BLANK_TEMPLATE_UID, {}, { breakBefore: 'page' });
    }
    if (blankCount > 0) {
      console.log(`[/api/sweetbook/books-from-data] Step 4b: added ${blankCount} blank pages`);
    }

    // Step 5: Finalize
    await sweetbookClient.books.finalize(bookUid);
    console.log(`[/api/sweetbook/books-from-data] Step 5: book finalized`);

    // Step 6: Create order
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

    const orderUid = orderResult.orderUid as string | undefined;
    if (!orderUid) {
      res.status(500).json({ error: 'orders.create returned no orderUid', raw: orderResult });
      return;
    }

    console.log(`[/api/sweetbook/books-from-data] Step 6: order created. orderUid=${orderUid}`);
    res.json({ bookUid, orderUid });
  } catch (err: unknown) {
    console.error('[/api/sweetbook/books-from-data] Failed, rolling back:', err);
    await sweetbookClient.books.delete(bookUid).catch((deleteErr: unknown) => {
      console.error('[/api/sweetbook/books-from-data] Rollback delete failed (ignored):', deleteErr);
    });

    if (err instanceof SweetbookApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.message, details: err.details });
    } else if (err instanceof SweetbookValidationError) {
      res.status(400).json({ error: err.message, field: err.field });
    } else if (err instanceof SweetbookNetworkError) {
      res.status(502).json({ error: 'Sweetbook API network error', message: (err as Error).message });
    } else {
      res.status(500).json({ error: 'Book creation failed', message: (err as Error).message });
    }
  }
});

export const sweebookRouter = router;
