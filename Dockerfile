FROM docker.io/denoland/deno:latest AS builder
RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y unzip
WORKDIR /app
COPY . ./
RUN deno compile \
	--allow-env=RSS_FEED,INTERVAL_MINUTES,YT_DLP_FORMAT \
	--allow-net \
	--allow-read=/data \
	--allow-run \
	--allow-write=/data \
	rss-feed-video-downloader.ts


FROM docker.io/library/debian:bookworm-slim
RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y yt-dlp \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*

VOLUME /data
WORKDIR /data

COPY --from=builder /app/rss-feed-video-downloader /usr/local/bin/

CMD ["rss-feed-video-downloader"]
