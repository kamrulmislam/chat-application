FROM node:12.10-alpine
WORKDIR /home/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mv ./build/index.js ./public/index.js
CMD ./script.sh
