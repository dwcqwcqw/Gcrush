// Test Supabase connection and user_gallery table
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { user_id, test_data } = body;
        
        console.log('🧪 Testing Supabase connection...');
        console.log('📋 Environment check:');
        console.log('• SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL || 'Missing');
        console.log('• SUPABASE_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Available' : 'Missing');
        console.log('• User ID:', user_id);
        
        if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return new Response(JSON.stringify({
                error: 'Supabase environment variables missing',
                supabase_url: !!env.NEXT_PUBLIC_SUPABASE_URL,
                supabase_key: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Test 1: Check if user_gallery table exists
        console.log('🔍 Test 1: Checking user_gallery table...');
        const tableCheckResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_gallery?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Table check response:', tableCheckResponse.status);
        
        if (!tableCheckResponse.ok) {
            const errorText = await tableCheckResponse.text();
            console.error('❌ Table check failed:', errorText);
            return new Response(JSON.stringify({
                error: 'user_gallery table not accessible',
                status: tableCheckResponse.status,
                details: errorText
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Test 2: Try to insert test data
        console.log('🧪 Test 2: Inserting test data...');
        const testGalleryData = {
            user_id: user_id,
            image_url: 'https://example.com/test-image.png',
            filename: 'test-image.png',
            prompt: 'Test prompt',
            negative_prompt: 'Test negative prompt',
            character_name: 'Test Character',
            seed: 12345,
            generation_params: {
                test: true,
                width: 1080,
                height: 1440
            }
        };
        
        console.log('📤 Test data:', JSON.stringify(testGalleryData, null, 2));
        
        const insertResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_gallery`, {
            method: 'POST',
            headers: {
                'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testGalleryData)
        });
        
        console.log('📊 Insert response status:', insertResponse.status);
        const insertResponseText = await insertResponse.text();
        console.log('📄 Insert response body:', insertResponseText);
        
        if (!insertResponse.ok) {
            return new Response(JSON.stringify({
                error: 'Failed to insert test data',
                status: insertResponse.status,
                response: insertResponseText,
                test_data: testGalleryData
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Test 3: Try to read the data back
        console.log('🔍 Test 3: Reading data back...');
        const readResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_gallery?user_id=eq.${user_id}&limit=5`, {
            method: 'GET',
            headers: {
                'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const readData = await readResponse.text();
        console.log('📊 Read response status:', readResponse.status);
        console.log('📄 Read response data:', readData);
        
        return new Response(JSON.stringify({
            success: true,
            tests: {
                table_check: {
                    status: tableCheckResponse.status,
                    success: tableCheckResponse.ok
                },
                insert_test: {
                    status: insertResponse.status,
                    success: insertResponse.ok,
                    response: insertResponseText
                },
                read_test: {
                    status: readResponse.status,
                    success: readResponse.ok,
                    data: readData
                }
            },
            environment: {
                supabase_url: env.NEXT_PUBLIC_SUPABASE_URL,
                has_key: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('❌ Test error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
} 