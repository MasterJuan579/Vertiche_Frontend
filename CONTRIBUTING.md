# Guía para contribuir — Vertiche SortFlow

Esta guía explica cómo trabajar en el monorepo sin pisar a los otros equipos. Léela completa antes de tu primer commit.

---

## El modelo en treinta segundos

Tenemos **cuatro equipos**, cada uno con su propia rama permanente:

- `team-sorter` — equipo del módulo Sorter & Bahía
- `team-rfid` — equipo del módulo RFID (Supervisión)
- `team-dashboard` — equipo del módulo Dashboard
- `team-proveedores` — equipo del módulo Proveedores

Y dos ramas centrales:

- `staging` — integración. Aquí merges todo antes de prod.
- `prod` — producción. Solo recibe merges desde `staging`.

Cada equipo trabaja en su propia rama, abre PR hacia `staging` cuando algo está listo, y eventualmente `staging` se mergea a `prod`. No hay ramas feature individuales — el equipo entero comparte la rama.

---

## Tu día normal: tres comandos

Al **inicio del día**:

```bash
git checkout team-sorter      # tu rama
git pull                      # baja los cambios de tus compañeros + el auto-sync
```

Al **terminar un pedazo de trabajo** (cada 30–60 min, no esperes al final del día):

```bash
git add .
git commit -m "feat: add bay screen layout"
git push
```

Eso es todo. No necesitas crear ramas nuevas para cada cambio.

---

## Cuando algo está listo para integrar

Cuando una feature está terminada y probada en tu rama:

1. Ve a GitHub → New Pull Request.
2. **Source**: `team-sorter` (tu rama). **Target**: `staging`.
3. Pide review a alguien del equipo (o de otro equipo si tocaste código compartido como `packages/`).
4. Cuando se aprueba, **Squash and Merge** desde la UI de GitHub.

⚠️ Nunca mergees directamente a `prod`. `prod` solo recibe merges desde `staging`, y solo el lead del proyecto los hace.

---

## El auto-sync nocturno

Cada noche (08:00 UTC ≈ 02:00 hora de Ciudad de México, lunes a viernes) corre una GitHub Action que hace algo simple pero crítico:

> Toma `staging` y la mergea hacia tu rama `team-sorter`.

¿Por qué? Porque si tu rama no recibe cambios de `staging` por una semana, eventualmente tu PR de regreso a `staging` tendrá conflictos enormes. El auto-sync mantiene las ramas "frescas".

### Caso A: el sync funciona (95% de los días)

No haces nada. Al día siguiente cuando hagas `git pull`, los cambios de los otros equipos ya están en tu rama. Sigues trabajando normalmente.

### Caso B: el sync falla por conflicto (5% de los días)

La Action abre automáticamente un **GitHub Issue** con label `merge-conflict` y `team-sorter`. El issue trae las instrucciones de resolución:

```bash
git checkout team-sorter
git pull --no-rebase origin staging
# VS Code te muestra cada conflicto con botones:
#   - Accept Current (lo tuyo)
#   - Accept Incoming (lo de staging)
#   - Accept Both (combinar)
# Resuelve cada archivo, guarda, y luego:
git add .
git commit -m "Resolve merge from staging"
git push origin team-sorter
```

Toma entre 5 y 30 minutos. **Resuélvelo dentro de 24 horas** — entre más tarde, más cambios nuevos llegan a `staging` y más difícil se vuelve.

---

## Reglas de oro

### 1. Commits pequeños y frecuentes

Mejor 10 commits chiquitos en el día que uno gigante al final. ¿Por qué?

- Si tu laptop se muere, no pierdes nada.
- El auto-sync funciona mejor sobre cambios pequeños.
- Tu equipo entiende mejor el progreso si lo ven en tiempo real.

Commits "work-in-progress" están permitidos:

```bash
git commit -m "WIP: starting bay screen"
git push
```

### 2. Antes de modificar `packages/`, avisa

Los paquetes `design-system` y `mock-data` son **compartidos por los cuatro equipos**. Si cambias algo ahí, todos lo van a sentir.

Antes de tocar `packages/`, abre un canal de Slack/Discord y di:

> "Voy a agregar una prop `accent` al componente `Card` para que rfid pueda usarla. ¿Alguien tiene problema?"

Si alguien dice "espera, ese cambio me rompería algo en sorter", coordínense. Si nadie responde en 30 minutos, procede.

### 3. Nunca borres una rama `team-*`

Las cuatro ramas `team-*` son **permanentes**. No las borres después de mergear a `staging` — la siguiente feature del mismo equipo seguirá viviendo ahí. Tampoco las renombres ni las muevas de lugar.

### 4. Si te confundes, pregunta

Git es intimidante. Mejor preguntar en el chat del equipo que romper algo. Casi nada es irreversible — el `git reflog` recupera commits perdidos por hasta 30 días.

---

## Branch protection (configurar en GitHub)

Estas son las reglas que debe activar el admin del repo, una sola vez:

**Rama `prod`**:
- ☑ Require a pull request before merging
- ☑ Require approvals: **2**
- ☑ Require branches to be up to date before merging
- ☑ Restrict who can push: solo el lead del proyecto

**Rama `staging`**:
- ☑ Require a pull request before merging
- ☑ Require approvals: **1**
- ☑ Require branches to be up to date before merging

**Ramas `team-*`**:
- Sin protección. El equipo dueño puede pushear directo.

---

## Resolución de conflictos en VS Code paso a paso

Cuando hagas `git pull` y aparezcan conflictos:

1. **Abre VS Code** en la raíz del repo.
2. El panel **Source Control** (icono de las tres ramitas) muestra una sección **Merge Changes**. Los archivos con conflicto están listados ahí.
3. Haz click en un archivo. VS Code lo abre con bloques así:

   ```
   <<<<<<< HEAD (tu cambio)
     <div className="rounded-lg">
   =======
     <div className="rounded-xl shadow-md">
   >>>>>>> origin/staging (cambio entrante)
   ```

4. Arriba de cada bloque hay cuatro botones:
   - **Accept Current Change** — te quedas con tu versión
   - **Accept Incoming Change** — te quedas con la versión de `staging`
   - **Accept Both Changes** — pone las dos versiones, una tras otra
   - **Compare Changes** — abre vista de diff lado a lado

5. Elige uno (o edita manualmente si necesitas combinar). Los marcadores `<<<<<<<`, `=======`, `>>>>>>>` deben desaparecer.

6. Cuando todos los archivos estén resueltos:

   ```bash
   git add .
   git commit -m "Resolve merge from staging"
   git push
   ```

Si te quedas atorado, **avisa antes de adivinar**. Resolver mal un conflicto puede romper algo en otro equipo sin que te des cuenta.

---

## ¿Qué pasa si...?

**...tengo cambios sin commitear cuando el auto-sync corre?**
No pasa nada. El auto-sync corre en GitHub, no toca tu laptop. Tus cambios locales están a salvo. Cuando hagas `pull` por la mañana, Git intentará mergear los cambios entrantes con los tuyos. Si chocan, te aparece un conflicto (ver sección arriba). Si no chocan (95% de las veces), todo fluye normal.

**...quiero ver qué cambió el auto-sync en mi rama?**

```bash
git log --since="yesterday" --author="github-actions"
```

**...mi `git push` es rechazado porque la rama está desincronizada?**

```bash
git pull --no-rebase
# resuelve conflictos si los hay
git push
```

**...rompí algo y quiero volver al estado de hace 1 hora?**

```bash
git reflog                    # muestra los últimos commits que has tenido
git reset --hard HEAD@{5}     # te regresas a un commit anterior
```

**...accidentalmente borré una rama `team-*`?**
Abre un issue urgente. El lead la restaura desde el reflog del repo (Git mantiene las refs por 90 días).

---

¿Tienes dudas? Pregunta en el canal del equipo antes de hacer cosas raras con Git. Nadie tiene la respuesta a todo, pero entre los cuatro equipos seguro alguien ya pasó por lo que tú estás pasando.
