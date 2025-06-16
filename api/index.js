// api/index.js - Einfache funktionierende Version
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  console.log(`${method} ${url}`);

  try {
    // Health Check
    if (url.includes('/health') || url === '/api/health') {
      return res.status(200).json({ 
        status: 'API funktioniert!',
        timestamp: new Date().toISOString(),
        method: method,
        url: url
      });
    }

    // Root API
    if (url === '/api' || url === '/api/') {
      return res.status(200).json({ 
        message: 'ProfiSlots API ist online!',
        status: 'working',
        endpoints: [
          'GET /api/health - Status check',
          'POST /api/test - Test endpoint'
        ]
      });
    }

    // Test Endpoint
    if (url.includes('/test')) {
      return res.status(200).json({ 
        message: 'Test erfolgreich!',
        data: {
          method: method,
          url: url,
          headers: req.headers,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 404 für andere Routen
    return res.status(404).json({ 
      error: 'Endpoint nicht gefunden',
      availableEndpoints: ['/api/health', '/api/test'],
      requestedUrl: url
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Server Error',
      message: error.message
    });
  }
};
