import { createClient } from '@supabase/supabase-js'

// Use backend proxy to avoid CORS issues
const supabaseUrl = window.location.origin + '/api/v1/supabase'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGNqbHdhcGJld2NpeWp2Z29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDMwNDksImV4cCI6MjA4NjkxOTA0OX0.kg-bbJt9ameZiSxalOdfWbtE7DOUurPxgzWdQvofgPo'

// NUCLEAR OPTION: Override XMLHttpRequest and fetch to BLOCK ALL HEAD requests
const originalXHROpen = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
    if (method.toUpperCase() === 'HEAD') {
        console.warn('[BLOCKED XHR] HEAD request to:', url)
        // Don't call original open, just return
        return
    }
    return originalXHROpen.call(this, method, url, async, username, password)
}

// Override global fetch PERMANENTLY
const originalFetch = window.fetch
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const method = (init?.method || 'GET').toUpperCase()
    
    if (method === 'HEAD') {
        const url = typeof input === 'string' ? input : (input as Request).url
        console.warn('[BLOCKED FETCH] HEAD request to:', url)
        // Return fake response immediately
        return Promise.resolve(new Response('{}', {
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'Content-Type': 'application/json' }),
        }))
    }
    
    return originalFetch.call(this, input, init)
}

// Create Supabase client with aggressive settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    global: {
        headers: {
            'X-Supabase-Proxy': 'true',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: -1
        }
    }
})

// Disable realtime completely
supabase.channel = function() {
    return {
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
        unsubscribe: () => {},
        send: () => {},
    } as any
}

supabase.removeAllChannels()
