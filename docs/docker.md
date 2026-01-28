# Ejecución con Docker

El proyecto está completamente preparado para ejecutarse dentro de un contenedor Docker, lo que garantiza un entorno consistente y facilita el despliegue.

## Requisitos

- Docker instalado.
- Docker Compose.

---

## Uso Rápido

### 1. Construir y ejecutar
```bash
docker-compose run --rm research-assistant
```
*Nota: Usamos `run --rm` para que la terminal sea interactiva y puedas interactuar con el Wizard de configuración y el agente.*

### 2. Comandos útiles
- **Detener todo**: `docker-compose down`
- **Ver logs**: `docker-compose logs -f`
- **Reconstruir**: `docker-compose build --no-cache`

---

## Persistencia

Docker utiliza un volumen llamado `research-assistant-config` para persistir tus API Keys. Esto significa que aunque borres el contenedor, tus configuraciones se mantendrán la próxima vez que inicies.

Si necesitas hacer un backup de tu configuración:
```bash
docker cp research-assistant-config:/root/.research-assistant/config.json ./my_backup.json
```

---

## Detalles del Contenedor

- **Base**: `node:20-alpine` (ligero y seguro).
- **Modo**: La imagen utiliza `node dist/index.js` en producción para máximo rendimiento.
- **TTY**: El archivo `docker-compose.yml` está configurado con `stdin_open: true` y `tty: true` para que la consola readline funcione correctamente.
