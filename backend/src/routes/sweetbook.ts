import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { sweetbookClient } from '../services/sweebookClient';
import { bookStore } from '../services/bookStore';
import {
  SweetbookApiError,
  SweetbookNetworkError,
  SweetbookValidationError,
} from 'bookprintapi-nodejs-sdk';

const router = Router();

// Convert base64 data URI to Node.js Blob
function dataUriToBlob(dataUri: string): Blob {
  const commaIdx = dataUri.indexOf(',');
  const header = dataUri.slice(0, commaIdx);
  const base64 = dataUri.slice(commaIdx + 1);
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const buffer = Buffer.from(base64, 'base64');
  return new Blob([buffer], { type: mimeType });
}

// Extract URL from photos.upload response — field name varies by API response
function extractPhotoUrl(photo: Record<string, unknown>): string {
  const url = (photo.url ?? photo.photoUrl ?? photo.fileUrl) as string | undefined;
  if (!url) {
    throw new Error(
      `photos.upload response missing URL field. Got keys: ${Object.keys(photo).join(', ')}`
    );
  }
  return url;
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

    const photoUrls: string[] = [];
    for (let i = 0; i < record.imageUrls.length; i++) {
      const blob = dataUriToBlob(record.imageUrls[i]);
      const photo = await sweetbookClient.photos.upload(bookUid, blob) as Record<string, unknown>;
      const photoUrl = extractPhotoUrl(photo);
      photoUrls.push(photoUrl);
      console.log(`[/api/sweetbook/books] Step 2: uploaded photo ${i + 1}/${record.imageUrls.length}`);
    }

    // Step 3: Create cover using first image
    await sweetbookClient.covers.create(
      bookUid,
      coverTemplateUid,
      { coverPhoto: photoUrls[0], title: bookTitle }
    );
    console.log(`[/api/sweetbook/books] Step 3: cover created`);

    // Step 4: Insert 16 content pages
    for (let i = 0; i < record.pages.length; i++) {
      await sweetbookClient.contents.insert(
        bookUid,
        contentTemplateUid,
        { photo: photoUrls[i], text: record.pages[i].text },
        { breakBefore: 'page' }
      );
    }
    console.log(`[/api/sweetbook/books] Step 4: ${record.pages.length} pages inserted`);

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

export const sweebookRouter = router;
