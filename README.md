# 🎵 Jona Bot — Railway Edition (DisTube + yt-dlp)

Bot de música para Discord optimizado para Railway.app.
Usa `distube` con el plugin `@distube/yt-dlp` en vez de `play-dl`, porque
`yt-dlp` es mucho más resistente a los bloqueos que YouTube aplica a las IPs
de servidores cloud como Railway.

---

## ⚡ Cómo hacer deploy en Railway

### 1. Sube el código a GitHub
1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Sube todos estos archivos.

### 2. Crea un nuevo proyecto en Railway
1. Ve a [railway.app](https://railway.app) y haz login.
2. Haz click en **"New Project"**.
3. Selecciona **"Deploy from GitHub repo"**.
4. Conecta tu repositorio.

### 3. Agrega las variables de entorno
En Railway → tu proyecto → **Variables**, agrega (mira `_env.example`):

| Variable | Valor |
|----------|-------|
| `DISCORD_TOKEN` | Tu token del bot |
| `GENIUS_TOKEN` | Tu token de Genius API |

> ⚠️ Ya NO necesitas Spotify Client ID/Secret. El plugin `@distube/spotify`
> convierte los links de Spotify en búsquedas de YouTube automáticamente.

### 4. Deploy
Railway detecta automáticamente el `Procfile` y el `nixpacks.toml`
(que instala `ffmpeg` y `python3`). Haz click en **Deploy** y listo. 🚀

---

## 🎮 Comandos

| Comando | Descripción |
|---------|-------------|
| `/play <canción>` | Reproduce por nombre, link YouTube o link Spotify |
| `/skip` | Salta la canción actual |
| `/pause` | Pausa la música |
| `/resume` | Reanuda la música |
| `/stop` | Para todo y borra la cola |
| `/queue` | Muestra la cola de canciones |
| `/np` | Muestra qué suena ahora con botones |
| `/letra` | Muestra la letra de la canción actual |
| `/letra <nombre>` | Busca la letra de cualquier canción |

---

## 🔧 Cambios respecto a la versión con play-dl

- ❌ Quitado: `play-dl` y todo el manejo manual de `AudioPlayer`/`AudioResource`/cola (`client.queues`).
- ✅ Agregado: `distube` como motor de reproducción — maneja conexión de voz,
  cola, streaming y eventos.
- ✅ Agregado: `@distube/yt-dlp` — usa el binario `yt-dlp` (mismo motor que
  usan herramientas de descarga populares) en vez de peticiones directas
  desde Node, por lo que YouTube no lo bloquea tan fácil en Railway.
- ✅ Agregado: `@distube/spotify` — resuelve links de Spotify a búsquedas de
  YouTube sin necesitar credenciales de la API de Spotify.
- Los comandos `/skip`, `/pause`, `/resume`, `/stop`, `/queue`, `/np` ahora
  usan la cola nativa de DisTube (`client.distube.getQueue(guildId)`) en vez
  de la cola manual anterior.

## 🩺 Si sigue sin reproducir en Railway

1. Revisa los logs del deploy — si `@distube/yt-dlp` no pudo descargar el
   binario de `yt-dlp` durante el build, fallará el `npm install`. En ese
   caso, dime el error exacto del log.
2. Verifica que `DISCORD_TOKEN` y `GENIUS_TOKEN` estén bien puestos en
   Railway → Variables.
3. Si YouTube sigue bloqueando incluso con `yt-dlp`, el siguiente paso sería
   pasar a un servidor Lavalink dedicado (más robusto, pero requiere host
   aparte) — avísame y lo armamos.
