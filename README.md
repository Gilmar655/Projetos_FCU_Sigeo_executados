# Projetos FCU · SIGEO · SAP — Enel Brasil

Site estático (GitHub Pages) com as programações, o histórico e a localização dos projetos das parceiras **Start Engenharia**, **Conecta** e **Engelmig** — Enel Brasil Grids · Gestão de Programação.

**Endereço:** https://gilmar655.github.io/Projetos_FCU_Sigeo_executados/

## O que o site mostra
- Cabeçalho com logomarca Enel Brasil, relógio e data on-line (horário de Brasília).
- Filtros: pesquisa livre, parceira, contratada, status, tipo de intervenção, polo, família FCU, região, período e localização.
- Indicadores: projetos, programações, executadas, parciais, canceladas, em aberto, efetividade, histórico SAP, ocorrências FCU e georreferenciamento.
- Cartões por parceira (clique para filtrar).
- Mapa Google Maps (ruas, híbrido, satélite) + OpenStreetMap, com agrupamento, cor por status ou parceira e links **Google Maps, Waze e Street View**.
- Análises: evolução mensal, resultado por parceira, status, motivos de cancelamento/parcial (FCU), tipo de intervenção e família.
- **Consultar**: busca por projeto, PowerON, equipamento, nota, ordem SIGEO, circuito ou descrição.
- Histórico do projeto (clique no código): SIGEO × FCU lado a lado com início e término de cada programação, ocorrências e comentários FCU, histórico SAP, todos os equipamentos geolocalizados (Google Maps/Waze) e exportação Excel. Link direto: `#projeto=CODIGO`.
- Lista de projetos na parte inferior (abas Projetos / Programações / Registros FCU), com ordenação, paginação e exportação.

## Importar e exportar
- **Importar Excel**: reconhece automaticamente as planilhas SIGEO das parceiras, a FCU, a Planilha FCU SAP e a base Equipamentos Buscapé, aplicando as exclusões de escopo. A base importada fica salva no navegador (IndexedDB); “Restaurar base publicada” volta ao original.
- **Exportar Excel**: recorte atual, base completa, CSV, modelo de importação e `base.js` para publicar.

## Atualizar a base publicada (para todos)
1. Importe as planilhas novas no site.
2. Exportar → **base.js para publicar no GitHub**.
3. Substitua `data/base.js` neste repositório.

Ou rode `python tools/build_data.py <pasta_das_planilhas> data/base.js`.

## Base atual (18/11/2026)
- SIGEO: Start_16_11_2026, Conecta_16_11_2026, Engelmig_16_11 — 6.168 programações após exclusões (Start · Manutenção de Redes e Linhas Aéreas: 287; Conecta · Poda de Árvores: 9.253).
- FCU: Fcu_execução_18_11_2026 — 6.235 registros das parceiras (de 29.164); 156 programações de projetos só na FCU.
- SAP: Planilha_FCU_SAP_18_11 — 2.692 projetos com histórico SAP.
- Equipamentos: Equipamentos_Buscape_18_11 (base 12/06/2026) — 3.283 de 3.660 equipamentos citados geolocalizados; 99,2% dos projetos no mapa.
- Total: 2.838 projetos · 6.324 programações. CHI não é exibido.

Especificação completa: [PROMPT_ELABORACAO.md](PROMPT_ELABORACAO.md).

Bibliotecas incluídas em `vendor/` (sem CDN): Chart.js 4.4.4 · Leaflet 1.9.4 + MarkerCluster · SheetJS 0.18.5.
