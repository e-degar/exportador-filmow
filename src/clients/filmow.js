import axios, { AxiosError } from "axios";
import * as log from "../cli/log.js";

const BASE_URL = "https://filmow.com";

export async function validateIfUserExists(username) {
	try {
		await axios.get("https://filmow.com/usuario/" + username);
		return true;
	} catch (error) {
		if (!(error instanceof AxiosError)) {
			throw new Error(log.panic("Resposta inesperada do servidor."));
		}
		return false;
	}
}

export async function getPage(url, session) {
	try {
		const response = await axios.get(url ? url : BASE_URL, {
			withCredentials: true,
			headers: {
				Cookie: session,
			},
		});
		return response.data;
	} catch (error) {
		log.panic(`Ocorreu um erro ao acessar: ${url}`);
		throw new Error(error);
	}
}
