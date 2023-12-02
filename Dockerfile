FROM node:20-alpine
WORKDIR /usr/src/app

COPY . .

COPY package*.json ./

RUN npm ci

RUN npm run build

CMD ["npm","run","start:pod"]
