# 토실이네 🐣

강도완·김명주 부부의 페이지 세 개를 모은 메인 포털. 폰에서 세로 스크롤 없이 배너 3개가 한 화면에 들어옵니다. 들어올 때 4자리 비밀번호(`0716`)를 한 번 풀면 그 기기에서는 계속 열립니다.

- 배포: https://gangdo98.github.io/

| 배너 | 링크 | 내용 |
| --- | --- | --- |
| ✈️ 후쿠오카 태교여행 | https://gangdo98.github.io/fukuoka-trip/ | 2027.01.07–10 3박 4일 일정·지도·쇼핑 |
| 🤰 토실이 출산 및 지원금 | https://gangdo98.github.io/tosil-story/ | 준비물·검진·지원금·휴직 계획 |
| 🏠 토실이 방 | https://gangdo98.github.io/tosil-home/ | 출생 후 공간별 육아용품 체크리스트 |

## 레이아웃

- `height:100dvh` + `overflow:hidden`, 배너는 `flex:1 1 0`으로 화면 높이를 3등분해 채웁니다. 세로 스크롤이 생기지 않습니다.
- 배너 제목은 `clamp(25px,7.7vw,32px)`, 설명은 `13.8px` — 이전보다 약 20% 키웠습니다. 영문 라벨(`TOSIL TRIP` 등)은 없애고 한국어 제목·설명만 남겼습니다.
- 배너 배경은 `assets/banner-*.jpg`(수채화 일러스트)와 `.banner__veil` 그라데이션. 세 장 모두 밝은 파스텔 톤이라 글자가 묻히지 않게 좌하단에 크림빛 막을 깔았습니다.
- 폰트는 `Pretendard` + `Gowun Batang`(제목). `tosil-story`·`fukuoka-trip`과 같은 결로 맞췄습니다.
- `#fukuoka` / `#tosil` / `#home` 해시로 들어오면 해당 사이트로 바로 넘깁니다.

## 잠금

- 4자리 비밀번호는 `0716`, 푼 상태는 `localStorage['tosil.portal.lock.v1'] = '1'`에 남습니다.
- 오른쪽 아래 자물쇠 버튼을 누르면 그 기기에서 다시 잠깁니다(저장값 삭제).
- 개인정보가 있는 하위 페이지라 `noindex, nofollow`.

## 수정할 때

- `assets/` 이미지를 바꾸면 `.webp`와 `.jpg`를 함께 두세요(`<picture>`가 webp를 먼저 씁니다). 후쿠오카 배너는 `banner-fukuoka-v2.*`(2026-11-27 새로 생성).
- `styles.css?v=` 쿼리를 올리면 캐시가 갱신됩니다.
