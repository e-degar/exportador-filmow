import { getScraperParams, printBadger } from "./cli/prompt.js";
import { startScraping } from "./scrapers/filmow.js";
import { writeDataToCSV } from "./writers/csv-writer.js";

printBadger();

let params = await getScraperParams();

const data = new Map();

if (params.options.includes("ja-vi")) {
	const watched = await startScraping(params, "ja-vi");
	data.set("assistidos", watched.reverse());
}

if (params.options.includes("quero-ver")) {
	const wishlist = await startScraping(params, "quero-ver");
	data.set("quero_ver", wishlist.reverse());
}

writeDataToCSV(data, params);
