# Imagen del frontend (Next.js)

# instala y compila
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Dirección de la API, Next.js la incorpora al compilar
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# imagen final 
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]