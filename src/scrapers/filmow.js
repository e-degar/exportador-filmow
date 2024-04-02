import * as log from "../cli/log.js";
import * as cheerio from "cheerio";

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
