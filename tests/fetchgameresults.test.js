import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'test-summary.json'), 'utf8')
);

jest.unstable_mockModule('axios', () => ({
    default: { get: jest.fn() }
}));

const { default: axios } = await import('axios');
const { fetchGameResults } = await import('../processpicksnew.js');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('fetchGameResults', () => {
    it('returns home and away team names and scores from real summary fixture', async () => {
        axios.get.mockResolvedValueOnce({ data: summary });

        const results = await fetchGameResults(['401772510']);

        expect(results).toHaveLength(1);
        expect(results[0].homeTeam).toBe('Philadelphia Eagles');
        expect(results[0].awayTeam).toBe('Dallas Cowboys');
        expect(results[0].homeScore).toBe('24');
        expect(results[0].awayScore).toBe('20');
    });

    it('calls the correct ESPN summary URL', async () => {
        axios.get.mockResolvedValueOnce({ data: summary });

        await fetchGameResults(['401772510']);

        expect(axios.get).toHaveBeenCalledWith(
            'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401772510'
        );
    });

    it('fetches one game per event ID', async () => {
        axios.get
            .mockResolvedValueOnce({ data: summary })
            .mockResolvedValueOnce({ data: summary });

        const results = await fetchGameResults(['401772510', '401772714']);

        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(results).toHaveLength(2);
    });

    it('returns empty array for empty event list', async () => {
        const results = await fetchGameResults([]);
        expect(results).toEqual([]);
        expect(axios.get).not.toHaveBeenCalled();
    });
});
