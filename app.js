/* Projetos FCU · SIGEO · SAP — Enel Brasil Grids · Gestão de Programação */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});
const fmtN = v => nf.format(Math.round(v || 0));
const pct = (a, b) => b ? nf1.format(a / b * 100) + '%' : '—';
const fmtD = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
const fmtDT = v => v ? fmtD(v.slice(0, 10)) + (v.length > 10 ? ' ' + v.slice(11, 16) : '') : '';
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const PARTNERS = ['Start', 'Conecta', 'Engelmig'];
const PC = {Start: '#2a78d6', Conecta: '#eb6834', Engelmig: '#1baf7a'};
const PNAME = {Start: 'Start Engenharia', Conecta: 'Conecta', Engelmig: 'Engelmig Energia'};
const GROUPS = ['Executado', 'Executado Parcial', 'Cancelado', 'Em aberto'];
const GC = {'Executado': '#0ca30c', 'Executado Parcial': '#fab219', 'Cancelado': '#d03b3b', 'Em aberto': '#7b8794'};
const FCU2ST = {Executado: 'Executado', ExecutadoParcial: 'Executado Parcial', Cancelado: 'Cancelado', LiberadoExecucao: 'Liberado para Execução', LiberadoDocumentacao: 'Liberado para Documentação', PendenteAprovacao: 'Pendente de Aprovação'};
const grp = s => (s === 'Executado' || s === 'Executado Parcial' || s === 'Cancelado') ? s : 'Em aberto';
const SC = s => { s = FCU2ST[s] || s; return s === 'Liberado para Execução' ? '#6250d6' : (GC[grp(s)] || '#7b8794'); };
const badge = s => s ? `<span class="badge" style="--c:${SC(s)}">${esc(FCU2ST[s] || s)}</span>` : '<span class="muted">—</span>';
const pchip = p => `<span class="pchip" style="--c:${PC[p] || '#999'}">${esc(p)}</span>`;
const tok = e => String(e || '').split(/[,;|\s/]+/).filter(Boolean);
const regOf = code => { const m = String(code).split('.'); return m.length > 2 ? m[1] : ''; };
const validLL = (a, b) => typeof a === 'number' && typeof b === 'number' && a < -10 && a > -35 && b < -35 && b > -60;
const gm = (a, b) => `https://www.google.com/maps/search/?api=1&query=${a},${b}`;
const wz = (a, b) => `https://waze.com/ul?ll=${a},${b}&navigate=yes`;
const sv = (a, b) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${a},${b}`;
const goLinks = (a, b, full) => `<span class="go"><a class="gm" href="${gm(a, b)}" target="_blank" rel="noopener">Google Maps</a><a class="wz" href="${wz(a, b)}" target="_blank" rel="noopener">Waze</a>${full ? `<a href="${sv(a, b)}" target="_blank" rel="noopener">Street View</a>` : ''}</span>`;
const isPoda = ct => /poda/i.test(ct || '');

const PUBLISHED = window.FCU_DATA;
let DB = PUBLISHED, PROG = [], PROJ = new Map(), PROJ_LIST = [], FCUROWS = [], FX = {};
let VIEW = {prog: [], proj: [], fcu: [], sap: [], occ: []};
const F = {q: '', parc: '', contr: '', status: '', tipo: '', polo: '', fam: '', reg: '', de: '', ate: '', loc: ''};

/* ---------- relógio ---------- */
function tick() {
  const now = new Date();
  $('#clockTime').textContent = now.toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo'});
  $('#clockDate').textContent = now.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'});
}
tick(); setInterval(tick, 1000);

/* ---------- toast / modal ---------- */
let toastT, pmap = null;
function toast(msg, ms = 3200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
function openModal(html, narrow) {
  if (pmap) { pmap.remove(); pmap = null; }
  $('#modalBody').innerHTML = html;
  $('.modal-box').classList.toggle('narrow', !!narrow);
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modal').hidden = true; document.body.style.overflow = '';
  if (pmap) { pmap.remove(); pmap = null; }
  if (location.hash.startsWith('#projeto=')) history.replaceState(null, '', location.pathname + location.search);
}
$('#modalX').onclick = closeModal;
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

/* ---------- preparação da base ---------- */
const OCC = () => ['motivo_canc_exec_parcial', 'Agrupamento', 'Comentario'].map(c => FX[c]);
function prepare() {
  const pc = DB.progCols, pj = DB.projCols;
  FX = Object.fromEntries(DB.fcuCols.map((c, i) => [c, i]));
  const PX = Object.fromEntries(pj.map((c, i) => [c, i]));
  const ci = n => pc.indexOf(n);
  const I = {p: ci('Projeto'), d: ci('Data Programacao'), st: ci('Status Programacao'), tp: ci('Tipo Intervencao'), po: ci('Numero PowerON'), eq: ci('Equipamentos'), ini: ci('Inicio'), fim: ci('Termino'), ct: ci('Contratada'), pa: ci('Parceira'), fo: ci('Fonte')};
  PROG = DB.prog.map((r, i) => ({i, p: r[I.p], d: r[I.d] || '', st: r[I.st] || '', g: grp(r[I.st]), tp: r[I.tp] || '', po: r[I.po] || '', eq: r[I.eq] || '', ini: r[I.ini] || '', fim: r[I.fim] || '', ct: r[I.ct] || '', pa: r[I.pa] || '', fo: r[I.fo] || 'SIGEO'}));
  PROJ = new Map();
  for (const r of PROG) {
    let p = PROJ.get(r.p);
    if (!p) PROJ.set(r.p, p = {code: r.p, progs: [], fcu: [], reg: regOf(r.p)});
    p.progs.push(r);
  }
  FCUROWS = DB.fcu;
  for (const r of DB.fcu) { const p = PROJ.get(r[0]); if (p) p.fcu.push(r); }
  const occF = OCC();
  for (const p of PROJ.values()) {
    const g = p.progs; g.sort((a, b) => (a.d + a.ini).localeCompare(b.d + b.ini));
    const top = fn => { const m = {}; g.forEach(r => { const v = fn(r); if (v) m[v] = (m[v] || 0) + 1; }); return (Object.entries(m).sort((a, b) => b[1] - a[1])[0] || [''])[0]; };
    p.pa = top(r => r.pa); p.ct = top(r => r.ct);
    p.n = g.length; p.ex = 0; p.parc = 0; p.canc = 0; p.ab = 0;
    g.forEach(r => { if (r.g === 'Executado') p.ex++; else if (r.g === 'Executado Parcial') p.parc++; else if (r.g === 'Cancelado') p.canc++; else p.ab++; });
    const last = g[g.length - 1]; p.last = last ? last.d : ''; p.lastSt = last ? last.st : ''; p.lastG = grp(p.lastSt);
    p.first = g[0] ? g[0].d : '';
    const info = DB.projects[p.code];
    p.info = info ? Object.fromEntries(pj.map((c, i) => [c, info[i]])) : null;
    const sp = DB.sap?.[p.code];
    p.sap = sp ? Object.fromEntries(DB.sapCols.map((c, i) => [c, sp[i]])) : null;
    p.fam = p.info?.familia_regen || ''; p.den = p.info?.denominacao || p.sap?.['Denominação'] || ''; p.polo = p.info?.polo || '';
    p.circ = p.info?.circuito || ''; p.conj = p.info?.conjunto || '';
    p.sapSt = p.sap?.Status || '';
    p.occ = p.fcu.filter(r => occF.some(i => r[i])).length;
    // equipamentos relacionados (SIGEO + FCU + SAP) com coordenadas Buscapé
    const eqs = new Map();
    const addEq = (t, src) => { t = String(t || '').toUpperCase().trim(); if (!t) return; const e = eqs.get(t) || {t, n: 0, src: new Set()}; e.n++; e.src.add(src); eqs.set(t, e); };
    g.forEach(r => tok(r.eq).forEach(t => addEq(t, r.fo === 'FCU' ? 'FCU' : 'SIGEO')));
    p.fcu.forEach(r => addEq(r[FX.local_inst], 'FCU'));
    if (p.sap) addEq(p.sap['Local de instalação'], 'SAP');
    p.eqs = [...eqs.values()].sort((a, b) => b.n - a.n).map(e => ({t: e.t, n: e.n, src: [...e.src].join(' · '), c: DB.coords[e.t] || null}));
    p.eqGeo = p.eqs.filter(e => e.c).length;
    p.lat = null; p.lng = null; p.locSrc = ''; p.locEq = '';
    if (info && validLL(info[PX.Latitude], info[PX.Longitude])) { p.lat = info[PX.Latitude]; p.lng = info[PX.Longitude]; p.locSrc = 'FCU (coordenada do projeto)'; }
    if (p.lat == null) { const e = p.eqs.find(e => e.c && validLL(e.c[0], e.c[1])); if (e) { p.lat = e.c[0]; p.lng = e.c[1]; p.locSrc = 'Buscapé (equipamento ' + e.src + ')'; p.locEq = e.t; } }
    if (!p.circ && p.locEq && DB.coords[p.locEq]) p.circ = DB.coords[p.locEq][2] || '';
    p.hasLoc = p.lat != null;
    p.search = [p.code, p.den, p.fam, p.circ, p.conj, p.polo, p.ct, p.info?.nota, p.info?.Ordem_Sigeo, p.sap?.['Denominação'], p.sap?.Status, p.sap?.Contrato, ...p.eqs.map(e => e.t), ...new Set(g.map(r => r.po))].join(' ').toLowerCase();
  }
  PROJ_LIST = [...PROJ.values()];
  fillSelects();
  const m = DB.meta, ex = m.exclusoes || {};
  $('#footMeta').innerHTML = `Base: programações ${fmtD(m.periodo[0])} a ${fmtD(m.periodo[1])} · gerada em ${esc((m.generated || '').replace('T', ' '))} · ${fmtN(PROG.length)} programações · ${fmtN(PROJ_LIST.length)} projetos · ${fmtN(Object.keys(DB.sap || {}).length)} com SAP${Object.keys(ex).length ? '<br>Fora do escopo: ' + Object.entries(ex).map(([k, v]) => `${esc(k)} (${fmtN(v)} programações)`).join(' · ') : ''}${DB.local ? ' · <b>base importada neste navegador</b>' : ''}`;
}

function fillSelects() {
  const uniq = arr => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const set = (id, vals, all = 'Todas', lbl = v => v) => { const el = $(id), cur = el.value; el.innerHTML = `<option value="">${all}</option>` + vals.map(v => `<option value="${esc(v)}">${esc(lbl(v))}</option>`).join(''); el.value = vals.includes(cur) ? cur : ''; };
  set('#fParc', PARTNERS, 'Todas', v => PNAME[v]);
  set('#fContr', uniq(PROG.map(r => r.ct)));
  set('#fStatus', uniq(PROG.map(r => r.st)), 'Todos');
  set('#fTipo', uniq(PROG.map(r => r.tp)), 'Todos');
  set('#fPolo', uniq(PROJ_LIST.map(p => p.polo)), 'Todos');
  set('#fFam', uniq(PROJ_LIST.map(p => p.fam)));
  set('#fReg', uniq(PROJ_LIST.map(p => p.reg)));
}

/* ---------- filtros ---------- */
function projOK(p, f = F) {
  if (f.polo && p.polo !== f.polo) return false;
  if (f.fam && p.fam !== f.fam) return false;
  if (f.reg && p.reg !== f.reg) return false;
  if (f.loc === '1' && !p.hasLoc) return false;
  if (f.loc === '0' && p.hasLoc) return false;
  if (f.q && !p.search.includes(f.q.toLowerCase())) return false;
  return true;
}
function progOK(r, f = F) {
  if (f.parc && r.pa !== f.parc) return false;
  if (f.contr && r.ct !== f.contr) return false;
  if (f.status && r.st !== f.status) return false;
  if (f.tipo && r.tp !== f.tipo) return false;
  if (f.de && r.d < f.de) return false;
  if (f.ate && r.d > f.ate) return false;
  return true;
}
function filterProg(f = F) {
  const ok = new Map();
  return PROG.filter(r => { let v = ok.get(r.p); if (v === undefined) { v = projOK(PROJ.get(r.p), f); ok.set(r.p, v); } return v && progOK(r, f); });
}
function apply() {
  VIEW.prog = filterProg();
  const set = new Set(VIEW.prog.map(r => r.p));
  VIEW.proj = PROJ_LIST.filter(p => set.has(p.code));
  const fi = FX.Data_Programação, occF = OCC();
  VIEW.fcu = FCUROWS.filter(r => set.has(r[0]) && (!F.de || (r[fi] || '') >= F.de) && (!F.ate || (r[fi] || '') <= F.ate));
  VIEW.occ = VIEW.fcu.filter(r => occF.some(i => r[i]));
  VIEW.sap = VIEW.proj.filter(p => p.sap);
  renderChips(); renderKPIs(); renderPartners(); renderMap(); renderCharts(); page = 1; renderTable();
}
const FLBL = {q: 'Pesquisa', parc: 'Parceira', contr: 'Contratada', status: 'Status', tipo: 'Tipo', polo: 'Polo', fam: 'Família', reg: 'Região', de: 'De', ate: 'Até', loc: 'Localização'};
const FID = {q: '#fQ', parc: '#fParc', contr: '#fContr', status: '#fStatus', tipo: '#fTipo', polo: '#fPolo', fam: '#fFam', reg: '#fReg', de: '#fDe', ate: '#fAte', loc: '#fLoc'};
function setF(k, v) { F[k] = v; $(FID[k]).value = v; }
function renderChips() {
  $('#activeChips').innerHTML = Object.entries(F).filter(([, v]) => v).map(([k, v]) => `<span class="chip" data-k="${k}" title="Remover filtro">${FLBL[k]}: ${esc(k === 'de' || k === 'ate' ? fmtD(v) : k === 'loc' ? (v === '1' ? 'com coordenada' : 'sem coordenada') : v)} ✕</span>`).join('');
}
$('#activeChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { setF(c.dataset.k, ''); apply(); } });
let deb;
Object.entries(FID).forEach(([k, id]) => {
  const el = $(id);
  el.addEventListener(el.tagName === 'INPUT' && el.type === 'search' ? 'input' : 'change', () => { F[k] = el.value.trim(); clearTimeout(deb); deb = setTimeout(apply, k === 'q' ? 280 : 0); });
});
$('#btnClear').onclick = () => { Object.keys(F).forEach(k => setF(k, '')); apply(); };

/* ---------- KPIs ---------- */
function counts(rows) {
  const c = {n: rows.length, ex: 0, parc: 0, canc: 0, ab: 0};
  rows.forEach(r => { if (r.g === 'Executado') c.ex++; else if (r.g === 'Executado Parcial') c.parc++; else if (r.g === 'Cancelado') c.canc++; else c.ab++; });
  c.ef = (c.ex + c.parc + c.canc) ? (c.ex + c.parc) / (c.ex + c.parc + c.canc) : 0;
  return c;
}
function renderKPIs() {
  const c = counts(VIEW.prog), np = VIEW.proj.length, nl = VIEW.proj.filter(p => p.hasLoc).length;
  const ns = VIEW.sap.length, ente = VIEW.sap.filter(p => /^ENTE/.test(p.sapSt)).length;
  const k = (lbl, v, s, col) => `<div class="kpi" style="--c:${col}"><div class="k">${lbl}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  $('#kpis').innerHTML =
    k('Projetos', fmtN(np), `${fmtN(VIEW.fcu.length)} registros FCU`, '#0b4fa8') +
    k('Programações', fmtN(c.n), 'SIGEO + FCU no recorte', '#0b4fa8') +
    k('Executadas', fmtN(c.ex), pct(c.ex, c.n) + ' das programações', GC['Executado']) +
    k('Executado parcial', fmtN(c.parc), pct(c.parc, c.n), GC['Executado Parcial']) +
    k('Canceladas', fmtN(c.canc), pct(c.canc, c.n), GC['Cancelado']) +
    k('Em aberto', fmtN(c.ab), 'liberado, pendente, rascunho', GC['Em aberto']) +
    k('Efetividade', nf1.format(c.ef * 100) + '%', 'exec. + parcial ÷ realizadas', '#0a8a3c') +
    k('Histórico SAP', fmtN(ns), `${pct(ns, np)} dos projetos · ${fmtN(ente)} ENTE`, '#6250d6') +
    k('Ocorrências FCU', fmtN(VIEW.occ.length), 'motivos e comentários', '#d03b3b') +
    k('Georreferenciados', pct(nl, np), `${fmtN(nl)} projetos no mapa`, '#1f9bd7');
}

/* ---------- parceiras ---------- */
function renderPartners() {
  const rows = filterProg({...F, parc: ''});
  $('#partners').innerHTML = PARTNERS.map(pa => {
    const rr = rows.filter(r => r.pa === pa), c = counts(rr);
    const ps = new Set(rr.map(r => r.p)), nsap = [...ps].filter(x => PROJ.get(x).sap).length;
    const contr = [...new Set(rr.map(r => r.ct))].filter(Boolean).slice(0, 4).join(' · ');
    const seg = GROUPS.map(g => { const v = rr.filter(r => r.g === g).length; return v ? `<i style="width:${v / (c.n || 1) * 100}%;background:${GC[g]}" title="${g}: ${fmtN(v)}"></i>` : ''; }).join('');
    const last = rr.reduce((m, r) => r.d > m ? r.d : m, '');
    return `<div class="card pcard ${F.parc === pa ? 'sel' : ''}" data-p="${pa}" style="--c:${PC[pa]}">
      <h3><span class="dot"></span>${PNAME[pa]}</h3><div class="contr">${esc(contr || '—')}</div>
      <div class="pstats"><div><b>${fmtN(ps.size)}</b><span>projetos</span></div><div><b>${fmtN(c.n)}</b><span>programações</span></div><div><b>${fmtN(c.ex)}</b><span>executadas</span></div><div><b>${nf1.format(c.ef * 100)}%</b><span>efetividade</span></div></div>
      <div class="bar">${seg}</div>
      <div class="pfoot"><span>Parcial ${fmtN(c.parc)} · Cancel. ${fmtN(c.canc)} · Aberto ${fmtN(c.ab)} · SAP ${fmtN(nsap)}</span><span>Última: ${fmtD(last) || '—'}</span></div></div>`;
  }).join('');
}
$('#partners').addEventListener('click', e => { const c = e.target.closest('.pcard'); if (!c) return; setF('parc', F.parc === c.dataset.p ? '' : c.dataset.p); apply(); });

/* ---------- mapa ---------- */
let map, cluster, colorMode = 'status';
const gTiles = lyrs => L.tileLayer(`https://mt{s}.google.com/vt/lyrs=${lyrs}&hl=pt-BR&x={x}&y={y}&z={z}`, {subdomains: '0123', maxZoom: 21, attribution: '© Google'});
function initMap() {
  map = L.map('map', {preferCanvas: true}).setView([-23.55, -46.55], 11);
  const base = {'Google Maps': gTiles('m'), 'Google Híbrido': gTiles('y'), 'Google Satélite': gTiles('s'),
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'})};
  base['Google Maps'].addTo(map);
  L.control.layers(base, null, {position: 'topright'}).addTo(map);
  L.control.scale({imperial: false}).addTo(map);
  cluster = L.markerClusterGroup({chunkedLoading: true, maxClusterRadius: 50, showCoverageOnHover: false,
    iconCreateFunction: c => { const n = c.getChildCount(), cls = n < 50 ? '' : n < 500 ? ' m' : ' l', s = n < 50 ? 40 : n < 500 ? 46 : 52;
      return L.divIcon({html: `<div>${nf.format(n)}</div>`, className: 'mc' + cls, iconSize: [s, s]}); }});
  map.addLayer(cluster);
  $('#mapColor').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#mapColor button').forEach(x => x.classList.toggle('on', x === b)); colorMode = b.dataset.v; renderMap(); });
}
function popupHtml(p) {
  return `<div class="pp"><h5>${esc(p.code)}</h5><div class="r">${pchip(p.pa)} · ${esc(p.ct)}</div>
  <div class="r">${esc(p.den || p.fam || '')}</div>
  <div class="r">Último: ${badge(p.lastSt)} ${fmtD(p.last)}</div>
  <div class="r">${p.n} programações · ${p.ex} exec. · ${p.canc} canc.${p.sapSt ? '<br>SAP: ' + esc(p.sapSt) : ''}<br>${p.eqGeo} de ${p.eqs.length} equipamentos geolocalizados<br>Local: ${esc(p.locSrc)}${p.locEq ? ' · ' + esc(p.locEq) : ''}</div>
  ${goLinks(p.lat, p.lng, true)}<div style="margin-top:8px"><a class="lnk" data-proj="${esc(p.code)}">Abrir histórico SIGEO · FCU · SAP →</a></div></div>`;
}
function renderMap() {
  if (!map) return;
  cluster.clearLayers();
  const pts = VIEW.proj.filter(p => p.hasLoc);
  cluster.addLayers(pts.map(p => {
    const m = L.circleMarker([p.lat, p.lng], {radius: 7, color: '#fff', weight: 2, fillColor: colorMode === 'parc' ? PC[p.pa] : GC[p.lastG], fillOpacity: .95});
    m.bindPopup(() => popupHtml(p), {maxWidth: 320}); return m;
  }));
  $('#mapLegend').innerHTML = (colorMode === 'parc' ? PARTNERS.map(k => `<span><i class="dot" style="--c:${PC[k]}"></i>${PNAME[k]}</span>`) : GROUPS.map(k => `<span><i class="dot" style="--c:${GC[k]}"></i>${k}</span>`)).join('') + `<span class="muted">· ${fmtN(pts.length)} de ${fmtN(VIEW.proj.length)} projetos com coordenada</span>`;
  if (pts.length) { try { map.fitBounds(cluster.getBounds(), {padding: [20, 20], maxZoom: 15}); } catch (e) {} }
}
document.addEventListener('click', e => { const a = e.target.closest('[data-proj]'); if (a) { e.preventDefault(); openProject(a.dataset.proj); } });

/* ---------- gráficos ---------- */
const charts = {};
function mkChart(id, cfg) {
  if (charts[id]) { charts[id].data = cfg.data; charts[id].options.onClick = cfg.options.onClick; charts[id].update(); return; }
  charts[id] = new Chart($('#' + id), cfg);
}
const baseOpt = (stacked, horiz, onClick, legend = true) => ({
  responsive: true, maintainAspectRatio: false, indexAxis: horiz ? 'y' : 'x', animation: {duration: 250},
  interaction: {mode: horiz ? 'nearest' : 'index', intersect: horiz},
  plugins: {legend: {display: legend, position: 'bottom', labels: {boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', color: '#4a5874'}},
    tooltip: {callbacks: {label: c => ` ${c.dataset.label ? c.dataset.label + ': ' : ''}${fmtN(c.parsed[horiz ? 'x' : 'y'])}`}}},
  scales: {x: {stacked, grid: {display: horiz, color: '#eef2f7'}, ticks: {color: '#7a879c'}, border: {display: false}},
    y: {stacked, grid: {display: !horiz, color: '#eef2f7'}, ticks: {color: '#4a5874', autoSkip: false, callback(v) { const l = this.getLabelForValue(v); return horiz && l.length > 34 ? l.slice(0, 33) + '…' : l; }}, border: {display: false}}},
  onClick, onHover: (e, el) => { e.native.target.style.cursor = el.length && onClick ? 'pointer' : 'default'; }
});
const ds = (label, data, color) => ({label, data, backgroundColor: color, borderColor: '#fff', borderWidth: 1, borderRadius: 4, borderSkipped: false, maxBarThickness: 34});
function renderCharts() {
  if (!window.Chart) return;
  Chart.defaults.locale = 'pt-BR'; Chart.defaults.font.family = '"Segoe UI",system-ui,Roboto,Arial,sans-serif';
  const R = VIEW.prog;
  const months = [...new Set(R.map(r => r.d.slice(0, 7)).filter(Boolean))].sort();
  const mi = Object.fromEntries(months.map((m, i) => [m, i]));
  const mdat = Object.fromEntries(GROUPS.map(g => [g, months.map(() => 0)]));
  R.forEach(r => { const i = mi[r.d.slice(0, 7)]; if (i !== undefined) mdat[r.g][i]++; });
  mkChart('chMes', {type: 'bar', data: {labels: months.map(m => MES[+m.slice(5) - 1] + '/' + m.slice(2, 4)), datasets: GROUPS.map(g => ds(g, mdat[g], GC[g]))},
    options: baseOpt(true, false, (e, el) => { if (!el.length) return; const m = months[el[0].index]; const [y, mo] = m.split('-').map(Number); setF('de', m + '-01'); setF('ate', m + '-' + String(new Date(y, mo, 0).getDate()).padStart(2, '0')); apply(); })});
  const pdat = Object.fromEntries(GROUPS.map(g => [g, PARTNERS.map(pa => R.filter(r => r.pa === pa && r.g === g).length)]));
  mkChart('chParc', {type: 'bar', data: {labels: PARTNERS.map(p => PNAME[p]), datasets: GROUPS.map(g => ds(g, pdat[g], GC[g]))},
    options: baseOpt(true, true, (e, el) => { if (!el.length) return; setF('parc', PARTNERS[el[0].index]); apply(); })});
  const sc = {}; R.forEach(r => sc[r.st] = (sc[r.st] || 0) + 1);
  const ss = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  mkChart('chStatus', {type: 'bar', data: {labels: ss.map(x => x[0]), datasets: [ds('Programações', ss.map(x => x[1]), ss.map(x => SC(x[0])))]},
    options: baseOpt(false, true, (e, el) => { if (!el.length) return; setF('status', ss[el[0].index][0]); apply(); }, false)});
  const ai = FX.Agrupamento, mo = FX.motivo_canc_exec_parcial, si = FX.Status_Sigeo, mc = {};
  VIEW.fcu.forEach(r => { if (r[si] === 'Cancelado' || r[si] === 'ExecutadoParcial') { const k = r[ai] || r[mo] || 'Não informado'; mc[k] = (mc[k] || 0) + 1; } });
  const ms = Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  mkChart('chMotivo', {type: 'bar', data: {labels: ms.map(x => x[0]), datasets: [ds('Registros', ms.map(x => x[1]), '#d03b3b')]}, options: baseOpt(false, true, null, false)});
  const ssap = {}; VIEW.sap.forEach(p => { const k = p.sapSt || '—'; ssap[k] = (ssap[k] || 0) + 1; });
  const sl = Object.entries(ssap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  mkChart('chTipo', {type: 'bar', data: {labels: sl.map(x => x[0]), datasets: [ds('Projetos', sl.map(x => x[1]), '#6250d6')]}, options: baseOpt(false, true, null, false)});
  const fc = {}; VIEW.proj.forEach(p => { const k = p.fam || 'Sem cadastro FCU'; fc[k] = (fc[k] || 0) + 1; });
  const fs = Object.entries(fc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  mkChart('chFam', {type: 'bar', data: {labels: fs.map(x => x[0]), datasets: [ds('Projetos', fs.map(x => x[1]), '#2a78d6')]},
    options: baseOpt(false, true, (e, el) => { if (!el.length) return; const k = fs[el[0].index][0]; if (k !== 'Sem cadastro FCU') { setF('fam', k); apply(); } }, false)});
}

/* ---------- tabela ---------- */
let mode = 'proj', page = 1, sortK = null, sortAsc = false;
const plink = c => `<a class="lnk" data-proj="${esc(c)}">${esc(c)}</a>`;
const COLS = {
  proj: [
    {h: 'Projeto', v: p => p.code, r: p => plink(p.code)},
    {h: 'Parceira', v: p => p.pa, r: p => pchip(p.pa)},
    {h: 'Contratada', v: p => p.ct},
    {h: 'Região', v: p => p.reg},
    {h: 'Polo', v: p => p.polo},
    {h: 'Família / Descrição', v: p => p.fam || p.den, r: p => `${esc(p.fam)}${p.den ? `<div class="muted">${esc(p.den)}</div>` : ''}`},
    {h: 'Circuito', v: p => p.circ},
    {h: 'Prog.', v: p => p.n, n: 1},
    {h: 'Exec.', v: p => p.ex, n: 1},
    {h: 'Parc.', v: p => p.parc, n: 1},
    {h: 'Canc.', v: p => p.canc, n: 1},
    {h: 'Ocorr. FCU', v: p => p.occ, n: 1},
    {h: '1ª prog.', v: p => p.first, r: p => fmtD(p.first)},
    {h: 'Última prog.', v: p => p.last, r: p => fmtD(p.last)},
    {h: 'Último status', v: p => p.lastSt, r: p => badge(p.lastSt)},
    {h: 'Status SAP', v: p => p.sapSt},
    {h: 'Equip. geo', v: p => p.eqGeo, r: p => `${p.eqGeo}/${p.eqs.length}`, n: 1},
    {h: 'Localização', v: p => p.hasLoc ? 1 : 0, r: p => p.hasLoc ? goLinks(p.lat, p.lng) : '<span class="muted">sem coordenada</span>'},
  ],
  prog: [
    {h: 'Data', v: r => r.d + r.ini, r: r => fmtD(r.d)},
    {h: 'Projeto', v: r => r.p, r: r => plink(r.p)},
    {h: 'Parceira', v: r => r.pa, r: r => pchip(r.pa)},
    {h: 'Status', v: r => r.st, r: r => badge(r.st)},
    {h: 'Início', v: r => r.ini, r: r => fmtDT(r.ini)},
    {h: 'Término', v: r => r.fim, r: r => fmtDT(r.fim)},
    {h: 'Tipo', v: r => r.tp},
    {h: 'PowerON', v: r => r.po},
    {h: 'Equipamentos', v: r => r.eq},
    {h: 'Contratada', v: r => r.ct},
    {h: 'Fonte', v: r => r.fo},
    {h: 'Local', v: () => '', r: r => { const p = PROJ.get(r.p); return p?.hasLoc ? goLinks(p.lat, p.lng) : ''; }},
  ],
  fcu: [
    {h: 'Data prog.', v: r => r[FX.Inicio], r: r => fmtD(r[FX.Data_Programação])},
    {h: 'Projeto', v: r => r[0], r: r => plink(r[0])},
    {h: 'Empreiteira', v: r => r[FX.Empreiteira_Contratos]},
    {h: 'Status SIGEO', v: r => r[FX.Status_Sigeo], r: r => badge(r[FX.Status_Sigeo])},
    {h: 'Início', v: r => r[FX.Inicio], r: r => fmtDT(r[FX.Inicio])},
    {h: 'Término', v: r => r[FX.Termino], r: r => fmtDT(r[FX.Termino])},
    {h: 'Tipo', v: r => r[FX.Tipo_Int]},
    {h: 'Motivo canc./parcial', v: r => r[FX.motivo_canc_exec_parcial]},
    {h: 'Agrupamento', v: r => r[FX.Agrupamento]},
    {h: 'Comentário', v: r => r[FX.Comentario]},
    {h: 'Reprogramação', v: r => r[FX['Status_Reprogramação']]},
    {h: 'Stt Resumo', v: r => r[FX['Stt Resumo']]},
  ],
  sap: [
    {h: 'Projeto', v: p => p.code, r: p => plink(p.code)},
    {h: 'Parceira', v: p => p.pa, r: p => pchip(p.pa)},
    {h: 'Denominação SAP', v: p => p.sap['Denominação']},
    {h: 'Tipo', v: p => p.sap['Tip.projeto']},
    {h: 'Status SAP', v: p => p.sapSt},
    {h: 'Conclusão obra', v: p => p.sap['Data Conclusão (total) de Obra'], r: p => fmtD(p.sap['Data Conclusão (total) de Obra'])},
    {h: 'Inventário (executor)', v: p => p.sap['Data Inventário (Executor)'], r: p => fmtD(p.sap['Data Inventário (Executor)'])},
    {h: 'Conciliação', v: p => p.sap['Data Conciliação de Inventário'], r: p => fmtD(p.sap['Data Conciliação de Inventário'])},
    {h: 'Energização', v: p => p.sap['Data de Energização'], r: p => fmtD(p.sap['Data de Energização'])},
    {h: 'Inv. aprovado', v: p => p.sap['Inventário Aprovado']},
    {h: 'Contrato', v: p => p.sap.Contrato},
    {h: 'Local de instalação', v: p => p.sap['Local de instalação'], r: p => { const t = p.sap['Local de instalação'], c = DB.coords[String(t).toUpperCase()]; return esc(t) + (c ? ' ' + goLinks(c[0], c[1]) : ''); }},
    {h: 'Regional', v: p => p.sap.Regional},
  ]
};
COLS.occ = COLS.fcu;
function tableRows() {
  let rows = VIEW[mode];
  const q = $('#tQ').value.trim().toLowerCase(), cols = COLS[mode];
  if (q) rows = rows.filter(r => cols.some(c => String(c.v(r) ?? '').toLowerCase().includes(q)));
  if (sortK !== null) {
    const c = cols[sortK];
    rows = [...rows].sort((a, b) => { const x = c.v(a), y = c.v(b); const d = c.n ? (+x || 0) - (+y || 0) : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR'); return sortAsc ? d : -d; });
  } else if (mode === 'proj' || mode === 'sap') rows = [...rows].sort((a, b) => b.last.localeCompare(a.last));
  else rows = [...rows].sort((a, b) => String(cols[0].v(b)).localeCompare(String(cols[0].v(a))));
  return rows;
}
function renderTable() {
  const cols = COLS[mode], rows = tableRows(), size = +$('#tSize').value, pages = Math.max(1, Math.ceil(rows.length / size));
  page = Math.min(page, pages);
  $('#tbl thead').innerHTML = '<tr>' + cols.map((c, i) => `<th data-i="${i}" class="${sortK === i ? 'sorted' + (sortAsc ? ' asc' : '') : ''}">${c.h}</th>`).join('') + '</tr>';
  $('#tbl tbody').innerHTML = rows.slice((page - 1) * size, page * size).map(r => '<tr>' + cols.map(c => `<td class="${c.n ? 'n' : ''}">${c.r ? c.r(r) : esc(c.n && c.v(r) != null ? nf.format(c.v(r)) : c.v(r))}</td>`).join('') + '</tr>').join('') || `<tr><td colspan="${cols.length}" class="muted" style="padding:24px;text-align:center">Nenhum registro no recorte.</td></tr>`;
  $('#tCount').textContent = `${fmtN(rows.length)} ${mode === 'proj' || mode === 'sap' ? 'projetos' : 'registros'}`;
  const b = (lbl, p, dis) => `<button class="btn sm" data-pg="${p}" ${dis ? 'disabled' : ''}>${lbl}</button>`;
  $('#pager').innerHTML = b('«', 1, page === 1) + b('‹', page - 1, page === 1) + `<span class="muted">Página ${page} de ${pages}</span>` + b('›', page + 1, page === pages) + b('»', pages, page === pages);
}
$('#tbl thead').addEventListener('click', e => { const th = e.target.closest('th'); if (!th) return; const i = +th.dataset.i; if (sortK === i) sortAsc = !sortAsc; else { sortK = i; sortAsc = !COLS[mode][i].n; } renderTable(); });
$('#pager').addEventListener('click', e => { const b = e.target.closest('[data-pg]'); if (b && !b.disabled) { page = +b.dataset.pg; renderTable(); $('#lista').scrollIntoView(); } });
$('#tblMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#tblMode button').forEach(x => x.classList.toggle('on', x === b)); mode = b.dataset.v; sortK = null; page = 1; renderTable(); });
$('#tSize').onchange = () => { page = 1; renderTable(); };
let tdeb; $('#tQ').addEventListener('input', () => { clearTimeout(tdeb); tdeb = setTimeout(() => { page = 1; renderTable(); }, 250); });

/* ---------- histórico do projeto ---------- */
// junta SIGEO e FCU por data de programação
function mergedHistory(p) {
  const by = new Map();
  const slot = d => { const k = d || '—'; if (!by.has(k)) by.set(k, {d, s: [], f: []}); return by.get(k); };
  p.progs.filter(r => r.fo === 'SIGEO').forEach(r => slot(r.d).s.push(r));
  p.fcu.forEach(r => slot(r[FX.Data_Programação]).f.push(r));
  return [...by.values()].sort((a, b) => String(b.d || '').localeCompare(String(a.d || '')));
}
function openProject(code) {
  const p = PROJ.get(code);
  if (!p) { toast('Projeto não encontrado: ' + code); return; }
  history.replaceState(null, '', '#projeto=' + encodeURIComponent(code));
  const i = p.info || {}, s = p.sap;
  const kv = (k, v) => `<div><span>${k}</span><b>${esc(v ?? '') || '—'}</b></div>`;
  const c = counts(p.progs), H = mergedHistory(p);
  const occ = p.fcu.filter(r => r[FX.motivo_canc_exec_parcial] || r[FX.Agrupamento] || r[FX.Comentario]).sort((a, b) => String(b[FX.Inicio]).localeCompare(String(a[FX.Inicio])));
  const fcuOnly = p.progs.every(r => r.fo === 'FCU');
  const hrows = H.map(h => { const n = Math.max(h.s.length, h.f.length, 1); let out = ''; for (let k = 0; k < n; k++) { const a = h.s[k], b = h.f[k];
    out += `<tr>${k === 0 ? `<td rowspan="${n}" class="dcell"><b>${fmtD(h.d) || '—'}</b></td>` : ''}
    <td class="sg">${a ? badge(a.st) : '<span class="muted">sem SIGEO</span>'}</td><td class="sg nw">${a ? fmtDT(a.ini) : ''}</td><td class="sg nw">${a ? fmtDT(a.fim) : ''}</td><td class="sg muted">${a ? esc([a.tp, a.po && 'PO ' + a.po, a.eq].filter(Boolean).join(' · ')) : ''}</td>
    <td class="fc">${b ? badge(b[FX.Status_Sigeo]) : '<span class="muted">sem FCU</span>'}</td><td class="fc nw">${b ? fmtDT(b[FX.Inicio]) : ''}</td><td class="fc nw">${b ? fmtDT(b[FX.Termino]) : ''}</td>
    <td class="fc">${b ? esc([b[FX.motivo_canc_exec_parcial], b[FX.Agrupamento]].filter(Boolean).join(' · ')) : ''}</td><td class="fc">${b ? esc(b[FX.Comentario]) : ''}</td></tr>`; } return out; }).join('');
  const sapDates = s ? [['Data de Energização', s['Data de Energização']], ['Data Conclusão (total) de Obra', s['Data Conclusão (total) de Obra']], ['Data Inventário (Executor)', s['Data Inventário (Executor)']], ['Data Conciliação de Inventário', s['Data Conciliação de Inventário']]].filter(x => x[1]).sort((a, b) => a[1].localeCompare(b[1])) : [];
  openModal(`
  <div class="mh"><h2>${esc(p.code)}</h2>${pchip(p.pa)} ${badge(p.lastSt)}${p.sapSt ? `<span class="badge" style="--c:#6250d6">SAP ${esc(p.sapSt)}</span>` : ''}<span class="muted">${esc(p.ct)}</span></div>
  <div class="info">
    ${kv('Família (FCU)', p.fam)}${kv('Denominação', p.den)}${kv('Polo / Área', [p.polo, i.Area != null ? 'Área ' + i.Area : ''].filter(Boolean).join(' · '))}${kv('Região', p.reg)}
    ${kv('Circuito', p.circ)}${kv('Conjunto', p.conj)}${kv('Nota', i.nota)}${kv('Ordem SIGEO', i.Ordem_Sigeo)}
    ${kv('Status projeto (FCU)', i.status)}${kv('Stt resumo (FCU)', i['Stt Resumo'])}${kv('KPI projeto', i['KPI Projeto'])}${kv('Reprogramação', i['Status_Reprogramação'])}
    ${kv('Camada', i.camada)}${kv('UPS planejada', i.Ups_Plan)}${kv('UPS executada', i.Ups_Exec_Projeto)}${kv('Programações', `${p.n} · exec. ${c.ex} · parc. ${c.parc} · canc. ${c.canc} · aberto ${c.ab}`)}
  </div>
  <div class="seg ptabs" id="ptabs">
    <button data-t="hist" class="on">Histórico SIGEO × FCU (${H.length} datas)</button><button data-t="occ">Ocorrências e comentários FCU (${occ.length})</button><button data-t="sap">Histórico SAP${s ? '' : ' (sem registro)'}</button><button data-t="loc">Equipamentos e localização (${p.eqGeo}/${p.eqs.length})</button>
  </div>
  <div class="ptab" data-t="hist">
    <p class="muted">Cada linha é uma data de programação: à esquerda o registro do <b>SIGEO</b> (planilhas das parceiras) e à direita o da <b>FCU</b>, ambos com data e hora de início e término.${fcuOnly ? ' <b>Este projeto não consta nas planilhas SIGEO das parceiras — as programações vêm somente da FCU.</b>' : ''}</p>
    <div class="tbl-wrap" style="max-height:470px"><table class="tbl hist"><thead><tr><th>Data</th><th class="sg">SIGEO · status</th><th class="sg">Início</th><th class="sg">Término</th><th class="sg">Tipo · PowerON · equipamentos</th><th class="fc">FCU · status</th><th class="fc">Início</th><th class="fc">Término</th><th class="fc">Motivo / agrupamento</th><th class="fc">Comentário</th></tr></thead>
    <tbody>${hrows || '<tr><td colspan="10" class="muted">Sem programações.</td></tr>'}</tbody></table></div>
  </div>
  <div class="ptab" data-t="occ" hidden>
    ${occ.length ? `<ul class="timeline">${occ.map(r => `<li style="--c:${SC(r[FX.Status_Sigeo])}"><div class="d">${fmtDT(r[FX.Inicio]) || '—'}${r[FX.Termino] ? ' → ' + fmtDT(r[FX.Termino]) : ''} ${badge(r[FX.Status_Sigeo])}</div>
      ${r[FX.motivo_canc_exec_parcial] ? `<div><b>Motivo:</b> ${esc(r[FX.motivo_canc_exec_parcial])}</div>` : ''}${r[FX.Agrupamento] ? `<div><b>Agrupamento:</b> ${esc(r[FX.Agrupamento])}</div>` : ''}
      ${r[FX.Comentario] ? `<div class="cmt">💬 ${esc(r[FX.Comentario])}</div>` : ''}
      <div class="m">${esc([r[FX.Tipo_Int], r[FX['Status_Reprogramação']] && 'Reprogramação: ' + r[FX['Status_Reprogramação']], r[FX.Status_PO] && 'PO: ' + r[FX.Status_PO], r[FX.Empreiteira_Contratos]].filter(Boolean).join(' · '))}</div></li>`).join('')}</ul>`
      : '<p class="muted">Nenhuma ocorrência, motivo ou comentário registrado na FCU para este projeto.</p>'}
  </div>
  <div class="ptab" data-t="sap" hidden>
    ${s ? `<div class="info">${kv('Denominação SAP', s['Denominação'])}${kv('Tipo de projeto', s['Tip.projeto'])}${kv('Status SAP', s.Status)}${kv('Regional', s.Regional)}
      ${kv('Contrato', s.Contrato)}${kv('Local de instalação', s['Local de instalação'])}${kv('Inventário aprovado', s['Inventário Aprovado'])}${kv('Usuário inventário execução', s['Usuário Inventário Execução'])}</div>
      <h4>Linha do tempo SAP</h4><ul class="timeline">${sapDates.map(x => `<li style="--c:#6250d6"><div class="d">${fmtD(x[1])}</div><div class="m">${x[0]}</div></li>`).join('') || '<li class="muted">Sem datas registradas no SAP.</li>'}</ul>`
      : '<p class="muted">Projeto sem registro na Planilha FCU SAP.</p>'}
  </div>
  <div class="ptab" data-t="loc" hidden>
    ${p.hasLoc ? `<div class="muted" style="margin-bottom:6px">Projeto: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)} · ${esc(p.locSrc)}${p.locEq ? ' · ' + esc(p.locEq) : ''}</div>${goLinks(p.lat, p.lng, true)}` : '<div class="muted">Sem coordenada na base FCU/Buscapé.</div>'}
    <div class="mgrid" style="margin-top:10px"><div id="pmap"></div>
    <ul class="list eqlist">${p.eqs.map(e => `<li><span><b>${esc(e.t)}</b> <span class="muted">${e.n}× · ${esc(e.src)}${e.c && e.c[2] ? ' · ' + esc(e.c[2]) : ''}${e.c ? '<br>' + e.c[0].toFixed(6) + ', ' + e.c[1].toFixed(6) : ''}</span></span>${e.c ? goLinks(e.c[0], e.c[1]) : '<span class="muted">sem coordenada no Buscapé</span>'}</li>`).join('') || '<li class="muted">Nenhum equipamento associado.</li>'}</ul></div>
  </div>
  <div class="actions"><button class="btn primary" id="pxExp">⬇ Exportar histórico completo (Excel)</button><button class="btn" id="pxLink">🔗 Copiar link do projeto</button></div>`);
  $('#ptabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#ptabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.ptab').forEach(t => t.hidden = t.dataset.t !== b.dataset.t); if (b.dataset.t === 'loc') setTimeout(() => drawPMap(p), 20); });
  $('#pxExp').onclick = () => exportProject(p);
  $('#pxLink').onclick = () => { const u = location.href; navigator.clipboard?.writeText(u).then(() => toast('Link copiado'), () => toast(u, 6000)); };
}
function drawPMap(p) {
  if (pmap) { pmap.invalidateSize(); return; }
  pmap = L.map('pmap').setView(p.hasLoc ? [p.lat, p.lng] : [-23.55, -46.55], p.hasLoc ? 16 : 10);
  gTiles('m').addTo(pmap);
  const pts = [];
  if (p.hasLoc) { L.marker([p.lat, p.lng]).addTo(pmap).bindPopup(`<b>Projeto ${esc(p.code)}</b><br>${goLinks(p.lat, p.lng, true)}`); pts.push([p.lat, p.lng]); }
  p.eqs.forEach(e => { if (e.c) { L.circleMarker([e.c[0], e.c[1]], {radius: 7, color: '#fff', weight: 2, fillColor: PC[p.pa] || '#2a78d6', fillOpacity: 1}).addTo(pmap).bindPopup(`<b>${esc(e.t)}</b> · ${esc(e.src)}<br>${goLinks(e.c[0], e.c[1], true)}`); pts.push([e.c[0], e.c[1]]); } });
  if (pts.length > 1) pmap.fitBounds(pts, {padding: [30, 30], maxZoom: 17});
}

/* ---------- consulta ---------- */
function openConsulta() {
  openModal(`<h2 style="margin:0 0 4px">Consultar informações</h2><p class="muted">Pesquise por projeto, PowerON, equipamento, local de instalação, nota, ordem SIGEO, contrato, circuito ou descrição — em SIGEO, FCU e SAP.</p>
  <input id="cQ" type="search" placeholder="Ex.: DMP/A.LES.25.03089, 15200395, 015ET031779…" style="width:100%;font-size:15px;padding:10px 12px">
  <div class="actions"><button class="btn" id="cApply">Aplicar como filtro do painel</button></div><ul class="list" id="cRes"></ul>`, true);
  const run = () => {
    const q = $('#cQ').value.trim().toLowerCase();
    if (q.length < 3) { $('#cRes').innerHTML = '<li class="muted">Digite ao menos 3 caracteres.</li>'; return; }
    const res = [];
    for (const p of PROJ_LIST) {
      if (!p.search.includes(q)) continue;
      let w = p.code.toLowerCase().includes(q) ? 'projeto' : '';
      if (!w) { const r = p.progs.find(r => r.po.toLowerCase().includes(q)); if (r) w = 'PowerON ' + r.po; }
      if (!w) { const e = p.eqs.find(e => e.t.toLowerCase().includes(q)); if (e) w = 'equipamento ' + e.t + ' (' + e.src + ')'; }
      if (!w) w = (p.sap?.['Denominação'] || '').toLowerCase().includes(q) ? 'SAP' : 'cadastro FCU';
      res.push([p, w]); if (res.length >= 60) break;
    }
    $('#cRes').innerHTML = res.map(([p, w]) => `<li><span>${plink(p.code)} ${pchip(p.pa)} <span class="muted">· ${esc(w)} · ${p.n} prog. · último ${fmtD(p.last)}${p.sapSt ? ' · SAP ' + esc(p.sapSt) : ''}</span></span>${badge(p.lastSt)}</li>`).join('') || '<li class="muted">Nada encontrado.</li>';
  };
  let d; $('#cQ').addEventListener('input', () => { clearTimeout(d); d = setTimeout(run, 200); });
  $('#cApply').onclick = () => { setF('q', $('#cQ').value.trim()); closeModal(); apply(); $('#lista').scrollIntoView(); };
  setTimeout(() => $('#cQ').focus(), 50);
}
$('#btnConsulta').onclick = openConsulta;

/* ---------- exportação ---------- */
const stamp = () => new Date().toLocaleString('sv-SE', {timeZone: 'America/Sao_Paulo'}).slice(0, 16).replace(/[-: ]/g, '').replace(/^(\d{8})(\d{4})$/, '$1_$2');
function sheet(aoa, widths) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (aoa.length && aoa[0].length) ws['!autofilter'] = {ref: XLSX.utils.encode_range({s: {r: 0, c: 0}, e: {r: aoa.length - 1, c: aoa[0].length - 1}})};
  ws['!cols'] = (widths || (aoa[0] || []).map(h => Math.max(10, Math.min(40, String(h).length + 4)))).map(w => ({wch: w}));
  return ws;
}
function linkCols(ws, aoa) { (aoa[0] || []).forEach((h, c) => { if (h === 'Google Maps' || h === 'Waze') for (let r = 1; r < aoa.length; r++) { const a = XLSX.utils.encode_cell({r, c}); if (ws[a] && ws[a].v) ws[a].l = {Target: ws[a].v}; } }); return ws; }
const SAPH = ['Denominação', 'Tip.projeto', 'Status', 'Data Conclusão (total) de Obra', 'Data Inventário (Executor)', 'Usuário Inventário Execução', 'Data Conciliação de Inventário', 'Contrato', 'Local de instalação', 'Regional', 'Inventário Aprovado', 'Data de Energização'];
function projAoa(list) {
  const h = ['Projeto', 'Parceira', 'Contratada', 'Região', 'Polo', 'Família', 'Denominação', 'Circuito', 'Conjunto', 'Nota', 'Ordem SIGEO', 'Status FCU', 'Stt Resumo', 'KPI Projeto', 'Programações', 'Executadas', 'Parciais', 'Canceladas', 'Em aberto', 'Ocorrências FCU', 'Primeira programação', 'Última programação', 'Último status', 'Status SAP', 'Conclusão obra SAP', 'Energização SAP', 'Equipamentos', 'Equip. geolocalizados', 'Latitude', 'Longitude', 'Fonte localização', 'Equipamento ref.', 'Google Maps', 'Waze'];
  return [h, ...list.map(p => [p.code, p.pa, p.ct, p.reg, p.polo, p.fam, p.den, p.circ, p.conj, p.info?.nota || '', p.info?.Ordem_Sigeo || '', p.info?.status || '', p.info?.['Stt Resumo'] || '', p.info?.['KPI Projeto'] || '', p.n, p.ex, p.parc, p.canc, p.ab, p.occ, fmtD(p.first), fmtD(p.last), p.lastSt, p.sapSt, fmtD(p.sap?.['Data Conclusão (total) de Obra']), fmtD(p.sap?.['Data de Energização']), p.eqs.map(e => e.t).join(', '), p.eqGeo, p.lat ?? '', p.lng ?? '', p.locSrc, p.locEq, p.hasLoc ? gm(p.lat, p.lng) : '', p.hasLoc ? wz(p.lat, p.lng) : ''])];
}
const progAoa = rows => [['Data Programacao', 'Projeto', 'Parceira', 'Status Programacao', 'Início', 'Término', 'Tipo Intervencao', 'Numero PowerON', 'Equipamentos', 'Contratada', 'Fonte', 'Latitude', 'Longitude'],
  ...rows.map(r => { const p = PROJ.get(r.p); return [fmtD(r.d), r.p, r.pa, r.st, fmtDT(r.ini), fmtDT(r.fim), r.tp, r.po, r.eq, r.ct, r.fo, p?.lat ?? '', p?.lng ?? '']; })];
const fcuAoa = rows => [DB.fcuCols, ...rows.map(r => r.map((v, i) => { const c = DB.fcuCols[i]; return c === 'Inicio' || c === 'Termino' ? fmtDT(v) : (/data|fim_prev/i.test(c) && v ? fmtD(v) : (v ?? '')); }))];
const sapAoa = list => [['Projeto', 'Parceira', ...SAPH], ...list.filter(p => p.sap).map(p => [p.code, p.pa, ...SAPH.map(h => /^Data/.test(h) ? fmtD(p.sap[h]) : (p.sap[h] ?? ''))])];
const eqAoa = list => [['Projeto', 'Parceira', 'Equipamento', 'Origem', 'Ocorrências', 'Circuito', 'Latitude', 'Longitude', 'Google Maps', 'Waze'], ...list.flatMap(p => p.eqs.map(e => [p.code, p.pa, e.t, e.src, e.n, e.c?.[2] || '', e.c?.[0] ?? '', e.c?.[1] ?? '', e.c ? gm(e.c[0], e.c[1]) : '', e.c ? wz(e.c[0], e.c[1]) : '']))];
function histAoa(list) {
  const out = [['Projeto', 'Parceira', 'Data', 'SIGEO status', 'SIGEO início', 'SIGEO término', 'Tipo', 'PowerON', 'Equipamentos', 'FCU status', 'FCU início', 'FCU término', 'Motivo', 'Agrupamento', 'Comentário']];
  list.forEach(p => mergedHistory(p).forEach(h => { const n = Math.max(h.s.length, h.f.length, 1); for (let k = 0; k < n; k++) { const a = h.s[k], b = h.f[k];
    out.push([p.code, p.pa, fmtD(h.d), a?.st || '', a ? fmtDT(a.ini) : '', a ? fmtDT(a.fim) : '', a?.tp || '', a?.po || '', a?.eq || '', b ? (FCU2ST[b[FX.Status_Sigeo]] || b[FX.Status_Sigeo]) : '', b ? fmtDT(b[FX.Inicio]) : '', b ? fmtDT(b[FX.Termino]) : '', b?.[FX.motivo_canc_exec_parcial] || '', b?.[FX.Agrupamento] || '', b?.[FX.Comentario] || '']); } }));
  return out;
}
function resumoAoa(rows) {
  const out = [['Parceira', 'Projetos', 'Programações', 'Executadas', 'Parciais', 'Canceladas', 'Em aberto', 'Efetividade %', 'Projetos com SAP']];
  [...PARTNERS, 'Total'].forEach(pa => { const rr = pa === 'Total' ? rows : rows.filter(r => r.pa === pa), c = counts(rr), ps = new Set(rr.map(r => r.p)); out.push([pa, ps.size, c.n, c.ex, c.parc, c.canc, c.ab, Math.round(c.ef * 1000) / 10, [...ps].filter(x => PROJ.get(x).sap).length]); });
  out.push([]); out.push(['Mês', 'Parceira', 'Programações', 'Executadas', 'Parciais', 'Canceladas', 'Em aberto']);
  const m = {}; rows.forEach(r => { const k = r.d.slice(0, 7) + '|' + r.pa; (m[k] = m[k] || []).push(r); });
  Object.keys(m).sort().forEach(k => { const c = counts(m[k]); const [mm, pa] = k.split('|'); out.push([mm, pa, c.n, c.ex, c.parc, c.canc, c.ab]); });
  return out;
}
function download(wb, name) { XLSX.writeFile(wb, name, {compression: true}); toast('Arquivo gerado: ' + name); }
function add(wb, aoa, name, w) { XLSX.utils.book_append_sheet(wb, linkCols(sheet(aoa, w), aoa), name); }
function exportWorkbook(full) {
  const prog = full ? PROG : VIEW.prog, proj = full ? PROJ_LIST : VIEW.proj, fcu = full ? FCUROWS : VIEW.fcu;
  const wb = XLSX.utils.book_new();
  add(wb, resumoAoa(prog), 'Resumo', [16, 14, 14, 12, 12, 12, 12, 14, 16]);
  add(wb, projAoa(proj), 'Projetos');
  add(wb, histAoa(proj), 'Histórico SIGEO x FCU');
  add(wb, progAoa(prog), 'Programações');
  add(wb, fcuAoa(fcu), 'FCU');
  add(wb, sapAoa(proj), 'SAP');
  add(wb, eqAoa(proj), 'Equipamentos');
  const filt = Object.entries(F).filter(([, v]) => v).map(([k, v]) => [FLBL[k], v]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Exportado em', new Date().toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})], ['Escopo', full ? 'Base completa' : 'Recorte filtrado'], ...filt, [], ['Fora do escopo', ...Object.entries(DB.meta.exclusoes || {}).map(([k, v]) => `${k}: ${v} programações`)], ['Fontes', ...(DB.meta.arquivos || [])]]), 'Filtros');
  download(wb, `Projetos_FCU_SIGEO_SAP_${full ? 'completo' : 'recorte'}_${stamp()}.xlsx`);
}
function exportProject(p) {
  const wb = XLSX.utils.book_new();
  add(wb, projAoa([p]), 'Projeto');
  add(wb, histAoa([p]), 'Histórico SIGEO x FCU');
  add(wb, progAoa([...p.progs].reverse()), 'Programações');
  add(wb, fcuAoa(p.fcu), 'FCU');
  add(wb, sapAoa([p]), 'SAP');
  add(wb, eqAoa([p]), 'Equipamentos');
  download(wb, `Historico_${p.code.replace(/[\/\\.]/g, '_')}.xlsx`);
}
function exportTable() {
  const rows = tableRows(), aoa = mode === 'proj' ? projAoa(rows) : mode === 'prog' ? progAoa(rows) : mode === 'sap' ? sapAoa(rows) : fcuAoa(rows);
  const wb = XLSX.utils.book_new(); add(wb, aoa, {proj: 'Projetos', prog: 'Programações', fcu: 'FCU', occ: 'Ocorrências FCU', sap: 'SAP'}[mode]);
  download(wb, `Lista_${mode}_${stamp()}.xlsx`);
}
$('#btnExportTbl').onclick = exportTable;
function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Arquivo gerado: ' + name); }
function exportCsv() {
  const csv = projAoa(VIEW.proj).map(r => r.map(v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
  saveBlob(new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'}), `Projetos_recorte_${stamp()}.csv`);
}
function exportModelo() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Projeto', 'Data Programacao', 'Status Programacao', 'Tipo Intervencao', 'Numero PowerON', 'Equipamentos', 'CHI', 'Horario Inicio', 'Horario Fim', 'Contratada']]), 'Dados');
  download(wb, 'Modelo_importacao_programacoes.xlsx');
}
function exportBaseJs() { const d = {...DB}; delete d.local; delete d.sapAll; saveBlob(new Blob(['window.FCU_DATA=' + JSON.stringify(d) + ';\n'], {type: 'text/javascript'}), 'base.js'); }
$('#btnExport').onclick = () => openModal(`<h2 style="margin:0 0 4px">Exportar informações</h2><p class="muted">Recorte atual: ${fmtN(VIEW.proj.length)} projetos · ${fmtN(VIEW.prog.length)} programações · ${fmtN(VIEW.fcu.length)} registros FCU · ${fmtN(VIEW.sap.length)} projetos com SAP.</p>
  <div class="opt">
    <button class="btn" data-x="rec">📊 Excel do recorte atual<small>Resumo, Projetos, Histórico SIGEO × FCU (início/término, motivos, comentários), Programações, FCU, SAP e Equipamentos com Google Maps/Waze</small></button>
    <button class="btn" data-x="all">📚 Excel da base completa<small>Todas as informações das três parceiras</small></button>
    <button class="btn" data-x="csv">🧾 CSV dos projetos (recorte)<small>Separador ponto e vírgula, pronto para o Excel</small></button>
    <button class="btn" data-x="mod">📄 Modelo de importação<small>Cabeçalho padrão das planilhas de programação das parceiras</small></button>
    <button class="btn" data-x="js">🌐 base.js para publicar no GitHub<small>Substitua data/base.js no repositório para atualizar o site para todos</small></button>
  </div>`, true);
$('#modalBody').addEventListener('click', e => {
  const b = e.target.closest('[data-x]'); if (!b) return;
  ({rec: () => exportWorkbook(false), all: () => exportWorkbook(true), csv: exportCsv, mod: exportModelo, js: exportBaseJs})[b.dataset.x]();
});

/* ---------- importação ---------- */
const serialToISO = v => { if (typeof v === 'number' && v > 20000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10); const s = String(v ?? '').trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
const serialToDT = v => { if (typeof v === 'number' && v > 20000) { const d = new Date(Math.round((v - 25569) * 864e5)).toISOString(); return d.slice(0, 10) + ' ' + d.slice(11, 16); } const m = String(v ?? '').trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/); return m ? m[1] + ' ' + m[2] : ''; };
const toHM = v => { if (typeof v === 'number') { const mins = Math.round((v % 1) * 1440) % 1440; return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); } const m = String(v ?? '').match(/(\d{1,2}):(\d{2})/); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };
const S = v => v == null ? '' : String(v).replace(/\s+/g, ' ').trim().replace(/^(\d+)\.0$/, '$1');
const N = v => { const x = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? null : Math.round(x * 1e6) / 1e6; };
const partnerOf = (txt, fname) => { const t = (txt + ' ' + fname).toLowerCase(); return t.includes('engelmig') ? 'Engelmig' : t.includes('conecta') ? 'Conecta' : t.includes('start') ? 'Start' : ''; };
function startExcluded(code, fcuDen) {
  if ((DB.meta.excStart || []).includes(code)) return true;
  const den = fcuDen?.[code] || DB.projects?.[code]?.[DB.projCols.indexOf('denominacao')] || '';
  return /^MA_/i.test(den);
}
function rebuildDerived() {
  const X = Object.fromEntries(DB.fcuCols.map((c, i) => [c, i]));
  const fcuDen = {}; DB.fcu.forEach(r => { if (r[X.denominacao]) fcuDen[r[0]] = r[X.denominacao]; });
  const exStart = new Set();
  // exclusões: Start · manutenção de redes e linhas aéreas | Conecta · poda de árvores
  DB.prog = DB.prog.filter(r => {
    if (r[10] !== 'SIGEO') return false;
    if (r[9] === 'Conecta' && isPoda(r[8])) return false;
    if (r[9] === 'Start' && startExcluded(r[0], fcuDen)) { exStart.add(r[0]); return false; }
    return true;
  });
  const have = new Set(DB.prog.map(r => r[0]));
  DB.fcu.forEach(r => { if (have.has(r[0])) return; const emp = r[X.Empreiteira_Contratos]; if (!PARTNERS.includes(emp)) return; if (emp === 'Start' && startExcluded(r[0], fcuDen)) return;
    DB.prog.push([r[0], r[X.Data_Programação] || '', FCU2ST[r[X.Status_Sigeo]] || r[X.Status_Sigeo] || '', r[X.Tipo_Int] === 'ObraLivre' ? 'OLVR' : (r[X.Tipo_Int] || ''), '', String(r[X.local_inst] || '').toUpperCase(), r[X.Inicio] || '', r[X.Termino] || '', 'FCU · ' + emp, emp, 'FCU']); });
  const all = new Set(DB.prog.map(r => r[0]));
  DB.fcu = DB.fcu.filter(r => all.has(r[0]));
  const pj = DB.projCols, proj = {};
  DB.fcu.forEach(r => { const c = proj[r[0]]; if (!c || String(r[X.Data_Programação] || '') >= String(c[X.Data_Programação] || '')) proj[r[0]] = r; });
  DB.projects = Object.fromEntries(Object.entries(proj).map(([k, r]) => [k, pj.map(c => r[X[c]])]));
  if (DB.sapAll) DB.sap = Object.fromEntries(Object.entries(DB.sapAll).filter(([k]) => all.has(k)));
  const ds = DB.prog.map(r => r[1]).filter(Boolean).sort();
  DB.meta = {...DB.meta, periodo: [ds[0] || '', ds[ds.length - 1] || ''], excStart: [...new Set([...(DB.meta.excStart || []), ...exStart])], generated: new Date().toLocaleString('sv-SE', {timeZone: 'America/Sao_Paulo'}).slice(0, 16).replace(' ', 'T')};
}
async function importFiles(files) {
  const log = [], old = DB;
  DB = JSON.parse(JSON.stringify(DB));
  let eqRows = null, podaTot = 0;
  try {
    for (const file of files) {
      const wb = XLSX.read(await file.arrayBuffer(), {type: 'array', cellDates: false}); let done = false;
      for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {defval: null, raw: true});
        if (!rows.length) continue;
        const h = Object.keys(rows[0]);
        if (h.includes('Status Programacao') && h.includes('Projeto')) {
          const parts = new Set(), out = []; let poda = 0;
          rows.forEach(r => { const pa = partnerOf(S(r['Contratada']), file.name); if (!pa || !S(r['Projeto'])) return; parts.add(pa);
            if (pa === 'Conecta' && isPoda(r['Contratada'])) { poda++; return; }
            const dd = serialToISO(r['Data Programacao']);
            out.push([S(r['Projeto']).toUpperCase(), dd, S(r['Status Programacao']), S(r['Tipo Intervencao']), S(r['Numero PowerON']), S(r['Equipamentos']).toUpperCase(),
              serialToDT(r['Horario Inicio']) || (dd + ' ' + toHM(r['Horario Inicio'])).trim(), serialToDT(r['Horario Fim']) || (dd + ' ' + toHM(r['Horario Fim'])).trim(), S(r['Contratada']), pa, 'SIGEO']); });
          DB.prog = DB.prog.filter(r => !(r[10] === 'SIGEO' && parts.has(r[9]))).concat(out);
          podaTot += poda;
          log.push(`✔ ${file.name}: ${fmtN(out.length)} programações (${[...parts].join(', ')})${poda ? ` — ${fmtN(poda)} de poda excluídas` : ''}`); done = true; break;
        }
        if (h.includes('Ordem_Sigeo') && h.includes('Projeto')) {
          const need = new Set(DB.prog.filter(r => r[10] === 'SIGEO').map(r => r[0]));
          const dateC = new Set(['Data_Programação', 'dataDELI', 'fim_prev', 'DATA_PLANO_SAP']), numC = new Set(['Ups_Plan', 'Ups_Exec_Projeto', 'ups_programada', 'Ups_Exec', 'Latitude', 'Longitude', 'WL', 'Area']);
          const iI = DB.fcuCols.indexOf('Inicio');
          DB.fcu = rows.filter(r => need.has(S(r.Projeto).toUpperCase()) || PARTNERS.includes(S(r.Empreiteira_Contratos))).map(r => {
            const dp = serialToISO(r['Data_Programação']), dpv = dp < '1950' ? '' : dp, hi = toHM(r.Hora_Inicio), hf = toHM(r.Hora_Fim);
            let fd = dpv; if (dpv && hi && hf && hf < hi) { const t = new Date(dpv + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); fd = t.toISOString().slice(0, 10); }
            return DB.fcuCols.map(c => { const v = r[c]; if (c === 'Projeto') return S(v).toUpperCase(); if (c === 'Inicio') return dpv ? (dpv + ' ' + hi).trim() : ''; if (c === 'Termino') return dpv ? (fd + ' ' + hf).trim() : '';
              if (dateC.has(c)) { const d = serialToISO(v); return d < '1950' ? '' : d; } if (numC.has(c)) return N(v); return S(v); }); })
            .sort((a, b) => (a[0] + a[iI]).localeCompare(b[0] + b[iI]));
          DB.meta.fcuTotal = rows.length;
          log.push(`✔ ${file.name}: FCU com ${fmtN(rows.length)} linhas — ${fmtN(DB.fcu.length)} das parceiras`); done = true; break;
        }
        if (h.includes('Definição do projeto') && h.includes('Status')) {
          DB.sapAll = {};
          rows.forEach(r => { const p = S(r['Definição do projeto']).toUpperCase(); if (!p) return; DB.sapAll[p] = DB.sapCols.map(c => { if (/^Data/.test(c)) { const d = serialToISO(r[c]); return d < '1950' ? '' : d; } return S(r[c]); }); });
          DB.meta.sapRows = rows.length;
          log.push(`✔ ${file.name}: Planilha FCU SAP com ${fmtN(rows.length)} projetos`); done = true; break;
        }
        if (h.includes('Número do Equipamento') && h.includes('Latitude')) { eqRows = rows; log.push(`✔ ${file.name}: ${fmtN(rows.length)} equipamentos com coordenadas (Buscapé)`); done = true; break; }
      }
      if (!done) log.push(`✖ ${file.name}: layout não reconhecido (esperado SIGEO parceira, FCU, Planilha FCU SAP ou Equipamentos Buscapé)`);
    }
    if (!DB.sapAll) DB.sapAll = {...(DB.sap || {})};
    rebuildDerived();
    if (podaTot) DB.meta.exclusoes = {...(DB.meta.exclusoes || {}), 'Conecta · Poda de Árvores': podaTot};
    const used = new Set(); DB.prog.forEach(r => tok(r[5]).forEach(t => used.add(t))); const li = DB.fcuCols.indexOf('local_inst'), sl = DB.sapCols.indexOf('Local de instalação');
    DB.fcu.forEach(r => { if (r[li]) used.add(String(r[li]).toUpperCase()); }); Object.values(DB.sap || {}).forEach(v => { if (v[sl]) used.add(String(v[sl]).toUpperCase()); });
    if (eqRows) { const co = {}; eqRows.forEach(r => { const k = S(r['Número do Equipamento']).toUpperCase(), la = N(r.Latitude), lo = N(r.Longitude); if (used.has(k) && la != null && lo != null) co[k] = [la, lo, S(r.Circuito)]; }); DB.coords = co; DB.meta.eqTotal = eqRows.length; }
    delete DB.sapAll;
    DB.local = new Date().toISOString();
    prepare(); apply(); await idbSet('base', DB);
    const sem = [...used].filter(t => !DB.coords[t]).length;
    log.push(`Base atualizada: ${fmtN(PROG.length)} programações · ${fmtN(PROJ_LIST.length)} projetos · ${fmtN(Object.keys(DB.sap || {}).length)} com SAP · ${fmtN(used.size - sem)} de ${fmtN(used.size)} equipamentos geolocalizados.`);
    if (!eqRows && sem) log.push('Dica: importe também o Equipamentos_Buscape para geolocalizar equipamentos novos.');
  } catch (err) { DB = old; prepare(); apply(); log.push('✖ Erro: ' + err.message); }
  $('#impLog').innerHTML = log.map(l => `<li>${esc(l)}</li>`).join('');
}
function openImport() {
  openModal(`<h2 style="margin:0 0 4px">Importar planilhas Excel</h2>
  <p class="muted">Arraste os arquivos ou clique para escolher. O site reconhece automaticamente: <b>programações SIGEO</b> (Start, Conecta, Engelmig), <b>FCU – Ferramenta de Controle</b>, <b>Planilha FCU SAP</b> e <b>Equipamentos Buscapé</b>. As exclusões (Start · manutenção de linhas, Conecta · poda de árvores) são aplicadas automaticamente. A importação fica salva só neste navegador.</p>
  <div class="drop" id="drop">⬆ Solte aqui os arquivos .xlsx (pode selecionar vários)</div>
  <ul class="list" id="impLog"></ul>
  <div class="actions"><button class="btn" id="btnRestore">↺ Restaurar base publicada no site</button></div>
  <p class="muted">Para publicar para todos: depois de importar, use <b>Exportar → base.js</b> e substitua <code>data/base.js</code> no repositório.</p>`, true);
  const dz = $('#drop');
  dz.onclick = () => $('#fileIn').click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); start(e.dataTransfer.files); };
  $('#btnRestore').onclick = async () => { await idbDel('base'); DB = PUBLISHED; prepare(); apply(); $('#impLog').innerHTML = '<li>✔ Base publicada restaurada.</li>'; };
}
function start(fl) { const files = [...(fl || [])]; if (!files.length) return; $('#impLog').innerHTML = '<li>Lendo arquivos… (arquivos grandes podem levar alguns segundos)</li>'; setTimeout(() => importFiles(files), 30); }
$('#fileIn').onchange = e => { start(e.target.files); e.target.value = ''; };
$('#btnImport').onclick = openImport;

/* ---------- IndexedDB ---------- */
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('fcu_sigeo_exec', 2); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbGet(k) { try { const d = await idb(); return await new Promise(res => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
async function idbSet(k, v) { try { const d = await idb(); await new Promise(res => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
async function idbDel(k) { try { const d = await idb(); await new Promise(res => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }

/* ---------- navegação ---------- */
const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) $$('#tabs a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }); }, {rootMargin: '-40% 0px -55% 0px'});
['inicio', 'parceiras', 'mapa', 'analises', 'lista'].forEach(id => io.observe(document.getElementById(id)));
function routeHash() { const m = location.hash.match(/^#projeto=(.+)$/); if (m) openProject(decodeURIComponent(m[1])); }
window.addEventListener('hashchange', routeHash);

/* ---------- início ---------- */
(async () => {
  if (!PUBLISHED) { $('#loading span').textContent = 'Não foi possível carregar data/base.js'; return; }
  const saved = await idbGet('base');
  // base importada de versão anterior (sem SAP / início-término) é descartada
  if (saved && saved.prog && saved.sapCols && saved.progCols?.includes('Inicio')) DB = saved; else if (saved) await idbDel('base');
  prepare(); initMap(); apply();
  $('#loading').classList.add('off');
  if (DB.local) toast('Usando base importada neste navegador em ' + new Date(DB.local).toLocaleString('pt-BR') + ' — restaure em Importar.', 6000);
  routeHash();
})();
})();
