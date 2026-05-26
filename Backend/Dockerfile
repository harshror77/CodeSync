FROM node:20-alpine
ENV NODE_ENV=production

WORKDIR /app

RUN chown -R node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .

RUN mkdir -p public/temp

EXPOSE 7000
EXPOSE 1234

CMD ["node","src/index.js"]