# RSS Feed Video Downloader

Downloads an RSS feed and tries to yt-dlp every entry

## Usage

- Point the container `/data` mount to a directory you want to use.
- Supply the `RSS_FEED` environment variable.
- (optional) set `INTERVAL_MINUTES` environment variable. `0` to disable
  interval. Defaults to 95 min.
- (optional) Sync the videos. Personally I use syncthing for this.
- Enjoy!
