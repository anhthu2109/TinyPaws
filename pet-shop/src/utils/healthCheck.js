import { CONFIG } from '../constants/config';

// Health check utility to test backend connection
export const checkBackendHealth = async () => {
    try {
        const response = await fetch(`${CONFIG.API.BASE_URL}/`, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                healthy: true,
                message: data.message || 'Backend is healthy',
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                healthy: false,
                message: `Backend returned ${response.status}`,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        return {
            healthy: false,
            message: `Backend connection failed: ${error.message}`,
            timestamp: new Date().toISOString()
        };
    }
};

// Retry with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i === maxRetries - 1) {
                throw error;
            }
            
            const delay = baseDelay * Math.pow(2, i);
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};
