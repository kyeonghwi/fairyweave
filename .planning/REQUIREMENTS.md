# Requirements: FairyWeave

**Defined:** 2026-04-01
**Core Value:** 부모가 입력한 아이 정보로 세상에 단 하나뿐인 동화책을 3분 안에 만들어 주문할 수 있어야 한다.

## v1 Requirements

### Input Form

- [ ] **FORM-01**: 사용자가 아이 이름, 나이, 테마(예: 공룡, 우주, 마법)를 입력할 수 있다
- [ ] **FORM-02**: 사용자가 스토리 방향/교훈(예: 형제간의 우애, 편식 극복)을 자유 텍스트로 입력할 수 있다
- [ ] **FORM-03**: 입력값 검증 — 필수 필드 누락 시 오류 메시지 표시

### AI Generation

- [x] **AI-01**: 백엔드가 Gemini API를 호출하여 16페이지 스토리 텍스트 + 각 페이지의 이미지 생성 프롬프트를 JSON 배열로 반환받는다
- [x] **AI-02**: 백엔드가 Gemini 이미지 생성 API를 병렬 호출하여 16장의 삽화를 생성한다
- [x] **AI-03**: 이미지 스타일 일관성을 위해 모든 이미지 프롬프트에 공통 스타일 시드 구문을 강제 삽입한다 ("soft watercolor children's book illustration, pastel colors")
- [ ] **AI-04**: 생성 중 사용자에게 진행 상태(로딩/스트리밍) 피드백을 제공한다

### Sweetbook Integration

- [x] **SB-01**: Sweetbook GET /templates 호출로 사용 가능한 템플릿 목록을 조회한다
- [x] **SB-02**: Sweetbook POST /books 호출로 16페이지 책 객체를 생성하고 bookUid를 저장한다
- [x] **SB-03**: Sweetbook POST /orders 호출 시 UUIDv4 Idempotency-Key 헤더를 포함한다
- [x] **SB-04**: 주문 완료 후 orderUid를 화면에 표시한다
- [x] **SB-05**: API Key는 백엔드 환경변수에서만 관리한다 (.env, .gitignore 등록)

### Preview & Order Flow

- [ ] **UI-01**: 생성된 책을 페이지별로 슬라이드 형태로 미리볼 수 있다 (이전/다음 페이지)
- [ ] **UI-02**: 수령인 이름, 배송지 주소, 연락처를 입력하는 주문 폼이 있다
- [ ] **UI-03**: 주문 완료 화면에서 orderUid를 확인할 수 있다

### Dummy Data

- [ ] **DUM-01**: dummyData.json에 5권의 완성된 동화책 데이터(텍스트 + 이미지 URL)가 내장되어 있다
- [ ] **DUM-02**: 메인 화면에 "인기 동화책 갤러리" 섹션이 있고 더미 북 5권이 즉시 표시된다
- [ ] **DUM-03**: 더미 북 선택 시 AI 생성 없이 즉시 Books API + Orders API가 호출된다

### Developer Experience

- [ ] **DEV-01**: .env.example 파일에 필요한 환경변수 키 목록이 포함되어 있다 (값은 비어있음)
- [ ] **DEV-02**: README.md의 안내대로 npm install + .env 설정 + npm run dev 만으로 실행 가능하다
- [ ] **DEV-03**: README.md에 사용한 Sweetbook API 엔드포인트 목록이 표로 정리되어 있다
- [ ] **DEV-04**: README.md에 AI 도구 활용 내역이 표로 정리되어 있다
- [ ] **DEV-05**: README.md에 설계 의도(LTV > CAC 아비트리지 비즈니스 모델)가 기술되어 있다

## v2 Requirements

### Enhancement

- **ENH-01**: Gemini 레퍼런스 이미지 기능으로 캐릭터 일관성 고도화
- **ENH-02**: 생성된 스토리 텍스트 인라인 편집 기능 (부모 co-creation)
- **ENH-03**: Sweetbook Webhook 수신으로 주문 상태 실시간 업데이트
- **ENH-04**: 사용자 계정 + 주문 내역 대시보드

## Out of Scope

| Feature | Reason |
|---------|--------|
| PostgreSQL / Prisma | 7일 내 셋업 비용 불필요, 과제 미요구 |
| AWS S3 / Supabase Storage | 샌드박스 데모에 불필요한 인프라 |
| Spotify API | 추가 OAuth 구현 필요, 시간 초과 |
| 3D Flipbook 뷰어 | 단순 슬라이드로 동일 효과, 복잡도 불필요 |
| Webhook 서버 | 과제 필수 요구사항 아님 |
| 사용자 인증 | 과제 범위 아님 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01~03 | Phase 1 | Pending |
| AI-01~04 | Phase 2 | Pending |
| SB-01~05 | Phase 3 | Pending |
| UI-01~03 | Phase 4 | Pending |
| DUM-01~03 | Phase 4 | Pending |
| DEV-01~05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
