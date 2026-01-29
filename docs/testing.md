# Suite de Pruebas y Verificación

Para asegurar la estabilidad del **Simple CLI**, contamos con una serie de pruebas de validación que cubren desde la compilación hasta el flujo de conversación completo.

## Pruebas Automáticas

### 1. Build & Lint
Verifica que el código TypeScript sea válido y no tenga errores de sintaxis.
```bash
npm run build
```

### 2. Estructura de Configuración
Asegura que el sistema pueda leer y validar el archivo `config.json` correctamente.

---

## Suite de Pruebas Manuales (Checklist)

Para una verificación completa antes de un release, se recomienda seguir este flujo:

- [ ] **Setup Wizard**: Borrar `config.json` y verificar que el wizard se inicie y valide las keys correctamente.
- [ ] **Comandos CLI**: Ejecutar `/help`, `/tools` y `/config` para verificar su funcionamiento.
- [ ] **Prueba de Tools**:
  - Preguntar la hora en una ciudad remota.
  - Pedir un cálculo matemático complejo.
  - Solicitar un resumen de un tema en Wikipedia.
- [ ] **Flujo de Razonamiento**: Hacer una pregunta que requiera 2 herramientas simultáneas (ej. "Busca qué es la inflación y calcula el 10% de 500").
- [ ] **Docker**: Verificar que `docker-compose run` inicie correctamente y persista la configuración.

---

## Entorno de Pruebas

Si deseas ejecutar pruebas sin afectar tu configuración personal, puedes definir un archivo de entorno dedicado o usar el flag `--config` (próximamente) para apuntar a un archivo JSON de prueba.
