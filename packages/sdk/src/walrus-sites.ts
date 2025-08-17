import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import JSZip from 'jszip';
// Browser-compatible MIME type detection
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Web files
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'txt': 'text/plain',
    'md': 'text/markdown',
    
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    
    // Fonts
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'eot': 'application/vnd.ms-fontobject',
    
    // Documents
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    
    // Media
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
};
import { WalrusMapping } from './index.js';

export interface WalrusResource {
  path: string;
  blobId: string;
  contentType: string;
  headers?: Record<string, string>;
}

export interface WalrusSite {
  objectId: string;
  name: string;
  resources: WalrusResource[];
  metadata?: Record<string, any>;
}

export interface WalrusSiteOptions {
  suiRpcUrl?: string;
  walrusPublisherUrl?: string;
  walrusAggregatorUrl?: string;
}

export interface DeploymentResult {
  objectId: string;
  transactionHash: string;
  resources: WalrusResource[];
  previewUrl: string;
}

const DEFAULT_OPTIONS: Required<WalrusSiteOptions> = {
  suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
  walrusPublisherUrl: 'https://publisher.walrus-testnet.walrus.space',
  walrusAggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space'
};

/**
 * Upload a single file to Walrus storage
 */
export async function uploadToWalrus(
  content: Uint8Array | Buffer | string,
  options: WalrusSiteOptions = {}
): Promise<string> {
  const { walrusPublisherUrl } = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const formData = new FormData();
    
    // Convert content to blob
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: 'text/plain' });
    } else {
      blob = new Blob([new Uint8Array(content)], { type: 'application/octet-stream' });
    }
    
    formData.append('file', blob);
    
    const response = await fetch(`${walrusPublisherUrl}/v1/store`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.alreadyCertified) {
      return result.alreadyCertified.blobId;
    } else if (result.newlyCreated) {
      return result.newlyCreated.blobObject.blobId;
    } else {
      throw new Error('Unexpected Walrus response format');
    }
  } catch (error) {
    throw new Error(`Failed to upload to Walrus: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get content from Walrus by blob ID
 */
export async function getWalrusContent(
  blobId: string,
  options: WalrusSiteOptions = {}
): Promise<Uint8Array> {
  const { walrusAggregatorUrl } = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await fetch(`${walrusAggregatorUrl}/v1/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to get Walrus content: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Package website files into a structure suitable for Walrus Sites
 */
export async function packageWebsite(
  files: Array<{ path: string; content: Uint8Array | Buffer | string }>,
  options: WalrusSiteOptions = {}
): Promise<WalrusResource[]> {
  const resources: WalrusResource[] = [];
  
  for (const file of files) {
    // Determine content type from file extension
    const contentType = getMimeType(file.path);
    
    // Upload to Walrus
    const blobId = await uploadToWalrus(file.content, options);
    
    // Create resource entry
    resources.push({
      path: file.path.startsWith('/') ? file.path : `/${file.path}`,
      blobId,
      contentType,
      headers: {
        'Content-Type': contentType
      }
    });
  }
  
  return resources;
}

/**
 * Create a Walrus Site object on Sui blockchain
 */
export async function createWalrusSite(
  name: string,
  resources: WalrusResource[],
  suiPrivateKey: string,
  options: WalrusSiteOptions = {}
): Promise<DeploymentResult> {
  const { suiRpcUrl } = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Initialize Sui client and keypair
    const client = new SuiClient({ url: suiRpcUrl });
    const keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(Buffer.from(suiPrivateKey.replace('0x', ''), 'hex')));
    const sender = keypair.getPublicKey().toSuiAddress();
    
    // Create transaction to create Walrus Site object
    const txb = new TransactionBlock();
    
    // For now, we'll store the site metadata as a simple object
    // In a real implementation, this would use the official Walrus Sites package
    const siteData = {
      name,
      resources: resources.map(r => ({
        path: r.path,
        blobId: r.blobId,
        contentType: r.contentType
      })),
      created: Date.now()
    };
    
    // TODO: Replace with official Walrus Sites Move package call
    // This is a placeholder implementation - the actual Walrus Sites package would be used here
    // Expected format: 
    // const moveCallResult = txb.moveCall({
    //   target: '0x<WALRUS_SITES_PACKAGE>::site::new_site',
    //   arguments: [
    //     txb.pure(name),
    //     txb.pure(resources),
    //     // additional site metadata
    //   ]
    // });
    
    // For now, create a simple object as a placeholder
    const moveCallResult = txb.moveCall({
      target: '0x2::object::new',
      arguments: []
    });
    
    // Store the site metadata temporarily in transaction metadata
    // In real implementation, this would be stored in the Walrus Sites object
    
    // Set transaction sender and gas budget
    txb.setSender(sender);
    txb.setGasBudget(10000000); // 0.01 SUI (increased for actual site creation)
    
    // Sign and execute transaction
    const response = await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });
    
    if (!response.effects?.status?.status || response.effects.status.status !== 'success') {
      throw new Error('Transaction failed');
    }
    
    // Extract created object ID
    const createdObjects = response.objectChanges?.filter(
      change => change.type === 'created'
    ) || [];
    
    if (createdObjects.length === 0) {
      throw new Error('No objects created in transaction');
    }
    
    const objectId = (createdObjects[0] as any).objectId;
    
    return {
      objectId,
      transactionHash: response.digest,
      resources,
      previewUrl: `https://${name}.walrus.site` // This would be the actual preview URL
    };
  } catch (error) {
    throw new Error(`Failed to create Walrus Site: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deploy a complete website to Walrus Sites
 */
export async function deployWebsiteToWalrus(
  siteName: string,
  files: Array<{ path: string; content: Uint8Array | Buffer | string }>,
  suiPrivateKey: string,
  options: WalrusSiteOptions = {}
): Promise<DeploymentResult> {
  try {
    // Package website files
    const resources = await packageWebsite(files, options);
    
    // Create Walrus Site object
    const result = await createWalrusSite(siteName, resources, suiPrivateKey, options);
    
    return result;
  } catch (error) {
    throw new Error(`Failed to deploy website: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Walrus Site information by object ID
 */
export async function getWalrusSite(
  objectId: string,
  options: WalrusSiteOptions = {}
): Promise<WalrusSite | null> {
  const { suiRpcUrl } = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const client = new SuiClient({ url: suiRpcUrl });
    const object = await client.getObject({
      id: objectId,
      options: { showContent: true }
    });
    
    if (!object.data) {
      return null;
    }
    
    // Parse object content - this would depend on the actual Walrus Sites object structure
    // For now, return a placeholder structure
    return {
      objectId,
      name: 'Unknown Site',
      resources: [],
      metadata: {}
    };
  } catch (error) {
    console.error('Error getting Walrus Site:', error);
    return null;
  }
}

/**
 * Validate that a Walrus Site object exists and is accessible
 */
export async function validateWalrusSite(
  objectId: string,
  options: WalrusSiteOptions = {}
): Promise<boolean> {
  try {
    const site = await getWalrusSite(objectId, options);
    return site !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Create WalrusMapping for ENS text record
 */
export function createWalrusSiteMapping(objectId: string, index: string = 'index.html'): WalrusMapping {
  return {
    type: 'site',
    id: objectId,
    index
  };
}
