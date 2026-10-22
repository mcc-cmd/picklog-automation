/* PICKLOG Saju Core v2 — pure calculation engine (no DOM).
 * Works in the browser (window.PicklogSaju) and in Node (module.exports) for testing.
 * Data: solar-terms.json (12 jie, Swiss Ephemeris, UTC ms) + saju-data.json (lunar table, Asia/Seoul tz history).
 */
(function (root) {
  'use strict';
  const STEMS = '갑을병정무기경신임계'.split('');
  const BRANCHES = '자축인묘진사오미신유술해'.split('');
  const STEMS_H = '甲乙丙丁戊己庚辛壬癸'.split('');
  const BRANCHES_H = '子丑寅卯辰巳午未申酉戌亥'.split('');
  const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const ELEMENTS = ['목', '화', '토', '금', '수'];
  const ELEMENTS_H = ['木', '火', '土', '金', '水'];
  const STEM_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const BRANCH_YANG = [true, false, true, false, true, false, true, false, true, false, true, false];
  // 지장간 (여기, 중기, 정기) — 정기 is last
  const HIDDEN = [[8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2], [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8]];
  const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
  const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  const SEASONS = ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'];
  const DAY_MS = 86400000;

  const mod = (n, m) => ((n % m) + m) % m;
  const sexagenary = (stem, branch) => { for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i; return -1; };
  const name = (idx) => STEMS[idx % 10] + BRANCHES[idx % 12];
  const hanja = (idx) => STEMS_H[idx % 10] + BRANCHES_H[idx % 12];

  /** 십성 of `other` stem relative to day stem `me`. */
  function tenGod(me, other) {
    const a = STEM_EL[me], b = STEM_EL[other];
    const same = (me % 2) === (other % 2);
    let base;
    if (a === b) base = 0; else if (mod(a + 1, 5) === b) base = 2; else if (mod(a + 2, 5) === b) base = 4;
    else if (mod(b + 2, 5) === a) base = 6; else base = 8; // b generates a
    return TEN_GODS[base + (same ? 0 : 1)];
  }
  const branchTenGod = (me, branch) => tenGod(me, HIDDEN[branch][HIDDEN[branch].length - 1]);
  function stage(stem, branch) {
    const s = STAGE_START[stem];
    return STAGES[stem % 2 === 0 ? mod(branch - s, 12) : mod(s - branch, 12)];
  }

  // ---- branch / stem relations ----
  const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const SIX_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const TRIADS = [[8, 0, 4, '수'], [11, 3, 7, '목'], [2, 6, 10, '화'], [5, 9, 1, '금']];
  const PUNISH = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
  const BREAK = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]];
  const HARM = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
  const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
  const SELF_PUNISH = [4, 6, 9, 11];
  function branchRelations(a, b) {
    const r = [];
    if (pairIn(SIX_HARMONY, a, b)) r.push('육합');
    if (a !== b && TRIADS.some(t => t.includes(a) && t.includes(b))) r.push('삼합');
    if (mod(a - b, 12) === 6) r.push('충');
    if (pairIn(PUNISH, a, b) || (a === b && SELF_PUNISH.includes(a))) r.push('형');
    if (pairIn(BREAK, a, b)) r.push('파');
    if (pairIn(HARM, a, b)) r.push('해');
    if (pairIn(WONJIN, a, b)) r.push('원진');
    return r;
  }
  function stemRelations(a, b) {
    const r = [];
    if (mod(a - b, 10) === 5) r.push('천간합');
    if (mod(a - b, 10) === 6 || mod(b - a, 10) === 6) { if (STEM_EL[a] !== 2 && STEM_EL[b] !== 2) r.push('천간충'); }
    return r;
  }

  // ---- calendar helpers ----
  function tzOffsetMinutes(data, utcMs) {
    let off = 540;
    for (const [t, o] of data.tz) { if (t <= utcMs) off = o; else break; }
    return off;
  }
  /** Convert Korea civil clock time to UTC ms, honouring historic offsets & daylight saving. */
  function civilToUtc(data, y, m, d, hh, mm) {
    const local = Date.UTC(y, m - 1, d, hh, mm);
    let off = tzOffsetMinutes(data, local - 540 * 60000);
    off = tzOffsetMinutes(data, local - off * 60000);
    return { utc: local - off * 60000, offset: off };
  }
  const EPOCH = Date.UTC(1900, 0, 1);
  function lunarToSolar(data, y, m, d, leap) {
    const row = data.lunar[y];
    if (!row) throw Error('음력은 1900~2049년만 지원합니다.');
    const [start, leapMonth, lens] = row;
    if (leap && leapMonth !== m) throw Error(`${y}년에는 음력 ${m}월 윤달이 없습니다.`);
    let offset = start, i = 0;
    for (let month = 1; month <= 12; month++) {
      const normalLen = lens[i++] === '1' ? 30 : 29;
      if (month === m && !leap) { if (d > normalLen) throw Error(`음력 ${y}년 ${m}월은 ${normalLen}일까지입니다.`); return dateFromEpochDays(offset + d - 1); }
      offset += normalLen;
      if (month === leapMonth) {
        const leapLen = lens[i++] === '1' ? 30 : 29;
        if (month === m && leap) { if (d > leapLen) throw Error(`음력 ${y}년 윤${m}월은 ${leapLen}일까지입니다.`); return dateFromEpochDays(offset + d - 1); }
        offset += leapLen;
      }
    }
    throw Error('음력 날짜를 변환할 수 없습니다.');
  }
  function solarToLunar(data, y, m, d) {
    const days = Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
    for (let ly = y; ly >= y - 1; ly--) {
      const row = data.lunar[ly]; if (!row) continue;
      const [start, leapMonth, lens] = row; if (days < start) continue;
      let offset = start, i = 0;
      for (let month = 1; month <= 12; month++) {
        const n = lens[i++] === '1' ? 30 : 29;
        if (days < offset + n) return { y: ly, m: month, d: days - offset + 1, leap: false };
        offset += n;
        if (month === leapMonth) { const L = lens[i++] === '1' ? 30 : 29; if (days < offset + L) return { y: ly, m: month, d: days - offset + 1, leap: true }; offset += L; }
      }
    }
    return null;
  }
  function dateFromEpochDays(n) { const t = new Date(EPOCH + n * DAY_MS); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  const dayIndexOf = (y, m, d) => mod(54 + Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / DAY_MS), 60);

  /** Year & month pillars for an instant using exact jie (절입) moments. */
  function yearMonthAt(terms, utcMs) {
    let lo = 0, hi = terms.length - 1, k = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (terms[mid][0] <= utcMs) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    if (k < 0) throw Error('해당 날짜의 절기 데이터가 없습니다.');
    const [, termYear, termMonth] = terms[k];
    const pillarYear = termMonth === 1 ? termYear - 1 : termYear; // 소한~입춘 전은 전년
    const yearIdx = mod(pillarYear - 1984, 60);
    const order = mod(termMonth - 2, 12);           // 0 = 인월(입춘)
    const branch = mod(order + 2, 12);
    const stem = mod((yearIdx % 10 % 5) * 2 + 2 + order, 10);
    return { yearIdx, monthIdx: sexagenary(stem, branch), termIndex: k, pillarYear };
  }

  /**
   * opts: {calendar:'solar'|'lunar', leap, y, m, d, time:'HH:MM'|null, gender:'M'|'F',
   *        correction:'lmt'|'none', zasi:'jo'|'ya'}
   */
  function compute(opts, data) {
    const { terms } = data;
    let { y, m, d } = opts;
    if (![y, m, d].every(Number.isInteger)) throw Error('생년월일을 모두 선택해 주세요.');
    let solar = { y, m, d };
    if (opts.calendar === 'lunar') solar = lunarToSolar(data, y, m, d, !!opts.leap);
    const check = new Date(Date.UTC(solar.y, solar.m - 1, solar.d));
    if (check.getUTCMonth() + 1 !== solar.m || check.getUTCDate() !== solar.d) throw Error('존재하지 않는 날짜입니다.');
    if (solar.y < 1900 || solar.y > 2049) throw Error('1900~2049년 출생만 지원합니다.');

    const timeKnown = !!opts.time;
    const [hh, mm] = timeKnown ? opts.time.split(':').map(Number) : [12, 0];
    const { utc, offset } = civilToUtc(data, solar.y, solar.m, solar.d, hh, mm);
    const correctionMin = opts.correction === 'none' ? 540 : 510; // 동경 127.5° 기준 지방평균시
    const P = new Date(utc + correctionMin * 60000);
    const pY = P.getUTCFullYear(), pM = P.getUTCMonth() + 1, pD = P.getUTCDate(), pH = P.getUTCHours(), pMin = P.getUTCMinutes();

    const ym = yearMonthAt(terms, utc);
    let dayIdx = dayIndexOf(pY, pM, pD);
    const lateZi = pH >= 23;
    if (lateZi && opts.zasi !== 'ya') dayIdx = mod(dayIdx + 1, 60);
    let hourIdx = null;
    if (timeKnown) {
      const branch = Math.floor(((pH * 60 + pMin) + 60) / 120) % 12;
      const stemBase = (lateZi && opts.zasi === 'ya') ? mod(dayIdx + 1, 60) % 10 : dayIdx % 10;
      hourIdx = sexagenary(mod((stemBase % 5) * 2 + branch, 10), branch);
    }

    // 절입일 근처 경고 (시간을 모를 때 월주/년주가 바뀔 수 있음)
    const prevTerm = terms[ym.termIndex][0], nextTerm = terms[ym.termIndex + 1] ? terms[ym.termIndex + 1][0] : Infinity;
    const nearTerm = !timeKnown && (utc - prevTerm < DAY_MS || nextTerm - utc < DAY_MS);

    // 대운
    let daeun = null;
    if (opts.gender === 'M' || opts.gender === 'F') {
      const yang = (ym.yearIdx % 10) % 2 === 0;
      const forward = (yang && opts.gender === 'M') || (!yang && opts.gender === 'F');
      const target = forward ? nextTerm : prevTerm;
      const days = Math.abs(target - utc) / DAY_MS;
      const exactYears = days / 3;
      const su = Math.max(1, Math.round(exactYears));
      const list = [];
      for (let k = 1; k <= 10; k++) {
        const idx = mod(ym.monthIdx + (forward ? k : -k), 60);
        const age = su + (k - 1) * 10;
        list.push({ idx, age, startYear: solar.y + age, endYear: solar.y + age + 9 });
      }
      daeun = { forward, su, exactYears, list };
    }

    const pillars = { year: ym.yearIdx, month: ym.monthIdx, day: dayIdx, hour: hourIdx };
    return {
      input: opts, solar, lunar: solarToLunar(data, solar.y, solar.m, solar.d),
      utc, civilOffset: offset, dst: offset === 600 || offset === 570,
      pillarClock: { y: pY, m: pM, d: pD, h: pH, min: pMin }, timeKnown, nearTerm,
      pillars, daeun, analysis: analyse(pillars)
    };
  }

  /** Structural analysis: 십성, 12운성, 지장간, 오행 분포 (8 glyphs). */
  function analyse(p) {
    const me = p.day % 10;
    const slots = [['hour', '시주'], ['day', '일주'], ['month', '월주'], ['year', '년주']];
    const cols = slots.map(([key, label]) => {
      const idx = p[key];
      if (idx === null) return { key, label, idx: null };
      const s = idx % 10, b = idx % 12;
      return {
        key, label, idx, stem: s, branch: b,
        stemGod: key === 'day' ? '일간' : tenGod(me, s), branchGod: branchTenGod(me, b),
        stage: stage(me, b), hidden: HIDDEN[b].map(h => ({ stem: h, god: tenGod(me, h) }))
      };
    });
    const counts = [0, 0, 0, 0, 0];
    cols.forEach(c => { if (c.idx === null) return; counts[STEM_EL[c.stem]]++; counts[BRANCH_EL[c.branch]]++; });
    const total = counts.reduce((a, b) => a + b, 0);
    // simplified strength: supporters (같은 오행·나를 생하는 오행) vs others, 월지 가중치 2배
    const meEl = STEM_EL[me];
    const supports = (el) => el === meEl || mod(el + 1, 5) === meEl;
    let sup = 0, all = 0;
    cols.forEach(c => {
      if (c.idx === null) return;
      if (c.key !== 'day') { all += 1; if (supports(STEM_EL[c.stem])) sup += 1; }
      const w = c.key === 'month' ? 2 : 1; all += w; if (supports(BRANCH_EL[c.branch])) sup += w;
    });
    const strength = all ? sup / all : 0.5;
    const godCounts = {};
    cols.forEach(c => { if (c.idx === null) return; if (c.key !== 'day') godCounts[c.stemGod] = (godCounts[c.stemGod] || 0) + 1; godCounts[c.branchGod] = (godCounts[c.branchGod] || 0) + 1; });
    const minCount = Math.min(...counts);
    let lacking = counts.map((c, i) => c === minCount ? i : -1).filter(i => i >= 0);
    const resource = mod(meEl - 1, 5);
    lacking.sort((a, b) => (b === resource) - (a === resource));
    return { me, meEl, cols, counts, total, strength, godCounts, lacking, season: SEASONS[p.month % 12] };
  }

  /** Pillars for an arbitrary moment (today / this month / this year). */
  function periodAt(data, utcMs) {
    const ym = yearMonthAt(data.terms, utcMs);
    const k = new Date(utcMs + 540 * 60000);
    return { year: ym.yearIdx, month: ym.monthIdx, day: dayIndexOf(k.getUTCFullYear(), k.getUTCMonth() + 1, k.getUTCDate()), pillarYear: ym.pillarYear, date: { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() } };
  }

  const api = {
    STEMS, BRANCHES, STEMS_H, BRANCHES_H, ANIMALS, ELEMENTS, ELEMENTS_H, STEM_EL, BRANCH_EL, BRANCH_YANG, HIDDEN, TEN_GODS, TRIADS,
    name, hanja, tenGod, branchTenGod, stage, branchRelations, stemRelations, compute, analyse, periodAt,
    lunarToSolar, solarToLunar, dayIndexOf, civilToUtc, mod
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PicklogSaju = api;
})(typeof window !== 'undefined' ? window : this);
