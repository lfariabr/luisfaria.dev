/**
 * Interface for the NASA APOD API response.
 * media_type can be 'image' or 'video'.
 */

interface ApodResponse {
    copyright?: string;
    date: string;
    explanation: string;
    media_type: string;
    service_version: string;
    title: string;
    url: string;
    hdurl?: string;
}

/**
 * Service function to fetch the Astronomy Picture of the Day.
 * @param apiKey Your NASA API key (defaults to 'DEMO_KEY' for testing).
 * @param date Optional date in YYYY-MM-DD format.
 * @returns A promise that resolves to an ApodResponse object.
 */

export async function fetchApod(apiKey: string, date?: string): Promise<ApodResponse> {
    const baseUrl = 'https://api.nasa.gov/planetary/apod?';
    let url = `${baseUrl}api_key=${apiKey}`;
    
    if (date) {
        url += `&date=${date}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Cast JSON response to ApodResponse
        const data = await response.json() as ApodResponse;

        return data;

    }
    catch (error) {
        console.error('Error fetching APOD:', error);
        throw error;
    }
}