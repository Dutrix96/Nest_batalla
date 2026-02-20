# 🧙‍♂️ Batalla Friki

Aplicación Full-Stack con:

- 🧠 Backend: NestJS + Prisma + PostgreSQL
- ⚔️ Sistema de batallas PVE y PVP
- 🔐 Autenticación JWT
- 🌐 Frontend: React + Vite + Nginx
- 🐳 Orquestación con Docker Compose
- 🧪 Tests E2E con Supertest

📦 Requisitos

Instalar:

Docker Desktop (Windows / Mac)
o
Docker + Docker Compose (Linux)

Comprobar instalación:

docker --version
docker compose version

🚀 Instalación en 1 solo comando

Desde la raíz del proyecto:

docker compose up --build

Esto automáticamente:

- Construye el backend (yarn install + build)
- Construye el frontend (npm install + build)
- Levanta PostgreSQL
- Ejecuta:
  prisma generate
  prisma migrate deploy
  prisma db seed
- Arranca NestJS
- Sirve el frontend con Nginx

🌍 Accesos

Frontend → http://localhost:5173
Backend → http://localhost:3000

🧪 Ejecutar Tests E2E (desde Docker)

Con el sistema levantado:

docker exec -it batalla_friki_backend sh -c "yarn test:e2e"

Resultado esperado:

Test Suites: 4 passed
Tests: 15 passed

🧪 Ejecutar Tests en local (sin backend Docker)

1️⃣ Levantar solo la base de datos
docker compose up -d db

2️⃣ Ir al backend
cd backend

3️⃣ Instalar dependencias
corepack enable
yarn install

4️⃣ Ejecutar migraciones
yarn prisma generate
yarn prisma migrate deploy

5️⃣ Ejecutar tests
yarn test:e2e

🔑 Configuración de DATABASE_URL

Dentro de Docker:
postgresql://postgres:postgres@db:5432/batalla_friki

En local:
postgresql://postgres:postgres@localhost:5432/batalla_friki

Si no se cambia correctamente, los tests fallarán.

🧹 Reset completo del sistema

docker compose down -v
docker compose up --build

Esto elimina completamente la base de datos.

📂 Estructura del proyecto

backend/
  ├── src/
  ├── prisma/
  ├── test/
  ├── DockerFile
  └── package.json

frontend/
  ├── src/
  ├── DockerFile
  └── package.json

docker-compose.yml
README.md

🛠 Tecnologías usadas

Backend:
- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT
- Jest
- Supertest

Frontend:
- React 18
- Vite
- Tailwind
- Socket.io

Infraestructura:
- Docker
- Docker Compose
- Nginx

👨‍💻 Flujo recomendado para corrección académica

git clone <repo>
cd <repo>
docker compose up --build

Luego:

docker exec -it batalla_friki_backend sh -c "yarn test:e2e"