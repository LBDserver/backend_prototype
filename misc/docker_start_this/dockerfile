FROM node:latest

RUN mkdir -p /usr/src/backend
WORKDIR /usr/src/backend

COPY . /usr/src/backend
RUN npm install -g ungit
RUN npm config set unsafe-perm true && npm ci
RUN npm install ts-node --save-dev
RUN npm install typescript -g 
RUN npm install typescript --save-dev
RUN npm install

RUN npm install lbd-server



EXPOSE 5000

CMD ["npm", "run", "dev"]

