FROM docker.io/denoland/deno:1.27.0
RUN echo "deb http://deb.debian.org/debian bullseye-backports main" >> /etc/apt/sources.list \
	&& apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*

WORKDIR /app

COPY deno.jsonc *.ts ./
RUN deno cache *.ts

VOLUME /data
WORKDIR /data

CMD deno run --allow-run --allow-net --allow-env=RSS_FEED --allow-read=/data --allow-write=/data /app/rss-feed-video-downloader.ts
