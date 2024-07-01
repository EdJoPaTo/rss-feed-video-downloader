import { parseFeed } from "jsr:@mikaelporttila/rss@1";

const RSS_FEED = getEnv("RSS_FEED");
const INTERVAL_MINUTES = getIntervalMinutes();

function getEnv(key: string): string {
	const value = Deno.env.get(key);
	if (!value) {
		throw new Error("Specify " + key + " as environment variable");
	}
	return value;
}

function getIntervalMinutes(): number {
	const value = Number(Deno.env.get("INTERVAL_MINUTES"));
	if (Number.isFinite(value) && value >= 0 && value <= 12000) {
		return value;
	}

	return 95;
}

await doRun();
if (INTERVAL_MINUTES > 0) {
	setInterval(doRun, 1000 * 60 * INTERVAL_MINUTES); // every n minutes
}

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
	console.log(
		"download done.",
		INTERVAL_MINUTES > 0
			? `Going to sleep for <${INTERVAL_MINUTES} minutes…`
			: "Everything done. Exitting…",
	);
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
			"--paths=temp:/tmp/yt-dlp",
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
