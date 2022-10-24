# RSS Feed Video Downloader

Downloads an RSS feed and tries to yt-dlp every entry

## Usage

- Point the container `/data` mount to a directory you want to use.
- Supply the `RSS_FEED` environment variable.
- (optional) Sync the videos. Personally I use syncthing for this. You should
  ignore some files from sync, check the [.gitignore](.gitignore)
- Enjoy!
