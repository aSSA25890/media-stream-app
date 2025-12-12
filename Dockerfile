FROM alpine:3.18

# Устанавливаем необходимые пакеты для WireGuard и QR-кодов
RUN apk update && \
    apk add --no-cache \
    wireguard-tools \
    iptables \
    qrencode \
    bash \
    curl

WORKDIR /app

# Копируем скрипты или конфигурации
COPY . .

# Пример команды по умолчанию
CMD ["/bin/bash"]
