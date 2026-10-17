# Emotional Reconstruction Program · Demo fase 1

Demo publicada: https://demos.novagrowth.solutions/emotional-reconstruction/

| Acceso | Para quién | Ruta |
|---|---|---|
| App | La persona (ES / EN / PT) | `#app` |
| Admin | Emilia y Queren: preguntas, reglas, acciones, versículos, crisis | `#admin` (admin@erp.demo / demo) |
| Dashboard | Equipo: uso, retención, embudo, emociones, audiencia | `#dashboard` (equipo@erp.demo / demo) |
| Lab | Dra. Emilia: cruces con χ², patrones en el tiempo, personas por código, exportación CSV / SPSS | `#lab` (investigacion@erp.demo / demo) |

## Cómo está hecho

- **Motor genérico**: el flujo es un grafo de pantallas en datos (`src/lib/content.js`). Cada pantalla guarda una variable, tiene 1–4 opciones con código estable y decide a dónde ir. `@result` muestra el parecer; `@crisis` interrumpe el juego.
- **Reglas**: combinación de respuestas → factor probable → parecer + acción + versículo (`src/lib/engine.js`).
- **Datos**: en modo demo viven en el navegador (`src/lib/store.js`) con la misma forma que `supabase/schema.sql`. Dashboard y Lab suman datos simulados marcados (`src/lib/sim.js`).
- **Versionado**: cada publicación del Admin sube la versión y cada check-in guarda qué versión respondió.

## Comandos

```bash
npm install
npm run dev     # desarrollo
npm test        # motor, protocolo de crisis, reglas y analítica
npm run build   # genera ../emotional-reconstruction/index.html (un solo archivo)
```

## Fase 2 (pendiente)

1. Crear un proyecto Supabase propio del programa y aplicar `supabase/schema.sql`.
2. Cambiar `store.js` por el adaptador de Supabase (Auth anónima para el primer check-in, luego email).
3. Mover el código a un repositorio privado.

Contenido clínico y bíblico: **borrador** del equipo de producto, pendiente de revisión de la Dra. Emilia, de un clínico con licencia (protocolo de crisis) y de un teólogo. Versiones bíblicas en uso: RV1909 / KJV / Almeida (dominio público). Objetivo: NVI / NIV / NVI-PT cuando Biblica otorgue el permiso.
