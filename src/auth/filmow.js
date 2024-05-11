import * as log from "../cli/log.js";
import puppeteer from "puppeteer";
import { getPage } from "../clients/filmow.js";
import { getUsernameFromPage } from "../scrapers/filmow.js";

const BASE_URL = "https://filmow.com";
const MAX_RETRIES = 3;

export async function openSession() {
	let retries = 1;

	while (retries <= 3) {
		try {
			const sessionCookie = await grabSessionCookie();
			const sessionId = `filmow_sessionid=${extractSessionId(sessionCookie)}`;
			const username = await getUsername(sessionId);

			return {
				username: username,
				session: sessionId,
			};
		} catch (error) {
			log.error("Erro ao iniciar sessão: ", error);
			log.error(`Tentativa ${retries} de ${MAX_RETRIES}.`);
			retries++;
		}
	}
	log.panic("Não foi possível iniciar a sessão após três tentativas.");
	return null;
}

async function grabSessionCookie() {
	return new Promise(async (resolve, reject) => {
		try {
			const browser = await puppeteer.launch({ headless: false });

			const [page] = await browser.pages();
			page.setDefaultNavigationTimeout(0);
			await page.goto(`${BASE_URL}/login`);
			await page.waitForNavigation();
			const cookies = await page.cookies();
			await browser.close();

			const sessionCookie = cookies.find(
				(cookie) => cookie.name === "filmow_sessionid"
			);

			resolve(sessionCookie);
		} catch (e) {
			reject(e);
		}
	});
}

function extractSessionId(sessionCookie) {
	if (!sessionCookie) throw new Error("O id da sessão veio vazio.");
	if (sessionCookie.value.length <= 66) throw new Error("Não autenticado.");
	return sessionCookie.value;
}

async function getUsername(sessionCookie) {
	const page = await getPage(null, sessionCookie);
	return await getUsernameFromPage(page);
}
