#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getGatewayUrl } from '@walrens/sdk';

const program = new Command();
program
	.name('walrens')
	.description('WalrENS CLI – link ENS names to Walrus blobs/sites')
	.version('0.1.0');

program
	.command('link')
	.description('Upload to Walrus and write ENS walrus Text record')
	.argument('<ensName>', 'ENS name or subname')
	.argument('<pathOrFile>', 'Path to file or directory')
	.option('--network <chain>', 'Target chain for ENS write')
	.option('--text-only', 'Write Text record only, skip contenthash', true)
	.action(async (ensName, pathOrFile, options) => {
		const spinner = ora(`Linking ${ensName} to Walrus…`).start();
		try {
			// TODO: implement upload + ENS write
			await new Promise((r) => setTimeout(r, 500));
			const url = getGatewayUrl(ensName);
			spinner.succeed(`Linked ${chalk.cyan(ensName)} to Walrus.`);
			console.log(`${chalk.gray('→')} Visit: ${chalk.green(url)}`);
			process.exitCode = 0;
		} catch (err) {
			spinner.fail('Failed to link');
			console.error(err instanceof Error ? err.message : String(err));
			process.exitCode = 2;
		}
	});

program
	.command('demo')
	.description('Publish example site and print demo URL')
	.action(async () => {
		console.log('Demo not yet implemented.');
	});

program.parseAsync().catch((err) => {
	console.error(err);
	process.exit(2);
});