// Netlify Function to proxy Upstash Redis requests
// This bypasses CORS issues by routing requests through the server

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { command } = JSON.parse(event.body);

        // Validate command exists
        if (!command || !Array.isArray(command)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid command format' })
            };
        }

        // Get Upstash credentials from environment variables
        const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!upstashUrl || !upstashToken) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Upstash credentials not configured in Netlify environment variables' 
                })
            };
        }

        // Build the full URL
        const url = `${upstashUrl}/${command.join('/')}`;

        // Make request to Upstash
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${upstashToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Upstash error: ${response.status}`);
        }

        const data = await response.json();

        // Return the result with CORS headers
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Redis proxy error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: error.message,
                result: null 
            })
        };
    }
};
