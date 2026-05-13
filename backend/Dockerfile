FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev \
  && npm cache clean --force

COPY . .

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
  && chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 5000

CMD ["npm", "start"]
