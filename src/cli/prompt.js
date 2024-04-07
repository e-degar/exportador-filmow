import pressAnyKey from "press-any-key";
import inquirer from "inquirer";
import * as log from "./log.js";
import * as fs from "fs";
import chalk from "chalk";
import os from "os";
import { validateIfUserExists } from "../clients/filmow.js";
import { openSession } from "../auth/filmow.js";

const prompt = inquirer.createPromptModule();

export async function getScraperParams() {
	log.talk(
		"Este programa funciona em dois modos:\n\n" +
			"Não-Autenticado  - Pede seu username para localizar seu perfil, sem acessar sua conta.\n" +
			"Autenticado      - Você precisa fazer login para abrir uma sessão. Consegue pegar a data em que o filme foi incluído.\n"
	);

	const mode = await askOperationMode();

	let session;
	if (mode.authenticated) {
		session = await tryToOpenSession();
		if (!session.username) {
			mode.authenticated = false;
		}
	}

	const options = await askOtherParams(mode);

	return {
		...mode,
		...session,
		...options,
	};
}

async function askOperationMode() {
	return prompt([
		{
			type: "list",
			name: "authenticated",
			message: "Escolha um modo de operação:",
			choices: [
				{
					name: "Autenticado",
					value: true,
				},
				{
					name: "Não-Autenticado",
					value: false,
				},
			],
		},
	]);
}

function askOtherParams(mode) {
	return prompt([
		{
			type: "input",
			name: "username",
			message: "Qual o seu nome de usuário no Filmow?",
			when: !mode.authenticated,
			validate: async (answer) => {
				if (!(await validateIfUserExists(answer)))
					return chalk.red("Usuário não encontrado.");
				return true;
			},
		},
		{
			type: "checkbox",
			name: "options",
			message: "Quais listas eu devo salvar?",
			choices: [
				{
					name: "Já vi",
					value: "ja-vi",
				},
				{
					name: "Quero ver",
					value: "quero-ver",
				},
			],
		},
		{
			type: "input",
			name: "path",
			message: "Onde devo salvar as listas?",
			default: os.homedir,
			validate: (answer) => {
				if (!fs.existsSync(answer))
					return chalk.red("Essa pasta não existe ¯\\_(ツ)_/¯");
				return true;
			},
		},
	]);
}

async function tryToOpenSession() {
	log.warn("Vou te redirecionar pra tela de login.");
	await pressKeyToContinue();

	let credentials = await openSession();

	while (!credentials) {
		credentials = await noCredentials();
	}

	return credentials;
}

async function noCredentials() {
	return await prompt([
		{
			type: "list",
			name: "option",
			default: true,
			message: "Não deu pra abrir uma sessão. O que você quer fazer?",
			choices: [
				{
					name: "Tentar de novo",
					value: "retry",
				},
				{
					name: "Seguir sem autenticação",
					value: "no-auth",
				},
				{
					name: "Encerrar",
					value: "exit",
				},
				{
					name: "Imprimir um gato no terminal",
					value: "cat",
				},
			],
		},
	]).then(async (answer) => {
		switch (answer.option) {
			case "retry":
				await tryToOpenSession();
			case "no-auth":
				return true;
			case "exit":
				process.exit();
			case "cat":
				printCat();
				return noCredentials();
		}
	});
}

function pressKeyToContinue() {
	return new Promise((resolve) => {
		pressAnyKey(log.warn("Pressione qualquer tecla para continuar...\n"), {
			ctrlC: "reject",
		})
			.then(() => {
				resolve();
			})
			.catch(() => {
				log.error("Programa interrompido pelo usuário. Há braços e beijos.");
			});
	});
}

function printCat() {
	// Best I could find
	log.talk(`
⠀ ／l、 miau?
（ﾟ､ ｡７
⠀ |, ~ヽ
  じし_,)ノ
	`);
}

export function printBadger() {
	log.talk(
		`
		⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠶⠔⠊⠉⠉⠐⠒⢒⣲⣶⣦⢤⠤⢠⣶⣿⣿⣿⣤⢠⣶⢤⠀⠀⠀⠀
		⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⠞⠉⠀⠀⠀⠀⠀⢀⣠⣤⣶⣦⣶⣬⣽⣓⣿⣀⣻⣿⣿⠛⣯⢁⡟⠿⢶⠟⣩
		⠈⢿⣿⣷⡂⠀⠀⠀⢀⣴⣿⡿⠁⠀⠀⢀⣠⣤⣶⢛⣛⣫⣽⣿⣿⣿⣯⣿⣿⣿⣿⡤⠤⠤⠤⢤⡭⠥⠤⠔⠐⠁
		⠀⠀⢿⣿⣧⢠⣶⣯⠻⣿⡟⠀⢀⣴⡾⠿⠿⣿⣿⣿⣿⠿⢿⣿⣿⠿⣿⣿⣿⣿⣿⣿⣶⠄⠀⠀⠀⠀⠀⠀⠀⠀
		⠀⠀⢸⣿⣿⣟⣬⣁⡴⠋⠀⢰⣿⡿⠷⠇⠀⣸⣿⠿⠟⢋⢅⣀⠀⠀⠀⠀⠙⠛⠿⣿⣿⣆⡀⠀⢀⡠⠂⠀⠀⠀
		⢀⡦⠞⠛⠙⠛⠦⣀⠀⠀⠀⠈⢙⣛⠓⠒⠻⡩⠴⣄⡴⠚⠭⡈⠫⡻⣷⣦⣄⠀⠀⠈⠛⢿⣆⠛⢅⠀⠀⠀⠀⠀
		⣿⣿⣶⣶⣦⠀⠀⠈⠁⢀⡀⣪⡖⠁⠲⣤⠚⠁⠀⢸⠀⠀⠀⣿⠉⠉⢻⣿⣿⣷⡄⠀⠀⠀⢻⠇⠀⠁⠀⠀⠀⠀
		⢿⣿⣿⢿⣁⣀⣀⣐⡼⢴⣾⡃⠀⠀⣸⣿⠀⠀⠀⡞⡇⠀⢀⠿⠀⠀⣾⣿⣿⣿⣿⣦⡀⠀⠈⣷⣀⡞⠹⢻⠀⣀
		⣾⣿⣿⠀⠙⢄⡈⣿⡄⠀⣿⠑⣄⠀⣿⡟⠇⠀⡸⠁⣇⢀⡞⠀⡇⡼⣿⣿⣿⣿⣿⣿⣷⡀⠀⣿⠛⠛⠛⠛⠛⠛
		⣿⣿⣿⠀⢀⡴⠋⡿⠋⣦⡇⠀⠸⣧⣿⠀⠘⣴⠁⠀⢺⡟⠀⠀⡟⠀⣿⣿⣿⣿⣿⣿⣿⣿⡀⢻⠀⠀⠀⠀⠀⠀
		⣿⣿⡏⣀⡞⠀⢰⠁⠀⢿⢧⠀⠀⠹⣧⠀⠀⡇⠀⠀⡞⠀⠀⢰⠃⠀⡿⣹⣿⣿⣿⣿⣿⣿⣷⠘⡇⠀⠀⠀⠀⠀
		⣿⣿⢸⠑⢓⣒⣋⡉⠉⠉⠉⠓⠒⠠⠼⣦⣠⢇⣀⠴⢥⣀⠤⢃⡤⠊⣠⣿⣿⣿⣿⣿⣿⣿⣿⣧⣧⠀⠀⠀⠀⠀
		⣿⠃⠈⠉⠉⠁⢻⡀⠀⠀⠀⠀⠈⠉⠐⠢⢬⣉⠑⠒⠒⠒⠂⣉⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣷⣄⠀⠀⠀
		⣷⣶⣦⣄⣀⣀⣸⣇⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠉⠉⠉⠉⢡⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀
		⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠑⠒⠂⠤⣄⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀
		⠒⠒⠒⠂⠀⠀⠉⠉⠉⠀⠀⠀⠒⠒⠒⠢⠤⠤⠤⣀⡀⠈⠉⠙⠛⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠉⠀⠀⠀⠀
`
	);

	log.talk("Oi meu chapa");
}
