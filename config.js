// Configuration file for API keys and settings
const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://kuflobojizyttadwcbhe.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw',
    
    // RunPod Configuration
    RUNPOD_TEXT_ENDPOINT_ID: '4cx6jtjdx6hdhr',
    get RUNPOD_API_URL() {
        const endpointId = window.RUNPOD_TEXT_ENDPOINT_ID || this.RUNPOD_TEXT_ENDPOINT_ID;
        return `https://api.runpod.ai/v2/${endpointId}/`;
    },
    get RUNPOD_API_KEY() {
        return window.RUNPOD_API_KEY || 'YOUR_RUNPOD_API_KEY_HERE';
    },
    MODEL_NAME: 'L3.2-8X4B.gguf',
    
    // Chat Configuration
    MAX_TOKENS: 150,
    TEMPERATURE: 0.8,
    TOP_P: 0.9,
    STOP_SEQUENCES: ["\n\n", "User:", "Human:"],
    
    // UI Configuration
    USER_AVATAR: 'https://via.placeholder.com/36x36/ff6b9d/ffffff?text=U',
    DEFAULT_CHARACTER_IMAGE: 'https://via.placeholder.com/50x50/ff6b9d/ffffff?text=C'
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
} 