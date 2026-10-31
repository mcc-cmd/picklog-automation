/* PICKLOG 띠비티아이 — 내 띠 × MBTI 성향 풀이 (재미용). 입력값은 브라우저에서만 계산하고 저장하지 않는다. */
(function () {
  'use strict';
  var A = [
    ['mouse', '쥐', '子', '재치', '상황 파악이 빠르고 기회를 먼저 알아채요.'],
    ['ox', '소', '丑', '끈기', '한번 맡은 일은 끝까지 해내는 뚝심이 있어요.'],
    ['tiger', '호랑이', '寅', '용기', '앞장서서 길을 여는 대담함이 있어요.'],
    ['rabbit', '토끼', '卯', '섬세함', '분위기를 부드럽게 만드는 섬세함이 있어요.'],
    ['dragon', '용', '辰', '포부', '큰 그림을 그리고 사람을 끌어당겨요.'],
    ['snake', '뱀', '巳', '통찰', '말보다 관찰로 핵심을 짚어 내요.'],
    ['horse', '말', '午', '활력', '움직이며 에너지를 얻는 자유로운 타입이에요.'],
    ['sheep', '양', '未', '온화함', '주변을 챙기며 편안함을 주는 사람이에요.'],
    ['monkey', '원숭이', '申', '재주', '새로운 걸 금방 익히는 재주꾼이에요.'],
    ['rooster', '닭', '酉', '꼼꼼함', '디테일을 놓치지 않고 할 말은 분명히 해요.'],
    ['dog', '개', '戌', '의리', '한번 믿은 사람은 끝까지 지키는 의리파예요.'],
    ['pig', '돼지', '亥', '여유', '넉넉한 마음으로 사람을 모으는 타입이에요.']
  ];
  var M = {
    ISTJ: ['묵묵한 기록관', '약속과 순서를 지키며 믿음을 쌓는'], ISFJ: ['조용한 살림꾼', '티 나지 않게 주변을 챙기는'],
    INFJ: ['속 깊은 상담가', '사람의 마음을 오래 들여다보는'], INTJ: ['큰그림 설계자', '멀리 내다보고 혼자 계획을 다듬는'],
    ISTP: ['손재주 해결사', '말보다 손으로 문제를 푸는'], ISFP: ['감성 수집가', '좋아하는 것에 조용히 깊이 빠지는'],
    INFP: ['몽상하는 작가', '자기만의 가치와 이야기를 품은'], INTP: ['궁금증 탐구자', '왜 그런지 끝까지 파고드는'],
    ESTP: ['순발력 승부사', '현장에서 바로 움직여 답을 찾는'], ESFP: ['무대 체질 분위기꾼', '지금 이 순간을 즐겁게 만드는'],
    ENFP: ['아이디어 폭죽', '새로운 가능성에 금방 설레는'], ENTP: ['말 잘하는 발명가', '익숙한 걸 뒤집어 새로 보는'],
    ESTJ: ['추진력 반장', '일을 정리하고 끝까지 밀어붙이는'], ESFJ: ['다정한 총무', '모두가 편한지 먼저 살피는'],
    ENFJ: ['따뜻한 리더', '사람을 북돋우며 함께 가는'], ENTJ: ['목표 지휘관', '목표를 세우고 판을 짜는']
  };
  // 전통 띠 관계(지지): 삼합·육합은 잘 맞는 관계, 충은 부딪히기 쉬운 관계로 본다
  var SAMHAP = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
  var YUKHAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  var CHUNG = function (i) { return (i + 6) % 12; };

  function zodiac(y, m, d) {
    // 띠는 입춘(대개 2월 4일 전후)에 바뀐다. 1월생, 2월 3일 이전 출생은 앞 해 띠로 본다(대략 기준).
    if (m && (m === 1 || (m === 2 && d && d < 4))) y -= 1;
    return ((y - 4) % 12 + 12) % 12;
  }
  function jo(w, a, b) { var c = String(w).charCodeAt(String(w).length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function img(base, i, cls) { return '<img class="' + cls + '" src="' + esc(base) + 'ttibti-' + A[i][0] + '.webp" alt="' + A[i][1] + '띠" width="96" height="96" loading="lazy">'; }

  function mates(i) {
    var g = SAMHAP.filter(function (x) { return x.indexOf(i) >= 0; })[0];
    return { sam: g.filter(function (x) { return x !== i; }), yuk: YUKHAP[i], chung: CHUNG(i) };
  }
  function talkMate(t) { // 가운데 두 글자(인식·판단)는 같고 에너지 방향(E/I)만 다른 유형: 대화가 잘 통하기 쉬운 조합으로 본다
    return (t[0] === 'E' ? 'I' : 'E') + t.slice(1);
  }

  function result(root, base, y, m, d, t) {
    var i = zodiac(y, m, d), a = A[i], mt = t && M[t], mm = mates(i);
    var h = '<div class="pil-tt-card">';
    h += '<div class="pil-tt-head">' + img(base, i, 'pil-tt-face') + '<div><p class="pil-tt-kicker">' + y + '년생 기준 · ' + a[2] + ' ' + a[1] + '띠</p>';
    h += '<h3 class="pil-tt-title">' + (mt ? esc(t) + ' ' + esc(mt[0]) + ' × ' : '') + esc(a[1]) + '띠</h3></div></div>';
    h += '<p><b>' + esc(a[1]) + '띠의 ' + esc(a[3]) + '</b> — ' + esc(a[4]) + '</p>';
    if (mt) {
      h += '<p><b>' + esc(t) + ' ' + esc(mt[0]) + '</b> — ' + esc(mt[1]) + ' 성향이에요.</p>';
      h += '<p class="pil-tt-mix">' + esc(a[1]) + '띠 특유의 ' + esc(a[3]) + '에 ' + esc(mt[1]) + ' 모습이 더해진 조합이에요. ';
      h += (t[0] === 'E' ? '사람들 사이에서 ' + esc(jo(a[3], '이', '가')) + ' 더 잘 드러나고, ' : '혼자만의 시간에 ' + esc(jo(a[3], '을', '를')) + ' 충전하고, ');
      h += (t[3] === 'J' ? '미리 계획을 세울 때 강점이 커져요.' : '그때그때 유연하게 움직일 때 강점이 커져요.') + '</p>';
    }
    h += '<div class="pil-tt-grid"><div><p class="pil-tt-label">잘 맞는 띠 (삼합·육합)</p><div class="pil-tt-row">';
    mm.sam.concat([mm.yuk]).forEach(function (k) { h += '<span>' + img(base, k, 'pil-tt-mini') + A[k][1] + '띠</span>'; });
    h += '</div></div><div><p class="pil-tt-label">부딪히기 쉬운 띠 (충)</p><div class="pil-tt-row"><span>' + img(base, mm.chung, 'pil-tt-mini') + A[mm.chung][1] + '띠</span></div></div>';
    if (mt) h += '<div><p class="pil-tt-label">대화가 잘 통하기 쉬운 유형</p><div class="pil-tt-row"><span class="pil-tt-type">' + talkMate(t) + '</span></div></div>';
    h += '</div><p class="pil-tt-note">재미로 보는 풀이예요. 띠 성향은 전해 내려오는 상징이고, MBTI는 스스로 답하는 성향 지표라 진단이 아니에요.</p>';
    h += '<div class="pil-tt-btns"><button type="button" class="pil-tt-share">결과 공유하기</button><a class="pil-tt-link" href="/big-five-test/">점수로 보는 Big Five 성격검사 →</a></div></div>';
    var out = root.querySelector('.pil-tt-out');
    out.innerHTML = h;
    var url = location.origin + location.pathname + '?y=' + y + (m ? '&mo=' + m + (d ? '&d=' + d : '') : '') + (t ? '&t=' + t : '');
    out.querySelector('.pil-tt-share').addEventListener('click', function () {
      var text = (t ? t + ' ' : '') + a[1] + '띠 결과: ' + (mt ? mt[0] + ' × ' : '') + a[1] + '띠의 ' + a[3] + ' | 띠비티아이';
      if (navigator.share) { navigator.share({ title: '띠비티아이', text: text, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(text + ' ' + url).then(function () { alert('결과 링크를 복사했어요.'); }); }
    });
    try { history.replaceState(null, '', url); } catch (e) {}
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function mount(root) {
    var base = root.getAttribute('data-base') || '';
    var now = new Date().getFullYear(), yo = '', mo = '<option value="">모름</option>', to = '<option value="">MBTI 모름</option>';
    for (var y = now; y >= 1930; y--) yo += '<option' + (y === 1990 ? ' selected' : '') + '>' + y + '</option>';
    for (var k = 1; k <= 12; k++) mo += '<option value="' + k + '">' + k + '월</option>';
    Object.keys(M).forEach(function (t) { to += '<option>' + t + '</option>'; });
    root.innerHTML = '<form class="pil-tt-form"><label>태어난 해<select name="y">' + yo + '</select></label>' +
      '<label>태어난 달<select name="mo">' + mo + '</select></label><label>일<input name="d" type="number" min="1" max="31" placeholder="모름"></label>' +
      '<label>MBTI<select name="t">' + to + '</select></label><button type="submit">내 띠비티아이 보기</button></form>' +
      '<p class="pil-tt-hint">1월생이나 2월 초(입춘 전) 출생이면 달과 날짜를 넣어 주세요. 앞 해 띠일 수 있어요.</p><div class="pil-tt-out"></div>';
    var f = root.querySelector('form');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      result(root, base, +f.y.value, +f.mo.value || 0, +f.d.value || 0, f.t.value);
    });
    var q = new URLSearchParams(location.search);
    if (q.get('y') && +q.get('y') >= 1930) {
      f.y.value = q.get('y'); if (q.get('mo')) f.mo.value = q.get('mo'); if (q.get('d')) f.d.value = q.get('d');
      var t = (q.get('t') || '').toUpperCase(); if (M[t]) f.t.value = t;
      result(root, base, +q.get('y'), +q.get('mo') || 0, +q.get('d') || 0, M[t] ? t : '');
    }
  }
  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.pil-ttibti'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.PicklogTtibti = { zodiac: zodiac, mates: mates, talkMate: talkMate, jo: jo };
})();
