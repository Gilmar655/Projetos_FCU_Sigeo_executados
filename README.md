# Projetos FCU · SIGEO Executados — Enel Brasil

Site estático (GitHub Pages) com as programações, o histórico e a localização dos projetos das parceiras **Start Engenharia**, **Conecta** e **Engelmig** — Enel Brasil Grids · Gestão de Programação.

**Endereço:** https://gilmar655.github.io/Projetos_FCU_Sigeo_executados/

## O que o site mostra
- Cabeçalho com logomarca Enel Brasil, relógio e data on-line (horário de Brasília).
- Filtros: pesquisa livre, parceira, contratada, status, tipo de intervenção, polo, família FCU, região, período e localização.
- Indicadores: projetos, programações, executadas, parciais, canceladas, em aberto, efetividade, CHI e georreferenciamento.
- Cartões por parceira (clique para filtrar).
- Mapa Google Maps (ruas, híbrido, satélite) + OpenStreetMap, com agrupamento, cor por status ou parceira e links **Google Maps, Waze e Street View**.
- Análises: evolução mensal, resultado por parceira, status, motivos de cancelamento/parcial (FCU), tipo de intervenção e família.
- **Consultar**: busca por projeto, PowerON, equipamento, nota, ordem SIGEO, circuito ou descrição.
- Histórico do projeto (clique no código): todas as programações, registros FCU, equipamentos com coordenadas, mini-mapa e exportação Excel. Link direto: `#projeto=CODIGO`.
- Lista de projetos na parte inferior (abas Projetos / Programações / Registros FCU), com ordenação, paginação e exportação.

## Importar e exportar
- **Importar Excel**: reconhece automaticamente as planilhas SIGEO das parceiras, a FCU e a base Equipamentos Buscapé. A base importada fica salva no navegador (IndexedDB); “Restaurar base publicada” volta ao original.
- **Exportar Excel**: recorte atual, base completa, CSV, modelo de importação e `base.js` para publicar.

## Atualizar a base publicada (para todos)
1. Importe as planilhas novas no site.
2. Exportar → **base.js para publicar no GitHub**.
3. Substitua `data/base.js` neste repositório.

Ou rode `python tools/build_data.py <pasta_das_planilhas> data/base.js`.

## Base atual
- Programações SIGEO: Start_16_11_2026.xlsx, Conecta_16_11_2026.xlsx, Engelmig_16_11.xlsx (01/01/2026 a 16/11/2026) — 15.708 linhas, todas incluídas.
- FCU: Fcu_execução_18_11_2026.xlsx — 6.267 de 29.164 linhas pertencem às três parceiras; 156 programações de projetos que existem só no FCU foram incluídas (fonte “FCU”).
- Localização: coordenada do projeto no FCU ou, na falta, do equipamento mais programado (Equipamentos_Buscape_18_11.xlsx, base 12/06/2026). 6.579 de 6.737 projetos georreferenciados.

Bibliotecas incluídas em `vendor/` (sem CDN): Chart.js 4.4.4 · Leaflet 1.9.4 + MarkerCluster · SheetJS 0.18.5.
