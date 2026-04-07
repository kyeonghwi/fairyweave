# FairyWeave

## 1. 서비스 소개

부모가 아이 정보(이름, 나이, 테마, 교훈)를 입력하면 AI가 세상에 단 하나뿐인 맞춤 동화책을 생성하고, Sweetbook API로 실물 책을 주문할 수 있는 웹 서비스입니다.

**타겟:** 0~7세 자녀를 둔 부모

**주요 기능:**
- Gemini AI 기반 스토리 + 삽화 자동 생성 (비동기 폴링 + 진행률 표시, 페이지 수 동적 조절)
- **2단계 생성 파이프라인** — 스토리 생성 후 `/story-review`에서 내용 검토·재작성, 이후 이미지 생성
- **스토리 검토 화면** — 생성된 제목·페이지 텍스트 전체 확인, AI 지시어로 전체 스토리 재작성 후 이미지 생성 시작
- 3종 책 사양 선택 (정사각형 하드커버, A4/A5 소프트커버) — API에서 동적 조회
- CSS 3D 페이지-플립 애니메이션 책 뷰어 (데스크탑 오픈북 스프레드 / 모바일 슬라이더)
- 인라인 텍스트 편집 — 완성된 책에서도 AI 생성 텍스트를 직접 수정 후 인쇄 반영
- SQLite 임시 저장 — 생성된 책 30분간 보존, 최대 20권 (better-sqlite3, WAL 모드)
- **사진 기반 캐릭터 일관성** — 아이 사진 업로드 시 Gemini Vision이 외모 특징을 텍스트로 추출, 모든 페이지 이미지 프롬프트에 자동 반영 (Image-to-Text-to-Image 파이프라인)
- 한국어/영어/이중언어 동화 생성 지원
- Sweetbook Print API 연동 실물 책 주문 (주문 가격 실시간 표시)
- 운영 대시보드 (`/dashboard`) — 주문 관리(취소/배송지 수정), 크레딧 잔액/내역 (데스크탑 전용)
- 더미 데이터 5권으로 즉시 체험 가능 (커버 이미지 포함)

---

## 2. 실행 방법

```bash
# 1. 의존성 설치
npm install && npm install --prefix frontend && npm install --prefix backend

# 2. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 아래 API 키를 입력하세요:
#   GEMINI_API_KEY=...
#   SWEETBOOK_API_KEY=...

# 3. 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:3000  
백엔드: http://localhost:3001

---

## 3. 사용한 API 목록

| API 엔드포인트 | 용도 |
|----------------|------|
| `POST /books` (books.create) | 빈 책 객체 생성, bookUid 획득 |
| `POST /books/:bookUid/photos` (photos.upload) | 삽화 이미지 업로드 |
| `PUT /books/:bookUid/cover` (covers.create) | 표지 템플릿 적용 |
| `PUT /books/:bookUid/contents` (contents.insert) | 본문 배치 |
| `POST /books/:bookUid/finalize` (books.finalize) | 책 확정 (편집 잠금) |
| `POST /orders` | 주문 생성 |
| `GET /book-specs` | 판형 목록 동적 조회 |
| `GET /templates?bookSpecUid=` | 사양별 템플릿 UID 동적 조회 |
| `GET /orders/:orderUid` | 주문 상태 및 가격 조회 |
| `POST /orders/estimate` | 주문 전 크레딧 잔액 검증 |
| `GET /orders` | 주문 목록 조회 |
| `POST /orders/:orderUid/cancel` | 주문 취소 |
| `GET /credits` | 충전금 잔액 조회 |
| `GET /credits/transactions` | 충전금 거래 내역 조회 |
| `GET /book-specs/:specUid` | 판형 상세 조회 (가격 정보 포함) |
| `GET /books` | 책 목록 조회 (status/limit/offset 필터) |
| `GET /books/:bookUid` | 책 상태 조회 (pageCount, status, createdAt) |
| `PATCH /orders/:orderUid/shipping` | 배송지 수정 (PAID/PDF_READY 상태에서 가능) |
| `GET /templates/:templateUid` | 템플릿 상세 조회 (파라미터 정의, 레이아웃, 썸네일) |

---

## 4. AI 도구 사용 내역

### 서비스 내 AI 활용 (런타임)

| AI 도구 | 활용 내용 |
|---------|----------|
| Gemini 2.5 Flash (텍스트) | 동화 스토리 생성, AI 지시어 기반 전체 스토리 재작성, 페이지별 이미지 프롬프트 생성, 제목 생성 |
| Gemini 2.5 Flash (멀티모달/Vision) | 아이 사진 업로드 시 외모 특징(머리 스타일, 안경 유무 등) 텍스트 추출 — Image-to-Text-to-Image 파이프라인 |
| Gemini 2.5 Flash Image (이미지) | 페이지별 삽화 생성 — 추출된 캐릭터 외모 특징을 프롬프트에 반영해 일관된 주인공 캐릭터 유지 |

### 개발 도구로 활용

| AI 도구 | 활용 내용 |
|---------|----------|
| Claude Code (Anthropic) | 프로젝트 전체 구현: 모노레포 설정, 백엔드 API, 프론트엔드 UI, Sweetbook 연동, 테스트 |
| OpenAI Codex 5.4 | 기능 구현 계획 검증 및 코드 품질 검증 |
| Gemini 3.1 Pro | 서비스 컨셉, 기능 범위, UX 플로우 아이디어 회의 |
| Stitch | 프론트엔드 페이지 레이아웃 및 컴포넌트 디자인 초안 생성 |

---

## 5. 설계 의도

**왜 이 서비스를 선택했는지**

맞춤 동화책은 부모의 감성적 소비 욕구와 AI 생성의 저비용 구조가 만나는 접점입니다. Sweetbook API가 인쇄-배송을 처리하므로 재고 없이 주문형 생산이 가능합니다.

**비즈니스 가능성**

FairyWeave의 비즈니스 모델은 LTV > CAC 아비트리지에 기반합니다. AI 동화책 생성 비용(Gemini API 호출)은 권당 수십 원 수준이지만, 실물 책의 감성적 가치와 개인화 프리미엄이 결합되어 높은 고객 생애가치를 만듭니다. 반복 주문(형제, 생일, 기념일)이 자연스럽게 발생하는 구조입니다.

**핵심 구현 선택**

- **2단계 생성 + 스토리 검토**: 스토리 생성 직후 `/story-review` 화면에서 전체 내용 확인, AI 지시어(예: "더 신나게", "강아지 추가") 기반 전체 스토리 재작성 후 이미지 생성 시작
- **사진 기반 캐릭터 일관성**: 아이 사진을 직접 Image API에 주입하는 대신 Gemini Vision으로 외모 특징만 텍스트 추출 후 프롬프트에 반영 — 딥페이크·CSAM 리스크 0%, 모든 페이지에서 같은 주인공 얼굴 유지
- **인라인 편집(co-creation)**: 부모가 완성된 책의 AI 생성 텍스트를 직접 수정하는 기능

**사진 기반 초개인화 (Vision API 활용) 및 아동 보호(Kids-Safe) 설계**

최고의 고객 경험을 위해 아이의 실제 사진을 활용하는 기능을 기획했습니다. 하지만 실제 아동의 사진을 직접 Image-to-Image 모델에 주입할 경우 발생할 수 있는 딥페이크 및 아동 보호 정책(CSAM) 위반 리스크를 고려했습니다.

이를 해결하기 위해 Gemini 2.5 Flash의 Multimodal 기능을 활용한 Image-to-Text-to-Image 파이프라인을 구축했습니다.

1. 사진 업로드 시 Vision API가 아이의 특징(머리 스타일, 안경 유무 등)만 텍스트로 추출
2. 추출된 텍스트를 프롬프트 파라미터로 변환하여 Image API에 전달
3. 보안 리스크는 0%로 줄이면서 아이와 꼭 닮은 캐릭터를 일관성 있게 생성

**더 시간이 있었다면 추가했을 기능**

- 아이 캐릭터 설정값을 DB에 저장해두고 매월 새 테마 동화책을 자동 발송하는 구독 모델
- 다른 이미지 생성 모델이나 LLM을 테스트해서 동화 내용과 캐릭터 품질이 더 좋은 모델로 교체
- 책 완성 후 인스타그램·가족 단톡방에 공유 가능한 3D 플립 웹 뷰어 링크 제공
- Sweetbook Webhook 연동으로 인쇄·배송 상태 변경 시 마이페이지 실시간 업데이트 및 알림톡 발송

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16, React, Tailwind CSS v4, TypeScript |
| 백엔드 | Express, TypeScript, tsx (dev runner), SQLite (better-sqlite3) |
| AI | Google Gemini 2.5 Flash (텍스트), Gemini 2.5 Flash Image (이미지) |
| 인쇄 API | Sweetbook Book Print API (bookprintapi-nodejs-sdk) |
| 개발 도구 | Claude Code (AI 코딩 어시스턴트) |
