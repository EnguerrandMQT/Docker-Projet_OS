FROM node:latest

WORKDIR /app

COPY package*.json .

RUN npm install
RUN npm install -g nodemon

COPY . .

EXPOSE 4200

CMD ["nodemon", "index.js"]