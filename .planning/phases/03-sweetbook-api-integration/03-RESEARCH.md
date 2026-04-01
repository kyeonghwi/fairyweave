# Phase 3: Sweetbook API Integration — Research

**Researched:** 2026-04-01
**Domain:** bookprintapi-nodejs-sdk (GitHub: sweet-book/bookprintapi-nodejs-sdk), Express router integration
**Confidence:** HIGH — SDK source read directly from GitHub; all method signatures verified against actual source

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `bookSpecUid`: 하드코딩 `SQUAREBOOK_HC`
- Cover templateUid: 환경변수 `SWEETBOOK_COVER_TEMPLATE_UID`에서 읽기, 샌드박스에서 1회 확인 후 설정
- Content templateUid: 환경변수 `SWEETBOOK_CONTENT_TEMPLATE_UID`에서 읽기, 샌드박스에서 1회 확인 후 설정
- 환경변수 누락 시 서버 시작 즉시 에러로 명시적 실패 (silent fallback 없음)
- Book creation flow (4 steps — one backend operation):
  1. `client.books.create({ bookSpecUid: 'SQUAREBOOK_HC', title, creationType: 'TEST' })` → `bookUid`
  2. 16장: base64 data URI → `new Blob([buffer])` → `client.photos.upload(bookUid, blob)` → URL 수집
  3. `client.covers.create(bookUid, COVER_TEMPLATE_UID, { coverPhoto: firstImageUrl, title })`
  4. 16× `client.contents.insert(bookUid, CONTENT_TEMPLATE_UID, { photo: imageUrl, text }, { breakBefore: 'page' })`
  5. `client.books.finalize(bookUid)`
- 4-step 중 어느 단계라도 실패 시: `client.books.delete(bookUid)` 후 에러 반환
- `POST /api/sweetbook/books` — body: `{ bookId: string }` → `{ bookUid: string }`
- `POST /api/sweetbook/orders` — body: `{ bookUid, recipientName, recipientPhone, postalCode, address1, address2?, shippingMemo? }` → `{ orderUid: string }`
- generate-book 엔드포인트에는 Sweetbook 호출 추가하지 않음
- `externalRef` 필드 사용 (HTTP 헤더 아님), 값: UUIDv4 — 매 요청마다 백엔드에서 생성
- 환경변수 추가: `SWEETBOOK_API_KEY`, `SWEETBOOK_ENV` (`sandbox`|`live`, 기본 `sandbox`), `SWEETBOOK_COVER_TEMPLATE_UID`, `SWEETBOOK_CONTENT_TEMPLATE_UID`
- Package: `bookprintapi-nodejs-sdk` (GitHub-only, npm registry에 없음)

### Claude's Discretion
- base64 → Blob 변환 구현 세부 (Buffer 패턴)
- SweetbookClient 싱글톤 vs 요청마다 생성
- TypeScript 타입 래핑 수준
- 에러 로깅 포맷

### Deferred Ideas (OUT OF SCOPE)
- 주문 상태 폴링/Webhook → Phase 5 이후 (ENH-03)
- `client.orders.estimate` 견적 표시 → Phase 4 UI에서 고려 가능
- 사진 업로드 병렬화 최적화 → Phase 3에서는 순차 업로드 허용
- bookUid를 내부 BookRecord에 저장하는 영속화 → Phase 4에서 필요시
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SB-01 | Sweetbook GET /templates 호출로 사용 가능한 템플릿 목록 조회 | SDK에 `client.books.list` 존재; templates 전용 리소스는 없음 — CONTEXT.md의 locked decision에 따라 templateUid는 환경변수에서 하드코딩으로 처리 |
| SB-02 | Sweetbook POST /books 호출로 16페이지 책 객체 생성, bookUid 저장 | `client.books.create()` + `client.photos.upload()` + `client.covers.create()` + `client.contents.insert()` + `client.books.finalize()` 전 흐름 확인 |
| SB-03 | Sweetbook POST /orders 호출 시 UUIDv4 Idempotency-Key 포함 | SDK core.js가 모든 요청에 자동으로 `Idempotency-Key` 헤더 삽입 (`generateUuid()` 호출) — 별도 구현 불필요. `externalRef`는 orders.create body 필드로 추가 |
| SB-04 | 주문 완료 후 orderUid 반환 | `orders.create()` 응답에서 `order.orderUid` 추출 후 `{ orderUid }` 반환 |
| SB-05 | API Key는 백엔드 환경변수에서만 관리 | `backend/.env`에 `SWEETBOOK_API_KEY` 추가, `.gitignore` 확인 |
</phase_requirements>

---

## Summary

`bookprintapi-nodejs-sdk`는 npm registry에 등록되지 않은 GitHub-only 패키지다 (`git+https://` URL로 설치). SDK 버전 0.1.0, CommonJS 모듈, Node.js 18+ 내장 fetch 사용. 순수 JS로 작성되어 TypeScript 타입 정의 파일이 없으므로 래퍼 타입은 프로젝트에서 직접 정의해야 한다.

`photos.upload(bookUid, file)`에서 `file` 파라미터는 `FormData.append`에 전달되는 값이므로 Node.js 18+ `Blob` 객체를 그대로 수용한다. base64 data URI → `Buffer.from(base64, 'base64')` → `new Blob([buffer], { type: 'image/png' })` 패턴으로 변환하면 된다. 반환값은 `ResponseParser.getData()`를 거치므로 `{ url, fileName, ... }` 형태의 객체다.

`covers.create`와 `contents.insert`는 `_buildTemplateFormData`를 통해 `templateUid`와 `parameters`를 FormData로 직렬화한다. `parameters`는 JSON.stringify 후 전송되고, 템플릿이 `coverPhoto`/`photo`/`text` 같은 URL 문자열 필드를 기대한다. SDK core.js가 모든 요청에 자동으로 `Idempotency-Key` 헤더(UUID v4)를 생성·삽입하므로 SB-03 요구사항이 자동 충족된다.

**Primary recommendation:** `npm install git+https://github.com/sweet-book/bookprintapi-nodejs-sdk.git` 으로 설치하고, `backend/src/routes/sweetbook.ts` 단일 파일에 `/api/sweetbook/books`와 `/api/sweetbook/orders` 두 엔드포인트를 구현한 뒤 `index.ts`에 `app.use('/api', sweebookRouter)` 마운트.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bookprintapi-nodejs-sdk | 0.1.0 | Sweetbook Books/Orders API 클라이언트 | 과제 지정 SDK — 유일한 공식 클라이언트 |
| uuid | ^9.x (node:crypto 대체) | UUIDv4 생성 (`externalRef`) | `randomUUID()` from `node:crypto`가 Node 18+에서 내장 — 별도 패키지 불필요 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (없음) | — | 추가 의존성 불필요 | Node 18+ 내장 fetch, Blob, FormData로 충분 |

**Installation:**

```bash
# backend 디렉토리에서 실행
npm install git+https://github.com/sweet-book/bookprintapi-nodejs-sdk.git
```

**Version verification:** SDK package.json의 `"version": "0.1.0"` 확인 완료 (2026-04-01 기준).

> 주의: npm registry에 `bookprintapi-nodejs-sdk`가 없음 — git URL 설치 필수.

---

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── routes/
│   ├── generate.ts       # 기존 (Phase 2)
│   └── sweetbook.ts      # 신규 — /api/sweetbook/* 엔드포인트
├── services/
│   ├── bookStore.ts      # 기존
│   └── sweebookClient.ts # 신규 — SweetbookClient 싱글톤 + 환경변수 검증
└── index.ts              # app.use('/api', sweebookRouter) 추가
```

### Pattern 1: SweetbookClient 싱글톤

**What:** 모듈 로드 시 1회 생성, 환경변수 누락 시 즉시 throw.
**When to use:** 요청마다 생성하면 불필요한 객체 생성 비용 발생 — API Key가 런타임에 바뀌지 않으므로 싱글톤이 적합.

```typescript
// Source: lib/client.js (verified from GitHub)
// backend/src/services/sweebookClient.ts

import { SweetbookClient } from 'bookprintapi-nodejs-sdk';

function createClient(): SweetbookClient {
  const apiKey = process.env.SWEETBOOK_API_KEY;
  const env = (process.env.SWEETBOOK_ENV || 'sandbox') as 'sandbox' | 'live';

  if (!apiKey) throw new Error('SWEETBOOK_API_KEY is required');
  if (!process.env.SWEETBOOK_COVER_TEMPLATE_UID) throw new Error('SWEETBOOK_COVER_TEMPLATE_UID is required');
  if (!process.env.SWEETBOOK_CONTENT_TEMPLATE_UID) throw new Error('SWEETBOOK_CONTENT_TEMPLATE_UID is required');

  return new SweetbookClient({ apiKey, environment: env });
}

export const sweetbookClient = createClient();
```

### Pattern 2: base64 data URI → Blob 변환

**What:** `data:image/png;base64,XXXX` 형식에서 base64 부분 추출 후 Node.js Buffer → Blob 변환.
**When to use:** `photos.upload`의 `file` 파라미터에 전달 시.

```typescript
// Source: Node.js 18+ Blob API, 검증됨
function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const buffer = Buffer.from(base64, 'base64');
  return new Blob([buffer], { type: mimeType });
}
```

### Pattern 3: 4-step 책 생성 with 롤백

**What:** 책 생성 → 사진 업로드 → 표지 → 내지 → 최종화. 중간 실패 시 `books.delete` 호출.
**When to use:** `POST /api/sweetbook/books` 핸들러.

```typescript
// Source: examples/01_create_book.js + lib/client.js (verified)
async function createSweetbook(bookId: string): Promise<string> {
  const record = bookStore.get(bookId);
  if (!record) throw new Error('Book not found');

  const book = await sweetbookClient.books.create({
    bookSpecUid: 'SQUAREBOOK_HC',
    title: record.request.childName + '의 동화책',
    creationType: 'TEST',
  });
  const bookUid: string = book.bookUid ?? book.uid;

  try {
    // Step 2: 16장 순차 업로드
    const photoUrls: string[] = [];
    for (const dataUri of record.imageUrls) {
      const blob = dataUriToBlob(dataUri);
      const photo = await sweetbookClient.photos.upload(bookUid, blob);
      photoUrls.push(photo.url);
    }

    // Step 3: 표지
    const coverTemplateUid = process.env.SWEETBOOK_COVER_TEMPLATE_UID!;
    await sweetbookClient.covers.create(bookUid, coverTemplateUid, {
      coverPhoto: photoUrls[0],
      title: record.request.childName + '의 동화책',
    });

    // Step 4: 내지 16장
    const contentTemplateUid = process.env.SWEETBOOK_CONTENT_TEMPLATE_UID!;
    for (let i = 0; i < record.pages.length; i++) {
      await sweetbookClient.contents.insert(
        bookUid,
        contentTemplateUid,
        { photo: photoUrls[i], text: record.pages[i].text },
        { breakBefore: 'page' }
      );
    }

    // Step 5: 최종화
    await sweetbookClient.books.finalize(bookUid);
    return bookUid;
  } catch (err) {
    await sweetbookClient.books.delete(bookUid).catch(() => {});
    throw err;
  }
}
```

### Pattern 4: orders.create 파라미터 구조

**What:** `items` 배열 + `shipping` 객체 + `externalRef` 루트 필드.
**When to use:** `POST /api/sweetbook/orders` 핸들러.

```typescript
// Source: examples/02_order.js + lib/client.js (verified)
import { randomUUID } from 'node:crypto';

const order = await sweetbookClient.orders.create({
  items: [{ bookUid, quantity: 1 }],
  shipping: {
    recipientName,
    recipientPhone,
    postalCode,
    address1,
    address2,        // optional
    shippingMemo,    // optional
  },
  externalRef: randomUUID(),  // UUIDv4, 매 요청마다 새로 생성
});
const orderUid: string = order.orderUid;
```

### Pattern 5: Express 라우터 마운트 (기존 패턴 준수)

```typescript
// Source: backend/src/index.ts 기존 패턴 참조
// index.ts에 추가:
import { sweebookRouter } from './routes/sweetbook';
app.use('/api', sweebookRouter);
// 결과: POST /api/sweetbook/books, POST /api/sweetbook/orders
```

### Anti-Patterns to Avoid

- **photos.upload에 base64 문자열 직접 전달:** `file` 파라미터는 `FormData.append`로 전달되므로 반드시 `Blob` 또는 `File` 객체여야 한다. 문자열 전달 시 API가 잘못된 파일로 처리.
- **환경변수 런타임 읽기(매 요청마다):** 서버 시작 시 1회 검증하고 싱글톤에 캐싱. 누락 시 요청 처리 중 500을 반환하면 진단이 어렵다.
- **books.delete 실패를 throw로 전파:** `delete`는 best-effort 클린업이므로 catch 후 무시. 원본 에러만 클라이언트에 전달.
- **photos.upload 응답에서 URL 필드 가정:** `ResponseParser.getData()` 결과가 `photo.url`에 있는지 `photo.fileName`에 있는지는 API 응답 스키마 의존적. 실제 샌드박스 응답을 확인 후 필드명 결정 필요.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency-Key 헤더 | 직접 헤더 삽입 코드 | SDK core.js 자동 삽입 | `BaseClient._request`가 모든 요청에 `Idempotency-Key: <uuid>` 자동 추가 — 수동 구현 불필요 |
| 재시도 로직 | 직접 retry 루프 | SDK 내장 | 429, 5xx에 대해 지수 백오프 2회 재시도 이미 구현됨 |
| HTTP fetch 래핑 | axios 또는 직접 fetch | SDK 메서드 호출 | SDK가 URL 빌드, 인증 헤더, 에러 파싱을 모두 처리 |
| UUIDv4 생성 | uuid 패키지 설치 | `node:crypto.randomUUID()` | Node 18+에 내장, 추가 의존성 불필요 |

---

## Common Pitfalls

### Pitfall 1: photos.upload 반환값의 URL 필드명

**What goes wrong:** `photo.url`로 접근했더니 `undefined` — 필드명이 다를 수 있음.
**Why it happens:** SDK가 `ResponseParser.getData()`를 반환하므로 실제 API 응답 JSON 스키마에 의존. SDK 소스에는 필드명 정의 없음.
**How to avoid:** 샌드박스에서 `client.photos.upload` 실제 호출 후 응답 객체를 `console.log`로 확인. `photo.url ?? photo.photoUrl ?? photo.fileUrl` 방어 코드 또는 타입 확인 선행.
**Warning signs:** `coverPhoto: undefined`가 covers.create에 전달되면 API 에러.

### Pitfall 2: bookUid 필드명 불일치

**What goes wrong:** `book.bookUid`가 `undefined`인 경우.
**Why it happens:** 예제 코드가 `book.bookUid || book.uid`를 사용 — API 응답이 두 필드 중 하나를 사용.
**How to avoid:** `const bookUid = book.bookUid ?? book.uid` 패턴으로 방어. 마찬가지로 `order.orderUid` 확인.
**Warning signs:** `bookUid`가 `undefined`인 채로 `covers.create` 호출 시 `SweetbookValidationError: bookUid is required`.

### Pitfall 3: Node.js CommonJS 모듈 import

**What goes wrong:** `import { SweetbookClient } from 'bookprintapi-nodejs-sdk'` TypeScript에서 에러.
**Why it happens:** SDK가 CommonJS(`module.exports`)이고 TypeScript 타입 정의(`.d.ts`)가 없음. `tsconfig.json`의 `"esModuleInterop": true`가 켜져 있어야 default import가 동작.
**How to avoid:** `backend/tsconfig.json`에 이미 `"esModuleInterop": true` 확인됨 — named import `{ SweetbookClient }` 방식 사용. TypeScript 타입은 `any` 또는 로컬 인터페이스로 래핑.
**Warning signs:** `Module '"bookprintapi-nodejs-sdk"' has no exported member 'SweetbookClient'` 컴파일 에러.

### Pitfall 4: creationType 누락 시 실제 충전

**What goes wrong:** 샌드박스에서 실제 충전금 차감.
**Why it happens:** `creationType` 기본값이 `'NORMAL'`이므로 명시하지 않으면 TEST가 아닌 실제 과금 모드.
**How to avoid:** 항상 `creationType: 'TEST'`를 명시. 환경변수 `SWEETBOOK_ENV=sandbox`와 별개로 반드시 명시.
**Warning signs:** 샌드박스 잔액이 예상보다 빠르게 감소.

### Pitfall 5: git URL 설치 후 TypeScript 타입 미생성

**What goes wrong:** `import` 후 `Could not find a declaration file` 경고.
**Why it happens:** SDK에 `.d.ts` 파일 없음 — `"skipLibCheck": true`가 tsconfig에 있어 빌드는 통과하지만 IDE 지원 없음.
**How to avoid:** `backend/src/types/sweetbook.d.ts`에 필요한 타입만 선언. 또는 `// @ts-ignore` 최소 사용 (기존 코드에서도 사용한 패턴 — generate.ts:59).

---

## Code Examples

Verified patterns from SDK source:

### SweetbookClient 생성자 (verified: lib/client.js)
```javascript
const client = new SweetbookClient({
  apiKey: 'SB_YOUR_API_KEY',   // 필수
  environment: 'sandbox',       // 'sandbox' | 'live', 기본: 'live'
  baseUrl: 'https://...',       // 선택: 환경 URL 직접 지정
  timeout: 30000                // 선택: ms, 기본 30초
});
// sandbox URL: https://api-sandbox.sweetbook.com/v1
// live URL:    https://api.sweetbook.com/v1
```

### photos.upload (verified: lib/client.js)
```javascript
// file은 FormData.append에 전달되는 값 — Blob, File, Buffer 수용
async upload(bookUid, file, options = {}) {
  const fd = new FormData();
  fd.append('file', file);
  if (options.preserveExif) fd.append('preserveExif', 'true');
  const body = await this._postForm(`/Books/${bookUid}/photos`, fd);
  return new ResponseParser(body).getData();  // { url?, fileName?, ... }
}
```

### covers.create (verified: lib/client.js)
```javascript
// parameters = { coverPhoto: 'https://...', title: '...' }
// files = optional (local file uploads, Phase 3에서는 불필요 — URL 사용)
async create(bookUid, templateUid, parameters, files) {
  const fd = this._buildTemplateFormData(templateUid, parameters, files, 'files');
  // fd에: templateUid, parameters(JSON.stringified), files
  const body = await this._postForm(`/Books/${bookUid}/cover`, fd);
  return new ResponseParser(body).getData();
}
```

### contents.insert (verified: lib/client.js)
```javascript
// parameters = { photo: 'https://...', text: '...' }
// options = { breakBefore: 'page', files: [...] }
async insert(bookUid, templateUid, parameters, options = {}) {
  const { files, breakBefore } = options;
  const fd = this._buildTemplateFormData(templateUid, parameters, files, 'rowPhotos');
  const params = {};
  if (breakBefore) params.breakBefore = breakBefore;
  const body = await this._request('POST', `/Books/${bookUid}/contents`, { formData: fd, params });
  // 응답에 cursor.pageNum, cursor.pageSide 포함 가능
  return new ResponseParser(body).getData();
}
```

### orders.create (verified: examples/02_order.js)
```javascript
const order = await client.orders.create({
  items: [{ bookUid: 'xxx', quantity: 1 }],
  shipping: {
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    postalCode: '06100',
    address1: '서울특별시 강남구 테헤란로 123',
    address2: '4층',           // optional
    shippingMemo: '부재 시 경비실',  // optional
  },
  externalRef: 'FW-' + randomUUID(),  // SDK가 items.length 검증
});
// order.orderUid 반환
```

### credits.sandboxCharge (verified: lib/client.js + examples/02_order.js)
```javascript
// 샌드박스 잔액 부족 시 1회 실행
await client.credits.sandboxCharge(100000, 'SDK 테스트 충전');
```

### 에러 처리 패턴 (verified: lib/core.js)
```typescript
import { SweetbookApiError, SweetbookNetworkError, SweetbookValidationError } from 'bookprintapi-nodejs-sdk';

try {
  // SDK 호출
} catch (err) {
  if (err instanceof SweetbookApiError) {
    // err.statusCode, err.errorCode, err.details
    res.status(err.statusCode ?? 500).json({ error: err.message, details: err.details });
  } else if (err instanceof SweetbookValidationError) {
    res.status(400).json({ error: err.message, field: err.field });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| axios 기반 HTTP 클라이언트 | Node 18+ 내장 fetch | Node 18 (2022) | 외부 HTTP 의존성 0 |
| npm registry 배포 | GitHub-only git URL 설치 | SDK 설계부터 | `npm install git+https://...` 필요 |

---

## Open Questions

1. **photos.upload 응답 URL 필드명**
   - What we know: `ResponseParser.getData()` 반환 — 실제 필드명은 API 서버 응답 스키마에 의존
   - What's unclear: `url`인지 `photoUrl`인지 `fileUrl`인지 — SDK 소스에 정의 없음
   - Recommendation: Wave 0 또는 구현 초기에 실제 sandbox 호출 후 `console.log(photo)` 확인. `photo.url ?? photo.photoUrl` 방어 접근

2. **템플릿 UID 값 (SWEETBOOK_COVER_TEMPLATE_UID, SWEETBOOK_CONTENT_TEMPLATE_UID)**
   - What we know: CONTEXT.md에서 "샌드박스에서 1회 확인 후 환경변수에 저장"으로 결정됨
   - What's unclear: 실제 값 — 플래너가 이 작업을 Wave 0에 명시적 태스크로 포함시켜야 함
   - Recommendation: `GET /Books/:bookUid/cover` 또는 Sweetbook 대시보드에서 템플릿 목록 확인 태스크를 Wave 0에 추가

---

## Validation Architecture

프로젝트에 테스트 프레임워크 미설정 (pytest.ini, jest.config.*, vitest.config.* 없음; backend/package.json에 test 스크립트 없음).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음 — Wave 0에 설정 불필요 (수동 sandbox 검증으로 충분) |
| Config file | 없음 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SB-01 | 템플릿 UID 환경변수 검증 | manual | 서버 시작 → 환경변수 누락 시 에러 메시지 확인 | N/A |
| SB-02 | 책 생성 → bookUid 반환 | manual-sandbox | `curl -X POST localhost:3001/api/sweetbook/books -d '{"bookId":"..."}' ` | N/A |
| SB-03 | Idempotency-Key 헤더 포함 | automatic (SDK) | SDK core.js 내장 — 별도 테스트 불필요 | N/A |
| SB-04 | orderUid 반환 | manual-sandbox | `curl -X POST localhost:3001/api/sweetbook/orders -d '{...}'` | N/A |
| SB-05 | API Key 환경변수 관리 | manual | .env, .gitignore 파일 확인 | N/A |

### Wave 0 Gaps

- [ ] `backend/.env`에 `SWEETBOOK_API_KEY`, `SWEETBOOK_ENV=sandbox` 추가
- [ ] `SWEETBOOK_COVER_TEMPLATE_UID`, `SWEETBOOK_CONTENT_TEMPLATE_UID` — 샌드박스 확인 후 설정
- [ ] `backend/.env` `.gitignore`에 등록 확인 (루트 `.gitignore` 또는 `backend/.gitignore`)

---

## Sources

### Primary (HIGH confidence)
- `https://github.com/sweet-book/bookprintapi-nodejs-sdk` — GitHub API로 lib/client.js, lib/core.js, index.js, examples/01_create_book.js, examples/02_order.js, package.json 직접 다운로드 및 분석
- `backend/src/routes/generate.ts` — 기존 Express 라우터 패턴 확인
- `backend/src/services/bookStore.ts` — bookStore.get(id) 반환 타입 확인
- `backend/src/types/story.ts` — BookRecord.imageUrls가 base64 data URI 배열임 확인
- `backend/tsconfig.json` — esModuleInterop: true, target: ES2022 확인
- `backend/package.json` — bookprintapi-nodejs-sdk 미설치 확인

### Secondary (MEDIUM confidence)
- GitHub README (WebFetch) — 생성자 파라미터, 환경변수 목록 확인

### Tertiary (LOW confidence)
- photos.upload 응답 필드명 (`url`) — SDK 소스에서 확인 불가, 실제 sandbox 호출 필요

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK 소스 직접 확인
- Architecture: HIGH — 기존 Express 라우터 패턴 + SDK 예제 양쪽 확인
- Pitfalls: HIGH (photos.upload URL 필드명 제외) / LOW (URL 필드명)

**Research date:** 2026-04-01
**Valid until:** SDK가 업데이트되기 전까지 (현재 v0.1.0, 활발한 개발 중 가능성 있으므로 설치 전 재확인 권장)
