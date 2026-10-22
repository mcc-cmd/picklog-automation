/* PICKLOG Interactive Lab v2 — landing page & router */
(() => {
  'use strict';
  const ASSET = window.PicklogIllustrationBase || '';
  const h = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c))); });
    return e;
  };

  /** Scroll the app's top into view once (no repeated jumps). */
  let ready = false;
  function goToStart(app) {
    if (!ready || !app || !app.isConnected) return;
    const rect = app.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < 140) return;
    requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, window.scrollY + app.getBoundingClientRect().top - 72), behavior: 'auto' }));
  }
  window.PicklogGoToStart = goToStart;

  /** In-result AdSense unit — rendered only when a client id and slot id are configured. */
  window.PicklogAd = () => {
    const c = window.PicklogConfig && window.PicklogConfig.ads;
    if (!c || !c.client || !c.slot) return null;
    const ins = h('ins', { class: 'adsbygoogle', style: 'display:block', 'data-ad-client': c.client, 'data-ad-slot': c.slot, 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' });
    setTimeout(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ad blocked */ } }, 60);
    return h('div', { class: 'pil-ad' }, [h('span', { class: 'pil-ad-label', text: '광고' }), ins]);
  };
  /** Optional Coupang Partners link with the legally required disclosure. */
  window.PicklogCoupang = (key, label) => {
    const links = window.PicklogConfig && window.PicklogConfig.coupang;
    const url = links && links[key];
    if (!url) return null;
    return h('aside', { class: 'pil-coupang' }, [
      h('a', { href: url, target: '_blank', rel: 'sponsored nofollow noopener', text: label || '결과와 어울리는 추천 아이템 보기 →' }),
      h('p', { text: '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.' })
    ]);
  };

  const CARDS = [
    { id: 'saju', cat: 'SAJU & FORTUNE', title: '내 사주와 오늘의 운세', desc: '절입 시각까지 반영한 정밀 만세력 · 오늘·이번 달·올해 운세와 10년 대운', meta: '생년월일 · 출생시각', tone: 'amber', wide: true, badge: '무료 운세' },
    { id: 'type', cat: 'PERSONALITY', title: '나의 성격 유형 스타일은?', desc: 'Big Five 50문항으로 알아보는 16타입 성격 스타일', meta: '50문항 · 약 8분', tone: 'violet' },
    { id: 'love', cat: 'LOVE STYLE', title: '나는 어떤 연애 스타일일까?', desc: '표현·배려·안정감으로 보는 나의 연애 방식', meta: '20문항 · 약 3분', tone: 'rose' },
    { id: 'compat', cat: 'COMPATIBILITY', title: '우리 둘은 얼마나 잘 맞을까?', desc: '일간·일지·띠·오행으로 보는 사주 궁합', meta: '두 사람 생년월일', tone: 'mint' },
    { id: 'bigfive', cat: 'BIG FIVE', title: 'Big Five 성격 정밀 검사', desc: 'IPIP 공개 50문항 · 5요인 프로파일 리포트', meta: '50문항 · 약 8분', tone: 'violet', badge: '정밀 검사' },
    { id: 'relation', cat: 'RELATIONSHIP', title: '관계에서 나는 어떤 사람일까?', desc: '감정 안정성과 공감으로 보는 관계 스타일', meta: '20문항 · 약 3분', tone: 'sky' },
    { id: 'animal', cat: 'ANIMAL TYPE', title: '나와 닮은 동물은?', desc: '성격 5요인으로 찾는 나의 동물 캐릭터', meta: '20문항 · 약 3분', tone: 'amber' },
    { id: 'work', cat: 'WORK STYLE', title: '회사에서 나는 어떤 캐릭터일까?', desc: '성실성과 외향성으로 보는 업무 스타일', meta: '20문항 · 약 3분', tone: 'sky' },
    { id: 'money', cat: 'MONEY STYLE', title: '나의 소비 성격은?', desc: '계획성과 감정 안정성으로 보는 소비 습관', meta: '20문항 · 약 3분', tone: 'amber' },
    { id: 'stress', cat: 'STRESS STYLE', title: '나는 스트레스를 어떻게 풀까?', desc: '나에게 맞는 회복 방식 찾기', meta: '20문항 · 약 3분', tone: 'rose' },
    { id: 'career', cat: 'CAREER STYLE', title: '내게 잘 맞는 일하는 스타일은?', desc: '개방성과 외향성으로 보는 직업 흥미 방향', meta: '20문항 · 약 3분', tone: 'mint' }
  ];

  function open(app, id) {
    if (id === 'saju') return window.PicklogFortune && window.PicklogFortune.mount(app, 'fortune');
    if (id === 'compat') return window.PicklogFortune && window.PicklogFortune.mount(app, 'compatibility');
    return window.PicklogIPIP && window.PicklogIPIP.mount(app, id);
  }

  function landing(app) {
    app.replaceChildren();
    const wrap = h('section', { class: 'pil-wrap pil-landing' });
    wrap.append(h('div', { class: 'pil-head' }, [
      h('div', { class: 'pil-kicker', text: 'PICKLOG / DISCOVER YOURSELF' }),
      h('h2', { text: '나를 알아가는 가장 흥미로운 방법' }),
      h('p', { text: '국제 공개 성격 문항(IPIP)으로 만든 심리테스트와 정밀 만세력 기반 사주·운세. 한 번 답하면 여러 테스트 결과를 바로 볼 수 있어요.' })
    ]));
    const grid = h('div', { class: 'pil-grid' });
    CARDS.forEach((c, i) => grid.append(h('button', { type: 'button', class: `pil-card pil-tone-${c.tone}${c.wide ? ' pil-card-wide' : ''}`, 'aria-label': c.title + ' 시작하기', onclick: () => open(app, c.id) }, [
      h('span', { class: 'pil-card-art' }, [h('img', { src: `${ASSET}card-${c.id}.webp`, alt: '', width: '800', height: '400', loading: i < 4 ? 'eager' : 'lazy', decoding: 'async' }), c.badge ? h('span', { class: 'pil-card-badge', text: c.badge }) : null]),
      h('span', { class: 'pil-card-body' }, [
        h('span', { class: 'pil-card-cat', text: c.cat }),
        h('strong', { class: 'pil-card-title', text: c.title }),
        h('span', { class: 'pil-card-desc', text: c.desc }),
        h('span', { class: 'pil-card-foot' }, [h('span', { class: 'pil-card-meta', text: c.meta }), h('span', { class: 'pil-card-go', text: '시작하기' })])
      ])
    ])));
    wrap.append(grid, h('p', { class: 'pil-disclaimer', text: '심리테스트는 IPIP(International Personality Item Pool) 공개 문항을 한국어로 옮긴 자기보고 검사로, 의학적 진단이나 공식 표준화 검사가 아닙니다. 사주·운세는 전통 명리학 기반의 오락 콘텐츠입니다. 모든 응답은 서버로 전송되지 않습니다.' }));
    app.append(wrap);
  }

  /** "Back to list" button, shown only where the landing page is the entry point. */
  window.PicklogBack = (app) => app.dataset.mode === 'all'
    ? h('div', { class: 'pil-back' }, h('button', { type: 'button', class: 'pil-btn pil-btn-ghost', text: '← 전체 테스트 목록', onclick: () => { landing(app); goToStart(app); } }))
    : null;

  const ALIASES = { personality: 'bigfive', ipip50: 'bigfive', fortune: 'saju', compatibility: 'compat' };
  document.querySelectorAll('.pil-app').forEach(app => {
    const mode = app.dataset.mode || 'all';
    const test = ALIASES[app.dataset.test] || app.dataset.test;
    if (mode === 'all' && !test) return landing(app);
    const id = test || ALIASES[mode] || mode;
    if (!CARDS.some(c => c.id === id)) return landing(app);
    open(app, id);
  });
  ready = true;
})();
