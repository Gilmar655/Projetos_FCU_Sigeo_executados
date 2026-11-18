"""Gera data/base.js — Projetos FCU · SIGEO · SAP (Start, Conecta, Engelmig).
Uso: python build_data.py <pasta_planilhas> <saida/base.js>"""
import sys, json, re, glob, os, datetime as dt
from collections import Counter, defaultdict
import pandas as pd
D, OUT = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
def find(pat):
    m = sorted(glob.glob(os.path.join(D, pat)));  assert m, 'arquivo não encontrado: ' + pat; return m[-1]
FILES = {'Start': find('*Start_*.xlsx'), 'Conecta': find('*Conecta_*.xlsx'), 'Engelmig': find('*Engelmig_*.xlsx')}
FCU, EQ, SAP = find('*Fcu_execu*.xlsx'), find('*Equipamentos_Buscape*.xlsx'), find('*FCU_SAP*.[xX][lL][sS][xX]')
PARTNERS = ['Start', 'Conecta', 'Engelmig']
EXC_START = set(open(os.path.join(HERE, 'exclusoes_start_manutencao.txt')).read().split())

def s(v):
    if v is None or v is pd.NaT or (isinstance(v, float) and pd.isna(v)): return ''
    t = re.sub(r'\s+', ' ', str(v)).strip(); return t[:-2] if re.fullmatch(r'\d+\.0', t) else t
def d(v):
    if v is None or v is pd.NaT or (isinstance(v, float) and pd.isna(v)): return ''
    if isinstance(v, (dt.datetime, pd.Timestamp)): return '' if v.year < 1950 else v.strftime('%Y-%m-%d')
    return s(v)[:10]
def dtm(v):
    if isinstance(v, (dt.datetime, pd.Timestamp)) and not pd.isna(v): return '' if v.year < 1950 else v.strftime('%Y-%m-%d %H:%M')
    return ''
def hm(v):
    if v is None or v is pd.NaT or (isinstance(v, float) and pd.isna(v)): return ''
    if isinstance(v, (dt.datetime, pd.Timestamp, dt.time)): return v.strftime('%H:%M')
    m = re.search(r'(\d{1,2}):(\d{2})', str(v)); return f'{int(m[1]):02d}:{m[2]}' if m else ''
def numN(v):
    try:
        f = float(v); return None if pd.isna(f) else (int(f) if f.is_integer() else round(f, 6))
    except Exception: return None
tok = lambda e: [t for t in re.split(r'[,;|\s/]+', e) if t]

# ---------- SIGEO ----------
rows, excl = [], Counter()
for org, f in FILES.items():
    df = pd.read_excel(f, dtype={'Numero PowerON': str, 'Equipamentos': str, 'Projeto': str})
    for r in df.to_dict('records'):
        p, ct = s(r['Projeto']).upper(), s(r['Contratada'])
        if org == 'Conecta' and 'poda' in ct.lower(): excl['Conecta · Poda de Árvores'] += 1; continue
        if org == 'Start' and p in EXC_START: excl['Start · Manutenção de Redes e Linhas Aéreas'] += 1; continue
        ini = dtm(r['Horario Inicio']) or (d(r['Data Programacao']) + ' ' + hm(r['Horario Inicio'])).strip()
        fim = dtm(r['Horario Fim']) or (d(r['Data Programacao']) + ' ' + hm(r['Horario Fim'])).strip()
        rows.append([p, d(r['Data Programacao']), s(r['Status Programacao']), s(r['Tipo Intervencao']), s(r['Numero PowerON']),
                     s(r['Equipamentos']).upper(), ini, fim, ct, org, 'SIGEO'])
print('SIGEO após exclusões', len(rows), dict(excl))
sigeo_proj = {r[0] for r in rows}
excluded_proj = set(EXC_START)
for org, f in FILES.items():
    if org == 'Conecta':
        df = pd.read_excel(f, dtype=str, usecols=['Projeto', 'Contratada'])
        excluded_proj |= {s(p).upper() for p, c in zip(df['Projeto'], df['Contratada']) if 'poda' in s(c).lower()}
excluded_proj -= sigeo_proj

# ---------- FCU ----------
F = pd.read_excel(FCU, dtype={'Projeto': str, 'local_inst': str, 'Comentario': str})
F['_p'] = F['Projeto'].astype(str).str.strip().str.upper()
sel = F[(F['_p'].isin(sigeo_proj) | F['Empreiteira_Contratos'].isin(PARTNERS)) & ~F['_p'].isin(excluded_proj)].copy()
fcuCols = ['Projeto', 'Ordem_Sigeo', 'status', 'nota', 'familia_regen', 'denominacao', 'Ups_Plan', 'Ups_Exec_Projeto', 'contrato', 'Area', 'polo',
           'Empreiteira_Contratos', 'Tipo_Int', 'Data_Programação', 'Inicio', 'Termino', 'motivo_canc_exec_parcial', 'ups_programada', 'Ups_Exec', 'Status_Sigeo', 'local_inst',
           'circuito', 'conjunto', 'dataDELI', 'Stt Resumo', 'Status_Reprogramação', 'KPI Projeto', 'fim_prev', 'WL', 'Status_PO', 'Comentario',
           'DATA_PLANO_SAP', 'camada', 'Status_Mapa', 'Agrupamento', 'Fecha Projeto?', 'Latitude', 'Longitude']
dateC = {'Data_Programação', 'dataDELI', 'fim_prev', 'DATA_PLANO_SAP'}
numC = {'Ups_Plan', 'Ups_Exec_Projeto', 'ups_programada', 'Ups_Exec', 'Latitude', 'Longitude', 'WL', 'Area'}
fcu = []
for r in sel.to_dict('records'):
    dp = d(r['Data_Programação']); hi, hf = hm(r['Hora_Inicio']), hm(r['Hora_Fim'])
    ini = f'{dp} {hi}'.strip() if dp else ''
    fd = dp
    if dp and hi and hf and hf < hi: fd = (dt.date.fromisoformat(dp) + dt.timedelta(days=1)).isoformat()
    fim = f'{fd} {hf}'.strip() if dp else ''
    out = []
    for c in fcuCols:
        if c == 'Projeto': out.append(s(r[c]).upper())
        elif c == 'Inicio': out.append(ini)
        elif c == 'Termino': out.append(fim)
        elif c in dateC: out.append(d(r[c]))
        elif c in numC: out.append(numN(r[c]))
        else: out.append(s(r[c]))
    fcu.append(out)
ix = {c: i for i, c in enumerate(fcuCols)}
fcu.sort(key=lambda x: (x[0], x[ix['Inicio']]))
print('FCU linhas das parceiras', len(fcu), 'de', len(F))

# programações de projetos só no FCU
SMAP = {'Executado': 'Executado', 'ExecutadoParcial': 'Executado Parcial', 'Cancelado': 'Cancelado', 'LiberadoExecucao': 'Liberado para Execução',
        'LiberadoDocumentacao': 'Liberado para Documentação', 'PendenteAprovacao': 'Pendente de Aprovação'}
extra = 0
for r in fcu:
    if r[0] in sigeo_proj or r[ix['Empreiteira_Contratos']] not in PARTNERS: continue
    emp = r[ix['Empreiteira_Contratos']]
    rows.append([r[0], r[ix['Data_Programação']], SMAP.get(r[ix['Status_Sigeo']], r[ix['Status_Sigeo']]), 'OLVR' if r[ix['Tipo_Int']] == 'ObraLivre' else r[ix['Tipo_Int']], '',
                 (r[ix['local_inst']] or '').upper(), r[ix['Inicio']], r[ix['Termino']], 'FCU · ' + emp, emp, 'FCU']); extra += 1
print('programações só no FCU', extra)
needed = {r[0] for r in rows}

proj = {}
for r in fcu:
    c = proj.get(r[0])
    if c is None or r[ix['Data_Programação']] >= c[ix['Data_Programação']]: proj[r[0]] = r
pcols = ['Ordem_Sigeo', 'nota', 'familia_regen', 'denominacao', 'polo', 'Area', 'Empreiteira_Contratos', 'circuito', 'conjunto', 'status', 'Stt Resumo', 'KPI Projeto',
         'Status_Reprogramação', 'camada', 'Ups_Plan', 'Ups_Exec_Projeto', 'local_inst', 'Latitude', 'Longitude']
projects = {p: [r[ix[c]] for c in pcols] for p, r in proj.items()}

# ---------- SAP ----------
S = pd.read_excel(SAP, dtype=str)
sapCols = ['Definição do projeto', 'Denominação', 'Tip.projeto', 'Status', 'Data Conclusão (total) de Obra', 'Data Inventário (Executor)', 'Usuário Inventário Execução',
           'Data Conciliação de Inventário', 'Contrato', 'Local de instalação', 'Regional', 'Inventário Aprovado', 'Data de Energização']
S2 = pd.read_excel(SAP)
sap = {}
for r in S2.to_dict('records'):
    p = s(r['Definição do projeto']).upper()
    if p not in needed: continue
    sap[p] = [d(r[c]) if c.startswith('Data') else s(r[c]).replace('  ', ' ') for c in sapCols[1:]]
    sap[p][2] = re.sub(r'\s+', ' ', sap[p][2])
print('SAP', len(S2), 'linhas; associadas a projetos das parceiras', len(sap))

# ---------- equipamentos / coordenadas ----------
eq = pd.read_excel(EQ, sheet_name='Equipamentos', dtype={'Número do Equipamento': str, 'Circuito': str})
eqmap = {}
for c, ci, la, lo in zip(eq['Número do Equipamento'], eq['Circuito'], eq['Latitude'], eq['Longitude']):
    if pd.isna(la) or pd.isna(lo): continue
    eqmap[s(c).upper()] = [round(float(la), 6), round(float(lo), 6), s(ci)]
used = set(t for r in rows for t in tok(r[5])) | {r[ix['local_inst']].upper() for r in fcu if r[ix['local_inst']]} | {v[8].upper() for v in sap.values() if v[8]}
coords = {t: eqmap[t] for t in used if t in eqmap}
print('equipamentos citados', len(used), 'com coordenada', len(coords))

dates = sorted(r[1] for r in rows if r[1])
meta = {'generated': dt.datetime.now().strftime('%Y-%m-%dT%H:%M'), 'periodo': [dates[0], dates[-1]],
        'fontes': {k: sum(1 for r in rows if r[9] == k and r[10] == 'SIGEO') for k in PARTNERS}, 'fcuOnly': extra,
        'fcuRows': len(fcu), 'fcuTotal': len(F), 'sapRows': len(S2), 'sapProj': len(sap), 'eqBase': '12/06/2026', 'eqTotal': len(eqmap),
        'exclusoes': dict(excl), 'excStart': sorted(EXC_START),
        'arquivos': [os.path.basename(x) for x in [*FILES.values(), FCU, SAP, EQ]]}
data = {'meta': meta,
        'progCols': ['Projeto', 'Data Programacao', 'Status Programacao', 'Tipo Intervencao', 'Numero PowerON', 'Equipamentos', 'Inicio', 'Termino', 'Contratada', 'Parceira', 'Fonte'],
        'prog': rows, 'fcuCols': fcuCols, 'fcu': fcu, 'projCols': pcols, 'projects': projects, 'sapCols': sapCols[1:], 'sap': sap, 'coords': coords}
with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write('window.FCU_DATA='); json.dump(data, fh, ensure_ascii=False, separators=(',', ':')); fh.write(';\n')
print('ok', os.path.getsize(OUT))
