# picklog-automation

picklog.kr 자동 운영 저장소입니다. 이 저장소에 올라간 내용이 Render 크론잡(`picklog-publisher`, 매시간)을 통해 사이트에 자동 반영됩니다.

- `plugin/` 워드프레스 플러그인 소스 (사주·운세 계산기, IPIP 성격검사, 자동 발행용 REST API, 자동 업데이트)
- `dist/` 사이트가 자동 업데이트로 받아 가는 플러그인 ZIP
- `content/` 페이지·글·메뉴·사이트 설정
- `publisher/` 발행 스크립트 (Render에서 실행)

비밀번호 같은 민감한 정보는 이 저장소에 저장하지 않습니다. 워드프레스 애플리케이션 비밀번호는 Render 환경변수 `WP_APP_PASSWORD`에만 있습니다.
