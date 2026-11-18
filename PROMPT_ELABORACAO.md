# Prompt de elaboração do site — Projetos FCU · SIGEO · SAP (Enel Brasil)

Este documento registra a especificação usada para construir e atualizar o site, para que qualquer pessoa (ou o Claude) possa refazê-lo ou atualizá-lo com novas planilhas.

## 1. Objetivo
Criar um site **bonito, profissional e em cores claras**, com a **logomarca da Enel Brasil** e **relógio e data on-line** (horário de Brasília), publicado no GitHub Pages em
`https://gilmar655.github.io/Projetos_FCU_Sigeo_executados/` (repositório `Gilmar655/Projetos_FCU_Sigeo_executados`, branch `main`, pasta raiz).

O site reúne os projetos das parceiras **Start Engenharia, Conecta e Engelmig**, com o **histórico completo de todas as programações (SIGEO e FCU)**, **ocorrências e comentários da FCU**, **histórico SAP** e a **geolocalização de todos os equipamentos** de cada projeto, com links para **Google Maps e Waze**.

## 2. Arquivos de entrada (analisar 100% das informações)
| Arquivo | Conteúdo | Chave de associação |
|---|---|---|
| `Start_DD_MM_AAAA.xlsx`, `Conecta_DD_MM_AAAA.xlsx`, `Engelmig_DD_MM.xlsx` | Programações SIGEO das parceiras: Projeto, Data Programacao, Status Programacao, Tipo Intervencao, Numero PowerON, Equipamentos, Horario Inicio, Horario Fim, Contratada | **Projeto** (referência principal) |
| `Fcu_execução_DD_MM_AAAA.xlsx` | FCU – Ferramenta de Controle Unificado (40 colunas): status, família, denominação, polo, área, circuito, motivo de cancelamento/parcial, agrupamento, **comentário**, reprogramação, Status PO, camada, latitude/longitude, local de instalação, Hora_Inicio/Hora_Fim | **Projeto** + Data_Programação |
| `Planilha_FCU_SAP_DD_MM.XLSX` | Histórico SAP por projeto: Denominação, Tip.projeto, Status, Data Conclusão (total) de Obra, Data Inventário (Executor), Usuário Inventário Execução, Data Conciliação de Inventário, Contrato, Local de instalação, Regional, Inventário Aprovado, Data de Energização | **Definição do projeto** = Projeto |
| `Equipamentos_Buscape_DD_MM.xlsx` | Base Buscapé (258 mil equipamentos): Número do Equipamento, Circuito, Latitude, Longitude | **Número do equipamento** |

**Bases de referência:** SIGEO e FCU. Todas as demais planilhas são associadas a elas pelo código do **Projeto**. Os equipamentos são associados pelo número (campo *Equipamentos* do SIGEO, *local_inst* da FCU e *Local de instalação* do SAP).

## 3. Regras de escopo (exclusões)
- **Start** — excluir os projetos de **Manutenção de Redes e Linhas Aéreas** (lista em `tools/exclusoes_start_manutencao.txt`; projetos com denominação FCU iniciando em `MA_` também são excluídos). Base atual: 154 projetos / 287 programações removidas.
- **Conecta** — excluir **Poda de Árvores** (contratadas "Conecta Poda …" e "ZZOUT-Conecta Poda"). Base atual: 9.253 programações removidas.
- As exclusões valem também para os registros FCU e SAP desses projetos e são aplicadas automaticamente nas importações feitas pelo site.
- **Não exibir CHI** (CHI programado total foi retirado do site).
- Projetos das parceiras que existem só na FCU (sem programação SIGEO) entram com fonte "FCU".

## 4. Estrutura do site
1. **Cabeçalho**: logomarca Enel Brasil, título, relógio e data on-line, menu (Visão geral, Parceiras, Mapa, Análises, Lista de projetos) e botões **Consultar**, **Importar Excel**, **Exportar Excel**.
2. **Filtros**: pesquisa livre (projeto, PowerON, equipamento, local de instalação, nota, ordem, contrato, circuito, descrição), parceira, contratada, status, tipo de intervenção, polo, família FCU, região, período (de/até), com/sem coordenada.
3. **Indicadores**: projetos, programações, executadas, parciais, canceladas, em aberto, efetividade, projetos com histórico SAP (e ENTE), ocorrências FCU, georreferenciados.
4. **Cartões das parceiras** (clicáveis para filtrar).
5. **Mapa Google Maps** (ruas, híbrido, satélite) + OpenStreetMap, agrupamento de pontos, cor por último status ou parceira, popups com **Google Maps, Waze e Street View**.
6. **Análises**: evolução mensal, resultado por parceira, status, motivos de cancelamento/parcial (FCU), status SAP, família.
7. **Lista de projetos (parte inferior)** com abas: Projetos · Programações · Registros FCU · Ocorrências e comentários · Histórico SAP — ordenação, busca, paginação e exportação.

## 5. Ao clicar em cada projeto (histórico)
- **Cadastro**: família, denominação, polo/área, região, circuito, conjunto, nota, ordem SIGEO, status FCU, Stt resumo, KPI, reprogramação, camada, UPS.
- **Histórico SIGEO × FCU**: uma linha por data de programação mostrando lado a lado o **SIGEO** (status, **data/hora de início e término**, tipo, PowerON, equipamentos) e a **FCU** (status, **data/hora de início e término**, motivo/agrupamento, comentário). Término da FCU após a meia-noite é levado para o dia seguinte.
- **Ocorrências e comentários FCU**: linha do tempo com motivo de cancelamento/execução parcial, agrupamento, comentário, reprogramação e Status PO.
- **Histórico SAP**: dados do SAP e linha do tempo (energização, conclusão de obra, inventário do executor, conciliação).
- **Equipamentos e localização**: todos os equipamentos do projeto (SIGEO, FCU e SAP) com coordenadas Buscapé, mini-mapa e links Google Maps/Waze para cada um. Localização do projeto: coordenada da FCU; na falta, o equipamento mais programado.
- **Exportar histórico completo (Excel)** e **link direto** `#projeto=CODIGO`.

## 6. Importar / Exportar
- **Importar Excel**: reconhece automaticamente SIGEO das parceiras, FCU, Planilha FCU SAP e Equipamentos Buscapé; aplica as exclusões; salva no navegador (IndexedDB); botão "Restaurar base publicada".
- **Exportar Excel**: recorte atual ou base completa com abas Resumo, Projetos, Histórico SIGEO × FCU, Programações, FCU, SAP, Equipamentos (links Google Maps/Waze clicáveis) e Filtros; CSV; modelo de importação; `base.js` para publicar.

## 7. Atualização da base publicada
`python tools/build_data.py <pasta_com_as_planilhas> data/base.js` (procura os arquivos pelos nomes `*Start_*`, `*Conecta_*`, `*Engelmig_*`, `*Fcu_execu*`, `*FCU_SAP*`, `*Equipamentos_Buscape*`) e publicar o novo `data/base.js` no repositório.
Alternativa sem Python: importar as planilhas no site → Exportar → **base.js** → substituir `data/base.js`.

## 8. Tecnologia
Site estático (HTML/CSS/JS), sem servidor. Bibliotecas locais em `vendor/`: Chart.js 4.4.4, Leaflet 1.9.4 + MarkerCluster, SheetJS 0.18.5. Paleta: parceiras Start #2a78d6, Conecta #eb6834, Engelmig #1baf7a; status Executado #0ca30c, Parcial #fab219, Cancelado #d03b3b, Em aberto #7b8794.

## Histórico de versões
- **18/11/2026 v1** — site inicial com SIGEO das três parceiras, FCU, Buscapé, mapa, filtros, importação/exportação.
- **18/11/2026 v2** — inclusão da Planilha FCU SAP no histórico; histórico SIGEO × FCU com início e término de cada programação; ocorrências e comentários FCU por projeto; geolocalização de todos os equipamentos (SIGEO/FCU/SAP); exclusão de Start manutenção de linhas e Conecta poda; remoção do CHI.
