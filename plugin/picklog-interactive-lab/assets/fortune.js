/* PICKLOG Fortune UI v2 — 사주 원국 · 오늘/이번 달/올해 운세 · 대운 · 궁합 */
(() => {
  'use strict';
  const C = window.PicklogSaju;
  if (!C) return;
  const ASSET = window.PicklogIllustrationBase || '';
  const STORE_KEY = 'picklog_saju_v2';

  // ---------- tiny DOM helper ----------
  const h = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c))); });
    return e;
  };
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }
  };

  // ---------- data loading ----------
  let dataPromise = null;
  function loadData() {
    if (dataPromise) return dataPromise;
    const urls = window.PicklogSajuData || {};
    if (!urls.terms || !urls.calendar) return Promise.reject(Error('달력 데이터 주소가 등록되지 않았습니다.'));
    dataPromise = Promise.all([urls.terms, urls.calendar].map(u => {
      if (!u) throw Error('달력 데이터 주소가 등록되지 않았습니다.');
      return fetch(u, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw Error('달력 데이터를 불러오지 못했습니다 (' + r.status + ')'); return r.json(); });
    })).then(([t, c]) => ({ terms: t.terms, tz: c.tz, lunar: c.lunar }))
      .catch(e => { dataPromise = null; throw e; });
    return dataPromise;
  }

  // ---------- interpretation content ----------
  const EL_COLOR = ['#3f9a6b', '#e0604a', '#c3922f', '#8b93a7', '#3b6fb6'];
  const EL_SOFT = ['#e8f5ee', '#fdecea', '#fbf2df', '#eef0f4', '#e7eef9'];
  const EL_NAME = ['나무', '불', '흙', '쇠', '물'];
  const LUCK = {
    color: ['초록·민트', '빨강·코랄', '베이지·노랑', '흰색·실버', '네이비·검정'],
    number: ['3, 8', '2, 7', '5, 10', '4, 9', '1, 6'],
    direction: ['동쪽', '남쪽', '중앙(가까운 곳)', '서쪽', '북쪽'],
    item: ['화분·나무 소품', '향초·따뜻한 조명', '도자기·니트 소재', '금속 액세서리·시계', '물병·유리 소품'],
    act: ['산책하며 새로운 길 걸어보기', '좋아하는 사람과 따뜻한 식사', '집 정리와 루틴 만들기', '불필요한 것 정리하기', '물 충분히 마시고 일찍 잠들기']
  };
  const STEM_TEXT = [
    ['곧게 뻗는 큰 나무', '목표가 분명하고 앞장서는 힘이 있습니다. 한번 정한 방향은 쉽게 바꾸지 않아 믿음직하지만, 때로는 고집으로 비칠 수 있습니다.'],
    ['바람에 흔들리는 꽃과 덩굴', '유연하고 친화력이 좋아 어떤 환경에서도 자리를 잡습니다. 겉은 부드럽지만 생활력과 끈기가 강합니다.'],
    ['하늘의 태양', '밝고 솔직하며 존재감이 큽니다. 주변을 환하게 만드는 힘이 있지만, 열정이 빨리 식는 순간도 있습니다.'],
    ['밤을 밝히는 등불', '섬세하고 따뜻하며 한곳에 깊이 집중합니다. 속마음은 쉽게 드러내지 않지만 한번 마음을 주면 오래갑니다.'],
    ['든든한 큰 산', '듬직하고 믿음직하며 사람들의 중심을 잡아 줍니다. 변화 앞에서는 신중하고 느긋한 편입니다.'],
    ['곡식을 키우는 밭', '사람과 자원을 키우고 돌보는 능력이 있습니다. 실속을 챙기는 현실 감각이 좋습니다.'],
    ['단단한 바위와 쇠', '결단력과 의리가 있고 원칙이 분명합니다. 말이 직선적이라 의도와 다르게 오해를 사기도 합니다.'],
    ['빛나는 보석', '감각이 예리하고 완성도를 중시합니다. 자존심이 강하고 평가에 민감한 만큼 스스로에게도 엄격합니다.'],
    ['넓은 바다와 큰 강', '포용력과 스케일이 크고 지혜롭습니다. 자유로움을 좋아해 틀에 묶이는 것을 답답해합니다.'],
    ['조용히 내리는 비와 이슬', '차분하지만 영리하고 관찰력이 뛰어납니다. 상황에 맞춰 스며드는 적응력이 강점입니다.']
  ];
  const GOD = {
    비견: { kw: '독립·자기주도', score: 72, overall: '스스로 결정하고 움직일 일이 늘어납니다. 남에게 기대기보다 내 방식대로 밀고 나갈 때 결과가 따라옵니다.', work: '혼자 맡는 일, 개인 프로젝트에 힘이 실립니다. 동료와 역할이 겹친다면 경계를 먼저 정리하세요.', money: '내가 움직인 만큼 들어오는 흐름입니다. 공동 지출은 기준을 분명히 해 두면 깔끔합니다.', love: '관계에서도 내 생활 리듬을 지키고 싶어집니다. 혼자만의 시간이 필요하다는 걸 미리 말해 두세요.', health: '체력은 무난하지만 고집으로 무리하기 쉽습니다. 쉬는 날을 일정표에 먼저 넣어 두세요.', advice: '남과의 비교보다 어제의 나와 경쟁하기', daily: '내 페이스대로 움직이면 편한 하루예요. 남과 비교하는 말에는 흔들리지 마세요.' },
    겁재: { kw: '경쟁·승부', score: 62, overall: '경쟁하거나 자원을 나눠야 하는 일이 생기기 쉽습니다. 추진력은 강해지지만 성급한 결정은 손실로 이어질 수 있습니다.', work: '승부가 걸린 일에서 힘을 냅니다. 공을 나누는 문제로 마찰이 생기지 않게 기록을 남기세요.', money: '지출과 돈 빌려주는 일에 주의할 시기입니다. 충동구매·보증·고위험 투자는 한 번 더 미루세요.', love: '자존심 싸움이 생기기 쉽습니다. 이기려는 대화보다 듣는 대화가 관계를 지킵니다.', health: '과열되기 쉬운 흐름이라 수면과 근육 피로를 챙기세요.', advice: '지갑은 닫고 실력은 열기', daily: '경쟁심이 올라오는 날이에요. 지출과 말다툼만 조심하면 추진력이 큰 무기가 됩니다.' },
    식신: { kw: '표현·여유·생산', score: 82, overall: '하고 싶은 일을 꾸준히 하며 성과를 쌓기 좋은 흐름입니다. 마음에 여유가 생기고 주변 분위기도 부드러워집니다.', work: '기획·콘텐츠·기술처럼 직접 만들어 내는 일이 잘 풀립니다. 결과물을 작게라도 공개해 보세요.', money: '재능과 노력이 수입으로 이어지기 좋습니다. 부업이나 작은 판매처럼 무언가를 만들어 파는 활동이 유리합니다.', love: '편안하고 다정한 분위기가 만들어집니다. 함께 먹고 즐기는 시간이 관계를 깊게 합니다.', health: '식욕이 늘기 쉬우니 과식만 조심하면 컨디션은 좋은 편입니다.', advice: '완벽보다 꾸준함', daily: '여유와 즐거움이 있는 하루예요. 맛있는 식사나 작은 창작이 기분을 끌어올립니다.' },
    상관: { kw: '아이디어·변화·말', score: 66, overall: '번뜩이는 아이디어와 표현력이 살아나지만, 기존 규칙이나 윗사람과 부딪히기 쉬운 흐름입니다. 변화를 시도하기에는 좋은 때입니다.', work: '새로운 방식 제안이나 개선 아이디어가 빛을 봅니다. 다만 말의 온도를 낮춰야 제안이 받아들여집니다.', money: '아이디어로 돈을 만들 기회가 있지만 계약 조건은 꼼꼼히 확인하세요.', love: '솔직함이 매력이 되기도, 상처가 되기도 합니다. 농담과 지적의 경계를 의식해 보세요.', health: '신경이 예민해지기 쉽습니다. 말을 많이 한 날엔 목 관리와 수면을 챙기세요.', advice: '말하기 전에 한 번 다듬기', daily: '아이디어가 반짝이는 날이에요. 다만 직설적인 말은 한 번 걸러서 하세요.' },
    편재: { kw: '기회·활동·인맥', score: 77, overall: '활동 반경이 넓어지고 새로운 사람과 기회를 만나는 흐름입니다. 움직이는 만큼 결과가 생기지만 힘이 분산되지 않게 우선순위가 필요합니다.', work: '외부 미팅, 새 거래처, 영업처럼 바깥 활동에서 성과가 납니다.', money: '돈이 크게 들어오고 크게 나가는 흐름입니다. 들어온 돈의 일부를 바로 따로 떼어 두세요.', love: '만남의 기회가 많아지고 분위기가 활발해집니다. 가벼운 약속이라도 성실하게 지키면 신뢰가 쌓입니다.', health: '바쁜 일정으로 끼니를 거르기 쉽습니다. 이동이 많을수록 수분과 휴식을 챙기세요.', advice: '기회는 잡되 욕심은 나누기', daily: '움직일수록 기회가 보이는 날이에요. 연락 온 제안은 가볍게라도 확인해 보세요.' },
    정재: { kw: '안정·관리·보상', score: 80, overall: '성실하게 쌓아 온 것이 안정적인 보상으로 돌아오는 흐름입니다. 계획을 세우고 차근차근 관리할수록 유리합니다.', work: '맡은 일을 꼼꼼하게 마무리하는 능력이 인정받습니다. 루틴과 체크리스트가 힘이 됩니다.', money: '저축·예산 관리·고정 수입에 좋은 시기입니다. 큰 모험보다 새는 돈을 막는 쪽이 이득입니다.', love: '신뢰와 책임감이 관계의 중심이 됩니다. 작은 약속을 지키는 것이 가장 큰 표현이 됩니다.', health: '규칙적인 생활이 컨디션을 지켜 줍니다. 오래 앉아 있다면 스트레칭을 챙기세요.', advice: '작은 습관이 큰 재산', daily: '차분하게 정리하기 좋은 날이에요. 가계부나 업무 정리가 마음을 가볍게 해 줍니다.' },
    편관: { kw: '도전·압박·책임', score: 60, overall: '해결해야 할 과제와 책임이 늘어나는 흐름입니다. 부담스럽지만 잘 넘기면 실력과 평판이 크게 올라가는 시기이기도 합니다.', work: '급하고 어려운 일이 몰릴 수 있습니다. 혼자 다 떠안기보다 우선순위를 정하고 도움을 요청하세요.', money: '예상치 못한 지출에 대비해 여유 자금을 두면 마음이 편합니다.', love: '상대의 기대나 요구가 부담으로 느껴질 수 있습니다. 힘들다는 말을 미루지 마세요.', health: '긴장과 피로가 쌓이기 쉽습니다. 무리한 운동보다 회복 위주로 관리하세요.', advice: '버티는 힘보다 쉬는 기술', daily: '해야 할 일이 몰릴 수 있는 날이에요. 가장 중요한 한 가지부터 처리하세요.' },
    정관: { kw: '인정·질서·명예', score: 79, overall: '원칙대로 움직일 때 인정과 신뢰가 따라오는 흐름입니다. 평가·직책·시험처럼 공식적인 일이 잘 풀리기 쉽습니다.', work: '승진·평가·자격 시험처럼 정해진 절차가 있는 일에 유리합니다. 보고와 기록을 깔끔하게 남기세요.', money: '급여처럼 정해진 보상에 좋은 흐름입니다. 무리한 투기는 흐름과 맞지 않습니다.', love: '진지하고 책임감 있는 관계로 발전하기 좋습니다. 공식적인 약속이나 소개 자리와 잘 맞습니다.', health: '생활 리듬이 안정되는 시기입니다. 정기 검진 같은 기본 관리를 챙기기 좋습니다.', advice: '정석이 가장 빠른 길', daily: '원칙을 지키면 인정받는 날이에요. 약속 시간과 보고를 깔끔하게 챙기세요.' },
    편인: { kw: '직관·연구·전문성', score: 68, overall: '생각이 깊어지고 혼자 파고드는 공부에 몰입하기 좋은 흐름입니다. 다만 생각이 많아 실행이 늦어질 수 있습니다.', work: '전문 기술, 자격증, 리서치처럼 깊이가 필요한 일에 유리합니다. 결론을 낼 마감일을 스스로 정해 두세요.', money: '돈보다 배움에 투자하게 되는 시기입니다. 강의나 도구 구입은 실제로 쓸 계획이 있을 때만 하세요.', love: '혼자만의 생각에 빠져 연락이 뜸해질 수 있습니다. 짧게라도 안부를 전해 보세요.', health: '수면 리듬이 흐트러지기 쉽습니다. 밤늦은 생각은 메모로 넘기고 잠드세요.', advice: '생각은 깊게, 실행은 작게', daily: '생각이 깊어지는 날이에요. 혼자 공부하거나 정리하는 시간이 효율적입니다.' },
    정인: { kw: '도움·배움·문서', score: 81, overall: '주변의 도움과 좋은 정보가 들어오는 흐름입니다. 배우고 정리하고 준비하는 일에 힘이 실립니다.', work: '공부·자격·서류 작업이 순조롭습니다. 선배나 윗사람의 조언을 적극적으로 구해 보세요.', money: '계약·문서와 관련된 일에 유리합니다. 서류를 꼼꼼히 읽고 서명하면 좋은 결과로 이어집니다.', love: '따뜻하게 챙겨 주고 챙김받는 관계가 됩니다. 가족이나 오래된 인연과의 시간이 마음을 채워 줍니다.', health: '회복력이 좋아지는 시기입니다. 충분한 휴식이 곧 실력이 됩니다.', advice: '도움을 받는 것도 능력', daily: '도움과 좋은 소식이 들어오는 날이에요. 고맙다는 말을 먼저 건네 보세요.' }
  };
  const CAT_ADJ = {
    work: { 정관: 8, 편관: 2, 식신: 4, 상관: 2, 정인: 5, 편인: 3, 겁재: -3 },
    money: { 정재: 10, 편재: 8, 식신: 6, 상관: 2, 겁재: -10, 비견: -4, 편인: -3 },
    health: { 편관: -8, 겁재: -4, 상관: -3, 정인: 6, 식신: 4, 비견: 2 },
    loveM: { 정재: 8, 편재: 6, 식신: 4, 정인: 3, 상관: -2, 겁재: -5 },
    loveF: { 정관: 8, 편관: 4, 식신: 4, 정인: 3, 상관: -3, 겁재: -4 }
  };
  const REL_TEXT = {
    육합: ['합(合)', 8, '일지와 합을 이루어 사람과 일이 자연스럽게 연결되는 기운이 더해집니다.'],
    삼합: ['삼합', 5, '일지와 삼합 계열을 이루어 협력과 팀워크에 힘이 붙습니다.'],
    충: ['충(沖)', -10, '일지와 충이 들어 이동·변화·의견 충돌이 생기기 쉽습니다. 계획이 바뀔 가능성을 염두에 두세요.'],
    형: ['형(刑)', -6, '형이 걸려 사소한 갈등이나 서류·규칙 문제에 주의가 필요합니다.'],
    파: ['파(破)', -3, '작은 약속이 어긋나기 쉬우니 확인 연락을 한 번 더 하세요.'],
    해: ['해(害)', -3, '작은 오해가 생기기 쉬우니 말의 뉘앙스를 챙기세요.'],
    원진: ['원진', -4, '이유 없이 서운함이 쌓이기 쉬운 기운이라 감정 표현을 부드럽게 하는 것이 좋습니다.']
  };
  const hasBatchim = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const josa = (w, a, b) => w + (hasBatchim(w) ? a : b);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Math.round(n)));

  /** Score & text for a period pillar (year / month / day / 대운) against the natal chart. */
  function readPeriod(chart, idx, gender) {
    const me = chart.analysis.me, dayBranch = chart.pillars.day % 12;
    const sGod = C.tenGod(me, idx % 10), bGod = C.branchTenGod(me, idx % 12);
    const rels = C.branchRelations(idx % 12, dayBranch).filter(r => REL_TEXT[r]);
    const stemRel = C.stemRelations(idx % 10, me);
    let relAdj = rels.reduce((a, r) => a + REL_TEXT[r][1], 0) + (stemRel.includes('천간합') ? 4 : 0) + (stemRel.includes('천간충') ? -4 : 0);
    relAdj = Math.max(-14, Math.min(12, relAdj));
    const base = GOD[sGod].score * 0.62 + GOD[bGod].score * 0.38 + relAdj;
    const cat = (key) => clamp(base + ((CAT_ADJ[key][sGod] || 0) * 0.7 + (CAT_ADJ[key][bGod] || 0) * 0.3), 42, 97);
    const loveKey = gender === 'F' ? 'loveF' : 'loveM';
    return {
      idx, sGod, bGod, rels, stemRel,
      score: { overall: clamp(base, 42, 97), work: cat('work'), money: cat('money'), love: cat(loveKey), health: cat('health') }
    };
  }

  // ---------- UI pieces ----------
  function seg(name, options, value) {
    const wrap = h('div', { class: 'pf-seg', role: 'radiogroup' });
    const group = 'pf-' + name + '-' + Math.random().toString(36).slice(2, 8);
    options.forEach(([v, label]) => {
      const id = group + '-' + v;
      wrap.append(h('input', { type: 'radio', name: group, id, value: v, checked: v === value }), h('label', { for: id, text: label }));
    });
    return wrap;
  }
  function segValue(wrap) { const c = wrap.querySelector('input:checked'); return c ? c.value : null; }
  function select(options, value, label) {
    const s = h('select', { 'aria-label': label });
    options.forEach(([v, t]) => s.append(h('option', { value: v, text: t, selected: String(v) === String(value) })));
    return s;
  }
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  function personForm(title, saved, opts = {}) {
    const s = saved || {};
    const box = h('div', { class: 'pf-form' }, [h('h3', { class: 'pf-form-title', text: title })]);
    const nameIn = h('input', { type: 'text', maxlength: '12', placeholder: '닉네임 (선택)', value: s.name || '', 'aria-label': '이름 또는 닉네임' });
    const gender = seg('g', [['F', '여성'], ['M', '남성']], s.gender || 'F');
    const cal = seg('c', [['solar', '양력'], ['lunar', '음력'], ['leap', '음력 윤달']], s.calendar || 'solar');
    const yS = select(range(1900, 2049).reverse().map(v => [v, v + '년']), s.y || 1995, '출생 연도');
    const mS = select(range(1, 12).map(v => [v, v + '월']), s.m || 1, '출생 월');
    const dS = select(range(1, 31).map(v => [v, v + '일']), s.d || 1, '출생 일');
    const hS = select(range(0, 23).map(v => [v, String(v).padStart(2, '0') + '시']), s.hh ?? 12, '출생 시');
    const minS = select(range(0, 59).map(v => [v, String(v).padStart(2, '0') + '분']), s.mm ?? 0, '출생 분');
    const unknown = h('input', { type: 'checkbox', checked: !!s.unknownTime });
    const sync = () => { hS.disabled = minS.disabled = unknown.checked; };
    unknown.addEventListener('change', sync); sync();
    const correction = select([['lmt', '서울 기준 -30분 보정 (권장)'], ['none', '보정 안 함 (시계 시간 그대로)']], s.correction || 'lmt', '시간 보정');
    const zasi = select([['jo', '23시 이후는 다음 날로 (일반적)'], ['ya', '야자시: 자정까지는 당일로']], s.zasi || 'jo', '자시 기준');
    box.append(
      h('div', { class: 'pf-row' }, [h('label', { class: 'pf-label', text: '이름' }), nameIn]),
      h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '성별' }), gender]),
      h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '달력' }), cal]),
      h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '생년월일' }), h('div', { class: 'pf-inline pf-date' }, [yS, mS, dS])]),
      h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '태어난 시각' }), h('div', { class: 'pf-inline' }, [hS, minS, h('label', { class: 'pf-check' }, [unknown, ' 모름'])])]),
      h('details', { class: 'pf-adv' }, [h('summary', { text: '시간 보정 설정' }),
        h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '경도 보정' }), correction]),
        h('div', { class: 'pf-row' }, [h('span', { class: 'pf-label', text: '자시 기준' }), zasi]),
        h('p', { class: 'pf-hint', text: '한국 표준시는 동경 135° 기준이라 실제 태양 시각보다 약 30분 빠릅니다. 대부분의 국내 만세력처럼 30분을 보정하며, 1948~1960년·1987~1988년 서머타임과 1954~1961년 표준시 변경은 자동으로 반영합니다.' })])
    );
    if (opts.ownerNote) box.append(h('p', { class: 'pf-hint', text: opts.ownerNote }));
    return {
      node: box,
      read() {
        const c = segValue(cal);
        return {
          name: nameIn.value.trim().slice(0, 12), gender: segValue(gender), calendar: c === 'solar' ? 'solar' : 'lunar', leap: c === 'leap', calRaw: c,
          y: +yS.value, m: +mS.value, d: +dS.value, hh: +hS.value, mm: +minS.value, unknownTime: unknown.checked,
          time: unknown.checked ? null : String(hS.value).padStart(2, '0') + ':' + String(minS.value).padStart(2, '0'),
          correction: correction.value, zasi: zasi.value
        };
      }
    };
  }

  function glyph(idx, which, god, small) {
    const isStem = which === 'stem';
    const i = isStem ? idx % 10 : idx % 12;
    const el = isStem ? C.STEM_EL[i] : C.BRANCH_EL[i];
    return h('div', { class: 'pf-glyph' + (small ? ' pf-glyph-sm' : ''), style: `--el:${EL_COLOR[el]};--el-soft:${EL_SOFT[el]}` }, [
      h('span', { class: 'pf-glyph-god', text: god || '' }),
      h('strong', { class: 'pf-glyph-h', text: isStem ? C.STEMS_H[i] : C.BRANCHES_H[i] }),
      h('span', { class: 'pf-glyph-k', text: (isStem ? C.STEMS[i] : C.BRANCHES[i]) + ' · ' + C.ELEMENTS[el] })
    ]);
  }

  function chartTable(chart) {
    const t = h('div', { class: 'pf-chart', role: 'table', 'aria-label': '사주 원국표' });
    chart.analysis.cols.forEach(c => {
      const col = h('div', { class: 'pf-col' + (c.key === 'day' ? ' pf-col-me' : ''), role: 'column' });
      col.append(h('div', { class: 'pf-col-head', text: c.label }));
      if (c.idx === null) {
        col.append(h('div', { class: 'pf-glyph pf-glyph-empty' }, [h('strong', { class: 'pf-glyph-h', text: '?' }), h('span', { class: 'pf-glyph-k', text: '시간 모름' })]), h('div', { class: 'pf-glyph pf-glyph-empty' }, [h('strong', { class: 'pf-glyph-h', text: '?' })]));
      } else {
        col.append(glyph(c.idx, 'stem', c.stemGod), glyph(c.idx, 'branch', c.branchGod),
          h('div', { class: 'pf-col-meta' }, [h('span', { text: '12운성 ' + c.stage }), h('span', { text: '지장간 ' + c.hidden.map(x => C.STEMS[x.stem]).join('') })]));
      }
      t.append(col);
    });
    return t;
  }

  function scoreRing(score, label) {
    const r = 34, len = 2 * Math.PI * r, off = len * (1 - score / 100);
    return h('div', { class: 'pf-ring' }, [
      h('div', { class: 'pf-ring-svg', html: `<svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--pf-track)" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--pf-accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 42 42)"/></svg>` }),
      h('div', { class: 'pf-ring-num' }, [h('strong', { text: score }), h('span', { text: label })])
    ]);
  }
  function catBars(score) {
    const rows = [['일·학업', score.work], ['재물', score.money], ['연애·관계', score.love], ['컨디션', score.health]];
    return h('div', { class: 'pf-cats' }, rows.map(([l, v]) => h('div', { class: 'pf-cat' }, [h('span', { text: l }), h('div', { class: 'pf-cat-track' }, h('i', { style: `width:${v}%` })), h('b', { text: v })])));
  }
  const section = (title, kids, cls) => h('section', { class: 'pf-sec' + (cls ? ' ' + cls : '') }, [h('h3', { text: title }), ...kids]);
  const P = (t, cls) => h('p', { class: cls || '', text: t });

  function periodCard(chart, r, kicker, title, scope) {
    const g = GOD[r.sGod], gb = GOD[r.bGod];
    const relLines = r.rels.map(x => REL_TEXT[x][2]);
    if (r.stemRel.includes('천간합')) relLines.push('천간이 일간과 합을 이루어 마음이 맞는 사람이나 반가운 제안이 들어오기 쉽습니다.');
    if (r.stemRel.includes('천간충')) relLines.push('천간이 일간과 부딪혀 생각이 자주 바뀔 수 있습니다. 중요한 결정은 하루 묵혀 보세요.');
    const wrap = h('article', { class: 'pf-period' });
    wrap.append(h('div', { class: 'pf-period-top' }, [
      h('div', {}, [h('span', { class: 'pf-kicker', text: kicker }), h('h3', { class: 'pf-period-title', text: title }),
        h('div', { class: 'pf-period-tags' }, [h('span', { class: 'pf-tag', text: C.name(r.idx) + ' ' + C.hanja(r.idx) }), h('span', { class: 'pf-tag pf-tag-soft', text: r.sGod + ' · ' + g.kw }), r.rels.length ? h('span', { class: 'pf-tag pf-tag-warn', text: '일지와 ' + r.rels.map(x => REL_TEXT[x][0]).join('·') }) : null])]),
      scoreRing(r.score.overall, '흐름 지수')
    ]));
    wrap.append(P(scope === 'day' ? g.daily : g.overall, 'pf-lead'));
    if (scope !== 'day' && r.bGod !== r.sGod) wrap.append(P(`바탕에는 ${r.bGod}(${gb.kw})의 기운이 함께 깔려 있습니다. ${gb.overall.split('. ')[0]}.`));
    relLines.forEach(t => wrap.append(P(t)));
    wrap.append(catBars(r.score));
    if (scope !== 'day') {
      wrap.append(h('div', { class: 'pf-grid2' }, [
        h('div', { class: 'pf-mini' }, [h('strong', { text: '일·학업' }), P(g.work)]),
        h('div', { class: 'pf-mini' }, [h('strong', { text: '재물' }), P(g.money)]),
        h('div', { class: 'pf-mini' }, [h('strong', { text: '연애·관계' }), P(g.love)]),
        h('div', { class: 'pf-mini' }, [h('strong', { text: '컨디션' }), P(g.health)])
      ]));
    }
    wrap.append(h('div', { class: 'pf-advice' }, [h('span', { text: '한 줄 조언' }), h('strong', { text: g.advice })]));
    return wrap;
  }

  function luckyBox(chart, today) {
    const el = chart.analysis.lacking[0];
    const dayBranch = chart.pillars.day % 12;
    const harmony = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]].find(p => p.includes(dayBranch));
    const luckyBranch = harmony[0] === dayBranch ? harmony[1] : harmony[0];
    const start = (luckyBranch * 2 + 23) % 24;
    const hourText = `${String(start).padStart(2, '0')}:30 ~ ${String((start + 2) % 24).padStart(2, '0')}:30 (${C.BRANCHES[luckyBranch]}시)`;
    const rows = [['행운의 색', LUCK.color[el]], ['행운의 숫자', LUCK.number[el]], ['좋은 방향', LUCK.direction[el]], ['좋은 시간대', hourText], ['추천 소품', LUCK.item[el]], ['추천 행동', LUCK.act[(el + today) % 5]]];
    return h('div', { class: 'pf-lucky', style: `--el:${EL_COLOR[el]};--el-soft:${EL_SOFT[el]}` }, [
      h('div', { class: 'pf-lucky-head' }, [h('span', { class: 'pf-kicker', text: 'LUCKY POINT' }), h('strong', { text: `보완하면 좋은 기운 · ${EL_NAME[el]}(${C.ELEMENTS[el]})` })]),
      h('dl', {}, rows.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])),
      P('원국에서 가장 적게 나타난 오행을 생활 속에서 보완한다는 전통적인 방식의 추천입니다.', 'pf-hint'),
      (window.PicklogCoupang && window.PicklogCoupang('el-' + el, `${LUCK.color[el]} 소품 둘러보기 →`)) || null
    ].filter(Boolean));
  }

  function natalSection(chart) {
    const a = chart.analysis, me = a.me;
    const total = a.total || 1;
    const elBars = h('div', { class: 'pf-els' }, C.ELEMENTS.map((e, i) => h('div', { class: 'pf-el', style: `--el:${EL_COLOR[i]};--el-soft:${EL_SOFT[i]}` }, [
      h('span', { class: 'pf-el-name', text: `${e}(${C.ELEMENTS_H[i]})` }), h('div', { class: 'pf-el-track' }, h('i', { style: `width:${a.counts[i] / total * 100}%` })), h('b', { text: a.counts[i] })])));
    const st = a.strength >= 0.58 ? ['신강 경향', '나를 돕는 기운(같은 오행·나를 생하는 오행)이 많은 편입니다. 주관이 뚜렷하고 밀어붙이는 힘이 있으니, 에너지를 밖으로 쓰는 활동(표현·성과·활동)과 잘 맞습니다.'] :
      a.strength <= 0.42 ? ['신약 경향', '나를 돕는 기운보다 쓰고 맞서는 기운이 많은 편입니다. 혼자 버티기보다 배움·사람·휴식 같은 지원을 잘 활용할 때 힘이 납니다.'] :
        ['균형 경향', '나를 돕는 기운과 쓰는 기운이 비교적 균형을 이루고 있습니다. 상황에 따라 유연하게 힘을 조절하기 좋은 구성입니다.'];
    const fam = { 비겁: ['비견', '겁재'], 식상: ['식신', '상관'], 재성: ['편재', '정재'], 관성: ['편관', '정관'], 인성: ['편인', '정인'] };
    const famText = { 비겁: '주관과 독립심, 내 사람을 챙기는 힘이 두드러집니다.', 식상: '표현력과 재능, 무언가를 만들어 내는 힘이 두드러집니다.', 재성: '현실 감각과 관리 능력, 결과를 챙기는 힘이 두드러집니다.', 관성: '책임감과 조직 감각, 규칙을 지키는 힘이 두드러집니다.', 인성: '배우고 생각하는 힘, 사람을 이해하는 깊이가 두드러집니다.' };
    const famCount = Object.entries(fam).map(([k, v]) => [k, v.reduce((s, g) => s + (a.godCounts[g] || 0), 0)]).sort((x, y) => y[1] - x[1]);
    const missing = famCount.filter(x => x[1] === 0).map(x => x[0]);
    return h('div', { class: 'pf-natal' }, [
      section('타고난 나의 기질', [
        h('div', { class: 'pf-me', style: `--el:${EL_COLOR[C.STEM_EL[me]]};--el-soft:${EL_SOFT[C.STEM_EL[me]]}` }, [
          h('strong', { class: 'pf-me-h', text: C.STEMS_H[me] }),
          h('div', {}, [h('span', { class: 'pf-kicker', text: '일간 · 나를 나타내는 글자' }), h('h4', { text: `${C.STEMS[me]}${C.ELEMENTS[C.STEM_EL[me]]} — ${STEM_TEXT[me][0]}` }), P(STEM_TEXT[me][1])])
        ]),
        P(`${a.season}에 태어나 ${a.season === '겨울' ? '차분하게 안으로 힘을 모으는' : a.season === '봄' ? '새로 시작하고 뻗어 나가는' : a.season === '여름' ? '밖으로 드러나고 활발한' : '정리하고 결실을 거두는'} 계절의 기운을 함께 받았습니다.`)
      ]),
      section('다섯 가지 기운(오행) 분포', [elBars, P(`여덟 글자 중 ${C.ELEMENTS.map((e, i) => a.counts[i] ? `${e} ${a.counts[i]}` : null).filter(Boolean).join(' · ')}개입니다. ${a.counts.some(c => c === 0) ? josa(C.ELEMENTS.filter((_, i) => a.counts[i] === 0).join('·'), '이', '가') + ' 겉으로 드러나지 않아 생활 속에서 보완하면 좋은 기운으로 봅니다.' : '다섯 기운이 모두 들어 있는 구성입니다.'}`, 'pf-hint')]),
      section('기운의 세기', [h('div', { class: 'pf-strength' }, [h('div', { class: 'pf-strength-track' }, h('i', { style: `left:${Math.round(a.strength * 100)}%` })), h('div', { class: 'pf-strength-labels' }, [h('span', { text: '신약' }), h('span', { text: '균형' }), h('span', { text: '신강' })])]), h('h4', { text: st[0] }), P(st[1]), P('월지에 가중치를 둔 간이 판정입니다. 격국·용신을 따지는 전문 감정과는 다를 수 있습니다.', 'pf-hint')]),
      section('십성으로 본 강점', [P(`가장 많이 나타난 기운은 ${famCount[0][0]}입니다. ${famText[famCount[0][0]]}`), famCount[1][1] ? P(`그다음은 ${famCount[1][0]}으로, ${famText[famCount[1][0]]}`) : null, missing.length ? P(`${josa(missing.join('·'), '은', '는')} 원국에 드러나지 않아 운(대운·세운)에서 들어올 때 새로운 경험으로 다가오기 쉽습니다.`) : null].filter(Boolean))
    ]);
  }

  function daeunSection(chart) {
    const d = chart.daeun;
    if (!d) return section('대운', [P('성별을 선택하면 10년 단위 대운 흐름을 계산합니다.')]);
    const nowY = new Date().getFullYear();
    const cur = d.list.find(x => nowY >= x.startYear && nowY <= x.endYear);
    const list = h('div', { class: 'pf-daeun' }, d.list.map(x => {
      const sGod = C.tenGod(chart.analysis.me, x.idx % 10);
      return h('div', { class: 'pf-daeun-item' + (x === cur ? ' is-now' : '') }, [
        h('span', { class: 'pf-daeun-age', text: x.age + '세~' }),
        glyph(x.idx, 'stem', sGod, true), glyph(x.idx, 'branch', C.branchTenGod(chart.analysis.me, x.idx % 12), true),
        h('span', { class: 'pf-daeun-year', text: x.startYear + '년~' })
      ]);
    }));
    const kids = [P(`${d.forward ? '순행' : '역행'} 대운이며 대운수는 ${d.su}입니다. ${d.su}세 무렵부터 10년마다 큰 흐름이 바뀝니다.`, 'pf-hint'), list];
    if (cur) kids.push(periodCard(chart, readPeriod(chart, cur.idx, chart.input.gender), `지금의 대운 · ${cur.startYear}~${cur.endYear}`, `${C.name(cur.idx)} 대운의 10년`, 'daeun'));
    kids.push(P('대운 나이는 전통 방식(3일 = 1년)으로 계산했으며, 해마다 바뀌는 세운과 함께 읽습니다.', 'pf-hint'));
    return section('10년 단위 큰 흐름 · 대운', kids);
  }

  function heroFor(chart, who) {
    const seasonKey = { 봄: 'spring', 여름: 'summer', 가을: 'autumn', 겨울: 'winter' }[chart.analysis.season];
    const me = chart.analysis.me;
    const s = chart.solar, l = chart.lunar;
    const timeText = chart.timeKnown ? `${chart.input.time}생` : '시간 모름';
    return h('div', { class: 'pf-hero' }, [
      h('figure', { class: 'pf-hero-art' }, h('img', { src: ASSET + 'saju-hero-' + seasonKey + '.webp', alt: chart.analysis.season + ' 밤하늘을 올려다보는 인물 일러스트', width: '880', height: '420', loading: 'eager', decoding: 'async' })),
      h('div', { class: 'pf-hero-body' }, [
        h('span', { class: 'pf-kicker', text: 'PICKLOG 사주 리포트' }),
        h('h2', { text: `${who ? who + '님은 ' : ''}${STEM_TEXT[me][0]}을 닮은 ${C.STEMS[me]}${C.ELEMENTS[C.STEM_EL[me]]} 일간` }),
        h('p', { class: 'pf-hero-sub', text: `양력 ${s.y}.${s.m}.${s.d}${l ? ` · 음력 ${l.y}.${l.m}.${l.d}${l.leap ? '(윤)' : ''}` : ''} · ${timeText} · ${C.ANIMALS[chart.pillars.year % 12]}띠` })
      ])
    ]);
  }

  function tabs(defs) {
    const bar = h('div', { class: 'pf-tabs', role: 'tablist' });
    const panel = h('div', { class: 'pf-tabpanel', role: 'tabpanel' });
    const btns = defs.map(([label, fn], i) => h('button', { type: 'button', role: 'tab', class: 'pf-tab', 'aria-selected': i === 0 ? 'true' : 'false', text: label, onclick: () => show(i) }));
    function show(i) { btns.forEach((b, j) => b.setAttribute('aria-selected', String(i === j))); panel.replaceChildren(defs[i][1]()); }
    bar.append(...btns); show(0);
    return h('div', { class: 'pf-tabwrap' }, [bar, panel]);
  }

  function renderReport(chart, data) {
    const now = Date.now();
    const per = C.periodAt(data, now);
    const g = chart.input.gender;
    const out = h('div', { class: 'pf-report' });
    out.append(heroFor(chart, chart.input.name));
    const warn = [];
    if (!chart.timeKnown) warn.push('출생 시각을 몰라 시주 없이 여섯 글자로 풀이했습니다.');
    if (chart.nearTerm) warn.push('절기가 바뀌는 날 태어나, 출생 시각에 따라 월주(또는 년주)가 달라질 수 있습니다.');
    if (chart.dst) warn.push('출생 당시 서머타임이 시행 중이어서 1시간을 자동 보정했습니다.');
    out.append(section('사주 원국', [chartTable(chart), ...warn.map(t => P(t, 'pf-note'))], 'pf-sec-chart'));
    const ad = window.PicklogAd && window.PicklogAd(); if (ad) out.append(ad);
    const dd = per.date;
    out.append(tabs([
      ['오늘의 운세', () => h('div', {}, [periodCard(chart, readPeriod(chart, per.day, g), `${dd.y}년 ${dd.m}월 ${dd.d}일 · 일진`, '오늘의 운세', 'day'), luckyBox(chart, per.day % 5)])],
      ['이번 달', () => periodCard(chart, readPeriod(chart, per.month, g), `${C.name(per.month)}월 · 절기 기준`, `${dd.m}월의 흐름`, 'month')],
      [`${per.pillarYear}년 운세`, () => {
        const r = readPeriod(chart, per.year, g);
        const yRel = C.branchRelations(per.year % 12, chart.pillars.year % 12);
        const card = periodCard(chart, r, `${per.pillarYear}년 ${C.name(per.year)}년 · 세운`, `${per.pillarYear}년 한 해의 운세`, 'year');
        if (yRel.length) card.insertBefore(P(`${C.ANIMALS[chart.pillars.year % 12]}띠와 올해 ${C.ANIMALS[per.year % 12]}의 해는 ${yRel.join('·')} 관계입니다. ${yRel.includes('충') ? '이사·이직처럼 환경이 바뀌는 일이 생기기 쉬운 해로 봅니다.' : yRel.some(x => x.includes('합')) ? '주변의 도움과 협력을 얻기 쉬운 해로 봅니다.' : '사소한 엇갈림을 조심하면 무난한 해로 봅니다.'}`), card.querySelector('.pf-cats'));
        return card;
      }],
      ['대운', () => daeunSection(chart)],
      ['타고난 기질', () => natalSection(chart)]
    ]));
    out.append(P('사주 풀이와 점수는 전통 명리학의 상징을 바탕으로 한 오락·자기성찰용 콘텐츠입니다. 건강·투자·법률 같은 중요한 결정은 전문가와 상의하세요. 입력한 정보는 서버로 전송되지 않고 이 브라우저에서만 계산됩니다.', 'pf-disclaimer'));
    return out;
  }

  // ---------- compatibility ----------
  function compatReport(A, B) {
    const a = A.analysis, b = B.analysis;
    let score = 70; const notes = [];
    const meA = a.me, meB = b.me, eA = C.STEM_EL[meA], eB = C.STEM_EL[meB];
    const sRel = C.stemRelations(meA, meB);
    if (sRel.includes('천간합')) { score += 12; notes.push(['일간 천간합', '두 사람의 일간이 합을 이룹니다. 전통적으로 서로에게 자연스럽게 끌리는 인연으로 봅니다.']); }
    else if (eA === eB) { score += 4; notes.push(['같은 오행의 일간', '비슷한 기질이라 말이 잘 통하지만, 둘 다 양보하지 않을 때는 부딪힐 수 있습니다.']); }
    else if (C.mod(eA + 1, 5) === eB || C.mod(eB + 1, 5) === eA) { score += 8; const giver = C.mod(eA + 1, 5) === eB ? 'A' : 'B'; notes.push(['서로 살리는 상생', `${giver}의 기운이 상대를 살려 주는 관계입니다. ${giver} 쪽이 챙겨 주고, 상대는 그 덕에 힘을 얻는 구조로 봅니다.`]); }
    else { score -= 4; notes.push(['서로 다듬는 상극', '한쪽이 다른 쪽을 제어하는 오행 관계입니다. 긴장감이 있지만 서로를 성장시키는 자극이 되기도 합니다.']); }
    if (sRel.includes('천간충')) { score -= 5; notes.push(['일간 충', '생각의 방향이 정반대일 때가 있어 결정 방식을 미리 맞춰 두면 좋습니다.']); }
    const dRel = C.branchRelations(A.pillars.day % 12, B.pillars.day % 12);
    const dMap = { 육합: [10, '일지(배우자 자리)가 육합을 이룹니다. 생활 리듬과 정서적 교감이 잘 맞는 조합으로 봅니다.'], 삼합: [6, '일지가 삼합 계열입니다. 같은 목표를 향해 협력하기 좋은 조합으로 봅니다.'], 충: [-10, '일지가 충입니다. 생활 방식 차이로 부딪힐 수 있어 각자의 공간을 존중하는 것이 중요합니다.'], 원진: [-6, '일지가 원진입니다. 이유 없이 서운함이 쌓이기 쉬워 감정을 자주 표현하는 것이 좋습니다.'], 형: [-4, '일지에 형이 있습니다. 사소한 일로 다투지 않도록 규칙을 함께 정해 보세요.'], 파: [-2, ''], 해: [-2, ''] };
    dRel.forEach(r => { score += dMap[r][0]; if (dMap[r][1]) notes.push(['일지 ' + r, dMap[r][1]]); });
    const yRel = C.branchRelations(A.pillars.year % 12, B.pillars.year % 12);
    if (yRel.length) { const good = yRel.some(r => r.includes('합')); score += good ? 4 : yRel.includes('충') || yRel.includes('원진') ? -4 : 0; notes.push([`띠 궁합 · ${C.ANIMALS[A.pillars.year % 12]}띠 × ${C.ANIMALS[B.pillars.year % 12]}띠`, `${yRel.join('·')} 관계입니다. ${good ? '전통적으로 서로 돕는 띠로 봅니다.' : '띠 관계는 전체 궁합에서 작은 비중만 차지합니다.'}`]); }
    // complement: elements A lacks that B has
    const comp = [];
    C.ELEMENTS.forEach((e, i) => { if (a.counts[i] === 0 && b.counts[i] >= 2) comp.push(`A에게 없는 ${josa(e, '을', '를')} B가 채워 줍니다`); if (b.counts[i] === 0 && a.counts[i] >= 2) comp.push(`B에게 없는 ${josa(e, '을', '를')} A가 채워 줍니다`); });
    score += Math.min(8, comp.length * 4);
    if (comp.length) notes.push(['오행 보완', comp.join(', ') + '. 서로의 빈자리를 메워 주는 조합입니다.']);
    score = clamp(score, 48, 97);
    const label = score >= 88 ? '천생연분에 가까운 조합' : score >= 78 ? '서로 힘이 되는 좋은 조합' : score >= 66 ? '노력할수록 깊어지는 조합' : '차이를 이해하면 성장하는 조합';
    const nm = (x, d) => x.input.name || d;
    const out = h('div', { class: 'pf-report' });
    const mini = (chart) => h('div', { class: 'pf-mini-chart' }, chart.analysis.cols.map(c => h('div', { class: 'pf-col' + (c.key === 'day' ? ' pf-col-me' : '') }, c.idx === null ? [h('div', { class: 'pf-col-head', text: c.label }), h('div', { class: 'pf-glyph pf-glyph-empty pf-glyph-sm' }, h('strong', { class: 'pf-glyph-h', text: '?' }))] : [h('div', { class: 'pf-col-head', text: c.label }), glyph(c.idx, 'stem', '', true), glyph(c.idx, 'branch', '', true)])));
    out.append(h('div', { class: 'pf-compat-head' }, [
      h('figure', { class: 'pf-hero-art' }, h('img', { src: ASSET + 'card-compat.webp', alt: '마주 보고 웃는 두 사람 일러스트', width: '800', height: '400' })),
      h('div', { class: 'pf-compat-score' }, [h('span', { class: 'pf-kicker', text: 'PICKLOG 사주 궁합' }), scoreRing(score, '궁합 지수'), h('h2', { text: label }), P(`${nm(A, 'A')} · ${C.STEMS[meA]}${C.ELEMENTS[eA]} 일간  ×  ${nm(B, 'B')} · ${C.STEMS[meB]}${C.ELEMENTS[eB]} 일간`, 'pf-hero-sub')])
    ]));
    out.append(section('두 사람의 원국', [h('div', { class: 'pf-grid2' }, [h('div', {}, [h('strong', { text: nm(A, 'A') }), mini(A)]), h('div', {}, [h('strong', { text: nm(B, 'B') }), mini(B)])])]));
    out.append(section('궁합 풀이', notes.map(([t, d]) => h('div', { class: 'pf-mini' }, [h('strong', { text: t }), P(d)]))));
    out.append(section('잘 지내기 위한 팁', [P(eA === eB ? '비슷한 점이 많은 만큼, 서로의 역할을 나누면 경쟁 대신 팀워크가 생깁니다.' : '서로 다른 기질이 장점입니다. 상대가 잘하는 영역은 믿고 맡겨 보세요.'), P(dRel.includes('충') || dRel.includes('원진') ? '서운한 일은 쌓아 두지 말고 그날 짧게라도 이야기하는 습관이 관계를 지켜 줍니다.' : '편안한 관계일수록 고마움을 말로 표현하는 습관이 오래가는 비결입니다.')]));
    out.append(P('궁합 점수는 전통 명리학의 합·충·상생 관계를 점수로 바꾼 재미용 지표입니다. 실제 관계는 대화와 신뢰가 만듭니다. 상대방의 출생 정보는 동의를 받고 입력해 주세요.', 'pf-disclaimer'));
    return out;
  }

  // ---------- mount ----------
  function mount(app, mode) {
    const saved = store.get();
    app.replaceChildren();
    const wrap = h('section', { class: 'pil-wrap pf' });
    const isCompat = mode === 'compatibility';
    wrap.append(h('div', { class: 'pil-head' }, [
      h('div', { class: 'pil-kicker', text: isCompat ? 'PICKLOG / 사주 궁합' : 'PICKLOG / 사주 · 운세' }),
      h('h2', { text: isCompat ? '우리 둘의 사주 궁합' : '내 사주와 오늘의 운세' }),
      h('p', { text: isCompat ? '두 사람의 일간·일지·띠·오행 관계를 함께 살펴봅니다.' : '절입 시각까지 반영한 정밀 만세력으로 사주 원국을 세우고, 오늘·이번 달·올해 운세와 10년 대운을 풀어 드립니다.' })
    ]));
    const one = personForm(isCompat ? '첫 번째 사람' : '내 출생 정보', saved);
    const two = isCompat ? personForm('두 번째 사람', null, { ownerNote: '상대방 정보는 저장하지 않습니다.' }) : null;
    const remember = h('input', { type: 'checkbox', checked: saved ? true : !isCompat });
    const formWrap = h('div', { class: 'pf-forms' + (isCompat ? ' pf-forms-2' : '') }, [one.node, two && two.node]);
    const out = h('div', { class: 'pf-out', 'aria-live': 'polite' });
    const go = h('button', { type: 'button', class: 'pil-btn primary pf-go', text: isCompat ? '궁합 보기' : '사주·운세 보기' });
    go.addEventListener('click', async () => {
      out.replaceChildren(h('p', { class: 'pf-loading', text: '만세력을 계산하고 있어요…' }));
      go.disabled = true;
      try {
        const data = await loadData();
        const ia = one.read();
        const A = C.compute(ia, data);
        if (remember.checked) store.set(ia); else store.clear();
        if (isCompat) { const B = C.compute(two.read(), data); out.replaceChildren(compatReport(A, B)); }
        else out.replaceChildren(renderReport(A, data));
        const y = out.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      } catch (e) {
        out.replaceChildren(h('p', { class: 'pf-error', text: e.message || '계산 중 문제가 생겼어요.' }));
      } finally { go.disabled = false; }
    });
    wrap.append(formWrap, h('div', { class: 'pf-submit' }, [h('label', { class: 'pf-check' }, [remember, ' 내 정보를 이 기기에 저장 (서버 전송 없음)']), go]), out);
    const back = window.PicklogBack && window.PicklogBack(app); if (back) wrap.append(back);
    app.append(wrap);
    if (window.PicklogGoToStart) window.PicklogGoToStart(app);
    loadData().catch(() => { /* surfaced on submit */ });
  }

  window.PicklogFortune = { mount, readPeriod, GOD };
})();
