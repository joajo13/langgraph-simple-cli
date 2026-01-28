# Research Assistant - Documentation Index

## Project Overview

Agente de investigación con LangGraph, multi-LLM, 5 tools y Docker.

---

## Implementation Checklist

### Phase 1: Project Setup

- [ ] **1.1** Inicializar npm project
  ```bash
  npm init -y
  ```
- [ ] **1.2** Instalar dependencias → Ver [architecture.md](./architecture.md#dependencias-clave)
- [ ] **1.3** Configurar TypeScript (`tsconfig.json`)
- [ ] **1.4** Crear estructura de carpetas → Ver [architecture.md](./architecture.md#estructura-del-proyecto)

---

### Phase 2: Config System

- [ ] **2.1** Crear `src/config/config-store.ts` → Ver [api-keys-spec.md](./api-keys-spec.md#config-storeets)
- [ ] **2.2** Crear `src/config/validators.ts` → Ver [api-keys-spec.md](./api-keys-spec.md#validatorsts)
- [ ] **2.3** Crear `src/config/setup-wizard.ts` → Ver [api-keys-spec.md](./api-keys-spec.md#setup-wizardts)

---

### Phase 3: LLM Factory

- [ ] **3.1** Crear `src/llm/llm-factory.ts` → Ver [llm-providers-spec.md](./llm-providers-spec.md#llm-factory)

---

### Phase 4: Tools

- [ ] **4.1** Crear `src/tools/calculator.tool.ts` → Ver [tools-spec.md](./tools-spec.md#3-calculator-tool)
- [ ] **4.2** Crear `src/tools/datetime.tool.ts` → Ver [tools-spec.md](./tools-spec.md#4-datetime-tool)
- [ ] **4.3** Crear `src/tools/wikipedia.tool.ts` → Ver [tools-spec.md](./tools-spec.md#2-wikipedia-tool)
- [ ] **4.4** Crear `src/tools/web-search.tool.ts` → Ver [tools-spec.md](./tools-spec.md#1-web-search-tool)
- [ ] **4.5** Crear `src/tools/url-reader.tool.ts` → Ver [tools-spec.md](./tools-spec.md#5-url-reader-tool)
- [ ] **4.6** Crear `src/tools/index.ts` → Ver [tools-spec.md](./tools-spec.md#tool-registry)

---

### Phase 5: Graph & Nodes

- [ ] **5.1** Crear `src/state.ts` → Ver [graph-spec.md](./graph-spec.md#state-definition)
- [ ] **5.2** Crear `src/nodes/router.node.ts` → Ver [graph-spec.md](./graph-spec.md#1-router-node)
- [ ] **5.3** Crear `src/nodes/tool-executor.node.ts` → Ver [graph-spec.md](./graph-spec.md#2-tool-executor-node)
- [ ] **5.4** Crear `src/nodes/generator.node.ts` → Ver [graph-spec.md](./graph-spec.md#3-generator-node)
- [ ] **5.5** Crear `src/graph.ts` → Ver [graph-spec.md](./graph-spec.md#graph-definition)

---

### Phase 6: CLI

- [ ] **6.1** Crear `src/cli/renderer.ts` → Ver [cli-spec.md](./cli-spec.md#rendererts)
- [ ] **6.2** Crear `src/cli/commands.ts` → Ver [cli-spec.md](./cli-spec.md#comandos-slash)
- [ ] **6.3** Crear `src/cli/console.ts` → Ver [cli-spec.md](./cli-spec.md#consolets)

---

### Phase 7: Entry Point

- [ ] **7.1** Crear `src/index.ts` (main entry)

---

### Phase 8: Docker

- [ ] **8.1** Crear `Dockerfile` → Ver [docker-spec.md](./docker-spec.md#dockerfile)
- [ ] **8.2** Crear `docker-compose.yml` → Ver [docker-spec.md](./docker-spec.md#docker-composeyml)
- [ ] **8.3** Crear `.dockerignore` → Ver [docker-spec.md](./docker-spec.md#dockerignore)

---

### Phase 9: Final

- [ ] **9.1** Crear `README.md` del proyecto
- [ ] **9.2** Crear `.env.example`

---

### Phase 10: Testing & Verification ⚠️ REQUIRED

> **IMPORTANTE**: No se considera completo hasta que todos los tests pasen.

- [ ] **10.1** Test 1: Build Success → Ver [testing-spec.md](./testing-spec.md#test-1-build-success)
- [ ] **10.2** Test 2: Setup Wizard → Ver [testing-spec.md](./testing-spec.md#test-2-setup-wizard)
- [ ] **10.3** Test 3: Tools Individuales → Ver [testing-spec.md](./testing-spec.md#test-3-tools-individuales)
- [ ] **10.4** Test 4: Conversation Flow → Ver [testing-spec.md](./testing-spec.md#test-4-conversation-flow)
- [ ] **10.5** Test 5: CLI Commands → Ver [testing-spec.md](./testing-spec.md#test-5-cli-commands)
- [ ] **10.6** Test 6: Docker → Ver [testing-spec.md](./testing-spec.md#test-6-docker)
- [ ] **10.7** Test 7: Provider Switch → Ver [testing-spec.md](./testing-spec.md#test-7-provider-switch)

**Si algún test falla**: Volver a la fase correspondiente, corregir, y re-testear.

---

## Document Reference

| Doc | Purpose |
|-----|---------|
| [architecture.md](./architecture.md) | Project structure |
| [llm-providers-spec.md](./llm-providers-spec.md) | Multi-LLM support |
| [tools-spec.md](./tools-spec.md) | 5 tools specs |
| [graph-spec.md](./graph-spec.md) | LangGraph workflow |
| [cli-spec.md](./cli-spec.md) | Console UI |
| [docker-spec.md](./docker-spec.md) | Docker setup |
| [api-keys-spec.md](./api-keys-spec.md) | Config system |
| [testing-spec.md](./testing-spec.md) | **Verification tests** |
