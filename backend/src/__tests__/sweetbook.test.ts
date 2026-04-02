import { describe, it, expect } from 'vitest';
import { deflateSync } from 'node:zlib';

// --- dataUriToFile logic (extracted for testability) ---

function buildPlaceholderPng(): Buffer {
  const W = 512, H = 512;
  const rowSize = 1 + W * 3;
  const raw = Buffer.alloc(rowSize * H);
  for (let y = 0; y < H; y++) {
    const off = y * rowSize;
    raw[off] = 0;
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
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const FALLBACK_PNG = buildPlaceholderPng();

function dataUriToFile(dataUri: string, filename: string): File {
  const commaIdx = dataUri.indexOf(',');
  const header = dataUri.slice(0, commaIdx);
  const data = dataUri.slice(commaIdx + 1);
  const mimeType = header.match(/:(.*?)(?:;|$)/)?.[1] ?? 'image/png';

  if (mimeType === 'image/svg+xml') {
    return new File([FALLBACK_PNG], filename, { type: 'image/png' });
  }

  const isBase64 = header.includes(';base64');
  const buffer = isBase64
    ? Buffer.from(data, 'base64')
    : Buffer.from(decodeURIComponent(data), 'utf-8');
  return new File([buffer], filename, { type: mimeType });
}

// --- Tests ---

describe('buildPlaceholderPng', () => {
  it('produces a valid PNG with correct header', () => {
    const png = buildPlaceholderPng();
    // PNG magic bytes
    expect(png[0]).toBe(137);
    expect(png[1]).toBe(80);  // P
    expect(png[2]).toBe(78);  // N
    expect(png[3]).toBe(71);  // G
    expect(png.length).toBeGreaterThan(100);
  });

  it('encodes 512x512 dimensions in IHDR', () => {
    const png = buildPlaceholderPng();
    // IHDR starts after 8-byte sig + 4-byte length + 4-byte type = offset 16
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width).toBe(512);
    expect(height).toBe(512);
  });
});

describe('dataUriToFile', () => {
  it('converts base64 PNG data URI to File', () => {
    // 1x1 red pixel PNG (minimal valid)
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const file = dataUriToFile(dataUri, 'test.png');

    expect(file.name).toBe('test.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBeGreaterThan(0);
  });

  it('substitutes SVG data URI with fallback PNG', () => {
    const svgUri = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3C/svg%3E';
    const file = dataUriToFile(svgUri, 'placeholder.png');

    expect(file.type).toBe('image/png');
    expect(file.size).toBe(FALLBACK_PNG.length);
  });

  it('handles URL-encoded (non-base64) data URI', () => {
    const encoded = 'data:text/plain,' + encodeURIComponent('hello world');
    const file = dataUriToFile(encoded, 'text.txt');

    expect(file.type).toBe('text/plain');
    expect(file.size).toBe(11); // "hello world"
  });
});

describe('extractPhotoRef', () => {
  function extractPhotoRef(photo: Record<string, unknown>): string {
    const ref = (photo.fileName ?? photo.url ?? photo.photoUrl ?? photo.fileUrl) as string | undefined;
    if (!ref) {
      throw new Error(
        `photos.upload response missing reference field. Got keys: ${Object.keys(photo).join(', ')}`
      );
    }
    return ref;
  }

  it('extracts fileName when present', () => {
    expect(extractPhotoRef({ fileName: 'abc123.png' })).toBe('abc123.png');
  });

  it('falls back to url field', () => {
    expect(extractPhotoRef({ url: 'https://example.com/img.png' })).toBe('https://example.com/img.png');
  });

  it('throws when no known field exists', () => {
    expect(() => extractPhotoRef({ unknownField: 'value' })).toThrow('missing reference field');
  });
});

describe('story JSON parsing', () => {
  it('repairs trailing commas before ] and }', () => {
    const badJson = '[{"a": 1,}, {"b": 2,},]';
    const repaired = badJson.replace(/,\s*([\]}])/g, '$1');
    expect(() => JSON.parse(repaired)).not.toThrow();
    expect(JSON.parse(repaired)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('extracts JSON array from markdown-fenced response', () => {
    const response = '```json\n[{"pageNumber":1}]\n```';
    const fenceMatch = response.match(/```json?\n?([\s\S]*?)```/);
    expect(fenceMatch).not.toBeNull();
    expect(JSON.parse(fenceMatch![1])).toEqual([{ pageNumber: 1 }]);
  });

  it('extracts outermost array from mixed text', () => {
    const response = 'Here is the story: [{"page":1}] hope you like it';
    const arrStart = response.indexOf('[');
    const arrEnd = response.lastIndexOf(']');
    const jsonStr = response.slice(arrStart, arrEnd + 1);
    expect(JSON.parse(jsonStr)).toEqual([{ page: 1 }]);
  });
});
