# WalrENS Deployment Guide

This guide covers deploying websites using WalrENS and setting up the infrastructure.

## Quick Deployment

### Using the Web Interface

1. **Start the site builder**:
   ```bash
   pnpm dev:site-builder
   ```

2. **Open http://localhost:3001** in your browser

3. **Follow the deployment wizard**:
   - Choose a template or upload files
   - Preview your site
   - Enter your ENS name
   - Deploy to Walrus Sites

### Using the CLI

1. **Install the CLI**:
   ```bash
   npm install -g @walrens/cli
   ```

2. **Set environment variables**:
   ```bash
   export SUI_PRIVATE_KEY=0x...
   export ETH_PRIVATE_KEY=0x...
   ```

3. **Deploy your website**:
   ```bash
   walrens deploy ./my-website mysite.eth --chain sepolia
   ```

## Detailed Setup

### Prerequisites

- Node.js 20 or higher
- pnpm package manager
- ENS name that you control
- Sui wallet with funds for transactions
- Ethereum wallet with funds for gas

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Required
SUI_PRIVATE_KEY=0x...
ETH_PRIVATE_KEY=0x...

# Optional (will use defaults)
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Website Structure

Your website should follow standard web structure:

```
my-website/
├── index.html          # Main entry point
├── css/
│   └── style.css      # Stylesheets
├── js/
│   └── script.js      # JavaScript files
├── images/
│   ├── logo.png       # Images and assets
│   └── background.jpg
└── favicon.ico        # Favicon
```

### Supported File Types

- **HTML**: `.html`, `.htm`
- **CSS**: `.css`
- **JavaScript**: `.js`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- **Fonts**: `.woff`, `.woff2`, `.ttf`, `.otf`
- **Documents**: `.pdf`, `.txt`, `.md`
- **Data**: `.json`, `.xml`

## Deployment Process

### 1. File Upload to Walrus

All website files are uploaded to Walrus storage:

```typescript
const files = [
  { path: 'index.html', content: htmlBuffer },
  { path: 'style.css', content: cssBuffer },
  // ... more files
]

const resources = await packageWebsite(files)
```

### 2. Walrus Site Creation

A Walrus Site object is created on Sui:

```typescript
const result = await createWalrusSite(
  siteName,
  resources,
  suiPrivateKey
)
```

### 3. ENS Text Record Update

Your ENS name is linked to the Walrus Site:

```typescript
await setEnsWalrusSite(ensName, result.objectId, {
  privateKey: ethPrivateKey,
  rpcUrl: ethRpcUrl
})
```

### 4. Gateway Serving

The gateway resolves ENS names and serves content:

```
yourname.eth → ENS text record → Walrus object ID → Served content
```

## Production Deployment

### Gateway Deployment

1. **Deploy to Cloudflare Workers**:
   ```bash
   cd apps/gateway
   pnpm deploy
   ```

2. **Configure custom domain** (optional):
   - Set up DNS records
   - Configure SSL certificates
   - Update gateway routing

3. **Set environment variables**:
   ```bash
   wrangler secret put ETH_RPC_URL
   wrangler secret put WALRUS_BASE
   ```

### Site Builder Deployment

1. **Build for production**:
   ```bash
   cd apps/site-builder
   pnpm build
   ```

2. **Deploy to hosting service**:
   - Vercel, Netlify, or any static host
   - Configure environment variables
   - Set up domain and SSL

## Advanced Configuration

### Custom Templates

Create custom templates in `apps/site-builder/src/templates/`:

```typescript
export const customTemplate = {
  id: 'custom',
  name: 'Custom Template',
  description: 'My custom template',
  generateHtml: (data) => `<!DOCTYPE html>...`,
  generateCss: (data) => `body { ... }`,
  fields: [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' }
  ]
}
```

### ENS Text Record Formats

WalrENS supports multiple ENS text record formats:

**Standard format** (recommended):
```json
{
  "type": "site",
  "objectId": "0x...",
  "network": "sui-testnet",
  "index": "index.html"
}
```

**Legacy format**:
```json
{
  "type": "site",
  "id": "0x...",
  "index": "index.html"
}
```

**Blob format** (for single files):
```
blob:blobId
```

### Gateway Configuration

Configure the gateway in `apps/gateway/wrangler.toml`:

```toml
name = "walrens-gateway"
compatibility_date = "2024-01-01"

[env.production]
vars = { WALRUS_BASE = "https://aggregator.walrus-mainnet.walrus.space/v1" }

[env.staging]
vars = { WALRUS_BASE = "https://aggregator.walrus-testnet.walrus.space/v1" }
```

## Troubleshooting

### Common Issues

**"ENS name not found"**
- Verify ENS name exists and is owned by your wallet
- Check that text record is set correctly
- Ensure gateway is using correct RPC endpoint

**"Walrus upload failed"**
- Check Walrus services are accessible
- Verify file size is under limits (10MB per file)
- Ensure Sui wallet has sufficient funds

**"Site not loading"**
- Check Walrus object ID is valid
- Verify all required files were uploaded
- Check browser console for errors

**"Transaction failed"**
- Ensure private key has sufficient funds
- Check network congestion
- Verify RPC endpoints are responsive

### Debug Mode

Enable debug logging:

```bash
export DEBUG=true
walrens deploy ./my-website mysite.eth --verbose
```

### Health Checks

Check service status:

```bash
# Check gateway
curl https://yourgateway.com/health

# Check Walrus services
curl https://publisher.walrus-testnet.walrus.space/v1/status

# Check ENS resolution
walrens status mysite.eth
```

## Best Practices

### File Organization

- Keep `index.html` as the main entry point
- Use relative paths for assets
- Optimize images for web (WebP, compressed)
- Minify CSS and JavaScript for production

### SEO Optimization

- Include meta tags in HTML
- Use semantic HTML structure
- Add alt text to images
- Include sitemap.xml and robots.txt

### Performance

- Compress assets before upload
- Use efficient image formats
- Minimize HTTP requests
- Leverage browser caching

### Security

- Sanitize user inputs in forms
- Use HTTPS for all resources
- Validate file uploads
- Keep dependencies updated

## Support

For deployment issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review logs with debug mode enabled
3. Open an issue on GitHub with details
4. Join our community for help

## Next Steps

After successful deployment:

- Set up monitoring and analytics
- Configure custom domains
- Set up automated deployments
- Explore advanced templates
- Integrate with CI/CD pipelines
