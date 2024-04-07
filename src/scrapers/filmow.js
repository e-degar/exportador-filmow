import * as cheerio from "cheerio";
import * as log from "../cli/log.js";
import cliProgress from "cli-progress";
import { getPage } from "../clients/filmow.js";
import { parse } from "date-fns";
import { ptBR } from "date-fns/locale";

const baseUrl = "https://filmow.com";
var progressBar;
var multibar;
var watchlist = false;

var authenticated;
var username;
var session;

export class ScraperError extends Error {
	constructor(message) {
		const internalMessage = "Erro do scraper";
		super(`${internalMessage}: ${message}`);
	}
}

export async function startScraping(params, option) {
	setup(params);

	let extractedData = [];

	watchlist = option == "quero-ver" ? true : false;

	// Exportando longas
	const moviesData = await exportFromList(
		`${baseUrl}/usuario/${username}/filmes/${option}`,
		`filmes em ${option}`
	);
	extractedData = extractedData.concat(moviesData);

	// Exportando Curtas
	const shortsData = await exportFromList(
		`${baseUrl}/usuario/${username}/curtas/${option}`,
		`curtas em ${option}`
	);

	extractedData = extractedData.concat(shortsData);
	return extractedData;
}

function setup(params) {
	authenticated = params.authenticated;
	username = params.username;
	session = params.session;
}

async function exportFromList(startUrl, listName) {
	let moviesData = [];
	var currentPage = startUrl;
	await createProgressBar(startUrl, listName);

	while (currentPage) {
		let result = await getMoviesOnPage(currentPage);
		moviesData = moviesData.concat(result.moviesOnPage);
		currentPage = result.nextPage;
		currentPage = undefined;
	}
	multibar.stop();
	return moviesData;
}

function createProgressBar(url, listName) {
	return new Promise(async (resolve) => {
		multibar = new cliProgress.MultiBar(
			{
				format: `Processando {listName}... {bar} | {percentage}% || {value}/{total} itens`,
				barCompleteChar: "\u2588",
				barIncompleteChar: "\u2591",
				stopOnComplete: true,
				hideCursor: true,
			},
			cliProgress.Presets.shades_grey
		);

		const totalItems = await getNumberOfItems(url);

		progressBar = multibar.create(totalItems, 0);
		progressBar.start(totalItems, 0, { listName: listName });
		resolve();
	});
}

async function getNumberOfItems(url) {
	const numberOfPages = await getNumberOfPages(url);

	if (numberOfPages == 0) return 0;

	const $ = cheerio.load(await getPage(`${url}/?pagina=${numberOfPages}`));

	const moviesOnLastPage = $("ul#movies-list li").length;

	const total = (numberOfPages - 1) * 24 + moviesOnLastPage;

	return total;
}

async function getNumberOfPages(url) {
	const $ = cheerio.load(await getPage(url));

	let numberOfPages = "";

	const lastPageLink = $('a[title="última página"]').attr("href");

	if (!lastPageLink) {
		let lastPage = $("a#next-page").parent().prev().find("a").text();
		if (!lastPage) {
			let mensagem = $("ul#movies-list p").text();
			if (
				mensagem ==
				"Não há filmes nesse sessão. Comente, curta e favorite filmes do Filmow!"
			) {
				numberOfPages = 0;
			} else {
				numberOfPages = 1;
			}
		} else {
			numberOfPages = lastPage;
		}
	} else {
		numberOfPages = lastPageLink.match(/pagina=(\d+)/)[1];
	}
	return numberOfPages;
}

async function getMoviesOnPage(url) {
	var movies = [];

	const $ = cheerio.load(await getPage(url));

	let movieName;

	for (const element of $("ul#movies-list li")) {
		try {
			movieName = $(element).find(".title").text();
			const movie = await scrapeMovieData(element, movieName);
			movies.push(movie);
		} catch (error) {
			if (error instanceof ScraperError) {
				multibar.log(`${error.message}\n`);
			} else {
				multibar.log(`${error}\n`);
			}
		} finally {
			progressBar.increment();
		}
	}

	const nextPageUrl = $("a#next-page").attr("href");

	return {
		nextPage: nextPageUrl ? `${baseUrl}${nextPageUrl}` : undefined,
		moviesOnPage: movies,
	};
}

async function scrapeMovieData(movieListItem, title) {
	try {
		let movie = {
			originalTitle: "",
			releaseYear: "",
			directors: "",
		};

		var $ = cheerio.load(movieListItem);
		let rating = watchlist ? "" : getMovieRating($, title);

		const movieRelativePath = $(".tip-movie").attr("href");
		$ = cheerio.load(
			await getPage(`${baseUrl}${movieRelativePath}`, session ? session : "")
		);

		movie.releaseYear = getMovieRelease($, title);
		movie.directors = getMovieDirectors($, title);
		movie.originalTitle = getMovieOriginalTitle($, title);

		if (!watchlist) {
			let watchedDate = getMovieWatchedDate($, title);
			Object.assign(movie, { rating: rating, watchedDate: watchedDate });
		}

		return movie;
	} catch (error) {
		if (error instanceof ScraperError) throw error;
		throw new Error("Ocorreu um erro inesperado:", error.message);
	}
}

function getMovieRating($, title) {
	try {
		let ratingStr = $(".star-rating").attr("title");
		if (!ratingStr) {
			multibar.log(`Parece que você não avaliou o filme ${title}\n`);
		}
		return ratingStr ? ratingStr.match(/\d+(\.\d+)?/)[0] : "";
	} catch (error) {
		throw new ScraperError(`Não consegui a avaliação do filme ${title}`, error);
	}
}

function getMovieRelease($, title) {
	try {
		return $(".movie-title .release")
			.text()
			.replace(/\s*\([^)]*\)/, "");
	} catch (error) {
		throw new ScraperError(
			`Não consegui a data de lançamento de ${title}`,
			error
		);
	}
}

function getMovieDirectors($, title) {
	try {
		return $(
			".directors span[itemprop='director'] span[itemprop='name'] strong"
		)
			.map((index, element) =>
				$(element)
					.text()
					.trim()
					.replace(/\s*\([^)]*\)/, "")
			)
			.get()
			.join(", ");
	} catch (error) {
		throw new ScraperError(`Não encontrei os diretores de ${title}`, error);
	}
}

function getMovieOriginalTitle($, title) {
	try {
		let title = $(
			".movie-other-titles li em:contains('Estados Unidos da América'):first"
		)
			.prev()
			.text();

		if (title.includes("/")) {
			title = title.split("/");
			title = title[0].trim();
		}

		if (!title) title = $(".movie-original-title").text();

		if (title.match("[^\u0000-\u024F]")) {
			title = $("div.movie-title h1").text();
		}
		return title;
	} catch (error) {
		throw new ScraperError(`Não consegui o título original de ${title}`, error);
	}
}

function getMovieWatchedDate($, title) {
	try {
		let strDate = authenticated ? $("#watched-in").text() : "";

		let parsedDate;
		if (strDate === "") {
			parsedDate = new Date();
		} else {
			parsedDate = parse(strDate, "d 'de' MMMM 'de' yyyy", new Date(), {
				locale: ptBR,
			});
		}

		const formattedDate = new Intl.DateTimeFormat("pt-BR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
			.format(parsedDate)
			.split("/")
			.reverse()
			.join("-");
		return formattedDate;
	} catch (error) {
		throw new ScraperError(
			`Tive um problema pra achar a data em que você assistiu ${title}`,
			error
		);
	}
}

export async function getUsernameFromPage(page) {
	try {
		const $ = cheerio.load(page);
		const user = $("div.span12 ul.nav li:last-child a.dropdown-toggle")
			.text()
			.trim();
		return user;
	} catch (error) {
		log.panic("Ocorreu um erro ao obter o username: ", error);
	}
}
