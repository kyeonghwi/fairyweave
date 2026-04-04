# FairyWeave 제출 로그

> Claude Code가 개발 과정에서 자동으로 업데이트합니다. 구글폼 제출 시 참고하세요.

---

## 3. 사용한 Book Print API 엔드포인트

| API | 용도 | 사용 시점 |
|-----|------|----------|
| `POST /books` | 책 객체 생성 (bookUid 획득): books.create → photos.upload × 16 → covers.create → contents.insert × 16 → books.finalize | Phase 3 |
| `POST /orders` | 주문 전송 (Idempotency-Key SDK 자동 삽입, externalRef UUIDv4 포함) | Phase 3 |
| `POST /books` + `POST /orders` | books-from-data 통합 엔드포인트: 더미북/AI북 데이터를 직접 받아 책 생성 + 주문까지 한 번에 처리 | Phase 4 |
| `GET /templates?bookSpecUid=` | 책 사양별 템플릿 UID 동적 조회 (cover/content 템플릿 자동 매칭) | Phase 5 |
| `GET /orders/:orderUid` | 주문 상태 및 가격 정보 조회 | Phase 5 |
| `POST /orders/estimate` | 주문 전 크레딧 잔액 검증 | Phase 7 |

---

## 4. AI 도구 사용 내역

| AI 도구 | 활용 내용 | 시점 |
|---------|----------|------|
| Claude Code | Phase 1 — 모노레포 스캐폴딩 (package.json, Next.js 16, Express 백엔드 구조 생성) | 2026-04-01 |
| Claude Code | Phase 1 — Gemini API 스파이크 (`POST /api/generate`, `POST /api/generate-image` 라우트 구현) | 2026-04-01 |
| Claude Code | Phase 1 — 모델 선택: gemini-2.0-flash가 신규 계정에서 404 반환 → gemini-2.5-flash / gemini-2.5-flash-image로 교체 | 2026-04-01 |
| Claude Code | Phase 2 — 스토리 타입 정의 (StoryPage, GenerateStoryRequest, GenerateStoryResponse, BookRecord) 및 storyGenerator 서비스 구현 | 2026-04-01 |
| Claude Code | Phase 2 — POST /api/generate-story 엔드포인트 구현 (메타-프롬프트 엔지니어링, JSON 파싱, 스타일 시드 주입) | 2026-04-01 |
| Claude Code | Phase 2 — imageGenerator 서비스 구현 (Promise.allSettled로 16장 병렬 생성, 개별 실패 시 placeholder 처리) | 2026-04-01 |
| Claude Code | Phase 2 — bookStore 서비스 구현 (in-memory Map 기반 BookRecord 저장/조회) | 2026-04-01 |
| Claude Code | Phase 2 — POST /api/generate-book (전체 파이프라인) 및 GET /api/books/:id 엔드포인트 구현 | 2026-04-01 |
| Claude Code | Phase 3 — bookprintapi-nodejs-sdk 설치, sweetbook.d.ts TypeScript 타입 선언, sweebookClient.ts 싱글턴 서비스 구현 (startup env var validation) | 2026-04-01 |
| Claude Code | Phase 3 — sweetbook.ts 라우트 구현: POST /api/sweetbook/books (5-step 책 생성 + 롤백), POST /api/sweetbook/orders (UUIDv4 externalRef), index.ts에 sweebookRouter 마운트 | 2026-04-01 |
| Claude Code | Phase 3 — sweebookClient.ts TS2352 수정: Proxy get trap에서 `unknown` 중간 캐스트 삽입 (`_client as unknown as Record<string \| symbol, unknown>`) | 2026-04-01 |
| Claude Code | Phase 3 — VERIFICATION.md 갭 해소: SB-01 설계 결정 확인 (템플릿 UID를 샌드박스에서 1회 조회 후 env var 저장하는 방식이 요구사항 충족) 및 문서 상태 업데이트 | 2026-04-01 |
| Claude Code | Phase 4 — 프론트엔드 UI 전체 구현: Home(Hero+Gallery), Create(폼+로딩), Book(프리뷰 슬라이더+주문+완료) 3개 페이지 | 2026-04-02 |
| Claude Code | Phase 4 — 디자인 시스템: Jua+Pretendard 듀얼 폰트, WCAG AA 색상, 공유 컴포넌트 9종(Button/FormField/ThemeChip/BookCard/PageSlider/ProgressBar/ErrorBanner/OrderSummary/PageLayout) | 2026-04-02 |
| Claude Code | Phase 4 — 더미 데이터: 5권(공룡/우주/마법/바다/숲) × 16페이지 스토리 + SVG placeholder 이미지 | 2026-04-02 |
| Claude Code | Phase 4 — POST /api/sweetbook/books-from-data 백엔드 엔드포인트 (더미북/직접 데이터 주문용) | 2026-04-02 |
| Claude Code | Phase 4 — Next.js rewrites 프록시 설정 (프론트 /api/* → 백엔드 localhost:3001) | 2026-04-02 |
| Claude Code | Phase 4 — Gemini JSON 파싱 강화: responseMimeType + 배열 추출 + trailing comma 제거 | 2026-04-02 |
| Claude Code | Phase 4 — AI 생성 프록시 타임아웃 해결: generate-book을 백엔드 직접 호출로 변경 | 2026-04-02 |
| Claude Code | Phase 4 — 책 데이터 전달: window.__bookCache로 create→book 페이지 간 데이터 핸드오프 (base64 이미지 sessionStorage 초과 해결) | 2026-04-02 |
| Claude Code | Phase 4 — PageSlider object-cover → object-contain 변경 (AI 생성 이미지 잘림 방지) | 2026-04-02 |
| Claude Code | Phase 5 — SVG→PNG placeholder 변환 버그픽스: MIME 타입 regex 수정 + zlib 512x512 PNG 런타임 생성으로 Sweetbook photo upload 400/500 해결 | 2026-04-03 |
| Claude Code | Phase 5 — CEO 리뷰 후 코드 품질 개선: sweetbook.ts DRY 리팩토링(공유 함수 추출), moral 필드 버그 수정, 만료 책 UX 개선, 고아 파일 제거, 유닛 테스트 11개 추가 | 2026-04-03 |
| Claude Code | Phase 5 — 멀티 책 사양 지원: BookSpecUid 타입 (SQUAREBOOK_HC, PHOTOBOOK_A4_SC, PHOTOBOOK_A5_SC), 사양별 템플릿 API 동적 조회, 프론트엔드 포맷 선택 UI | 2026-04-03 |
| Claude Code | Phase 5 — 비동기 생성 + 폴링: generate-book이 bookId 즉시 반환, 백그라운드 생성 진행률을 GET /status로 폴링, 프론트엔드 프로그레스 바 표시 | 2026-04-03 |
| Claude Code | Phase 5 — 표지 이미지 분리: storyGenerator가 coverImagePrompt 반환, generateCoverImage 별도 생성, Sweetbook에 커버 전용 이미지 업로드 | 2026-04-03 |
| Claude Code | Phase 5 — 이미지 생성 개선: 동시 4개 워커 풀, 429 rate limit 시 지수 백오프 재시도 (최대 2회) | 2026-04-03 |
| Claude Code | Phase 5 — bookStore TTL + 용량 제한: 30분 만료, 최대 20권, 메모리 누수 방지 | 2026-04-03 |
| Claude Code | Phase 5 — 프론트엔드 한국어 전면 현지화: 네비게이션, 푸터, 생성 폼, 책 뷰어, 홈페이지 | 2026-04-03 |
| Claude Code | Phase 5 — 주문 가격 표시: orders API 응답에서 totalAmount, unitPrice, pageCount 추출하여 UI에 표시 | 2026-04-03 |
| Claude Code | Phase 5 — 입력 검증 강화: storyGenerator 입력 sanitize (제어문자/템플릿 문자 제거), age 상한 12→10 조정 | 2026-04-03 |
| Claude Code | Phase 6 — 실제 동화책 레이아웃 조사 후 BookViewer 구현: 데스크탑 오픈북 spread(좌=일러스트/우=텍스트), CSS 3D flipForward/flipBackward 페이지 넘김 애니메이션, 모바일 이미지+텍스트 오버레이 뷰 | 2026-04-03 |
| Claude Code | Phase 6 — 페이지 넘김 애니메이션 버그픽스: back-face 미러링 제거, z-index 타이밍 조정, translateX 방향 수정으로 자연스러운 플립 동작 완성 | 2026-04-03 |
| Claude Code | Phase 7 — credits 검증 로직 및 book-specs 엔드포인트 구현: POST /orders/estimate 호출로 주문 전 잔액 확인, 부족 시 402 반환, GET /api/sweetbook/book-specs 로컬 엔드포인트 추가 | 2026-04-04 |
| Claude Code | Phase 8 — Language 유니온 타입 추가, StoryPage.textEn 옵셔널 필드, GenerateStoryRequest.language 옵셔널 필드 (story.ts 타입 확장) | 2026-04-04 |
| Claude Code | Phase 8 — storyGenerator에 언어별 프롬프트 분기 추가: korean(기존 동일), english(영어 텍스트), bilingual(text=한국어, textEn=영어 동시 생성) | 2026-04-04 |
| Claude Code | Phase 8 — generate.ts 라우트에서 language 파라미터 추출 및 검증, generateStory 호출 시 전달 (generate-story + generate-book 양쪽) | 2026-04-04 |
| Gemini 2.5 Flash | 텍스트 스토리 생성 API 호출 검증 | 2026-04-01 |
| Gemini 2.5 Flash Image | 이미지 생성 API 호출 검증 (base64 PNG 반환 확인) | 2026-04-01 |

---

## 5. 설계 의도

### 왜 이 서비스를 선택했는지
맞춤 동화책은 부모의 감성적 소비 욕구와 AI 생성의 저비용 구조가 만나는 접점입니다. Sweetbook API가 인쇄-배송을 처리하므로 재고 없이 주문형 생산이 가능합니다.

### 비즈니스 가능성
AI 생성 비용은 권당 수십 원이지만 실물 동화책의 감성 가치는 수만 원입니다. 형제, 생일, 기념일마다 반복 주문이 발생하는 구조로 LTV가 높습니다.

### 시간이 더 있었다면 추가했을 기능
Gemini 레퍼런스 이미지로 캐릭터 일관성 강화, 부모가 스토리를 직접 편집하는 co-creation 기능, Sweetbook Webhook으로 주문 상태 실시간 추적.

---

## 구글폼 문항

### 문항 1: 과제 수행 과정
Phase 1에서 Next.js 16 + Express 모노레포를 구성하고 Gemini 2.5 Flash API 연동을 검증했습니다. Phase 2에서 메타-프롬프트 엔지니어링으로 16페이지 스토리 JSON 생성 파이프라인을 만들고, Promise.allSettled로 16장 삽화를 병렬 생성했습니다. Phase 3에서 Sweetbook SDK로 5-step 책 생성(create → upload → cover → contents → finalize) + 주문 플로우를 구현했습니다. Phase 4에서 프론트엔드 UI 3페이지(홈/생성/책 프리뷰+주문)와 더미 데이터 5권을 완성했습니다. Phase 5에서 멀티 책 사양(3종), 비동기 생성+폴링 UX, 표지 이미지 분리, 이미지 동시생성 워커 풀, 한국어 현지화, 주문 가격 표시를 추가했습니다. Phase 6에서 실제 동화책처럼 보이는 BookViewer를 구현했습니다. 데스크탑은 좌(일러스트)/우(텍스트) 오픈북 스프레드에 CSS 3D 페이지 넘김 애니메이션을 적용했고, 모바일은 이미지 위에 텍스트를 오버레이하는 뷰로 전환됩니다. Phase 7에서 주문 전 크레딧 잔액을 POST /orders/estimate로 검증하는 로직을 추가하고, 책 사양 목록을 반환하는 GET /api/sweetbook/book-specs 엔드포인트를 구현했습니다. Phase 8에서 한국어/영어/이중언어 칩 UI를 추가하고, 이중언어 선택 시 Gemini가 text(한국어)와 textEn(영어)을 동시에 생성하여 책 뷰어에 두 언어를 함께 표시하는 기능을 구현했습니다.

### 문항 2: API를 써보고 느낀 점
SDK에 TypeScript 타입 정의가 없어서 메서드 시그니처를 추측하며 .d.ts를 직접 작성해야 했습니다. books.create → photos.upload × 16 → covers.create → contents.insert × 16 → books.finalize로 이어지는 5단계 생성 플로우는 유연하지만 진입 장벽이 높습니다. 한 번의 API 호출로 책을 생성할 수 있는 convenience 메서드가 있으면 개발 속도가 크게 개선될 것입니다. 샌드박스 환경에서 creationType: 'TEST'로 과금 없이 테스트할 수 있어 안심하고 반복 실험이 가능했습니다. multipart 업로드 시 Blob이 아닌 File 객체를 요구하는 점은 문서에 명시되어 있지 않아 디버깅에 시간이 걸렸습니다.

### 문항 3: 과제에서 내린 가장 중요한 판단
가장 중요한 판단은 Gemini JSON 파싱 전략이었습니다. LLM 출력이 항상 완벽한 JSON이 아니라는 전제로, responseMimeType 강제 + 배열 추출 + trailing comma 제거의 3중 방어를 설계했습니다. 두 번째는 AI 생성 엔드포인트를 Next.js 프록시 대신 백엔드 직접 호출로 분리한 것입니다. 수 분 걸리는 요청에 프록시 타임아웃이 맞지 않았고, 장시간 요청만 분리하여 나머지 API는 프록시의 편의성을 유지했습니다. 세 번째는 generate-book을 비동기 폴링 방식으로 전환한 것입니다. bookId를 즉시 반환하고 백그라운드에서 생성하면서 progress 엔드포인트로 상태를 노출하여, 사용자가 긴 대기 시간 동안 진행 상황을 확인할 수 있게 했습니다. 네 번째는 템플릿 UID를 env var 하드코딩에서 API 동적 조회로 전환한 것입니다. 멀티 책 사양 지원 시 사양마다 env var를 관리하는 것은 확장성이 없어, 시작 시 API로 조회하되 env var를 fallback으로 두는 방식을 선택했습니다.

### 문항 4: AI 도구 사용 중 겪은 실패 또는 문제
Gemini 2.0 Flash가 신규 계정에서 404를 반환하여 ListModels API로 사용 가능 모델을 확인한 뒤 2.5 Flash로 교체했습니다. LLM이 trailing comma가 포함된 JSON을 반환하여 파싱이 실패했고, responseMimeType 강제와 정규식 후처리로 해결했습니다. Next.js rewrites 프록시가 AI 생성의 긴 응답 시간에 ECONNRESET을 발생시켜, 해당 엔드포인트만 백엔드 직접 호출로 변경했습니다. 16장의 base64 이미지가 sessionStorage 5MB 제한을 초과하여, window 객체에 임시 캐시하는 방식으로 페이지 간 데이터를 전달했습니다.

---

## 트러블슈팅 기록

| 날짜 | 문제 | 원인 | 해결 |
|------|------|------|------|
| 2026-04-01 | gemini-2.0-flash 404 | 신규 계정에 제공 중단 | gemini-2.5-flash로 교체 |
| 2026-04-01 | gemini-2.0-flash-exp 이미지 생성 안됨 | 모델 미지원 | gemini-2.5-flash-image로 교체 |
| 2026-04-01 | gsd-tools 플랜 파일 미인식 | 파일명 형식 불일치 | `01-01-PLAN.md` 형식으로 변경 |
| 2026-04-02 | SVG data URI btoa() InvalidCharacterError | 한글/이모지 포함 SVG를 btoa()로 base64 인코딩 시 실패 | encodeURIComponent() 방식으로 변경 |
| 2026-04-02 | Gemini JSON 파싱 실패 (position 3548) | LLM이 trailing comma 포함 JSON 반환 | responseMimeType: 'application/json' + 배열 추출 + trailing comma 정규식 제거 |
| 2026-04-02 | Next.js 프록시 ECONNRESET | AI 생성이 수 분 걸려 프록시 타임아웃 | generate-book 엔드포인트를 localhost:3001 직접 호출로 변경 |
| 2026-04-02 | 책 페이지 "Failed to fetch" | tsx watch가 백엔드 재시작 → in-memory store 초기화 + sessionStorage 5MB 제한 초과 | window.__bookCache로 클라이언트 메모리 핸드오프 |
| 2026-04-02 | PageSlider 이미지 양쪽 잘림 | object-cover + 고정 aspect-[3/4]가 AI 이미지 비율과 불일치 | object-contain으로 변경, 고정 비율 제거 |
| 2026-04-03 | 더미 북 주문 시 Sweetbook photos.upload 400/500 | 더미 이미지가 SVG data URI인데 dataUriToFile이 base64로 디코딩 시도 + 1x1 PNG는 서버 거부 | SVG MIME 감지 후 zlib으로 생성한 512x512 PNG로 대체 |

---

## 더미 데이터 경로 수동 테스트 체크리스트

> D-10: 더미 데이터 경로만 수동 테스트 (AI 생성은 rate limit + 대기시간 이슈로 생략)
> D-11: 샌드박스 실제 주문 테스트 (creationType: TEST)

| # | 테스트 항목 | 기대 결과 | Pass/Fail | 비고 |
|---|-----------|----------|-----------|------|
| 1 | `npm run dev` 실행 | 프론트엔드(3000) + 백엔드(3001) 동시 시작 | Pass | |
| 2 | http://localhost:3000 접속 | 홈페이지 로드, 더미 북 5권 갤러리 표시 | Pass | |
| 3 | 더미 북 클릭 | 책 프리뷰 페이지 이동, 16페이지 슬라이더 표시 | Pass | |
| 4 | 주문 폼 작성 (이름/주소/전화번호) | 폼 입력 정상 동작 | Pass | |
| 5 | 주문 제출 | 완료 화면에 orderUid 표시 | Pass | orderUid=or_4QK4i8R0OXao |
| 6 | 백엔드 콘솔 확인 | Sweetbook API 호출 로그 (creationType: TEST) | Pass | 16장 photo upload + cover + 16 pages + 8 blank + finalize + order 완료 |
