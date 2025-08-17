/**
 * Environment validation utilities for WalrENS
 */

export interface EnvConfig {
  suiPrivateKey?: string;
  ethPrivateKey?: string;
  suiRpcUrl?: string;
  ethRpcUrl?: string;
  walrusPublisherUrl?: string;
  walrusAggregatorUrl?: string;
  gatewayDomain?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const DEFAULT_CONFIG: Required<Omit<EnvConfig, 'suiPrivateKey' | 'ethPrivateKey'>> = {
  suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
  ethRpcUrl: 'https://eth.llamarpc.com',
  walrusPublisherUrl: 'https://publisher.walrus-testnet.walrus.space',
  walrusAggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
  gatewayDomain: 'walrus.site'
};

/**
 * Load environment configuration from process.env
 */
export function loadEnvConfig(): EnvConfig {
  return {
    suiPrivateKey: process.env.SUI_PRIVATE_KEY,
    ethPrivateKey: process.env.ETH_PRIVATE_KEY,
    suiRpcUrl: process.env.SUI_RPC_URL || DEFAULT_CONFIG.suiRpcUrl,
    ethRpcUrl: process.env.ETH_RPC_URL || DEFAULT_CONFIG.ethRpcUrl,
    walrusPublisherUrl: process.env.WALRUS_PUBLISHER_URL || DEFAULT_CONFIG.walrusPublisherUrl,
    walrusAggregatorUrl: process.env.WALRUS_AGGREGATOR_URL || DEFAULT_CONFIG.walrusAggregatorUrl,
    gatewayDomain: process.env.GATEWAY_DOMAIN || DEFAULT_CONFIG.gatewayDomain
  };
}

/**
 * Validate private key format
 */
function validatePrivateKey(key: string | undefined, keyName: string): string[] {
  const errors: string[] = [];
  
  if (!key) {
    errors.push(`${keyName} is required`);
    return errors;
  }
  
  if (!key.startsWith('0x')) {
    errors.push(`${keyName} must start with '0x'`);
  }
  
  if (key.length !== 66) {
    errors.push(`${keyName} must be 64 hex characters (plus '0x' prefix)`);
  }
  
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
    errors.push(`${keyName} contains invalid characters (must be hex)`);
  }
  
  return errors;
}

/**
 * Validate URL format
 */
function validateUrl(url: string | undefined, urlName: string): string[] {
  const errors: string[] = [];
  
  if (!url) {
    errors.push(`${urlName} is required`);
    return errors;
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push(`${urlName} must use http:// or https://`);
    }
  } catch {
    errors.push(`${urlName} is not a valid URL`);
  }
  
  return errors;
}

/**
 * Validate environment configuration for deployment operations
 */
export function validateDeploymentConfig(config: EnvConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required private keys
  errors.push(...validatePrivateKey(config.suiPrivateKey, 'SUI_PRIVATE_KEY'));
  errors.push(...validatePrivateKey(config.ethPrivateKey, 'ETH_PRIVATE_KEY'));
  
  // Validate URLs (these have defaults so they should always be present)
  errors.push(...validateUrl(config.suiRpcUrl, 'SUI_RPC_URL'));
  errors.push(...validateUrl(config.ethRpcUrl, 'ETH_RPC_URL'));
  errors.push(...validateUrl(config.walrusPublisherUrl, 'WALRUS_PUBLISHER_URL'));
  errors.push(...validateUrl(config.walrusAggregatorUrl, 'WALRUS_AGGREGATOR_URL'));
  
  // Check for testnet usage
  if (config.suiRpcUrl?.includes('testnet')) {
    warnings.push('Using Sui testnet - make sure you have testnet SUI tokens');
  }
  
  if (config.ethRpcUrl?.includes('sepolia') || config.ethRpcUrl?.includes('goerli')) {
    warnings.push('Using Ethereum testnet - make sure your ENS name is on the same network');
  }
  
  if (config.walrusPublisherUrl?.includes('testnet')) {
    warnings.push('Using Walrus testnet - deployed sites will only be accessible on testnet');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment configuration for gateway operations
 */
export function validateGatewayConfig(config: EnvConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Gateway only needs read access, so no private keys required
  errors.push(...validateUrl(config.ethRpcUrl, 'ETH_RPC_URL'));
  errors.push(...validateUrl(config.walrusAggregatorUrl, 'WALRUS_AGGREGATOR_URL'));
  
  if (!config.gatewayDomain) {
    errors.push('GATEWAY_DOMAIN is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if all environment variables are set up correctly
 */
export function checkEnvironmentSetup(): ValidationResult {
  const config = loadEnvConfig();
  return validateDeploymentConfig(config);
}

/**
 * Print environment validation results to console
 */
export function printValidationResults(result: ValidationResult, operation: string = 'operation') {
  if (result.isValid) {
    console.log(`✅ Environment configuration is valid for ${operation}`);
  } else {
    console.log(`❌ Environment configuration has errors for ${operation}:`);
    result.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings:`);
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
}