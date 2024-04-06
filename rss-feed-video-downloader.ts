import { parseFeed } from "https://deno.land/x/rss@1.0.2/mod.ts";

const RSS_FEED = getEnv("RSS_FEED");

function getEnv(key: string): string {
	const value = Deno.env.get(key);
	if (!value) {
		throw new Error("Specify " + key + " as environment variable");
	}
	return value;
}

await doRun();
setInterval(doRun, 1000 * 60 * 95); // every 95 minutes

async function doRun() {
	const response = await fetch(RSS_FEED);
	const text = await response.text();
	const { entries } = await parseFeed(text);
	const links = entries.flatMap((o) => o.links).map((o) => o.href).filter((
		o,
	): o is string => Boolean(o));
	console.log("rss has", links.length);

	const downloadedContent = await Deno.readTextFile(".downloaded.txt").catch(
		() => "",
	);
	const downloaded = new Set(downloadedContent.split("\n").filter(Boolean));
	const missing = links.filter((o) => !downloaded.has(o));
	console.log("missing", missing.length, missing);

	for (const link of missing) {
		try {
			// deno-lint-ignore no-await-in-loop
			await doDownload(link);
		} catch (error) {
			console.error(
				"download failed",
				error instanceof Error ? error.message : error,
			);
		}
	}

	console.log();
	console.log("download done. Going to sleep for a while");
}

async function doDownload(link: string): Promise<void> {
	console.log("\n");
	console.log("begin download of", link);

	const p = new Deno.Command("nice", {
		args: [
			"yt-dlp",
			"--prefer-free-formats",
			"--embed-thumbnail",
			"--embed-metadata",
			"--embed-chapters",
			"--no-progress",
			link,
		],
	}).spawn();
	const status = await p.status;
	if (!status.success) {
		throw new Error("yt-dlp was not successful");
	}

	await markDownloaded(link);
}

async function markDownloaded(link: string): Promise<void> {
	const downloadedContent = await Deno.readTextFile(".downloaded.txt").catch(
		() => "",
	);
	const downloaded = downloadedContent.split("\n").filter(Boolean);
	downloaded.push(link);
	await Deno.writeTextFile(
		".downloaded.txt",
		downloaded.sort().map((o) => `${o}\n`).join(""),
	);
}
