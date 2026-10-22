/* PICKLOG IPIP module v2
 * Items: IPIP Big-Five Factor Markers, 50 items (Goldberg, 1992; public domain, ipip.ori.org).
 * Short form: Mini-IPIP 20 items (Donnellan, Oswald, Baird & Lucas, 2006) — a subset of the 50.
 * Korean wording: PICKLOG translation (not a validated Korean adaptation; no Korean norms).
 */
(() => {
  'use strict';
  const STORE_KEY = 'picklog_ipip_v2';
  const h = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c))); });
    return e;
  };
  const P = (t, cls) => h('p', { class: cls || '', text: t });

  // ---------- item bank ----------
  const FACTORS = [
    { id: 'E', name: '외향성', eng: 'Extraversion', alpha: .87, color: '#e8743b', what: '사람들과 어울리며 에너지를 얻고 자신을 드러내는 정도', poles: ['조용함·신중함', '활발함·사교성'] },
    { id: 'A', name: '친화성', eng: 'Agreeableness', alpha: .82, color: '#d9487a', what: '타인에게 관심을 갖고 공감하며 협력하려는 정도', poles: ['독립적·직설적', '따뜻함·배려'] },
    { id: 'C', name: '성실성', eng: 'Conscientiousness', alpha: .79, color: '#2f8f6b', what: '계획을 세우고 질서 있게 맡은 일을 해내는 정도', poles: ['유연함·즉흥성', '체계성·책임감'] },
    { id: 'ES', name: '정서 안정성', eng: 'Emotional Stability', alpha: .86, color: '#3a73c4', what: '스트레스 상황에서도 감정이 크게 흔들리지 않는 정도', poles: ['섬세함·민감성', '차분함·평온함'] },
    { id: 'I', name: '개방성(지성·상상력)', eng: 'Intellect / Imagination', alpha: .84, color: '#7454d6', what: '아이디어·추상적 사고·상상력을 즐기는 정도', poles: ['실용적·현실적', '호기심·상상력'] }
  ];
  const BANK = {
    E: [['모임에서 분위기를 띄우는 편이다', 1], ['사람들과 함께 있으면 편안하다', 1], ['먼저 대화를 시작한다', 1], ['모임에서 여러 사람과 두루 이야기를 나눈다', 1], ['주목받는 것이 크게 불편하지 않다', 1], ['말을 많이 하지 않는 편이다', -1], ['사람들 사이에서 뒤로 물러나 있는 편이다', -1], ['할 말이 별로 없는 편이다', -1], ['남의 관심을 끄는 것을 좋아하지 않는다', -1], ['낯선 사람들 앞에서는 조용해진다', -1]],
    A: [['사람들에게 관심이 많다', 1], ['다른 사람의 감정에 공감한다', 1], ['마음이 여린 편이다', 1], ['다른 사람을 위해 시간을 낸다', 1], ['다른 사람의 감정을 함께 느낀다', 1], ['사람들을 편안하게 해 준다', 1], ['다른 사람에게 별로 관심이 없다', -1], ['남에게 모욕적인 말을 한다', -1], ['다른 사람의 고민에는 관심이 없다', -1], ['다른 사람을 별로 걱정하지 않는다', -1]],
    C: [['늘 미리 준비해 두는 편이다', 1], ['세부 사항에 주의를 기울인다', 1], ['해야 할 일은 바로 처리한다', 1], ['정리정돈된 상태를 좋아한다', 1], ['정해 둔 일정에 맞춰 움직인다', 1], ['일할 때 기준이 까다롭고 정확하다', 1], ['물건을 아무 데나 두는 편이다', -1], ['일을 엉망으로 만들곤 한다', -1], ['물건을 제자리에 두는 것을 자주 잊는다', -1], ['맡은 일을 회피하는 편이다', -1]],
    ES: [['대부분의 시간 동안 느긋하고 편안하다', 1], ['우울한 기분을 거의 느끼지 않는다', 1], ['스트레스를 쉽게 받는다', -1], ['여러 가지 일을 걱정한다', -1], ['쉽게 마음이 동요한다', -1], ['쉽게 속상해한다', -1], ['기분이 자주 바뀐다', -1], ['감정 기복이 심한 편이다', -1], ['쉽게 짜증이 난다', -1], ['자주 우울한 기분이 든다', -1]],
    I: [['어휘력이 풍부한 편이다', 1], ['상상력이 생생하다', 1], ['좋은 아이디어를 잘 떠올린다', 1], ['새로운 것을 빨리 이해한다', 1], ['어려운 단어를 즐겨 쓴다', 1], ['여러 가지를 곰곰이 생각하는 시간을 갖는다', 1], ['아이디어가 넘친다', 1], ['추상적인 개념을 이해하기 어렵다', -1], ['추상적인 생각에는 관심이 없다', -1], ['상상력이 그다지 풍부하지 않다', -1]]
  };
  const MINI = { E: [0, 5, 3, 6], A: [1, 8, 4, 6], C: [2, 8, 3, 7], ES: [7, 0, 5, 1], I: [1, 8, 7, 9] };
  const ITEMS = [];
  for (let k = 0; k < 10; k++) FACTORS.forEach(f => { const [text, key] = BANK[f.id][k]; ITEMS.push({ id: f.id + (k + 1), f: f.id, text, key, mini: MINI[f.id].includes(k) }); });
  const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  const MINI_ITEMS = ITEMS.filter(i => i.mini);
  const CHOICES = ['전혀 아니다', '대체로 아니다', '보통이다', '대체로 그렇다', '매우 그렇다'];
  // pairs used for a response-consistency check: [idA, idB, sameDirection]
  const PAIRS = [['ES7', 'ES8'], ['ES2', 'ES10'], ['A1', 'A7'], ['E6', 'E8'], ['I9', 'I8'], ['C7', 'C9'], ['E3', 'E10']];

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { answers: {} }; } catch (e) { return { answers: {} }; } },
    set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  // ---------- scoring ----------
  function score(answers, items) {
    return FACTORS.map(f => {
      const its = items.filter(i => i.f === f.id);
      const vals = its.map(i => i.key === 1 ? answers[i.id] : 6 - answers[i.id]);
      const sum = vals.reduce((a, b) => a + b, 0), mean = sum / vals.length;
      const pomp = Math.round((mean - 1) / 4 * 100);
      const band = pomp >= 75 ? '높음' : pomp >= 60 ? '다소 높음' : pomp > 40 ? '중간' : pomp > 25 ? '다소 낮음' : '낮음';
      const level = pomp >= 60 ? 'high' : pomp <= 40 ? 'low' : 'mid';
      return { f, sum, n: vals.length, mean, pomp, band, level };
    });
  }
  function quality(answers, items, msPerItem) {
    const raw = items.map(i => answers[i.id]);
    const freq = [0, 0, 0, 0, 0]; raw.forEach(v => freq[v - 1]++);
    const flags = [];
    if (Math.max(...freq) / raw.length >= 0.7) flags.push('같은 응답이 70% 이상 반복되었습니다.');
    const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
    if (mean >= 4.3 || mean <= 1.7) flags.push('문항 방향과 관계없이 한쪽으로 응답하는 경향이 있습니다.');
    let incons = null;
    const usable = PAIRS.filter(([a, b]) => answers[a] && answers[b] && items.some(i => i.id === a) && items.some(i => i.id === b));
    if (usable.length >= 4) {
      incons = usable.reduce((s, [a, b]) => { const A = ITEM_BY_ID[a], B = ITEM_BY_ID[b]; const va = A.key === 1 ? answers[a] : 6 - answers[a]; const vb = B.key === 1 ? answers[b] : 6 - answers[b]; return s + Math.abs(va - vb); }, 0) / usable.length;
      if (incons >= 1.75) flags.push('비슷한 의미의 문항에 서로 다른 응답이 많았습니다.');
    }
    if (msPerItem && msPerItem < 1600) flags.push('응답 속도가 매우 빨랐습니다(문항당 평균 ' + (msPerItem / 1000).toFixed(1) + '초).');
    return { flags, incons, ok: flags.length === 0 };
  }
  const levelOf = (r, id) => r.find(x => x.f.id === id);

  // ---------- interpretation ----------
  const DESC = {
    E: { high: ['사람 속에서 에너지를 얻는 편', '새로운 사람과 대화를 시작하고 여럿이 모인 자리에서 적극적으로 참여하는 경향이 있습니다.', '분위기를 만들고 사람을 연결하는 힘', '혼자 정리할 시간이 부족하면 쉽게 소진될 수 있음', '사람을 만나는 일정 사이에 짧은 회복 시간을 넣어 보세요.'], mid: ['상황에 따라 조절하는 사교성', '친한 사람들 앞에서는 활발하지만 낯선 환경에서는 신중해지는, 상황에 맞춰 조절하는 모습입니다.', '혼자와 함께 모두에서 편안함', '애매한 자리에서 에너지를 어디에 쓸지 망설일 수 있음', '오늘 필요한 것이 "사람"인지 "휴식"인지 먼저 물어보세요.'], low: ['조용하고 깊이 있는 교류', '많은 사람과 어울리기보다 소수와 깊게 지내거나 혼자 생각을 정리하는 시간을 선호합니다.', '집중력과 경청, 신중한 판단', '의견이 있어도 말할 타이밍을 놓칠 수 있음', '회의 전 꼭 말할 한 문장을 미리 준비해 보세요.'] },
    A: { high: ['따뜻한 배려와 협력', '상대의 감정을 살피고 협력적으로 관계를 유지하려는 경향이 뚜렷합니다.', '신뢰를 얻고 갈등을 부드럽게 푸는 힘', '거절을 어려워해 내 몫이 줄어들 수 있음', '배려하면서도 내 필요와 경계를 분명히 말해 보세요.'], mid: ['균형 잡힌 대인 태도', '상대의 입장을 고려하면서도 필요할 때는 자기 의견을 분명히 냅니다.', '협력과 주장 사이의 균형', '상황에 따라 태도가 달라 보일 수 있음', '어떤 상황에서 단호해지는지 스스로 알아 두면 좋습니다.'], low: ['솔직하고 독립적인 판단', '분위기보다 원칙과 자기 판단을 우선하며, 직설적으로 의견을 말하는 편입니다.', '냉정한 판단과 협상력', '의도와 달리 차갑게 보일 수 있음', '반대 의견 전에 상대가 중요하게 여기는 점을 한 번 짚어 주세요.'] },
    C: { high: ['계획적이고 책임감 있는 실행', '일정과 세부 사항을 관리하고 맡은 일을 끝까지 해내려는 경향이 강합니다.', '믿고 맡길 수 있는 꾸준함', '계획이 틀어지면 스트레스를 크게 받을 수 있음', '계획에 일부러 여유 시간을 넣어 두세요.'], mid: ['중요한 일에 집중하는 유연한 실행', '중요한 일은 계획적으로 챙기지만 모든 일을 엄격하게 관리하지는 않습니다.', '효율과 유연성의 균형', '관심이 덜한 일은 미뤄지기 쉬움', '자꾸 미뤄지는 일 하나에만 체크리스트를 써 보세요.'], low: ['즉흥적이고 유연한 접근', '정해진 순서보다 그때그때 대응하는 방식을 편하게 느낍니다.', '변화에 빠르게 적응하는 순발력', '마감과 정리가 밀리기 쉬움', '시작 시간과 완료 기준을 구체적으로 적어 두세요.'] },
    ES: { high: ['차분하고 안정적인 감정', '압박 상황에서도 감정의 변화를 비교적 안정적으로 다룬다고 응답했습니다.', '위기 상황의 침착함', '내 감정이나 타인의 힘듦을 가볍게 넘길 수 있음', '괜찮다고 넘기기 전에 지금 감정에 이름을 붙여 보세요.'], mid: ['상황에 따라 달라지는 감정 반응', '평소에는 안정적이지만 특정 상황에서 걱정이나 긴장이 커질 수 있습니다.', '감정을 느끼면서도 다시 균형을 찾는 힘', '스트레스가 몰리면 예민해질 수 있음', '스트레스가 커지는 상황과 회복에 도움이 되는 행동을 기록해 보세요.'], low: ['섬세하고 민감한 감정', '걱정·긴장·기분 변화를 비교적 자주 경험한다고 응답했습니다. 질병이나 정신건강 상태를 뜻하지는 않습니다.', '위험을 미리 감지하고 타인의 감정을 잘 알아차림', '걱정이 꼬리를 물어 지치기 쉬움', '반복되는 스트레스 요인을 적고, 도움을 요청할 사람을 정해 두세요.'] },
    I: { high: ['아이디어와 상상력을 즐김', '추상적인 주제와 새로운 관점을 탐색하고 아이디어를 떠올리는 것을 즐깁니다.', '창의적 문제 해결과 빠른 이해', '아이디어가 실행보다 앞서갈 수 있음', '떠오른 아이디어 하나를 이번 주에 작게 실험해 보세요.'], mid: ['실용과 탐색의 조화', '새로운 생각에 관심이 있으면서도 익숙하고 구체적인 방법을 함께 활용합니다.', '아이디어를 현실에 맞게 다듬는 능력', '새로운 시도를 할지 망설일 때가 있음', '관심 있는 주제를 실제 생활의 문제와 연결해 보세요.'], low: ['구체적이고 실용적인 사고', '추상적인 개념보다 분명한 사실과 실용적인 과제에 집중하는 편입니다.', '현실 감각과 실행 중심의 사고', '새로운 방식에 대한 거부감이 기회를 막을 수 있음', '새 정보를 배울 땐 사례와 그림 자료부터 보세요.'] }
  };

  const ARCH = (name, desc, strength, caution, tip) => ({ name, desc, strength, caution, tip });
  const THEMES = {
    love: { title: '나는 어떤 연애 스타일일까?', kicker: 'LOVE STYLE', axes: ['E', 'A'], arch: {
      HH: ARCH('다정한 분위기 메이커', '함께 있으면 즐겁고, 상대의 마음까지 세심하게 챙기는 연애 스타일입니다. 표현이 풍부하고 데이트 분위기를 자연스럽게 이끕니다.', '애정 표현과 공감이 모두 풍부해 상대가 사랑받는다고 느끼기 쉽습니다.', '모두에게 다정한 모습이 연인에게는 서운함이 될 수 있어요.', '연인만을 위한 작은 표현(둘만의 약속, 기념 메시지)을 따로 만들어 보세요.'),
      HL: ARCH('솔직한 직진형', '좋으면 좋다고 분명히 말하고 먼저 다가가는 스타일입니다. 밀고 당기기보다 솔직한 대화를 선호합니다.', '감정을 숨기지 않아 관계가 투명하고 빠르게 가까워집니다.', '솔직함이 상대에게는 날카롭게 들릴 수 있어요.', '의견을 말하기 전에 "네 생각은 어때?"를 먼저 물어보세요.'),
      LH: ARCH('은근한 배려형', '말보다 행동으로 마음을 보여 주는 스타일입니다. 상대에게 필요한 것을 조용히 알아차리고 챙겨 줍니다.', '세심한 배려로 깊고 안정적인 신뢰를 쌓습니다.', '표현하지 않으면 상대가 내 진심을 모를 수 있어요.', '하루 한 번, 고마운 점을 말로 전해 보세요.'),
      LL: ARCH('독립적인 쿨한 연인', '각자의 시간과 공간을 존중하는 담백한 연애를 선호합니다. 과한 간섭이나 감정 소모를 피하려 합니다.', '서로의 자율성을 지켜 주어 오래가도 지치지 않는 관계를 만듭니다.', '상대는 거리감을 무관심으로 느낄 수 있어요.', '연락 빈도와 만남 주기를 미리 합의해 두면 오해가 줄어듭니다.') },
      extra: { ES: ['연락이 늦거나 다툼이 있어도 비교적 차분하게 기다릴 수 있는 편입니다.', '평소엔 안정적이지만 관계가 흔들리는 순간에는 걱정이 커질 수 있습니다.', '상대의 작은 반응에도 마음이 크게 움직이는 편입니다. 확인을 요구하기보다 내 감정을 차분히 설명해 보세요.'], C: ['약속과 기념일을 잘 챙기고 계획적인 데이트를 선호합니다.', '중요한 약속은 챙기되 즉흥적인 만남도 즐깁니다.', '계획보다 그때그때의 흐름을 즐깁니다. 상대가 계획형이라면 큰 약속만큼은 미리 정해 두세요.'], I: ['새로운 장소, 깊은 대화, 색다른 경험을 함께할 때 설렘을 느낍니다.', '익숙한 데이트와 새로운 경험을 적당히 섞을 때 만족합니다.', '익숙하고 편안한 데이트 코스를 선호하는 편입니다.'] } },
    relation: { title: '관계에서 나는 어떤 사람일까?', kicker: 'RELATIONSHIP', axes: ['ES', 'A'], arch: {
      HH: ARCH('든든한 버팀목형', '감정이 안정적이고 배려심이 깊어 주변 사람들이 기대고 싶어 하는 사람입니다.', '갈등 상황에서도 차분하게 중재하고 상대를 안심시킵니다.', '늘 괜찮은 사람으로 보여, 정작 내가 힘들 때 도움을 받지 못할 수 있어요.', '가끔은 먼저 "나도 좀 힘들어"라고 말해 보세요.'),
      HL: ARCH('담백한 거리 유지형', '감정 소모가 적고 사람에게 휘둘리지 않는 편입니다. 필요한 만큼 깔끔하게 관계를 유지합니다.', '관계 때문에 흔들리지 않고 자기 중심을 지킵니다.', '상대에게 차갑거나 무심하게 보일 수 있어요.', '상대의 이야기에 짧은 공감 한마디("그랬구나")를 더해 보세요.'),
      LH: ARCH('마음 쓰는 공감형', '다른 사람의 감정을 잘 느끼고 깊이 공감합니다. 관계의 작은 변화에도 민감하게 반응합니다.', '섬세한 공감으로 사람들이 마음을 열게 만듭니다.', '남의 감정까지 떠안아 쉽게 지칠 수 있어요.', '도와줄 수 있는 것과 없는 것의 경계를 정해 두세요.'),
      LL: ARCH('솔직한 감정파', '감정이 풍부하고 자기 생각을 분명히 드러냅니다. 불편한 것을 오래 참지 않습니다.', '진짜 감정을 숨기지 않아 관계가 솔직합니다.', '감정이 클 때 한 말이 관계에 상처를 남길 수 있어요.', '화가 날 땐 10분 뒤에 이야기하는 규칙을 만들어 보세요.') },
      extra: { E: ['여러 사람과 폭넓게 어울리며 새로운 관계를 쉽게 시작합니다.', '상황에 따라 넓게 또는 좁게 관계를 맺습니다.', '소수의 사람과 깊고 오래가는 관계를 선호합니다.'], C: ['약속을 잘 지켜 믿을 수 있는 사람으로 인식됩니다.', '중요한 약속은 지키지만 사소한 연락은 놓칠 때가 있습니다.', '자유로운 관계를 좋아하지만 연락이나 약속이 늦어 오해를 사기도 합니다.'], I: ['깊고 다양한 주제의 대화를 즐깁니다.', '가벼운 대화와 깊은 대화를 모두 편하게 나눕니다.', '일상적이고 실용적인 대화를 편하게 느낍니다.'] },
      note: '애착 유형(안정형·불안형·회피형)을 판정하는 검사가 아닙니다. 성격 5요인이 관계에서 어떻게 드러날 수 있는지 보여 줍니다.' },
    work: { title: '회사에서 나는 어떤 캐릭터일까?', kicker: 'WORK STYLE', axes: ['C', 'E'], arch: {
      HH: ARCH('추진하는 리더형', '계획을 세우고 사람들을 이끌며 목표를 끝까지 밀고 갑니다.', '체계와 추진력을 모두 갖춰 팀의 방향을 잡아 줍니다.', '내 기준으로 팀을 몰아붙이면 팀원이 지칠 수 있어요.', '목표를 정할 때 팀원의 의견을 먼저 듣는 시간을 만드세요.'),
      HL: ARCH('꼼꼼한 설계자', '혼자 집중해서 정확하고 완성도 높은 결과물을 만듭니다.', '디테일과 마감 관리가 뛰어나 믿고 맡길 수 있는 사람입니다.', '완벽을 추구하다 공유가 늦어질 수 있어요.', '80% 완성 단계에서 중간 공유를 해 보세요.'),
      LH: ARCH('현장의 분위기 메이커', '사람들과 부딪히며 빠르게 움직이고, 회의와 협업에 활기를 불어넣습니다.', '네트워크와 순발력으로 막힌 일을 풀어냅니다.', '일이 많아지면 마무리가 흐트러질 수 있어요.', '하루를 시작할 때 꼭 끝낼 일 세 가지만 적어 두세요.'),
      LL: ARCH('유연한 독립 작업자', '정해진 틀보다 자기 방식과 리듬으로 일할 때 능률이 오릅니다.', '변화에 유연하고, 압박 없는 환경에서 창의적인 해결책을 냅니다.', '마감과 보고가 느슨해지기 쉬워요.', '큰 일을 작게 쪼개고 중간 마감을 스스로 정하세요.') },
      extra: { A: ['협업과 조율에 강하며 팀 분위기를 부드럽게 만듭니다.', '필요할 땐 협력하고, 필요할 땐 의견을 분명히 냅니다.', '감정보다 결과와 논리를 우선해 날카로운 피드백을 잘합니다.'], ES: ['압박이 큰 상황에서도 침착하게 판단합니다.', '평소엔 안정적이지만 마감이 몰리면 긴장이 커질 수 있습니다.', '업무 스트레스에 민감한 편이라 일정에 여유를 두는 것이 성과에 도움이 됩니다.'], I: ['새로운 방식과 개선 아이디어를 내는 데 강합니다.', '검증된 방식과 새로운 시도를 균형 있게 활용합니다.', '검증된 방법을 안정적으로 실행하는 데 강합니다.'] } },
    money: { title: '나의 소비 성격은?', kicker: 'MONEY STYLE', axes: ['C', 'ES'], arch: {
      HH: ARCH('차분한 자산 관리자', '계획적으로 쓰고 모으며, 상황이 출렁여도 크게 동요하지 않습니다.', '예산과 저축 습관이 탄탄해 장기적으로 자산을 쌓기 유리합니다.', '지나친 절약으로 지금의 즐거움을 놓칠 수 있어요.', '월 예산에 "나를 위한 소비" 항목을 따로 만들어 두세요.'),
      HL: ARCH('걱정 많은 절약가', '꼼꼼하게 관리하지만 돈 걱정이 쉽게 커지는 편입니다.', '지출을 철저히 점검해 낭비가 적습니다.', '불안 때문에 필요한 투자나 경험까지 미룰 수 있어요.', '비상금 목표 금액을 정해 두면 막연한 불안이 줄어듭니다.'),
      LH: ARCH('여유로운 경험 소비자', '돈보다 경험과 즐거움을 중시하며 지출을 크게 걱정하지 않습니다.', '삶의 만족도를 높이는 곳에 돈을 쓸 줄 압니다.', '계획 없이 쓰다 보면 월말에 놀랄 수 있어요.', '급여일에 저축액부터 자동이체로 빼 두세요.'),
      LL: ARCH('기분 따라 소비형', '기분이 소비에 영향을 주기 쉬운 편입니다. 스트레스를 쇼핑으로 푸는 경우가 있습니다.', '감각이 좋아 자신에게 맞는 것을 빠르게 알아봅니다.', '감정적인 순간의 결제가 후회로 이어질 수 있어요.', '장바구니에 담고 24시간 뒤에 결제하는 규칙을 만들어 보세요.') },
      extra: { E: ['사람을 만나는 데 쓰는 지출(모임·선물)이 큰 편입니다.', '사교 지출과 개인 지출이 균형을 이룹니다.', '혼자만의 취미나 집에서의 소비를 선호합니다.'], A: ['선물과 나눔에 아낌없는 편입니다. 부탁을 거절하지 못해 생기는 지출에 주의하세요.', '나와 타인을 위한 지출의 균형을 잘 잡습니다.', '내 기준에 맞는 합리적인 소비를 중시합니다.'], I: ['새로운 제품, 배움, 색다른 경험에 투자하는 것을 즐깁니다.', '검증된 제품과 새로운 시도를 적절히 섞습니다.', '익숙하고 검증된 브랜드와 제품을 선호합니다.'] },
      note: '소비 행동을 직접 측정하지 않고, 성격 특성과 소비 습관의 일반적인 관련성을 바탕으로 해석했습니다.' },
    stress: { title: '나는 스트레스를 어떻게 풀까?', kicker: 'STRESS STYLE', axes: ['ES', 'E'], arch: {
      HH: ARCH('툭툭 털고 사람 속으로', '스트레스를 받아도 회복이 빠르고, 사람들과 어울리며 기분을 전환합니다.', '긍정적인 에너지로 주변까지 밝게 만듭니다.', '괜찮은 척 넘긴 문제가 나중에 쌓일 수 있어요.', '가끔은 혼자 정리하는 시간도 가져 보세요.'),
      HL: ARCH('혼자서도 단단한 회복형', '힘든 일이 있어도 조용히 스스로 정리하며 균형을 되찾습니다.', '감정에 휩쓸리지 않고 차분하게 문제를 바라봅니다.', '도움이 필요할 때도 혼자 해결하려 할 수 있어요.', '믿을 만한 한 사람에게는 상황을 공유해 두세요.'),
      LH: ARCH('털어놓으며 회복하는 대화형', '감정을 크게 느끼는 만큼, 누군가와 이야기하며 마음을 정리할 때 회복됩니다.', '감정을 솔직하게 나누며 도움을 잘 구합니다.', '같은 고민을 반복해 말하면 오히려 더 지칠 수 있어요.', '이야기 끝에 "그래서 내가 할 수 있는 한 가지"를 정해 보세요.'),
      LL: ARCH('조용한 충전이 필요한 섬세형', '자극에 민감해 스트레스를 깊게 느끼고, 혼자만의 조용한 시간이 꼭 필요합니다.', '자신의 상태를 섬세하게 알아차립니다.', '혼자 고민하다 생각이 꼬리를 물 수 있어요.', '산책이나 샤워처럼 몸을 쓰는 짧은 루틴으로 생각의 고리를 끊어 보세요.') },
      extra: { C: ['계획을 세워 문제를 하나씩 해결하는 방식이 스트레스를 줄여 줍니다.', '급한 일은 계획적으로, 나머지는 유연하게 대응합니다.', '압박이 클 때 미루기 쉬우니 "5분만 시작하기"가 도움이 됩니다.'], A: ['주변의 지지를 받을 때 빠르게 회복합니다. 남의 부탁까지 떠안지 않도록 주의하세요.', '필요할 때 도움을 요청하고 거절도 할 수 있습니다.', '남에게 기대기보다 스스로 해결하는 것을 편하게 느낍니다.'], I: ['관점을 바꾸거나 새로운 활동에 몰입하며 기분을 전환합니다.', '익숙한 방식과 새로운 방식을 섞어 회복합니다.', '잠, 음식, 좋아하는 콘텐츠 같은 익숙한 루틴으로 안정을 찾습니다.'] },
      note: '스트레스 수준이나 우울·불안을 진단하는 검사가 아닙니다. 힘든 상태가 2주 이상 이어진다면 전문가와 상담해 보세요.' },
    career: { title: '내게 잘 맞는 일하는 스타일은?', kicker: 'CAREER STYLE', axes: ['I', 'E'], arch: {
      HH: ARCH('아이디어를 이끄는 기획·창업형', '새로운 아이디어를 내고 사람들을 설득해 실현하는 일에 끌립니다. 기획, 마케팅, 창업, 콘텐츠 제작 같은 영역과 성향이 잘 맞습니다.', '비전을 그리고 사람들을 움직이는 힘이 있습니다.', '시작은 많지만 마무리가 약해질 수 있어요.', '실행을 꼼꼼히 챙겨 줄 파트너와 함께하세요.'),
      HL: ARCH('깊이 파고드는 연구·전문가형', '복잡한 문제를 혼자 깊이 탐구하는 일에 끌립니다. 연구, 개발, 분석, 디자인처럼 전문성이 쌓이는 영역과 잘 맞습니다.', '깊은 사고로 남들이 못 보는 답을 찾습니다.', '성과를 알리는 데 소극적일 수 있어요.', '작업 결과를 정기적으로 기록하고 공유해 보세요.'),
      LH: ARCH('사람과 현장을 움직이는 실행형', '사람을 만나고 현장에서 결과를 만드는 일에 끌립니다. 영업, 서비스, 운영, 교육처럼 사람과 호흡하는 영역과 잘 맞습니다.', '실행력과 대인 감각으로 빠르게 성과를 냅니다.', '반복적인 업무가 길어지면 지루함을 느낄 수 있어요.', '새로운 사람이나 목표가 주기적으로 생기는 환경을 찾아보세요.'),
      LL: ARCH('안정적으로 완성하는 실무형', '정해진 절차를 정확하게 수행하는 일에 강점이 있습니다. 회계, 관리, 품질, 기술 실무처럼 체계가 분명한 영역과 잘 맞습니다.', '꾸준함과 정확성으로 조직의 기반을 받칩니다.', '변화가 잦은 환경에서는 스트레스를 받을 수 있어요.', '전문 자격이나 기술로 나만의 영역을 굳혀 보세요.') },
      extra: { C: ['체계적인 환경, 명확한 목표가 있는 일에서 능력을 발휘합니다.', '체계와 자율이 적절히 섞인 환경이 편합니다.', '규칙이 느슨하고 자율성이 큰 환경에서 능률이 오릅니다.'], A: ['사람을 돕고 가르치는 일에서 보람을 크게 느낍니다.', '협업과 개인 성과가 균형 잡힌 일이 잘 맞습니다.', '경쟁과 협상, 냉정한 판단이 필요한 일에서 강점을 보입니다.'], ES: ['압박이 큰 직무(위기 대응, 고객 응대)도 비교적 잘 견딥니다.', '적당한 긴장감이 있는 환경에서 집중력이 좋아집니다.', '예측 가능하고 안정적인 환경에서 실력을 더 잘 발휘합니다.'] },
      note: '직업 적성을 판정하는 검사가 아닙니다. 메타분석 연구(Barrick, Mount & Gupta, 2003)에서 개방성은 탐구·예술형, 외향성은 진취·사회형 직업 흥미와 관련이 있는 것으로 보고되었습니다.' },
    animal: { title: '나와 닮은 동물은?', kicker: 'ANIMAL TYPE', animal: true }
  };
  const ANIMALS = [
    ['골든 리트리버', [1, 1, 0, .5, 0], '모두를 반기는 다정한 친구', '어디서든 금방 친구를 만들고 주변을 따뜻하게 만듭니다. 사람을 좋아하고 믿음직해서 모임에 꼭 필요한 존재입니다.', '돌고래'],
    ['고양이', [-1, 0, 0, 0, .8], '나만의 세계가 있는 자유로운 관찰자', '혼자만의 시간과 취향이 확실합니다. 조용히 관찰하다가 마음을 연 사람에게는 깊은 애정을 보여 줍니다.', '부엉이'],
    ['여우', [.7, -.8, 0, .3, 1], '재치 있고 영리한 전략가', '머리 회전이 빠르고 상황 판단이 정확합니다. 솔직한 말과 재치로 분위기를 장악합니다.', '사자'],
    ['곰', [-.5, 1, .5, 1, -.5], '느긋하고 든든한 수호자', '쉽게 흔들리지 않고 주변을 품어 주는 넉넉함이 있습니다. 함께 있으면 마음이 편안해지는 사람입니다.', '다람쥐'],
    ['다람쥐', [0, .3, 1, -.8, 0], '부지런하고 섬세한 준비왕', '미리미리 준비하고 꼼꼼하게 챙기는 성실함이 돋보입니다. 작은 변화도 잘 알아차리는 섬세함이 있습니다.', '곰'],
    ['돌고래', [1, .8, 0, .3, 1], '호기심 많은 사교왕', '새로운 사람과 아이디어를 모두 좋아합니다. 장난기와 지적 호기심으로 어디서든 즐거움을 만듭니다.', '골든 리트리버'],
    ['부엉이', [-1, 0, .8, .3, 1], '조용히 꿰뚫어 보는 지혜가', '말수는 적지만 깊이 생각하고 핵심을 꿰뚫습니다. 계획적이고 지적인 대화를 즐깁니다.', '고양이'],
    ['사자', [1, -.6, 1, 1, 0], '당당하게 이끄는 리더', '목표가 분명하고 추진력이 강합니다. 위기 상황에서도 흔들리지 않고 앞장서는 타입입니다.', '여우']
  ];
  const TYPE_NAMES = { ISTJ: '신중한 현실 설계자', ISFJ: '다정한 일상 수호자', INFJ: '깊이 생각하는 조언자', INTJ: '미래를 그리는 전략가', ISTP: '침착한 문제 해결사', ISFP: '감각적인 자유 탐험가', INFP: '가치를 따르는 이상주의자', INTP: '호기심 많은 분석가', ESTP: '현장에서 빛나는 실행가', ESFP: '분위기를 살리는 에너지 메이커', ENFP: '가능성을 발견하는 아이디어 탐험가', ENTP: '질문을 던지는 발명가', ESTJ: '체계적인 목표 추진가', ESFJ: '사람을 잇는 조율가', ENFJ: '함께 성장하는 이끄미', ENTJ: '큰 그림을 실행하는 리더' };

  const TESTS = {
    bigfive: { title: 'Big Five 성격 정밀 검사', kicker: 'IPIP BIG FIVE · 50문항', items: ITEMS, minutes: '7~10분' },
    type: { title: '나의 성격 유형 스타일', kicker: 'BIG FIVE 기반 16타입 · 50문항', items: ITEMS, minutes: '7~10분' },
    love: { items: MINI_ITEMS, minutes: '약 3분' }, relation: { items: MINI_ITEMS, minutes: '약 3분' }, work: { items: MINI_ITEMS, minutes: '약 3분' },
    money: { items: MINI_ITEMS, minutes: '약 3분' }, stress: { items: MINI_ITEMS, minutes: '약 3분' }, career: { items: MINI_ITEMS, minutes: '약 3분' }, animal: { items: MINI_ITEMS, minutes: '약 3분' }
  };
  Object.keys(THEMES).forEach(k => Object.assign(TESTS[k], { title: THEMES[k].title, kicker: THEMES[k].kicker + ' · Mini-IPIP 20문항' }));

  // ---------- views ----------
  function shell(app, test) {
    app.replaceChildren();
    const root = h('section', { class: 'pil-wrap ip' });
    root.append(h('div', { class: 'ip-head' }, [h('span', { class: 'ip-kicker', text: test.kicker }), h('h2', { text: test.title })]));
    app.append(root);
    if (window.PicklogGoToStart) window.PicklogGoToStart(app);
    return root;
  }
  function factorBars(results, compact) {
    return h('div', { class: 'ip-bars' + (compact ? ' ip-bars-compact' : '') }, results.map(r => h('div', { class: 'ip-bar', style: `--c:${r.f.color}` }, [
      h('div', { class: 'ip-bar-top' }, [h('strong', { text: r.f.name }), h('span', { text: `${r.pomp}점 · ${r.band}` })]),
      h('div', { class: 'ip-bar-track' }, h('i', { style: `width:${Math.max(3, r.pomp)}%` })),
      compact ? null : h('div', { class: 'ip-bar-poles' }, [h('span', { text: r.f.poles[0] }), h('span', { text: r.f.poles[1] })])
    ])));
  }
  function radar(results) {
    const cx = 130, cy = 122, R = 92, n = 5;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const ring = (f) => results.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(',')).join(' ');
    const poly = results.map((r, i) => pt(i, R * Math.max(.04, r.pomp / 100)).map(v => v.toFixed(1)).join(',')).join(' ');
    const labels = results.map((r, i) => { const [x, y] = pt(i, R + 20); const short = r.f.name.replace(/\(.*\)/, ''); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="ip-radar-label">${short}</text>`; }).join('');
    const dots = results.map((r, i) => { const [x, y] = pt(i, R * Math.max(.04, r.pomp / 100)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${r.f.color}"/>`; }).join('');
    return h('div', { class: 'ip-radar', html: `<svg viewBox="0 0 260 250" role="img" aria-label="성격 5요인 프로파일 차트">${[1, .75, .5, .25].map(f => `<polygon points="${ring(f)}" class="ip-radar-grid"/>`).join('')}${results.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="ip-radar-grid"/>`; }).join('')}<polygon points="${poly}" class="ip-radar-shape"/>${dots}${labels}</svg>` });
  }

  function intro(app, key) {
    const test = TESTS[key];
    const root = shell(app, test);
    const saved = store.get();
    const have = test.items.filter(i => saved.answers[i.id]).length;
    const isFull = test.items.length === 50;
    root.append(h('div', { class: 'ip-intro' }, [
      h('div', { class: 'ip-facts' }, [
        h('div', {}, [h('strong', { text: test.items.length + '문항' }), h('span', { text: '5점 척도' })]),
        h('div', {}, [h('strong', { text: test.minutes }), h('span', { text: '소요 시간' })]),
        h('div', {}, [h('strong', { text: 'IPIP' }), h('span', { text: isFull ? 'Big-Five Factor Markers' : 'Mini-IPIP' })])
      ]),
      h('ul', { class: 'ip-guide' }, [
        h('li', { text: '미래에 되고 싶은 모습이 아니라, 지금 평소의 나를 떠올리며 답해 주세요.' }),
        h('li', { text: '비슷한 나이·성별의 다른 사람들과 비교했을 때 어떤지 생각하면 쉽습니다.' }),
        h('li', { text: '정답은 없습니다. 너무 오래 고민하지 말고 처음 떠오른 답을 고르세요.' }),
        h('li', { text: '키보드 숫자 1~5로도 답할 수 있습니다.' })
      ])
    ]));
    const actions = h('div', { class: 'ip-actions' });
    if (have === test.items.length) {
      actions.append(h('button', { type: 'button', class: 'pil-btn primary', text: '이전 응답으로 바로 결과 보기', onclick: () => result(app, key, saved.answers, null) }));
      actions.append(h('button', { type: 'button', class: 'pil-btn', text: '처음부터 새로 답하기', onclick: () => run(app, key, {}) }));
    } else if (have > 0) {
      actions.append(h('button', { type: 'button', class: 'pil-btn primary', text: `이어서 ${test.items.length - have}문항만 답하기`, onclick: () => run(app, key, saved.answers) }));
      actions.append(h('button', { type: 'button', class: 'pil-btn', text: '처음부터 답하기', onclick: () => run(app, key, {}) }));
    } else actions.append(h('button', { type: 'button', class: 'pil-btn primary ip-start', text: '검사 시작하기', onclick: () => run(app, key, {}) }));
    root.append(actions);
    if (have > 0 && have < test.items.length) root.append(P(`이 기기에 이전에 답한 ${have}개 문항이 저장되어 있어요. 같은 문항은 다시 묻지 않습니다.`, 'ip-hint'));
    root.append(P('문항 출처: International Personality Item Pool (ipip.ori.org, 공개 문항). 한국어 번역은 PICKLOG가 작성했으며 국내 표준화 검사가 아닙니다.', 'ip-source'));
    { const back = window.PicklogBack && window.PicklogBack(app); if (back) root.append(back); }
  }

  function run(app, key, prior) {
    const test = TESTS[key];
    const answers = Object.assign({}, prior);
    const queue = test.items.filter(i => !answers[i.id]);
    if (!queue.length) return result(app, key, answers, null);
    let pos = 0; const started = Date.now();
    const root = shell(app, test);
    const meta = h('div', { class: 'ip-meta' });
    const track = h('div', { class: 'ip-progress' }, h('i'));
    const card = h('div', { class: 'ip-card' });
    const nav = h('div', { class: 'ip-nav' });
    root.append(meta, track, card, nav);
    let locked = false;
    function answer(v) {
      if (locked) return; locked = true;
      answers[queue[pos].id] = v;
      const s = store.get(); s.answers[queue[pos].id] = v; s.ts = Date.now(); store.set(s);
      draw(true);
      setTimeout(() => { locked = false; if (pos < queue.length - 1) { pos++; draw(); } else finish(); }, 180);
    }
    function finish() { document.removeEventListener('keydown', onKey); result(app, key, answers, (Date.now() - started) / queue.length); }
    function draw() {
      const it = queue[pos];
      const done = test.items.length - queue.length + pos;
      meta.replaceChildren(h('span', { text: `${done + 1} / ${test.items.length}` }), h('span', { text: test.items.length === 50 ? 'IPIP-50' : 'Mini-IPIP' }));
      track.firstChild.style.width = (done / test.items.length * 100) + '%';
      card.replaceChildren(h('span', { class: 'ip-step', text: 'Q' + String(done + 1).padStart(2, '0') }), h('h3', { class: 'ip-q', text: it.text }),
        h('div', { class: 'ip-scale', role: 'radiogroup', 'aria-label': '응답 선택' }, CHOICES.map((c, i) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(answers[it.id] === i + 1), class: 'ip-opt' + (answers[it.id] === i + 1 ? ' is-on' : ''), onclick: () => answer(i + 1) }, [h('span', { class: 'ip-dot', text: i + 1 }), h('span', { class: 'ip-opt-label', text: c })]))));
      nav.replaceChildren(
        h('button', { type: 'button', class: 'pil-btn', text: '← 이전', disabled: pos === 0, onclick: () => { if (pos > 0) { pos--; draw(); } } }),
        answers[it.id] ? h('button', { type: 'button', class: 'pil-btn', text: pos === queue.length - 1 ? '결과 보기' : '다음 →', onclick: () => { if (pos < queue.length - 1) { pos++; draw(); } else finish(); } }) : h('span')
      );
    }
    function onKey(e) { if (!document.body.contains(card)) { document.removeEventListener('keydown', onKey); return; } if (e.key >= '1' && e.key <= '5' && !e.metaKey && !e.ctrlKey && !/input|select|textarea/i.test(e.target.tagName)) answer(+e.key); }
    document.addEventListener('keydown', onKey);
    draw();
  }

  function qualityBox(q) {
    return h('div', { class: 'ip-quality' + (q.ok ? ' is-ok' : ' is-warn') }, [
      h('strong', { text: q.ok ? '응답 품질 점검 · 양호' : '응답 품질 점검 · 해석 주의' }),
      q.ok ? P('일관성·응답 편향·응답 속도에서 특이 사항이 발견되지 않았습니다.') : h('ul', {}, q.flags.map(t => h('li', { text: t }))),
      q.ok ? null : P('결과가 실제 성격과 다를 수 있습니다. 시간 여유가 있을 때 다시 응답해 보세요.')
    ]);
  }

  function crossLinks(app, current) {
    const all = [['bigfive', 'Big Five 정밀 검사'], ['type', '16타입 성격 스타일'], ['love', '연애 스타일'], ['relation', '관계 스타일'], ['work', '직장 캐릭터'], ['money', '소비 성격'], ['stress', '스트레스 해소법'], ['career', '일하는 스타일'], ['animal', '닮은 동물']];
    return h('div', { class: 'ip-more' }, [h('strong', { text: '같은 응답으로 다른 결과도 볼 수 있어요' }), h('div', { class: 'ip-chips' }, all.filter(([k]) => k !== current).map(([k, label]) => h('button', { type: 'button', class: 'ip-chip', text: label, onclick: () => intro(app, k) })))]);
  }
  function copyBtn(text) {
    return h('button', { type: 'button', class: 'pil-btn', text: '결과 복사', onclick: (e) => { const b = e.currentTarget; const done = () => { b.textContent = '복사했어요'; setTimeout(() => { b.textContent = '결과 복사'; }, 1600); }; if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => { b.textContent = '복사 실패'; }); } });
  }

  function result(app, key, answers, msPerItem) {
    const test = TESTS[key];
    const r = score(answers, test.items);
    const q = quality(answers, test.items, msPerItem);
    const root = shell(app, test);
    const shareLines = r.map(x => `${x.f.name} ${x.pomp}점(${x.band})`).join('\n');
    if (key === 'bigfive') renderBigFive(root, r);
    else if (key === 'type') renderType(root, r);
    else if (key === 'animal') renderAnimal(root, r);
    else renderTheme(root, key, r);
    const ad = window.PicklogAd && window.PicklogAd(); if (ad) root.append(ad);
    const cp = window.PicklogCoupang && window.PicklogCoupang(key); if (cp) root.append(cp);
    root.append(qualityBox(q));
    root.append(h('details', { class: 'ip-method' }, [h('summary', { text: '점수 계산 방법과 한계' }),
      P(`각 요인의 ${test.items.length === 50 ? 10 : 4}개 문항을 1~5점으로 채점하고, 반대 방향 문항은 역채점(6−응답)했습니다. 점수는 평균을 0~100으로 바꾼 값(POMP 점수)으로, 가능한 점수 범위 안에서의 위치입니다. 다른 사람과 비교한 백분위가 아닙니다.`),
      P(test.items.length === 50 ? '원척도의 미국 표본 신뢰도(Cronbach α)는 외향성 .87, 친화성 .82, 성실성 .79, 정서 안정성 .86, 개방성 .84로 보고되었습니다(ipip.ori.org). 한국어 번역판의 신뢰도와 한국인 규준은 확인되지 않았습니다.' : 'Mini-IPIP는 50문항 원척도에서 요인별 4문항을 고른 단축형입니다(Donnellan 외, 2006). 문항 수가 적어 정밀도가 낮으니, 더 정확한 결과는 50문항 정밀 검사를 이용하세요.'),
      P('이 결과는 자기이해를 돕는 참고 자료이며 채용·진단·치료 판단에 사용할 수 없습니다.')]));
    root.append(h('div', { class: 'ip-actions' }, [
      copyBtn(`PICKLOG ${test.title}\n${shareLines}\n(IPIP 기반 자기보고 결과)`),
      h('button', { type: 'button', class: 'pil-btn', text: '다시 검사', onclick: () => run(app, key, {}) }),
      test.items.length < 50 ? h('button', { type: 'button', class: 'pil-btn primary', text: '50문항 정밀 검사로 더 정확하게', onclick: () => intro(app, 'bigfive') }) : null
    ]));
    root.append(crossLinks(app, key));
    { const back = window.PicklogBack && window.PicklogBack(app); if (back) root.append(back); }
  }

  function renderBigFive(root, r) {
    const top = [...r].sort((a, b) => b.pomp - a.pomp);
    root.append(h('div', { class: 'ip-summary' }, [radar(r), h('div', { class: 'ip-summary-text' }, [
      h('span', { class: 'ip-kicker', text: 'MY BIG FIVE PROFILE' }),
      h('h3', { text: `가장 두드러진 특성은 ${top[0].f.name}` }),
      P(`${DESC[top[0].f.id][top[0].level][1]} 상대적으로 낮게 나타난 특성은 ${top[4].f.name}입니다.`),
      factorBars(r, true)])]));
    r.forEach(x => {
      const d = DESC[x.f.id][x.level];
      root.append(h('article', { class: 'ip-factor', style: `--c:${x.f.color}` }, [
        h('div', { class: 'ip-factor-head' }, [h('div', {}, [h('span', { class: 'ip-eng', text: x.f.eng }), h('h3', { text: x.f.name })]), h('div', { class: 'ip-factor-score' }, [h('strong', { text: x.pomp }), h('span', { text: x.band })])]),
        P(x.f.what, 'ip-what'),
        h('div', { class: 'ip-bar-track' }, h('i', { style: `width:${Math.max(3, x.pomp)}%` })),
        h('div', { class: 'ip-bar-poles' }, [h('span', { text: x.f.poles[0] }), h('span', { text: x.f.poles[1] })]),
        h('h4', { text: d[0] }), P(d[1]),
        h('div', { class: 'ip-grid3' }, [h('div', {}, [h('b', { text: '강점' }), P(d[2])]), h('div', {}, [h('b', { text: '주의할 점' }), P(d[3])]), h('div', {}, [h('b', { text: '활용 팁' }), P(d[4])])]),
        P(`원점수 ${x.sum} / ${x.n * 5} · 평균 ${x.mean.toFixed(2)}`, 'ip-raw')
      ]));
    });
  }

  function renderType(root, r) {
    const g = (id) => levelOf(r, id);
    const axes = [['E', 'I', g('E'), '에너지 방향'], ['N', 'S', g('I'), '정보 인식'], ['F', 'T', g('A'), '판단 기준'], ['J', 'P', g('C'), '생활 방식']];
    const code = axes.map(([a, b, x]) => x.mean >= 3 ? a : b).join('');
    root.append(h('div', { class: 'ip-type' }, [h('span', { class: 'ip-kicker', text: 'MY PERSONALITY STYLE' }), h('div', { class: 'ip-type-code', text: code }), h('h3', { text: TYPE_NAMES[code] }),
      P('Big Five의 외향성·개방성·친화성·성실성 점수를 네 가지 선호 축으로 바꾼 결과입니다. 연구에서 MBTI의 네 축은 이 네 요인과 각각 관련이 있는 것으로 보고되었습니다(McCrae & Costa, 1989).', 'ip-hint')]));
    root.append(h('div', { class: 'ip-axes' }, axes.map(([a, b, x, label]) => {
      const pct = x.pomp; const left = x.mean >= 3;
      return h('div', { class: 'ip-axis' }, [h('div', { class: 'ip-axis-top' }, [h('strong', { text: label }), h('span', { text: `${left ? a : b} · 선명도 ${Math.round(Math.abs(pct - 50) * 2)}%` })]),
        h('div', { class: 'ip-axis-track' }, [h('span', { text: b }), h('div', {}, h('i', { style: `left:${pct}%` })), h('span', { text: a })])]);
    })));
    root.append(P('선명도가 낮은 축은 양쪽 특성이 비슷하게 나타난다는 뜻입니다. 공식 MBTI® 검사 결과가 아닙니다.', 'ip-hint'));
    root.append(h('h3', { class: 'ip-subtitle', text: '바탕이 된 성격 5요인' }), factorBars(r));
  }

  function renderTheme(root, key, r) {
    const t = THEMES[key];
    const [ax, ay] = t.axes;
    const kx = levelOf(r, ax).mean >= 3 ? 'H' : 'L', ky = levelOf(r, ay).mean >= 3 ? 'H' : 'L';
    const a = t.arch[kx + ky];
    root.append(h('div', { class: 'ip-hero-result' }, [h('span', { class: 'ip-kicker', text: t.kicker + ' RESULT' }), h('h3', { class: 'ip-arch', text: a.name }), P(a.desc, 'ip-lead'),
      h('div', { class: 'ip-grid3' }, [h('div', {}, [h('b', { text: '강점' }), P(a.strength)]), h('div', {}, [h('b', { text: '주의할 점' }), P(a.caution)]), h('div', {}, [h('b', { text: '이렇게 해 보세요' }), P(a.tip)])])]));
    const fx = levelOf(r, ax).f.name, fy = levelOf(r, ay).f.name;
    root.append(P(`이 유형은 ${fx}(${levelOf(r, ax).pomp}점)과 ${fy}(${levelOf(r, ay).pomp}점) 조합으로 정해졌습니다.`, 'ip-hint'));
    const lv = { high: 0, mid: 1, low: 2 };
    root.append(h('section', { class: 'ip-extra' }, [h('h3', { class: 'ip-subtitle', text: '조금 더 자세히' }), ...Object.entries(t.extra).map(([fid, lines]) => { const x = levelOf(r, fid); return h('div', { class: 'ip-extra-row', style: `--c:${x.f.color}` }, [h('strong', { text: `${x.f.name} ${x.pomp}점` }), P(lines[lv[x.level]])]); })]));
    root.append(h('h3', { class: 'ip-subtitle', text: '나의 성격 5요인' }), factorBars(r));
    if (t.note) root.append(P(t.note, 'ip-note'));
  }

  function renderAnimal(root, r) {
    const v = ['E', 'A', 'C', 'ES', 'I'].map(id => Math.max(-1, Math.min(1, (levelOf(r, id).mean - 3) / 1.5)));
    const ranked = ANIMALS.map(a => [a, Math.sqrt(a[1].reduce((s, p, i) => s + (p - v[i]) ** 2, 0))]).sort((x, y) => x[1] - y[1]);
    const [best] = ranked[0], second = ranked[1][0];
    const match = Math.round(100 - ranked[0][1] / 4.5 * 100);
    root.append(h('div', { class: 'ip-hero-result' }, [h('span', { class: 'ip-kicker', text: 'ANIMAL TYPE RESULT' }), h('h3', { class: 'ip-arch', text: best[0] }), h('p', { class: 'ip-arch-sub', text: best[2] }), P(best[3], 'ip-lead'),
      h('div', { class: 'ip-grid3' }, [h('div', {}, [h('b', { text: '닮은 정도' }), P(`${Math.max(55, match)}%`)]), h('div', {}, [h('b', { text: '두 번째로 닮은 동물' }), P(second[0])]), h('div', {}, [h('b', { text: '잘 맞는 친구' }), P(best[4])])])]));
    root.append(h('h3', { class: 'ip-subtitle', text: '나의 성격 5요인' }), factorBars(r));
    root.append(P('성격 5요인 점수를 동물 캐릭터의 특징과 비교한 재미용 매칭입니다.', 'ip-note'));
  }

  window.PicklogIPIP = { mount: (app, key) => intro(app, TESTS[key] ? key : 'bigfive'), TESTS, ITEMS, score };
})();
