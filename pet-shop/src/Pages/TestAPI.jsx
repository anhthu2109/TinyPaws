import { useState } from 'react';
import { publicApi } from '../api/publicApi';
import { CONFIG } from '../constants/config';

const TestAPI = () => {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testEndpoint = async (endpoint) => {
        setLoading(true);
        setResult('Testing...');
        
        try {
            const response = await publicApi.get(endpoint);
            setResult(`✅ Success!\n${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setResult(`❌ Error!\nStatus: ${error.response?.status}\nMessage: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Config</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify({ BASE_URL: CONFIG.API.BASE_URL }, null, 2)}
                    </pre>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>
                    <div className="space-y-2">
                        <button
                            onClick={() => testEndpoint('/api/products')}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={loading}
                        >
                            Test: /api/products
                        </button>
                        <button
                            onClick={() => testEndpoint('/api/products/69020b9efd1c20bfa9507261')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            disabled={loading}
                        >
                            Test: /api/products/:id
                        </button>
                        <button
                            onClick={() => testEndpoint('/products')}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            disabled={loading}
                        >
                            Test: /products (should fail)
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Result</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap">
                            {result}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestAPI;
