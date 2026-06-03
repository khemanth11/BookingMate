// Centralized API Configuration
// Replace the IP address here when your local network IP changes.
// Your current IP (from ipconfig): 10.33.72.195

const IP_ADDRESS = '10.33.72.195';
const PORT = '5000';

export const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

export default {
    BASE_URL,
    IP_ADDRESS,
    PORT
};
