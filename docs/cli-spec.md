# CLI Specification

## Overview

Consola interactiva para comunicarse con el agente.

---

## Diseño Visual

### Header de Inicio

```
╭──────────────────────────────────────────────╮
│  🔬 Research Assistant v1.0                  │
│  Powered by LangGraph + OpenAI               │
├──────────────────────────────────────────────┤
│  Tools: web_search, wikipedia, calculator,   │
│         datetime, url_reader                 │
│  Type /help for commands                     │
╰──────────────────────────────────────────────╯
```

### Interacción Normal

```
You: ¿Cuál es la población de Argentina?

🔧 Ejecutando tools...
   ├─ 🌐 web_search: "población Argentina 2024"
   └─ 📚 wikipedia: "Argentina"

🤖 Assistant:
   Según los datos más recientes, Argentina tiene una población
   de aproximadamente 46.6 millones de habitantes...

You: _
```

### Estados Visuales

| Estado | Indicador |
|--------|-----------|
| Esperando input | `You: _` (cursor parpadeante) |
| Pensando | Spinner animado |
| Ejecutando tools | Lista de tools con íconos |
| Respondiendo | Texto streaming |

---

## Comandos Slash

| Comando | Descripción | Implementación |
|---------|-------------|----------------|
| `/help` | Muestra ayuda | Lista comandos y tools |
| `/config` | Reconfigurar API keys | Ejecuta setup wizard |
| `/tools` | Lista tools activas | Muestra status de cada tool |
| `/clear` | Limpia pantalla | `console.clear()` |
| `/exit` | Salir | `process.exit(0)` |

### Salida de `/help`

```
📖 Comandos disponibles:

  /help    - Muestra esta ayuda
  /config  - Reconfigurar API keys
  /tools   - Ver tools disponibles
  /clear   - Limpiar pantalla
  /exit    - Salir

🔧 Tools activas:
  ✅ web_search  - Búsqueda web (Tavily)
  ✅ wikipedia   - Wikipedia API
  ✅ calculator  - Cálculos matemáticos
  ✅ datetime    - Fecha y hora
  ✅ url_reader  - Leer URLs
```

### Salida de `/tools`

```
🔧 Estado de Tools:

  ✅ web_search   - Búsqueda web (Tavily)
  ✅ wikipedia    - Wikipedia API
  ✅ calculator   - Cálculos matemáticos
  ✅ datetime     - Fecha y hora
  ❌ url_reader   - Requiere OpenAI API key
```

---

## Implementación

### Archivos

- `src/cli/console.ts` - REPL principal
- `src/cli/renderer.ts` - Renderizado con colores
- `src/cli/commands.ts` - Handlers de comandos slash

### Console.ts

```typescript
import * as readline from 'readline';
import { Renderer } from './renderer';
import { handleCommand } from './commands';
import { AgentApp } from '../graph';

export class Console {
  private rl: readline.Interface;
  private renderer: Renderer;
  private agent: AgentApp;

  constructor(agent: AgentApp) {
    this.agent = agent;
    this.renderer = new Renderer();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    this.renderer.printHeader();
    this.prompt();
  }

  private prompt() {
    this.rl.question(this.renderer.getPrompt(), async (input) => {
      await this.handleInput(input.trim());
      this.prompt();
    });
  }

  private async handleInput(input: string) {
    if (!input) return;
    
    // Comandos slash
    if (input.startsWith('/')) {
      await handleCommand(input, this);
      return;
    }
    
    // Consulta al agente
    this.renderer.showThinking();
    const result = await this.agent.run({ 
      messages: [{ role: 'user', content: input }] 
    });
    this.renderer.printResponse(result.response);
  }
}
```

### Renderer.ts

```typescript
import chalk from 'chalk';
import ora from 'ora';

export class Renderer {
  private spinner = ora();

  printHeader() {
    console.log(chalk.cyan('╭──────────────────────────────────────────────╮'));
    console.log(chalk.cyan('│') + chalk.bold('  🔬 Research Assistant v1.0                  ') + chalk.cyan('│'));
    console.log(chalk.cyan('│') + '  Powered by LangGraph + OpenAI               ' + chalk.cyan('│'));
    console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
    console.log();
  }

  getPrompt(): string {
    return chalk.green('You: ');
  }

  showThinking() {
    this.spinner.start(chalk.yellow('Pensando...'));
  }

  showToolExecution(tools: string[]) {
    this.spinner.stop();
    console.log(chalk.yellow('\n🔧 Ejecutando tools...'));
    tools.forEach((tool, i) => {
      const prefix = i === tools.length - 1 ? '└─' : '├─';
      console.log(chalk.gray(`   ${prefix} ${this.getToolIcon(tool)} ${tool}`));
    });
  }

  printResponse(response: string) {
    this.spinner.stop();
    console.log(chalk.blue('\n🤖 Assistant:'));
    console.log(chalk.white(`   ${response}\n`));
  }

  private getToolIcon(tool: string): string {
    const icons: Record<string, string> = {
      web_search: '🌐',
      wikipedia: '📚',
      calculator: '🔢',
      datetime: '🕐',
      url_reader: '📄'
    };
    return icons[tool] || '🔧';
  }
}
```

---

## Colores

| Elemento | Color | Código chalk |
|----------|-------|--------------|
| Bordes | Cyan | `chalk.cyan()` |
| Prompt usuario | Verde | `chalk.green()` |
| Respuesta AI | Azul | `chalk.blue()` |
| Tools | Amarillo | `chalk.yellow()` |
| Errores | Rojo | `chalk.red()` |
| Info secundaria | Gris | `chalk.gray()` |
