import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock axios BEFORE importing the module under test
jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn()
    }
}));

const { default: axios } = await import('axios');
const { processPicks } = await import('../processpicksnew.js');

const mockBoxscoresResponse = (eventIds) => ({
    status: 200,
    data: {
        items: eventIds.map(id => ({ '$ref': `https://example.com/events/${id}?lang=en` }))
    }
});

const mockSummaryResponse = (homeTeam, awayTeam, homeScore, awayScore) => ({
    data: {
        header: {
            competitions: [{
                competitors: [
                    { homeAway: 'home', team: { displayName: homeTeam }, score: homeScore },
                    { homeAway: 'away', team: { displayName: awayTeam }, score: awayScore }
                ]
            }]
        }
    }
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('processPicks', () => {

    describe('input validation', () => {
        it('throws on invalid season', async () => {
            await expect(processPicks('abc', '1', '2', [])).rejects.toThrow('Invalid input parameters');
        });

        it('throws on invalid week', async () => {
            await expect(processPicks('2025', '0', '2', [])).rejects.toThrow('Invalid input parameters');
        });

        it('throws on invalid weekType', async () => {
            await expect(processPicks('2025', '1', '4', [])).rejects.toThrow('Invalid input parameters');
        });
    });

    describe('favorite / dog picks', () => {
        beforeEach(() => {
            axios.get
                .mockResolvedValueOnce(mockBoxscoresResponse(['event1']))
                .mockResolvedValueOnce(mockSummaryResponse('Green Bay Packers', 'Washington Commanders', '24', '17'));
        });

        it('favorite wins (+1)', async () => {
            const picks = [{ type: 'favorite', text: 'Green Bay Packers -3.5', value: -3.5, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1); // 24 - 3.5 - 17 = 3.5 > 0
        });

        it('favorite loses (-1)', async () => {
            const picks = [{ type: 'favorite', text: 'Green Bay Packers -10', value: -10, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1); // 24 - 10 - 17 = -3 < 0
        });

        it('push (0)', async () => {
            const picks = [{ type: 'favorite', text: 'Green Bay Packers -7', value: -7, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(0); // 24 - 7 - 17 = 0
        });

        it('dog loses (-1)', async () => {
            const picks = [{ type: 'dog', text: 'Washington Commanders +3.5', value: 3.5, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1); // 17 + 3.5 - 24 = -3.5 < 0
        });

        it('throws on team mismatch', async () => {
            const picks = [{ type: 'favorite', text: 'Dallas Cowboys -3', value: -3, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            await expect(processPicks('2025', '1', '2', picks)).rejects.toThrow('Team mismatch');
        });
    });

    describe('over / under picks', () => {
        beforeEach(() => {
            axios.get
                .mockResolvedValueOnce(mockBoxscoresResponse(['event1']))
                .mockResolvedValueOnce(mockSummaryResponse('Green Bay Packers', 'Washington Commanders', '24', '17'));
        });

        it('over wins (+1)', async () => {
            const picks = [{ type: 'over', text: 'Packers Commanders Over 38', value: 38, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1); // 41 > 38
        });

        it('over loses (-1)', async () => {
            const picks = [{ type: 'over', text: 'Packers Commanders Over 45', value: 45, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1); // 41 < 45
        });

        it('under wins (+1)', async () => {
            const picks = [{ type: 'under', text: 'Packers Commanders Under 45', value: 45, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1); // 41 < 45
        });

        it('under loses (-1)', async () => {
            const picks = [{ type: 'under', text: 'Packers Commanders Under 38', value: 38, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1); // 41 > 38
        });
    });

    describe('gotw picks', () => {
        beforeEach(() => {
            axios.get
                .mockResolvedValueOnce(mockBoxscoresResponse(['event1']))
                .mockResolvedValueOnce(mockSummaryResponse('Green Bay Packers', 'Washington Commanders', '24', '17'));
        });

        it('gotw spread win (+1)', async () => {
            const picks = [{ type: 'gotw', text: 'Green Bay Packers -3.5', value: -3.5, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1);
        });

        it('gotw spread loss (-1)', async () => {
            const picks = [{ type: 'gotw', text: 'Green Bay Packers -10', value: -10, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1);
        });

        it('gotw over win (+1)', async () => {
            const picks = [{ type: 'gotw', text: 'Packers Commanders Over 38', value: 38, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1);
        });

        it('gotw over loss (-1)', async () => {
            const picks = [{ type: 'gotw', text: 'Packers Commanders Over 45', value: 45, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1);
        });

        it('gotw under win (+1)', async () => {
            const picks = [{ type: 'gotw', text: 'Packers Commanders Under 45', value: 45, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1);
        });

        it('gotw under loss (-1)', async () => {
            const picks = [{ type: 'gotw', text: 'Packers Commanders Under 38', value: 38, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(-1);
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            axios.get
                .mockResolvedValueOnce(mockBoxscoresResponse(['event1']))
                .mockResolvedValueOnce(mockSummaryResponse('Green Bay Packers', 'Washington Commanders', '24', '17'));
        });

        it('skips picks with existing result', async () => {
            const picks = [{ type: 'favorite', text: 'Green Bay Packers -3.5', value: -3.5, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders', result: 1 }];
            const result = await processPicks('2025', '1', '2', picks);
            expect(result[0].result).toBe(1);
        });

        it('throws on unknown pick type', async () => {
            const picks = [{ type: 'mystery', text: 'some text', value: 3, homeTeam: 'Green Bay Packers', awayTeam: 'Washington Commanders' }];
            await expect(processPicks('2025', '1', '2', picks)).rejects.toThrow('Unknown pick type');
        });
    });
});
