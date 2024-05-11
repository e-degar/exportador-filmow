import chalk from "chalk";

export function talk(msg) {
	console.log(msg);
}

export function success(msg) {
	console.log(chalk.green(msg));
}

export function warn(msg) {
	console.log(chalk.yellow(msg));
}

export function attention(msg) {
	console.log(chalk.bgYellowBright(msg));
}

export function error(msg) {
	console.log(chalk.red(msg));
}

export function panic(msg) {
	console.log(chalk.bold.red(msg));
}
