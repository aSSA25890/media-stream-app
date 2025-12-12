FROM node:18-alpine

# Устанавливаем WireGuard
RUN apk add --no-cache wireguard-tools iptables qrencode

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000 51820/udp

CMD ["node", "server.js"]
