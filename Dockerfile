FROM docker.io/lukechannings/deno:latest AS deno

FROM docker.io/library/debian:bullseye-slim

COPY --from=deno /usr/bin/deno /usr/local/bin/
RUN useradd --uid 1993 --user-group deno \
	&& mkdir -p /deno-dir \
	&& chown deno:deno /deno-dir
ENV DENO_DIR /deno-dir/
ENV DENO_INSTALL_ROOT /usr/local

RUN echo "deb http://deb.debian.org/debian bullseye-backports main" >> /etc/apt/sources.list \
	&& apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y yt-dlp \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*

WORKDIR /app

COPY . ./
RUN deno cache *.ts

VOLUME /data
WORKDIR /data

CMD ["deno", "run", "--allow-run", "--allow-net", "--allow-env=RSS_FEED", "--allow-read=/data", "--allow-write=/data", "/app/rss-feed-video-downloader.ts"]
