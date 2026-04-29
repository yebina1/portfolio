# 포트폴리오 큐브 애니메이션 진행 현황

## 목표
iamthecu.be처럼 루빅스 큐브 조각 26개가 흩어진 상태에서 수렴하여 완성된 큐브를 이루고, 천천히 회전하며 유지

---

## 진행 단계

### ✅ 1~3단계: CSS 3D 시도 (2026-04-29) — 방향 수정
- CSS `transform-style: preserve-3d` 방식 3차 시도
- **근본 한계**: CSS 3D는 조명(lighting) 시뮬레이션이 없음 → 모든 면이 동일한 밝기 → 납작해 보임
- iamthecu.be처럼 윗면 밝고 옆면 어두운 입체감은 WebGL이 필요

### ✅ 4단계: Three.js (WebGL) 전환 (2026-04-29)
**패키지:** `three` + `@types/three` 설치

**Three.js 장점:**
- 실제 3D 렌더링 + 조명(Lighting) → 진짜 입체감
- AmbientLight + DirectionalLight → 윗면 밝음, 옆면 어두움, 자연스러운 깊이감
- 정확한 BoxGeometry로 각 큐블릿이 실제 3D 박스로 보임

**구현 내용:**
- `THREE.BoxGeometry(0.93, 0.93, 0.93)` + 6면 개별 `MeshLambertMaterial`
- BoxGeometry 면 순서(+X, -X, +Y, -Y, +Z, -Z)에 맞춰 색상 적용
- 26개 큐블릿 scatter 위치(cx×7, cy×7, cz×7) → target 위치(cx×1.04, ...) 애니메이션
- `easeOutCubic` + `lerpVectors` 로 스프링감 있는 수렴
- cz 순서로 정렬 → 뒤(노란) 면 조각부터 먼저 조립 (back-to-front)
- 전체 조립 완료 후 group.rotation.y 로 무한 회전

**조명 설정:**
- `AmbientLight(0xffffff, 0.45)` - 기본 밝기
- `DirectionalLight(0xffffff, 1.0)` - 위-앞-오른쪽 주광 (윗면/앞면 밝게)
- `DirectionalLight(0x8899bb, 0.25)` - 반대편 보조광 (완전 검은 그림자 방지)

---

## 색상 규칙 (Three.js 좌표계 기준)
| BoxGeometry 면 | 방향 | 조건 | 색상 |
|---|---|---|---|
| index 0 | +X | cx === 1 | 초록 #009b48 |
| index 1 | -X | cx === -1 | 파랑 #0046ad |
| index 2 | +Y | cy === 1 | 빨강 #c41230 |
| index 3 | -Y | cy === -1 | 주황 #ff5800 |
| index 4 | +Z | cz === 1 | 흰색 #e8e8e8 |
| index 5 | -Z | cz === -1 | 노랑 #ffd600 |
| 내부 | — | 해당없음 | 검정 #1a1a1a |

## 애니메이션 타이밍
| 시점 | 이벤트 |
|------|--------|
| 0ms | 26개 조각이 scatter 위치에 보임 |
| 350ms | 첫 조각(뒤쪽) 수렴 시작 |
| 350~830ms | 나머지 조각 순차 시작 (480ms stagger) |
| ~1930ms | 모든 조각 조립 완료 |
| ~2430ms | 큐브 전체 Y축 회전 시작 (무한) |

---

## 파일 구조
```
src/
  components/CubeHero.tsx  ← Three.js WebGL 큐브
  App.tsx                  ← <CubeHero /> 렌더링
  App.css                  ← 배경색만
```

## 다음 단계 (예정)
- 포트폴리오 텍스트 콘텐츠 배치
- 큐브 크기/카메라 미세조정
- 모바일 반응형
