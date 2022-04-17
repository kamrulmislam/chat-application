FROM node:12.10-alpine
WORKDIR /home/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]