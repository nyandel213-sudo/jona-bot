# 🎵 Jona Bot v4 — Railway Edition (DisTube v5 + yt-dlp)

Bot de música para Discord optimizado para Railway.app.

---

## 🎮 Comandos

| Comando | Descripción |
|---------|-------------|
| `/reproducir <canción>` | Reproduce por nombre, link de YouTube o Spotify |
| `/saltar` | Salta la canción actual |
| `/pausar` | Pausa la música |
| `/reanudar` | Reanuda la música |
| `/parar` | Para todo y borra la cola |
| `/cola` | Muestra la cola de canciones |
| `/sonando` | Muestra qué suena ahora con barra de progreso |
| `/letra [canción]` | Muestra la letra de la canción actual o la que busques |

---

## ⚡ Deploy en Railway

### 1. Variables de entorno
En Railway → tu proyecto → **Variables**:

| Variable | Valor |
|----------|-------|
| `DISCORD_TOKEN` | Tu token del bot |
| `GENIUS_TOKEN` | Tu token de Genius API |

### 2. Deploy
Railway detecta automáticamente el `Procfile` y `nixpacks.toml`.
El `nixpacks.toml` instala `ffmpeg`, `python3` y `yt-dlp` en el build.

---

## 🔧 Stack

- **discord.js v14** — librería principal
- **DisTube v5** — motor de reproducción, maneja voz + cola
- **@distube/yt-dlp** — usa el binario yt-dlp para evitar bloqueos de YouTube
- **@distube/spotify** — convierte links de Spotify en búsquedas de YouTube
- **genius-lyrics** — letras de canciones
