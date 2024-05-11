import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";
import * as log from "../cli/log.js";

export async function writeDataToCSV(data, params) {
	let totalMovies = 0;
	let files = [];

	for (let [key, value] of data) {
		const fileName = `${params.path}/${params.username}_filmow_${key}.csv`;

		const header = [
			{ id: "originalTitle", title: "Title" },
			{ id: "releaseYear", title: "Year" },
			{ id: "directors", title: "Directors" },
		];

		if (key == "assistidos") {
			header.push({ id: "rating", title: "Rating" });
			header.push({ id: "watchedDate", title: "WatchedDate" });
		}

		const csvWriter = createObjectCsvWriter({
			path: fileName,
			header: header,
		});

		try {
			await csvWriter.writeRecords(value);
			totalMovies += value.length;
			files.push(fileName);
		} catch (error) {
			throw new Error(chalk.red("Deu ruim pra exportar CSV:", error));
		}
	}

	log.success(
		`Seus ${totalMovies} filmes foram exportados em ${files.length} arquivos:`
	);
	files.forEach((f) => {
		console.log(f);
	});
}
