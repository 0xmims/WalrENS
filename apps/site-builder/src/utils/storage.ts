export interface DeployedSite {
  id: string
  ensName: string
  objectId: string
  transactionHash: string
  deployedAt: Date
  filesCount: number
  template?: string
  status: 'active' | 'deploying' | 'error'
  previewUrl?: string
  gatewayUrl: string
  lastChecked?: Date
}

const STORAGE_KEY = 'walrens_deployed_sites'

/**
 * Get all deployed sites from localStorage
 */
export function getDeployedSites(): DeployedSite[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const sites = JSON.parse(stored)
    return sites.map((site: any) => ({
      ...site,
      deployedAt: new Date(site.deployedAt),
      lastChecked: site.lastChecked ? new Date(site.lastChecked) : undefined
    }))
  } catch (error) {
    console.error('Error loading deployed sites:', error)
    return []
  }
}

/**
 * Save a deployed site to localStorage
 */
export function saveDeployedSite(site: Omit<DeployedSite, 'id' | 'deployedAt'>): DeployedSite {
  const sites = getDeployedSites()
  
  const newSite: DeployedSite = {
    ...site,
    id: generateSiteId(),
    deployedAt: new Date()
  }
  
  // Remove any existing site with the same ENS name
  const filteredSites = sites.filter(s => s.ensName !== site.ensName)
  
  // Add the new site
  const updatedSites = [newSite, ...filteredSites]
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSites))
    return newSite
  } catch (error) {
    console.error('Error saving deployed site:', error)
    throw new Error('Failed to save site information')
  }
}

/**
 * Update an existing deployed site
 */
export function updateDeployedSite(id: string, updates: Partial<DeployedSite>): boolean {
  const sites = getDeployedSites()
  const siteIndex = sites.findIndex(s => s.id === id)
  
  if (siteIndex === -1) {
    return false
  }
  
  sites[siteIndex] = { ...sites[siteIndex], ...updates }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
    return true
  } catch (error) {
    console.error('Error updating deployed site:', error)
    return false
  }
}

/**
 * Remove a deployed site from localStorage
 */
export function removeDeployedSite(id: string): boolean {
  const sites = getDeployedSites()
  const filteredSites = sites.filter(s => s.id !== id)
  
  if (filteredSites.length === sites.length) {
    return false // Site not found
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSites))
    return true
  } catch (error) {
    console.error('Error removing deployed site:', error)
    return false
  }
}

/**
 * Get a specific deployed site by ID
 */
export function getDeployedSite(id: string): DeployedSite | null {
  const sites = getDeployedSites()
  return sites.find(s => s.id === id) || null
}

/**
 * Get a specific deployed site by ENS name
 */
export function getDeployedSiteByEns(ensName: string): DeployedSite | null {
  const sites = getDeployedSites()
  return sites.find(s => s.ensName.toLowerCase() === ensName.toLowerCase()) || null
}

/**
 * Clear all deployed sites (for testing/reset)
 */
export function clearDeployedSites(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing deployed sites:', error)
  }
}

/**
 * Generate a unique site ID
 */
function generateSiteId(): string {
  return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Export sites data for backup
 */
export function exportSitesData(): string {
  const sites = getDeployedSites()
  return JSON.stringify(sites, null, 2)
}

/**
 * Import sites data from backup
 */
export function importSitesData(data: string): boolean {
  try {
    const sites = JSON.parse(data)
    
    // Validate the data structure
    if (!Array.isArray(sites)) {
      throw new Error('Invalid data format: expected array')
    }
    
    for (const site of sites) {
      if (!site.ensName || !site.objectId) {
        throw new Error('Invalid site data: missing required fields')
      }
    }
    
    // Convert date strings back to Date objects
    const processedSites = sites.map((site: any) => ({
      ...site,
      deployedAt: new Date(site.deployedAt),
      lastChecked: site.lastChecked ? new Date(site.lastChecked) : undefined
    }))
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processedSites))
    return true
  } catch (error) {
    console.error('Error importing sites data:', error)
    return false
  }
}