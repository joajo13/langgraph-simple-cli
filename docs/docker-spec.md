# Docker Specification

## Overview

Configuración de Docker para ejecutar el agente en contenedor.

---

## Archivos

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Compilar TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Directorio para configuración persistente
RUN mkdir -p /root/.research-assistant

# Variables de entorno
ENV NODE_ENV=production

# Entry point
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  research-assistant:
    build: .
    container_name: research-assistant
    stdin_open: true      # -i: Mantener stdin abierto
    tty: true             # -t: Asignar pseudo-TTY
    volumes:
      - config-data:/root/.research-assistant
    environment:
      - NODE_ENV=production
    restart: unless-stopped

volumes:
  config-data:
    name: research-assistant-config
```

### .dockerignore

```
node_modules
dist
.git
.gitignore
*.md
.env
.env.local
docs
```

---

## Comandos

### Desarrollo

```bash
# Build de la imagen
docker-compose build

# Ejecutar en modo interactivo
docker-compose run --rm research-assistant

# O con docker directo
docker run -it --rm \
  -v research-assistant-config:/root/.research-assistant \
  research-assistant
```

### Producción

```bash
# Build y ejecutar
docker-compose up --build -d

# Attach al contenedor
docker attach research-assistant

# Detach sin parar: Ctrl+P, Ctrl+Q
```

### Mantenimiento

```bash
# Ver logs
docker-compose logs -f

# Reconstruir
docker-compose build --no-cache

# Limpiar todo
docker-compose down -v
```

---

## Persistencia

### Volumen de Configuración

La configuración (API keys) se persiste en el volumen `config-data`:

```
/root/.research-assistant/
└── config.json
```

Contenido de `config.json`:
```json
{
  "openaiApiKey": "sk-...",
  "tavilyApiKey": "tvly-...",
  "createdAt": "2024-01-27T10:00:00Z",
  "updatedAt": "2024-01-27T10:00:00Z"
}
```

### Backup de Configuración

```bash
# Exportar config
docker cp research-assistant:/root/.research-assistant/config.json ./backup-config.json

# Importar config
docker cp ./backup-config.json research-assistant:/root/.research-assistant/config.json
```

---

## Modo TTY Interactivo

Para que la consola funcione correctamente:

1. **stdin_open: true** - Permite input del usuario
2. **tty: true** - Habilita terminal TTY para readline
3. **docker run -it** - Flags equivalentes en CLI

### Troubleshooting

Si el input no funciona:
```bash
# Verificar que tiene TTY
docker exec -it research-assistant /bin/sh

# Re-attach con TTY explícito
docker attach --sig-proxy=false research-assistant
```

---

## Health Check (Opcional)

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "console.log('OK')" || exit 1
```

---

## Multi-Platform Build

```bash
# Build para múltiples arquitecturas
docker buildx build --platform linux/amd64,linux/arm64 -t research-assistant .
```
