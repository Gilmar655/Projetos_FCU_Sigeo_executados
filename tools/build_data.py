"""Gera data/base.js — Projetos FCU SIGEO executados (Start, Conecta, Engelmig)."""
import sys, json, re, datetime as dt
from collections import Counter, defaultdict
import pandas as pd
D, OUT = sys.argv[1], sys.argv[2]
FILES = {'Start':'Start_16_11_2026.xlsx','Conecta':'Conecta_16_11_2026.xlsx','Engelmig':'Engelmig_16_11.xlsx'}
FCU = 'Fcu_execução_18_11_2026.xlsx'; EQ='Equipamentos_Buscape_18_11.xlsx'
def s(v):
    if v is None or v is pd.NaT or (isinstance(v,float) and pd.isna(v)): return ''
    t=re.sub(r'\s+',' ',str(v)).strip()
    return t[:-2] if re.fullmatch(r'\d+\.0',t) else t
def d(v):
    if v is None or v is pd.NaT or (isinstance(v,float) and pd.isna(v)): return ''
    if isinstance(v,(dt.datetime,pd.Timestamp)): return '' if v.year<1950 else v.strftime('%Y-%m-%d')
    return s(v)[:10]
def hm(v):
    if v is None or v is pd.NaT or (isinstance(v,float) and pd.isna(v)): return ''
    if isinstance(v,(dt.datetime,pd.Timestamp,dt.time)): return v.strftime('%H:%M')
    m=re.search(r'(\d{1,2}):(\d{2})',str(v)); return f'{int(m[1]):02d}:{m[2]}' if m else ''
def num(v):
    try:
        f=float(v); return 0 if pd.isna(f) else (int(f) if f.is_integer() else round(f,2))
    except Exception: return 0
def numN(v):
    try:
        f=float(v); return None if pd.isna(f) else (int(f) if f.is_integer() else round(f,2))
    except Exception: return None
tok=lambda e:[t for t in re.split(r'[,;|\s/]+',e) if t]

rows=[]
for org,f in FILES.items():
    df=pd.read_excel(f'{D}/{f}',dtype={'Numero PowerON':str,'Equipamentos':str,'Projeto':str})
    for r in df.to_dict('records'):
        rows.append([s(r['Projeto']).upper(),d(r['Data Programacao']),s(r['Status Programacao']),s(r['Tipo Intervencao']),
            s(r['Numero PowerON']),s(r['Equipamentos']).upper(),num(r['CHI']),hm(r['Horario Inicio']),hm(r['Horario Fim']),s(r['Contratada']),org])
print('prog',len(rows))
needed={r[0] for r in rows}
partner_names={'Start','Conecta','Engelmig'}

F=pd.read_excel(f'{D}/{FCU}',dtype={'Projeto':str,'local_inst':str})
F['_p']=F['Projeto'].astype(str).str.strip().str.upper()
sel=F[F['_p'].isin(needed)|F['Empreiteira_Contratos'].isin(partner_names)].copy()
print('fcu rows sel',len(sel),'of',len(F))
fcuCols=['Projeto','Ordem_Sigeo','status','nota','familia_regen','denominacao','Ups_Plan','Ups_Exec_Projeto','contrato','Area','polo',
 'Empreiteira_Contratos','Tipo_Int','Data_Programação','motivo_canc_exec_parcial','ups_programada','Ups_Exec','Status_Sigeo','local_inst',
 'circuito','conjunto','dataDELI','Stt Resumo','Status_Reprogramação','KPI Projeto','fim_prev','WL','Status_PO','Comentario','Hora_Inicio',
 'Hora_Fim','DATA_PLANO_SAP','camada','Status_Mapa','Agrupamento','Fecha Projeto?','CI_Prog','CHI_Prog','Latitude','Longitude']
dateC={'Data_Programação','dataDELI','fim_prev','DATA_PLANO_SAP'}; timeC={'Hora_Inicio','Hora_Fim'}
numC={'Ups_Plan','Ups_Exec_Projeto','ups_programada','Ups_Exec','CI_Prog','CHI_Prog','Latitude','Longitude','WL','Area'}
fcu=[]
for r in sel[fcuCols].to_dict('records'):
    out=[]
    for c in fcuCols:
        v=r[c]
        if c=='Projeto': out.append(s(v).upper())
        elif c in dateC: out.append(d(v))
        elif c in timeC: out.append(hm(v))
        elif c in numC: x=numN(v); out.append(round(x,6) if isinstance(x,float) else x)
        else: out.append(s(v))
    fcu.append(out)
fcu.sort(key=lambda x:(x[0],x[13]))
ix={c:i for i,c in enumerate(fcuCols)}
for r in rows: r.append('SIGEO')
SMAP={'Executado':'Executado','ExecutadoParcial':'Executado Parcial','Cancelado':'Cancelado','LiberadoExecucao':'Liberado para Execução',
 'LiberadoDocumentacao':'Liberado para Documentação','PendenteAprovacao':'Pendente de Aprovação'}
TMAP={'ObraLivre':'OLVR'}
extra=0
for r in fcu:
    if r[0] in needed: continue
    emp=r[ix['Empreiteira_Contratos']]
    if emp not in partner_names: continue
    rows.append([r[0],r[ix['Data_Programação']],SMAP.get(r[ix['Status_Sigeo']],r[ix['Status_Sigeo']]),TMAP.get(r[ix['Tipo_Int']],r[ix['Tipo_Int']]),'',
      (r[ix['local_inst']] or '').upper(),r[ix['CHI_Prog']] or 0,r[ix['Hora_Inicio']],r[ix['Hora_Fim']],'FCU · '+emp,emp,'FCU']); extra+=1
print('progs sinteticas FCU',extra)
needed={r[0] for r in rows}
# cadastro por projeto (linha FCU mais recente)
proj={}
for r in fcu:
    p=r[0]; cur=proj.get(p)
    if cur is None or (r[13] or '')>=(cur[13] or ''): proj[p]=r
pcols=['Ordem_Sigeo','nota','familia_regen','denominacao','polo','Area','Empreiteira_Contratos','circuito','conjunto','status','Stt Resumo','KPI Projeto','Status_Reprogramação','camada','Ups_Plan','Ups_Exec_Projeto','local_inst','Latitude','Longitude']
projects={p:[r[ix[c]] for c in pcols] for p,r in proj.items()}
print('projetos com FCU',len(projects),'de',len(needed),'(FCU sel inclui',len({r[0] for r in fcu}),')')

eq=pd.read_excel(f'{D}/{EQ}',sheet_name='Equipamentos',dtype={'Número do Equipamento':str,'Circuito':str})
eqmap={}
for c,ci,la,lo in zip(eq['Número do Equipamento'],eq['Circuito'],eq['Latitude'],eq['Longitude']):
    if pd.isna(la) or pd.isna(lo): continue
    eqmap[s(c).upper()]=[round(float(la),6),round(float(lo),6),s(ci)]
used=set(t for r in rows for t in tok(r[5]))|set(r[ix['local_inst']].upper() for r in fcu if r[ix['local_inst']])
coords={t:eqmap[t] for t in used if t in eqmap}
print('eq tokens',len(used),'com coord',len(coords))
# cobertura por projeto
cov=0
for p in needed:
    eqs=[t for r in rows if False for t in []]
pe=defaultdict(Counter)
for r in rows:
    for t in tok(r[5]): pe[r[0]][t]+=1
for p in needed:
    pr=projects.get(p)
    if pr and pr[-2] is not None and pr[-1] is not None: cov+=1; continue
    if any(t in coords for t in pe[p]): cov+=1
print('projetos com localizacao',cov,'de',len(needed))
dates=sorted(r[1] for r in rows if r[1])
meta={'generated':dt.datetime.now().strftime('%Y-%m-%dT%H:%M'),'periodo':[dates[0],dates[-1]],
 'fontes':{k:sum(1 for r in rows if r[10]==k and r[11]=='SIGEO') for k in FILES},'fcuOnly':extra,'fcuRows':len(fcu),'fcuTotal':len(F),'eqBase':'12/06/2026','eqTotal':len(eqmap),
 'arquivos':['Start_16_11_2026.xlsx','Conecta_16_11_2026.xlsx','Engelmig_16_11.xlsx','Fcu_execução_18_11_2026.xlsx','Equipamentos_Buscape_18_11.xlsx (base 12/06/2026)']}
data={'meta':meta,'progCols':['Projeto','Data Programacao','Status Programacao','Tipo Intervencao','Numero PowerON','Equipamentos','CHI','Horario Inicio','Horario Fim','Contratada','Parceira','Fonte'],
 'prog':rows,'fcuCols':fcuCols,'fcu':fcu,'projCols':pcols,'projects':projects,'coords':coords}
with open(OUT,'w',encoding='utf-8') as fh:
    fh.write('window.FCU_DATA='); json.dump(data,fh,ensure_ascii=False,separators=(',',':')); fh.write(';\n')
print('ok')
