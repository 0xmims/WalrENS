#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { 
	getGatewayUrl, 
	publishToEns, 
	deployWebsiteToWalrus,
	createWalrusSiteMapping,
	setEnsWalrusSite,
	validateWalrusSite,
	resolveWalrusSite,
	loadEnvConfig,
	validateDeploymentConfig,
	printValidationResults
} from '@walrens/sdk';

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

// New command: Deploy a complete website directory to Walrus Sites
program
	.command('deploy')
	.description('Deploy a website directory to Walrus Sites and link to ENS')
	.argument('<directory>', 'Directory containing website files')
	.argument('<ensName>', 'ENS name to link to')
	.option('--chain <chain>', 'Target chain for ENS write', 'sepolia')
	.option('--sui-key <key>', 'Sui private key (or use SUI_PRIVATE_KEY env var)')
	.option('--eth-key <key>', 'Ethereum private key (or use ETH_PRIVATE_KEY env var)')
	.option('--sui-rpc <url>', 'Sui RPC URL', 'https://fullnode.testnet.sui.io:443')
	.option('--walrus-publisher <url>', 'Walrus publisher URL', 'https://publisher.walrus-testnet.walrus.space')
	.action(async (directory, ensName, options) => {
		try {
			// Validate environment configuration first
			const envConfig = loadEnvConfig();
			
			// Override with command line options if provided
			if (options.suiKey) envConfig.suiPrivateKey = options.suiKey;
			if (options.ethKey) envConfig.ethPrivateKey = options.ethKey;
			if (options.suiRpc) envConfig.suiRpcUrl = options.suiRpc;
			if (options.walrusPublisher) envConfig.walrusPublisherUrl = options.walrusPublisher;
			
			const validation = validateDeploymentConfig(envConfig);
			
			if (!validation.isValid) {
				console.log(chalk.red('❌ Environment validation failed:'));
				validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
				console.log(chalk.yellow('\n💡 Create a .env file or set environment variables. See .env.example for guidance.'));
				process.exitCode = 1;
				return;
			}
			
			if (validation.warnings.length > 0) {
				console.log(chalk.yellow('⚠️  Environment warnings:'));
				validation.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
				console.log(); // Extra line for spacing
			}
			
			const spinner = ora(`Deploying ${directory} to Walrus Sites...`).start();
			
			const suiPrivateKey = envConfig.suiPrivateKey!;
			const ethPrivateKey = envConfig.ethPrivateKey!;
			
			// Check if directory exists
			if (!await fs.pathExists(directory)) {
				throw new Error(`Directory not found: ${directory}`);
			}
			
			spinner.text = 'Reading website files...';
			
			// Read all files in directory
			const files = await readWebsiteFiles(directory);
			if (files.length === 0) {
				throw new Error('No files found in directory');
			}
			
			spinner.text = `Uploading ${files.length} files to Walrus...`;
			
			// Deploy to Walrus Sites
			const result = await deployWebsiteToWalrus(ensName, files, suiPrivateKey, {
				suiRpcUrl: envConfig.suiRpcUrl,
				walrusPublisherUrl: envConfig.walrusPublisherUrl
			});
			
			spinner.text = `Setting ENS record for ${ensName}...`;
			
			// Set ENS text record to point to the Walrus Site
			await setEnsWalrusSite(ensName, result.objectId, {
				rpcUrl: envConfig.ethRpcUrl,
				privateKey: ethPrivateKey,
				useNewFormat: true // Use the enhanced walrus-site text record format
			});
			
			const url = getGatewayUrl(ensName);
			spinner.succeed(`Successfully deployed ${chalk.cyan(ensName)} to Walrus Sites!`);
			
			console.log(`${chalk.gray('→')} Object ID: ${chalk.blue(result.objectId)}`);
			console.log(`${chalk.gray('→')} Transaction: ${chalk.blue(result.transactionHash)}`);
			console.log(`${chalk.gray('→')} Files uploaded: ${result.resources.length}`);
			console.log(`${chalk.gray('→')} Preview URL: ${chalk.green(result.previewUrl)}`);
			console.log(`${chalk.gray('→')} Gateway URL: ${chalk.green(url)}`);
			
		} catch (err) {
			spinner.fail('Failed to deploy website');
			console.error(err instanceof Error ? err.message : String(err));
			process.exitCode = 2;
		}
	});

// New command: Update an existing Walrus Site
program
	.command('update')
	.description('Update an existing Walrus Site')
	.argument('<directory>', 'Directory containing updated website files')
	.argument('<ensName>', 'ENS name of existing site')
	.option('--chain <chain>', 'Target chain for ENS', 'sepolia')
	.option('--sui-key <key>', 'Sui private key (or use SUI_PRIVATE_KEY env var)')
	.action(async (directory, ensName, options) => {
		const spinner = ora(`Updating ${ensName}...`).start();
		
		try {
			// This would be similar to deploy but update existing site
			spinner.fail('Update command not yet implemented');
			console.log('This feature requires updating existing Walrus Site objects');
		} catch (err) {
			spinner.fail('Failed to update website');
			console.error(err instanceof Error ? err.message : String(err));
			process.exitCode = 2;
		}
	});

// New command: Check status of a Walrus Site
program
	.command('status')
	.description('Check the status of a Walrus Site')
	.argument('<ensName>', 'ENS name to check')
	.option('--chain <chain>', 'Target chain for ENS', 'sepolia')
	.option('--eth-rpc <url>', 'Ethereum RPC URL')
	.action(async (ensName, options) => {
		const spinner = ora(`Checking status of ${ensName}...`).start();
		
		try {
			const ethRpcUrl = options.ethRpc || process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
			
			// Resolve ENS to Walrus mapping
			const mapping = await resolveWalrusSite(ensName, { provider: ethRpcUrl });
			
			if (!mapping) {
				spinner.fail(`No Walrus record found for ${ensName}`);
				return;
			}
			
			spinner.text = 'Validating Walrus Site...';
			
			// Validate the site exists
			const isValid = await validateWalrusSite(mapping.id);
			
			spinner.succeed(`Status for ${chalk.cyan(ensName)}`);
			
			console.log(`${chalk.gray('→')} Type: ${mapping.type}`);
			console.log(`${chalk.gray('→')} ID: ${chalk.blue(mapping.id)}`);
			if (mapping.index) {
				console.log(`${chalk.gray('→')} Index: ${mapping.index}`);
			}
			console.log(`${chalk.gray('→')} Valid: ${isValid ? chalk.green('✓') : chalk.red('✗')}`);
			console.log(`${chalk.gray('→')} Gateway URL: ${chalk.green(getGatewayUrl(ensName))}`);
			
		} catch (err) {
			spinner.fail('Failed to check status');
			console.error(err instanceof Error ? err.message : String(err));
			process.exitCode = 2;
		}
	});

// Helper function to read all files in a directory
async function readWebsiteFiles(directory: string): Promise<Array<{ path: string; content: Buffer }>> {
	const files: Array<{ path: string; content: Buffer }> = [];
	
	// Find all files recursively
	const pattern = path.join(directory, '**/*').replace(/\\/g, '/');
	const filePaths = await glob(pattern, { nodir: true });
	
	for (const filePath of filePaths) {
		const content = await fs.readFile(filePath);
		const relativePath = path.relative(directory, filePath).replace(/\\/g, '/');
		files.push({ path: relativePath, content });
	}
	
	return files;
}

// Environment check command
program
	.command('env-check')
	.description('Check environment configuration')
	.action(async () => {
		console.log(chalk.bold('🔍 Checking WalrENS environment configuration...\n'));
		
		const envConfig = loadEnvConfig();
		const validation = validateDeploymentConfig(envConfig);
		
		console.log(chalk.bold('Environment Variables:'));
		console.log(`${chalk.gray('→')} SUI_PRIVATE_KEY: ${envConfig.suiPrivateKey ? chalk.green('✓ Set') : chalk.red('✗ Missing')}`);
		console.log(`${chalk.gray('→')} ETH_PRIVATE_KEY: ${envConfig.ethPrivateKey ? chalk.green('✓ Set') : chalk.red('✗ Missing')}`);
		console.log(`${chalk.gray('→')} SUI_RPC_URL: ${chalk.blue(envConfig.suiRpcUrl)}`);
		console.log(`${chalk.gray('→')} ETH_RPC_URL: ${chalk.blue(envConfig.ethRpcUrl)}`);
		console.log(`${chalk.gray('→')} WALRUS_PUBLISHER_URL: ${chalk.blue(envConfig.walrusPublisherUrl)}`);
		console.log(`${chalk.gray('→')} WALRUS_AGGREGATOR_URL: ${chalk.blue(envConfig.walrusAggregatorUrl)}`);
		console.log();
		
		printValidationResults(validation, 'deployment');
		
		if (!validation.isValid) {
			console.log(chalk.yellow('\n💡 To fix these issues:'));
			console.log(chalk.yellow('  1. Copy .env.example to .env: cp .env.example .env'));
			console.log(chalk.yellow('  2. Add your private keys to the .env file'));
			console.log(chalk.yellow('  3. Run this command again to verify'));
			process.exitCode = 1;
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