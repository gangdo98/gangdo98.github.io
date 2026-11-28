(function () {
  'use strict';

  /* ── 기본 정보 ─────────────────────────────── */
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  var QUARTERS = [
    { id: '26-4Q', name: '2026년 4분기', months: [[2026, 10], [2026, 11], [2026, 12]] },
    { id: '27-1Q', name: '2027년 1분기', months: [[2027, 1], [2027, 2], [2027, 3]] },
    { id: '27-2Q', name: '2027년 2분기', months: [[2027, 4], [2027, 5], [2027, 6]] },
    { id: '27-3Q', name: '2027년 3분기', months: [[2027, 7], [2027, 8], [2027, 9]] },
    { id: '27-4Q', name: '2027년 4분기', months: [[2027, 10], [2027, 11], [2027, 12]] }
  ];
  var MONTHS = [];
  QUARTERS.forEach(function (q) {
    q.months.forEach(function (m) { MONTHS.push({ y: m[0], m: m[1], q: q.id }); });
  });

  var state = { view: 'quarter', quarter: '26-4Q', theme: 'all', status: 'all', date: null };
  var DATA = null, THEMES = [], ITEMS = [];
  var TODAY = isoOf(new Date());

  /* ── 작은 도구들 ───────────────────────────── */
  function $(sel) { return document.querySelector(sel); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function themeOf(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return { id: id, label: id, emoji: '', color: '#8A8377', deep: '#6B6456', soft: '#F3EEE4' };
  }
  function fmtShort(iso) { var d = parseISO(iso); return (d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function fmtFull(iso) { var d = parseISO(iso); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function monthKey(y, m) { return y + '-' + pad(m); }
  function weekOf(iso) { return WEEK[parseISO(iso).getDay()]; }
  function daysBetween(fromISO, toISO) {
    var a = parseISO(fromISO), b = parseISO(toISO);
    return Math.round((b - a) / 86400000);
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function quarterOf(iso) {
    var y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
    for (var i = 0; i < QUARTERS.length; i++) {
      var ms = QUARTERS[i].months;
      for (var j = 0; j < ms.length; j++) if (ms[j][0] === y && ms[j][1] === m) return QUARTERS[i].id;
    }
    return null;
  }
  function quarterById(id) {
    for (var i = 0; i < QUARTERS.length; i++) if (QUARTERS[i].id === id) return QUARTERS[i];
    return QUARTERS[0];
  }

  /* ── 필터 · 조회 ───────────────────────────── */
  function passes(item) {
    if (state.theme !== 'all' && item.theme !== state.theme) return false;
    if (state.status === 'done' && item.status !== 'done') return false;
    if (state.status === 'planned' && item.status !== 'planned') return false;
    return true;
  }
  function covers(item, iso) {
    var end = item.endDate || item.date;
    return iso >= item.date && iso <= end;
  }
  function itemsOn(iso) {
    return ITEMS.filter(function (it) { return passes(it) && covers(it, iso); });
  }
  function itemsInMonth(y, m) {
    var key = monthKey(y, m);
    return ITEMS.filter(function (it) { return passes(it) && it.date.slice(0, 7) === key; });
  }
  function itemsInQuarter(q) {
    var keys = q.months.map(function (mm) { return monthKey(mm[0], mm[1]); });
    return ITEMS.filter(function (it) { return passes(it) && keys.indexOf(it.date.slice(0, 7)) !== -1; });
  }

  /* ── 카드 ─────────────────────────────────── */
  function dateLabel(item) {
    if (item.precision === 'month') {
      var d = parseISO(item.date);
      return d.getFullYear() + '.' + pad(d.getMonth() + 1) + ' · 날짜 미정';
    }
    if (item.endDate) return fmtShort(item.date) + ' – ' + fmtShort(item.endDate);
    return fmtShort(item.date);
  }

  function ddayLabel(item) {
    if (item.status !== 'planned') return '';
    if (item.precision === 'month') return (Number(item.date.slice(5, 7))) + '월 중';
    var n = daysBetween(TODAY, item.date);
    if (n < 0 || n > 400) return '';
    if (n === 0) return '오늘';
    if (n === 1) return '내일';
    return 'D-' + n;
  }

  function followHTML(item) {
    if (!item.follow || !item.follow.length) return '';
    var rows = item.follow.map(function (f) {
      var when = '일정 미정';
      if (f.date) {
        var fd = parseISO(f.date);
        when = f.precision === 'month' ? fd.getFullYear() + '.' + pad(fd.getMonth() + 1) : fmtShort(f.date);
      } else if (f.when) {
        when = f.when;
      }
      return '<li class="follow__item">' +
        '<span class="follow__arrow" aria-hidden="true">↳</span>' +
        '<span class="follow__when">' + esc(when) + '</span>' +
        '<span class="follow__text">' + esc(f.text) + '</span>' +
        '</li>';
    }).join('');
    return '<div class="follow"><p class="follow__label">후속 예정</p><ul>' + rows + '</ul></div>';
  }

  function cardHTML(item, opts) {
    opts = opts || {};
    var t = themeOf(item.theme);
    var done = item.status === 'done';
    var dd = ddayLabel(item);
    var detail = item.detail
      ? '<details class="more"><summary>자세히 보기</summary><p>' + esc(item.detail) + '</p></details>'
      : '';
    return '<article class="card" data-theme="' + item.theme + '" style="--tc:' + t.deep + ';--ts:' + t.soft + '">' +
      '<div class="card__top">' +
        '<span class="badge ' + (done ? 'badge--done' : 'badge--plan') + '">' + (done ? '기록 완료' : '예정') + '</span>' +
        '<span class="tag"><span aria-hidden="true">' + t.emoji + '</span>' + esc(t.label) + '</span>' +
        (dd ? '<span class="dday">' + dd + '</span>' : '') +
        (opts.hideDate ? '' : '<span class="card__date">' + esc(dateLabel(item)) + '</span>') +
      '</div>' +
      '<h3 class="card__title">' + esc(item.title) + '</h3>' +
      (item.memo ? '<p class="card__memo">' + esc(item.memo) + '</p>' : '') +
      detail + followHTML(item) +
      '</article>';
  }

  /* ── 필터 칩 ──────────────────────────────── */
  function renderChips() {
    var themeHTML = '<button class="chip chip--all' + (state.theme === 'all' ? ' is-active' : '') +
      '" type="button" data-theme="all" aria-pressed="' + (state.theme === 'all') + '">전체</button>';
    themeHTML += THEMES.map(function (t) {
      var on = state.theme === t.id;
      return '<button class="chip chip--theme' + (on ? ' is-active' : '') + '" type="button" data-theme="' + t.id +
        '" aria-pressed="' + on + '" style="--tc:' + t.deep + '">' +
        '<span aria-hidden="true">' + t.emoji + '</span>' + esc(t.label) + '</button>';
    }).join('');
    $('#themeChips').innerHTML = themeHTML;

    var statuses = [['all', '전체'], ['done', '기록'], ['planned', '예정']];
    $('#statusChips').innerHTML = statuses.map(function (s) {
      var on = state.status === s[0];
      return '<button class="chip chip--status' + (on ? ' is-active' : '') + '" type="button" data-status="' + s[0] +
        '" aria-pressed="' + on + '">' + s[1] + '</button>';
    }).join('');
  }

  /* ── 통계 ─────────────────────────────────── */
  function renderStats() {
    var done = ITEMS.filter(function (i) { return i.status === 'done'; }).length;
    var planned = ITEMS.filter(function (i) { return i.status === 'planned'; }).length;
    $('#statDone').textContent = done;
    $('#statPlanned').textContent = planned;

    var upcoming = ITEMS.filter(function (i) { return i.status === 'planned' && i.date >= TODAY; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var next = upcoming[0];
    if (!next) {
      $('#statNext').textContent = '—';
      $('#statNextMeta').textContent = '예정된 일정 없음';
    } else {
      var n = daysBetween(TODAY, next.date);
      $('#statNext').textContent = next.precision === 'month' ? (Number(next.date.slice(5, 7)) + '월') : fmtShort(next.date);
      $('#statNextMeta').textContent = truncate(next.title, 13) + ' · ' + (n === 0 ? '오늘' : n + '일 뒤');
    }
    $('#footUpdated').textContent = '마지막 정리 ' + fmtFull(DATA.updated) + ' · 기록은 계속 쌓이는 중';
  }

  /* ── 분기 탭 ──────────────────────────────── */
  function renderQuarterTabs() {
    $('#qtrTabs').innerHTML = QUARTERS.map(function (q) {
      var on = state.quarter === q.id;
      var n = itemsInQuarter(q).length;
      return '<button class="qtr' + (on ? ' is-active' : '') + '" type="button" role="tab" aria-selected="' + on +
        '" data-quarter="' + q.id + '" aria-label="' + q.name + ', ' + n + '건">' +
        '<span class="qtr__label">' + q.id + '</span>' +
        '<span class="qtr__n">' + n + '</span></button>';
    }).join('');
  }

  /* ── 달력 ─────────────────────────────────── */
  function calendarHTML(y, m) {
    var first = new Date(y, m - 1, 1);
    var startDow = first.getDay();
    var days = new Date(y, m, 0).getDate();
    var monthItems = itemsInMonth(y, m);
    var cells = '';

    for (var b = 0; b < startDow; b++) cells += '<span class="cal__blank" aria-hidden="true"></span>';

    for (var d = 1; d <= days; d++) {
      var iso = y + '-' + pad(m) + '-' + pad(d);
      var list = itemsOn(iso);
      var dow = (startDow + d - 1) % 7;
      var cls = 'cal__day';
      if (dow === 0) cls += ' is-sun';
      if (dow === 6) cls += ' is-sat';
      if (list.length) cls += ' has-items';
      if (iso === TODAY) cls += ' is-today';
      if (iso === state.date) cls += ' is-selected';

      var seen = {}, dots = '';
      list.forEach(function (it) {
        if (!seen[it.theme]) { seen[it.theme] = 1; dots += '<i style="--c:' + themeOf(it.theme).color + '"></i>'; }
      });

      var label = m + '월 ' + d + '일 ' + WEEK[dow] + '요일' + (list.length ? ', ' + list.length + '건' : '');

      if (list.length) {
        cells += '<button class="' + cls + '" type="button" data-date="' + iso + '" aria-label="' + label +
          '" aria-pressed="' + (iso === state.date) + '">' +
          '<span class="cal__num">' + d + '</span>' +
          (dots ? '<span class="cal__dots" aria-hidden="true">' + dots + '</span>' : '') +
          '</button>';
      } else {
        cells += '<span class="' + cls + '" aria-hidden="true"><span class="cal__num">' + d + '</span></span>';
      }
    }

    var panel = '';
    if (state.date && state.date.slice(0, 7) === monthKey(y, m)) panel = dayPanelHTML(state.date);

    return '<section class="calcard">' +
      '<div class="calcard__head">' +
        '<h2 class="calcard__title">' + y + '. ' + pad(m) + '</h2>' +
        '<span class="calcard__count">' + monthItems.length + '건</span>' +
      '</div>' +
      '<div class="cal" role="grid" aria-label="' + y + '년 ' + m + '월 달력">' +
        ['일', '월', '화', '수', '목', '금', '토'].map(function (w, i) {
          return '<span class="cal__dow' + (i === 0 ? ' cal__dow--sun' : i === 6 ? ' cal__dow--sat' : '') +
            '" role="columnheader">' + w + '</span>';
        }).join('') +
        cells +
      '</div>' + panel +
      '</section>';
  }

  function dayPanelHTML(iso) {
    var list = itemsOn(iso);
    var d = parseISO(iso);
    var monthOnly = list.length > 0 && list.every(function (it) { return it.precision === 'month'; });
    var heading = monthOnly
      ? d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 <span>날짜 미정</span>'
      : (d.getMonth() + 1) + '월 ' + d.getDate() + '일 <span>' + WEEK[d.getDay()] + '요일</span>';
    var body = list.length
      ? list.map(function (it) { return cardHTML(it, { hideDate: true }); }).join('')
      : '<p class="empty">이 날짜에는 선택한 필터에 맞는 기록이 없어요.</p>';
    return '<section class="daypanel" id="daypanel" aria-label="' + (monthOnly ? (d.getMonth() + 1) + '월 중 기록' : (d.getMonth() + 1) + '월 ' + d.getDate() + '일 기록') + '">' +
      '<div class="daypanel__head">' +
        '<p class="daypanel__date">' + heading + '</p>' +
        '<button class="daypanel__close" type="button" data-action="close-day" aria-label="날짜 상세 닫기">닫기 ✕</button>' +
      '</div>' +
      '<div class="daypanel__body">' + body + '</div>' +
      '</section>';
  }

  /* ── 분기 목록 ────────────────────────────── */
  function groupedHTML(list, emptyText) {
    if (!list.length) return '<p class="empty">' + emptyText + '</p>';
    var groups = {};
    list.forEach(function (it) { (groups[it.date] = groups[it.date] || []).push(it); });
    return Object.keys(groups).sort().map(function (iso) {
      var d = parseISO(iso);
      var items = groups[iso];
      return '<div class="daygroup">' +
        '<div class="daygroup__head">' +
          '<span class="daygroup__date">' + (d.getMonth() + 1) + '.' + pad(d.getDate()) + ' (' + WEEK[d.getDay()] + ')</span>' +
          '<i class="daygroup__line" aria-hidden="true"></i>' +
          '<span class="daygroup__n">' + items.length + '건</span>' +
        '</div>' +
        items.map(function (it) { return cardHTML(it, { hideDate: true }); }).join('') +
        '</div>';
    }).join('');
  }

  function renderQuarterView() {
    var q = quarterById(state.quarter);
    $('#calendars').innerHTML = q.months.map(function (mm) { return calendarHTML(mm[0], mm[1]); }).join('');

    var list = itemsInQuarter(q);
    $('#quarterListTitle').textContent = q.name + ' 기록';
    $('#quarterListCount').textContent = list.length + '건';
    var filtered = state.theme !== 'all' || state.status !== 'all';
    $('#quarterList').innerHTML = groupedHTML(list, filtered
      ? '이 분기에는 선택한 필터에 맞는 기록이 없어요.'
      : '이 분기에는 아직 기록이 없어요. 새로운 일이 생기면 여기에 쌓여요.');
  }

  function renderMonthView() {
    var total = ITEMS.filter(passes).length;
    $('#monthListCount').textContent = total + '건';
    $('#monthList').innerHTML = MONTHS.map(function (mm) {
      var list = itemsInMonth(mm.y, mm.m);
      var head = '<div class="month__head">' +
        '<h3 class="month__title">' + mm.y + '. ' + pad(mm.m) + '</h3>' +
        '<span class="month__count">' + (list.length ? list.length + '건' : '기록 없음') + '</span>' +
        '</div>';
      if (!list.length) return '<section class="month month--empty">' + head + '</section>';
      list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      return '<section class="month">' + head +
        list.map(function (it) { return cardHTML(it, { hideDate: false }); }).join('') +
        '</section>';
    }).join('');
  }

  /* ── 렌더 ─────────────────────────────────── */
  function render() {
    var quarter = state.view === 'quarter';
    $('#panel-quarter').hidden = !quarter;
    $('#panel-month').hidden = quarter;
    document.querySelectorAll('.viewswitch__btn').forEach(function (b) {
      var on = b.dataset.view === state.view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    renderChips();
    if (quarter) {
      renderQuarterTabs();
      renderQuarterView();
    } else {
      renderMonthView();
    }
  }

  function setView(view) {
    if (state.view === view) return;
    state.view = view;
    render();
    /* 스티키 바에 가리지 않게 히어로 아래(필터 바의 원래 자리)로 이동 */
    var jump = function () {
      var hero = document.querySelector('.hero');
      if (!hero) return;
      var html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, hero.offsetTop + hero.offsetHeight);
      html.style.scrollBehavior = prev;
    };
    requestAnimationFrame(jump);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
  }

  function setQuarter(id) {
    state.quarter = id;
    state.date = null;
    render();
  }

  function toggleDate(iso) {
    state.date = state.date === iso ? null : iso;
    render();
    if (state.date) {
      requestAnimationFrame(function () {
        var p = document.getElementById('daypanel');
        if (p) p.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
  }

  /* ── 이벤트 ───────────────────────────────── */
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-view]'))) { setView(el.dataset.view); return; }
    if ((el = e.target.closest('[data-quarter]'))) { setQuarter(el.dataset.quarter); return; }
    if ((el = e.target.closest('[data-theme]'))) {
      state.theme = el.dataset.theme;
      render();
      return;
    }
    if ((el = e.target.closest('[data-status]'))) {
      state.status = el.dataset.status;
      render();
      return;
    }
    if ((el = e.target.closest('[data-date]'))) { toggleDate(el.dataset.date); return; }
    if (e.target.closest('[data-action="close-day"]')) { state.date = null; render(); return; }
  });

  /* ── 시작 ─────────────────────────────────── */
  function showError() {
    $('#calendars').innerHTML = '<p class="empty">기록을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.</p>';
    $('#statNextMeta').textContent = '불러오기 실패';
  }

  function init() {
    fetch('data/timeline.json?v=20261128a', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (json) {
        DATA = json;
        THEMES = json.themes;
        ITEMS = json.items.slice().sort(function (a, b) {
          return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        });
        var t = new Date();
        $('#todayLabel').textContent = t.getFullYear() + '년 ' + (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + WEEK[t.getDay()] + '요일';
        state.quarter = quarterOf(TODAY) || '26-4Q';
        renderStats();
        render();
      })
      .catch(function (err) {
        console.error(err);
        showError();
      });
  }

  init();
})();
