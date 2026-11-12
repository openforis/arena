# Developer documentation

Documentation for people working on the Arena code. User documentation: the [user manual](user-manual/)
(Open Foris Arena Handbook) and the [Open Foris Arena website](https://openforis.org/tools/arena/).

## Guides

- [Architecture overview](architecture.md): repositories, server runtime, database schemas, webapp.
- [Record editing](record-editing.md): what happens from opening a record to saving, validating and
  broadcasting a node update.
- [Analysis chains](analysis-chain.md): chains, R scripts generation, RStudio and analysis results.
- [Sampling "plot area" and "weight" node defs](sampling-plot-area-node-defs.md) generated for
  analysis chains.
- [Collect import](collect-import.md): how Open Foris Collect surveys and backups are imported.
- [Webapp conventions](webapp-conventions.md): React components, styling, state, i18n.
- [Server requirements](server-requirements.md): software, hardware, storage and infrastructure to host
  Arena (e.g. for a National Forest Inventory).

Elsewhere in the repo: [e2e tests](../test/e2e/README.md), [load tests](../test/load/README.md),
[Kubernetes deployment](../infra/k8s/README.md).

## Other folders

- [api/](api/): OpenAPI (`@swagger`) definitions served by the server at `/api-docs` (logged-in users).
- [superpowers/](superpowers/): design specs and implementation plans written while building a feature.
  They record the decisions made at that time and are not updated afterwards: check the code (or the
  guides above) for the current behavior.
- [user-manual/](user-manual/): the user manual (`.docx`, in English, French and Spanish); its PDFs are attached to every release.
- [whats-new-2026/](whats-new-2026/): "What's new in 2026" presentation, its screenshots and its animated, narrated video.

## Writing docs

- Markdown; diagrams in [Mermaid](https://mermaid.js.org/) (GitHub renders them), not images or PlantUML.
- Explain what the code can't show at a glance: the flow, the reasons, where each step lives. Don't copy
  what goes stale (folder trees, lists of files or store slices).
- Reference code by repository path and function name, not by line number.
- When a change makes a guide wrong, update it in the same PR.
