PICKLOG Interactive Lab v2.0.0

[설치]
플러그인 > 새로 추가 > 플러그인 업로드 > 이 ZIP 선택 > "업로드한 것으로 현재 버전 교체".
기존 숏코드는 그대로 작동합니다.

[숏코드]
[picklog_interactive]                 전체 테스트 목록(랜딩)
[picklog_interactive test="love"]     특정 테스트만 단독 페이지로
   test 값: saju, compat, type, bigfive, love, relation, work, money, stress, career, animal
[picklog_fortune] / [picklog_saju]    사주·운세
[picklog_compatibility]               사주 궁합
[picklog_ipip50] / [picklog_personality]  Big Five 50문항

[v2.0.0 변경]
- 사주 엔진 재작성: 서울 기준 -30분 경도 보정, 1948~60·1987~88 서머타임, 1954~61 표준시 변경 자동 반영,
  23시(자시) 처리와 야자시 옵션, 음력·윤달 입력, 성별·대운 계산.
  lunar-javascript 라이브러리와 무작위 2만 건 대조 결과 년·월·일·시주와 대운 100% 일치.
- 운세 추가: 오늘의 운세(일진), 이번 달, 올해(세운), 10년 대운, 행운 포인트, 타고난 기질.
- 궁합 개편: 일간 합·상생/상극, 일지·띠 합충·원진, 오행 보완.
- 심리테스트 IPIP 기반 재구성: Big Five 50문항(Goldberg IPIP), 테마 테스트 7종은 Mini-IPIP 20문항.
  응답은 브라우저에 저장되어 한 번 답하면 다른 테스트 결과를 바로 볼 수 있음. 응답 품질 점검 추가.
- 일러스트: 카드 이미지의 글자·배지 제거, 2:1 비율로 통일, 카드-그림 매칭 수정. 중복 이미지 정리(5.1MB → 1MB).
- CSS 전면 재작성(누적 덮어쓰기 제거).

[이미지 교체 방법]
assets/card-<테스트id>.webp (800x400, 2:1) 파일을 같은 이름으로 바꾸면 카드 그림이 바뀝니다.
