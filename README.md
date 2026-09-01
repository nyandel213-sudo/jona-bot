# 🎵 Jona Bot — Railway Edition

Bot de música para Discord optimizado para Railway.app.  
Usa `play-dl` en vez de `ytdl-core` para funcionar bien en servidores cloud.

---

## ⚡ Cómo hacer deploy en Railway

### 1. Sube el código a GitHub
1. Crea un repositorio nuevo en GitHub (puede ser privado)
2. Sube todos estos archivos

### 2. Crea un nuevo proyecto en Railway
1. Ve a [railway.app](https://railway.app) y haz login
2. Haz click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu repositorio

### 3. Agrega las variables de entorno
En Railway → tu proyecto → **Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DISCORD_TOKEN` | Tu token del bot |
| `GENIUS_TOKEN` | Tu token de Genius API |

> ⚠️ Ya NO necesitas Spotify Client ID/Secret. `play-dl` maneja links de Spotify automáticamente.

### 4. Deploy
Railway detecta automáticamente el `Procfile` y el `nixpacks.toml` (que instala ffmpeg).  
Haz click en **Deploy** y listo. 🚀

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

## 🔧 Cambios respecto a la versión anterior

- ❌ Quitado: `ytdl-core`, `spotify-web-api-node`, `yt-search`
- ✅ Agregado: `play-dl` (maneja YouTube + Spotify + búsquedas)
- ✅ Agregado: `nixpacks.toml` (instala ffmpeg en Railway automáticamente)
- ✅ Agregado: `Procfile` para Railway
