import pressAnyKey from "press-any-key";
import inquirer from "inquirer";
import * as log from "./log.js";

const prompt = inquirer.createPromptModule();

export async function getScraperParams() {
	log.talk(
		"Este programa funciona em dois modos:\n\n" +
			"Não-Autenticado  - Pede seu username para localizar seu perfil, sem acessar sua conta.\n" +
			"Autenticado      - Você precisa fazer login para abrir uma sessão. Consegue pegar a data em que o filme foi incluído.\n"
	);

	const operation = await askOperationMode();

	let session;
	if (operation.mode == "authenticated") {
		session = await tryToOpenSession();
	}

	const options = await askOtherParams(operation.mode);

	return {
		...operation,
		...session,
		...options,
	};
}

async function askOperationMode() {
	return prompt([
		{
			type: "list",
			name: "mode",
			message: "Escolha um modo de operação:",
			choices: [
				{
					name: "Autenticado",
					value: "authenticated",
				},
				{
					name: "Não-Autenticado",
					value: "non-authenthicated",
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
			when: mode == "non-authenthicated",
			//TODO: Implementar validação
		},
		{
			type: "checkbox",
			name: "option",
			message: "Quais listas eu devo salvar?",
			choices: [
				{
					name: "Já vi",
					value: "seenlist",
				},
				{
					name: "Quero ver",
					value: "wishlist",
				},
			],
		},
		{
			type: "input",
			name: "path",
			message: "Onde devo salvar as listas?",
			//TODO: Implementar validação
		},
	]);
}

async function tryToOpenSession() {
	log.warn("Vou te redirecionar pra tela de login.");
	await pressKeyToContinue();

	//TODO: Implementar login manual

	return {
		username: "teste",
		session: "teste",
	};
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
