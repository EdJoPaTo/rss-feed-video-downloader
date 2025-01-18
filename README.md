# RSS Feed Video Downloader

Downloads an RSS feed and tries to yt-dlp every entry

## Usage

- Point the container `/data` mount to a directory you want to use.
- Supply the `RSS_FEED` environment variable. Can contain multiple space (`\s`)
  separated feed URLs. (Escape spaces in URLs with %20 like URL decoding does.)
- (optional) set `INTERVAL_MINUTES` environment variable. `0` to disable
  interval. Defaults to 95 min.
- (optional) set `YT_DLP_FORMAT` or `YT_DLP_FORMAT_SORT` environment variable.
  Can be used to limit to 720p or other things like that. Read `man yt-dlp`
  `--format`, `--format-sort` and `Sorting Formats` for more details.
- (optional) Sync the videos. Personally I use syncthing for this.
- Enjoy!
