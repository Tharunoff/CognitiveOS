const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');

export function startKeepAlive() {
    const ping = async () => {
        try {
            await fetch(`${BACKEND_URL}/health`);
        } catch (e) {
            // silent fail — do not throw or log
        }
    };

    ping(); // ping immediately on app load to wake backend early
    setInterval(ping, 10 * 60 * 1000); // then every 10 minutes
}
