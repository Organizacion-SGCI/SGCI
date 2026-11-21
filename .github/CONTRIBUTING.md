# Guía de Contribución - SGCI Parque Tempisque

Para mantener un flujo de trabajo ordenado y garantizar la estabilidad del código, todo el equipo debe seguir el flujo **Feature Branch Workflow**. 

## 1. Nomenclatura de Ramas
Toda nueva rama debe crearse a partir de `main` y seguir este formato:
*   `feature/descripcion-corta` -> Para nuevas funcionalidades (ej. `feature/h10-transferencias`).
*   `bugfix/descripcion-corta` -> Para corrección de errores.
*   `hotfix/descripcion-corta` -> Para corregir errores críticos en producción.
*   `test/descripcion-corta` -> Para pruebas unitarias o E2E.
*   `docs/descripcion-corta` -> Para documentación.

## 2. Flujo de Trabajo (GitHub Flow)
1. **Crear la rama:** `git checkout -b feature/nombre-descriptivo` desde `main`.
2. **Desarrollar:** Hacer commits atómicos y descriptivos.
3. **Push:** Subir la rama al repositorio remoto.
4. **Pull Request (PR):** Abrir un PR hacia `main` utilizando la plantilla oficial.
5. **Code Review:** Al menos 1 miembro del equipo debe revisar y aprobar el PR.
6. **CI Pasado:** El pipeline de GitHub Actions debe pasar en verde.
7. **Merge:** Una vez aprobado y con el CI en verde, se hace el merge a `main`.

## 3. Protección de la Rama `main`
La rama `main` cuenta con reglas de protección configuradas en GitHub para evitar modificaciones accidentales:
*   Requiere Pull Request para hacer merge.
*   Requiere al menos una aprobación.
*   No se permite hacer push directo a `main`.