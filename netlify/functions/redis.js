// Netlify Function to proxy Upstash Redis requests
// This bypasses CORS issues by routing requests through the server

exports.handler = async (event) => {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed', result: null })
        };
    }

    try {
        // Parse the request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error('Invalid JSON in request body:', event.body);
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Invalid JSON', result: null })
            };
        }

        const { command } = body;

        // Validate command exists
        if (!command || !Array.isArray(command)) {
            console.error('Invalid command format:', command);
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Invalid command format', result: null })
            };
        }

        // Get Upstash credentials from environment variables
        const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        // Log what we have (without exposing full credentials)
        console.log('Environment check:', {
            hasUrl: !!upstashUrl,
            hasToken: !!upstashToken,
            urlStart: upstashUrl ? upstashUrl.substring(0, 20) + '...' : 'MISSING',
            command: command.join(' ')
        });

        if (!upstashUrl || !upstashToken) {
            console.error('Missing Upstash credentials!');
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: 'Upstash credentials not configured in Netlify environment variables. Check Site Settings → Environment Variables.',
                    result: null
                })
            };
        }

        // Build the full URL - encode the command parts properly
        const encodedCommand = command.map(part => encodeURIComponent(part)).join('/');
        const url = `${upstashUrl}/${encodedCommand}`;

        console.log('Making request to Upstash...');

        // Make request to Upstash
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${upstashToken}`
            }
        });

        console.log('Upstash response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upstash error response:', errorText);
            throw new Error(`Upstash error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Success! Result type:', typeof data.result);

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
        console.error('Error stack:', error.stack);
        
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
