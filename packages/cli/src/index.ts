#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getGatewayUrl, publishToEns } from '@walrens/sdk';

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
	.option('--network <chain>', 'Target chain for ENS write', 'sepolia')
	.option('--text-only', 'Write Text record only, skip contenthash', true)
	.action(async (ensName, pathOrFile, options) => {
		const spinner = ora(`Linking ${ensName} to Walrus…`).start();
		try {
			// Get the private key: Read the user's private key from an environment variable
			const privateKey = process.env.PRIVATE_KEY;
			if (!privateKey) {
				throw new Error('PRIVATE_KEY environment variable is not set. Please set it to your Ethereum private key.');
			}
			
			// Update the spinner: Change the spinner's text to "Writing ENS record for ensName on network..."
			spinner.text = `Writing ENS record for ${ensName} on ${options.network}...`;
			
			// Call the SDK: Call the publishToEns function
			const result = await publishToEns(ensName, pathOrFile, {
				network: options.network,
				privateKey: process.env.PRIVATE_KEY,
			});
			
			const url = getGatewayUrl(ensName);
			spinner.succeed(`Linked ${chalk.cyan(ensName)} to Walrus.`);
			console.log(`${chalk.gray('→')} Visit: ${chalk.green(url)}`);
			console.log(`${chalk.gray('→')} Network: ${options.network}`);
			console.log(`${chalk.gray('→')} Transaction: ${chalk.blue(result.txHash)}`);
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