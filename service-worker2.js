self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    console.log('Intercepted request:', url);

    if (url.includes('https://o4508213881274368.ingest.us.sentry.io') ||
        url.includes('https://directory.cookieyes.com')) {
        event.respondWith(
            (async () => {
                try {
                    const response = await fetch(event.request);
                    const headers = new Headers(response.headers);
                    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' sentry.io https://log.cookieyes.com/ https://cdn-cookieyes.com/ https://o4508213881274368.ingest.us.sentry.io https://directory.cookieyes.com;");
                    console.log('Modified CSP Header:', headers.get('Content-Security-Policy'));
                    return new Response(response.body, {
                        headers: headers
                    });
                } catch (error) {
                    console.error('Error fetching resource:', error);
                }
            })()
        );
    }
});