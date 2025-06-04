/**
 * Parse metadata JSON and extract key information
 * @param {Object} metadata - The parsed JSON metadata object
 * @returns {Object} Parsed information
 */
export function parseMetadata(metadata) {
    return {
        name: metadata.name || 'Unknown',
        totalPoints: metadata.points || 0,
        elevationRange: calculateElevationRange(metadata),
        boundingBox: metadata.boundingBox || null,
        spacing: metadata.spacing || 0,
        version: metadata.version || 'Unknown',
        optimalPointBudget: calculateOptimalPointBudget(metadata) // Add this line
    };
}

/**
 * Calculate optimal pointcloud budget from metadata
 * @param {Object} metadata - The metadata object
 * @returns {int} - recommended point budget 
 */

export function calculateOptimalPointBudget(metadata) {
    const totalPoints = metadata.points || 0;
    
    // Calculate optimal budget based on total points
    // Use 10-30% of total points for good performance/quality balance
    let optimalBudget;
    
    if (totalPoints < 1_000_000) {
        // Small point clouds - use most points
        optimalBudget = Math.max(100_000, totalPoints * 0.8);
    } else if (totalPoints < 10_000_000) {
        // Medium point clouds - use 20-30%
        optimalBudget = totalPoints * 0.25;
    } else {
        // Large point clouds - cap at reasonable limit
        optimalBudget = Math.min(5_000_000, totalPoints * 0.15);
    }
    
    // Round to nearest 100k for cleaner values
    return Math.round(optimalBudget / 100_000) * 100_000;
}


/**
 * Calculate elevation range from metadata
 * @param {Object} metadata - The metadata object
 * @returns {Array} [minElevation, maxElevation]
 */
export function calculateElevationRange(metadata) {
    // Method 1: Use bounding box (most reliable)
    if (metadata.boundingBox && metadata.boundingBox.min && metadata.boundingBox.max) {
        const minZ = metadata.boundingBox.min[2]; // Z is elevation (index 2)
        const maxZ = metadata.boundingBox.max[2];
        return [minZ, maxZ];
    }
    
    // Method 2: Use position attribute if bounding box not available
    const positionAttribute = metadata.attributes?.find(attr => attr.name === 'position');
    if (positionAttribute && positionAttribute.min && positionAttribute.max) {
        const minZ = positionAttribute.min[2];
        const maxZ = positionAttribute.max[2];
        return [minZ, maxZ];
    }
    
    // Fallback: return null if no elevation data found
    console.warn('No elevation data found in metadata');
    return [0, 0];
}

/**
 * Load and parse point cloud metadata from JSON file
 * @param {String} metadataPath - Path to metadata.json file
 * @returns {Promise} Promise that resolves with parsed metadata info
 */
export async function loadPointCloudMetadata(metadataPath) {
    try {
        const response = await fetch(metadataPath);
        const metadata = await response.json();
        return parseMetadata(metadata);
    } catch (error) {
        console.error('Error loading metadata:', error);
        throw error;
    }
}

