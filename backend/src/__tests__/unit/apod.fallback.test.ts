import { readFileSync } from 'fs';
import { join } from 'path';
import { parseApodHtml, fetchApodHtmlFallback } from '../../services/apod/apod.fallback';
import { ApodServiceError } from '../../services/apod/apod.errors';

// Trimmed copies of science.nasa.gov/apod/ (today) and ?date=261112, saved 2026-11-14 (#499).
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name), 'utf8');
const TODAY = fixture('apod-science-today.html');
const DATED = fixture('apod-science-dated.html');

describe('parseApodHtml', () => {
  it("reads today's picture from the hero block, not the header logo", () => {
    const apod = parseApodHtml(TODAY, '2026-11-14');

    expect(apod.url).toBe(
      'https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/november/Andromeda_closeupCruz4096.jpg?w=2048&h=1451&fit=clip&crop=faces%2Cfocalpoint',
    );
    expect(apod.url).not.toMatch(/nasa-logo/);
    expect(apod.hdurl).toBe(
      'https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/november/Andromeda_closeupCruz4096.jpg',
    );
    expect(apod.media_type).toBe('image');
    expect(apod.title).toBe('NGC 206 and the Star Clouds of Andromeda');
    expect(apod.explanation).toMatch(/^The large stellar association cataloged as NGC 206/);
    expect(apod.explanation).not.toMatch(/Explanation:|<|Tomorrow/);
  });

  it("takes the page's own date over the caller's guess", () => {
    // The page is on US time: at 2026-11-14 UTC it still shows the 13th.
    expect(parseApodHtml(TODAY, '2026-11-14').date).toBe('2026-11-13');
    expect(parseApodHtml(DATED, '2026-01-01').date).toBe('2026-11-12');
  });

  it('reads a dated page, whose title is an h1 and Date row has no colon', () => {
    const apod = parseApodHtml(DATED, '2026-11-12');

    expect(apod.title).toBe('Moon, Venus and Spica Meet');
    expect(apod.url).toMatch(/conjunction-bubak\.jpg/);
    expect(apod.explanation).toMatch(/triple system\.$/);
  });

  it('reads an embedded video as a video', () => {
    const html = TODAY.replace(/<img[^>]*Andromeda[^>]*>/, '<iframe src="https://www.youtube.com/embed/abc?rel=0&amp;x=1"></iframe>');
    const apod = parseApodHtml(html, '2026-11-14');

    expect(apod.media_type).toBe('video');
    expect(apod.url).toBe('https://www.youtube.com/embed/abc?rel=0&x=1');
    expect(apod.hdurl).toBeUndefined();
  });

  it('throws instead of returning the logo when the hero block is gone', () => {
    const redesigned = TODAY.replace(/media-detail-hero__media/g, 'something-else');

    expect(() => parseApodHtml(redesigned, '2026-11-14')).toThrow(ApodServiceError);
  });

  it('throws when the hero block has no image or video', () => {
    const empty = TODAY.replace(/<img[^>]*Andromeda[^>]*>/, '');

    expect(() => parseApodHtml(empty, '2026-11-14')).toThrow('APOD hero block has no image or video');
  });
});

describe('fetchApodHtmlFallback', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("asks for that day's page and parses it", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => DATED });
    global.fetch = fetchMock as unknown as typeof fetch;

    const apod = await fetchApodHtmlFallback('2026-11-12');

    expect(fetchMock).toHaveBeenCalledWith('https://science.nasa.gov/apod/?date=261112', expect.any(Object));
    expect(apod.title).toBe('Moon, Venus and Spica Meet');
  });

  it("asks for today's page without a date", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => TODAY });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchApodHtmlFallback();

    expect(fetchMock).toHaveBeenCalledWith('https://science.nasa.gov/apod/', expect.any(Object));
  });

  it('raises an ApodServiceError on a non-2xx page', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => '' }) as unknown as typeof fetch;

    await expect(fetchApodHtmlFallback()).rejects.toMatchObject({ code: 'NASA_API_ERROR', statusCode: 503 });
  });
});
