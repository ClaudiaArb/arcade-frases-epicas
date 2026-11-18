# 🎮 Quote Arcade · Arcade de Frases Épicas

Arcade web donde votas frases de **películas, series y videojuegos**. Cada frase tiene su portada, un ranking **Top 10 en tiempo real**, traducción y un modal que se expande al hacer clic.

> Proyecto 5 · Curso 1015 Programación Orientada a Eventos.

## ✨ Funciones
- **Hero rotativo** con las 5 frases más votadas, y **galería deslizable** (flechas, arrastre o scroll).
- **Clic en una portada → se expande** con la imagen de la película/juego, votos y ranking.
- **Top 10 en vivo**: se reordena al instante cuando votas.
- **CRUD completo con SQLite**: agregar, ver, editar y eliminar frases en cualquier categoría.
- **Votos**: un voto por frase (puedes quitarlo).
- **Traducción**: botón "Español" para traducir todo el sitio, y selector de idioma (ES, EN, PT, FR, IT, DE) en cada frase.
- Búsqueda, filtro por categoría, actividad reciente y diseño responsive (móvil y escritorio).

## 🧱 Tecnologías
TypeScript · Vite · **SQL.js (SQLite en el navegador)** · patrón MVC · CSS puro.

## 🗄️ Base de datos
SQL.js corre SQLite en WebAssembly. La base se exporta a **Base64** y se guarda en `localStorage` (clave `sqlite_db_arcade`) después de cada cambio, así los datos **persisten al recargar**. Tablas: `phrases`, `my_votes`, `activity`. Todas las consultas son parametrizadas (`?`).

> Como la base vive en el navegador de cada persona, los votos no se comparten entre usuarios.


## ▶️ Ejecutar
```bash
npm install
npm run dev      
npm run build    
```

## 🚀 Despliegue
Repositorio en GitHub → importado en Vercel (preset **Vite**, comando `npm run build`, salida `dist`). Cada `git push` redespliega solo.


