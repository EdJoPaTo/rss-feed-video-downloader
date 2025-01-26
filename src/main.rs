use std::collections::HashSet;
use std::io::{BufReader, Write as _};
use std::process::Command;
use std::{env, fs};

use ureq::ResponseExt as _;

fn main() {
    let rss_feeds = env::var("RSS_FEED")
        .expect("RSS_FEED environment variable should be set")
        .split_whitespace()
        .filter(|feed| !feed.is_empty())
        .map(ToOwned::to_owned)
        .collect::<Vec<_>>();

    let yt_dlp_format = env::var("YT_DLP_FORMAT").ok();
    let yt_dlp_format_sort = env::var("YT_DLP_FORMAT_SORT").ok();

    println!("RSS feeds: {}", rss_feeds.len());
    for link in &rss_feeds {
        println!("\t{link}");
    }
    println!("YT_DLP_FORMAT: {yt_dlp_format:?}");
    println!("YT_DLP_FORMAT_SORT: {yt_dlp_format_sort:?}");

    let missing = {
        let downloaded = fs::read_to_string(".downloaded.txt").unwrap_or_default();
        let downloaded = downloaded
            .lines()
            .filter(|line| !line.is_empty())
            .collect::<HashSet<_>>();
        println!("already .downloaded.txt: {}", downloaded.len());

        let mut missing = HashSet::new();
        for feed_url in rss_feeds {
            match get_feed(&feed_url) {
                Ok(channel) => {
                    let items = channel.into_items();
                    println!("got {:>4} items from {feed_url}", items.len());
                    let links = items
                        .into_iter()
                        .filter_map(|item| item.link)
                        .filter(|link| !downloaded.contains(&**link));
                    for link in links {
                        missing.insert(link);
                    }
                }
                Err(err) => println!("WARNING: RSS feed failed {feed_url} {err:#}"),
            }
        }
        missing
    };
    let total_missing = missing.len();
    println!("not yet downloaded {total_missing}");

    for (index, link) in missing.into_iter().enumerate() {
        println!(
            "\n\n{:>4}/{total_missing} begin download of {link}",
            index + 1
        );
        download(
            yt_dlp_format.as_deref(),
            yt_dlp_format_sort.as_deref(),
            &link,
        );
    }
    println!("\n\nEverything done. Exiting…");
}

fn get_feed(url: &str) -> anyhow::Result<rss::Channel> {
    let response = ureq::get(url).call()?;
    let final_url = response.get_uri();
    if final_url != url {
        println!("RSS_FEED URL was redirected: {url} → {final_url}");
    }
    let reader = BufReader::new(response.into_body().into_reader());
    let channel = rss::Channel::read_from(reader)?;
    Ok(channel)
}

fn download(format: Option<&str>, format_sort: Option<&str>, link: &str) {
    let mut command = Command::new("yt-dlp");
    command.args([
        "--prefer-free-formats",
        "--embed-thumbnail",
        "--embed-metadata",
        "--embed-chapters",
        "--no-progress",
        "--paths=temp:/tmp/rss-yt-dlp",
    ]);
    if let Some(format) = format {
        command.arg(format!("--format={format}"));
    }
    if let Some(format_sort) = format_sort {
        command.arg(format!("--format-sort={format_sort}"));
    }
    command.arg(link);
    let status = command.status().expect("should be able to execute yt-dlp");
    if status.success() {
        mark_downloaded(link);
    } else {
        eprintln!("yt-dlp was not successful with {link}");
    }
}

fn mark_downloaded(link: &str) {
    let mut file = fs::OpenOptions::new()
        .append(true)
        .create(true)
        .open(".downloaded.txt")
        .expect("Should be able to open .downloaded.txt");
    writeln!(file, "{link}").expect("Should be able to write to .downloaded.txt");
}
