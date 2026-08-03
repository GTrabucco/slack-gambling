import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn()
    }
}));

const { default: axios } = await import('axios');
const { getGames } = await import('../theoddsapinew.js');

// Real response captured from DraftKings via The Odds API (2026-08-03)
const REAL_ODDS_API_RESPONSE = [
    {
        id: "8c94552d022acec4a0458d70c19d3da9",
        sport_key: "americanfootball_nfl",
        sport_title: "NFL",
        commence_time: "2026-09-10T00:15:00Z",
        home_team: "Seattle Seahawks",
        away_team: "New England Patriots",
        bookmakers: [{
            key: "draftkings",
            title: "DraftKings",
            last_update: "2026-08-03T18:17:19Z",
            markets: [
                {
                    key: "spreads",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "New England Patriots", price: -110, point: 3.5 },
                        { name: "Seattle Seahawks", price: -110, point: -3.5 }
                    ]
                },
                {
                    key: "totals",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Over", price: -110, point: 44.5 },
                        { name: "Under", price: -110, point: 44.5 }
                    ]
                }
            ]
        }]
    },
    {
        id: "acc580d74344ea3b31bbcdd057fe6a9c",
        sport_key: "americanfootball_nfl",
        sport_title: "NFL",
        commence_time: "2026-09-11T00:35:00Z",
        home_team: "Los Angeles Rams",
        away_team: "San Francisco 49ers",
        bookmakers: [{
            key: "draftkings",
            title: "DraftKings",
            last_update: "2026-08-03T18:17:19Z",
            markets: [
                {
                    key: "spreads",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Los Angeles Rams", price: -105, point: -3.5 },
                        { name: "San Francisco 49ers", price: -115, point: 3.5 }
                    ]
                },
                {
                    key: "totals",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Over", price: -110, point: 48.5 },
                        { name: "Under", price: -110, point: 48.5 }
                    ]
                }
            ]
        }]
    },
    {
        id: "95c01d1bb797d6df14824b106c5a9130",
        sport_key: "americanfootball_nfl",
        sport_title: "NFL",
        commence_time: "2026-09-13T17:00:00Z",
        home_team: "Pittsburgh Steelers",
        away_team: "Atlanta Falcons",
        bookmakers: [{
            key: "draftkings",
            title: "DraftKings",
            last_update: "2026-08-03T18:17:19Z",
            markets: [
                {
                    key: "spreads",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Atlanta Falcons", price: 100, point: 3 },
                        { name: "Pittsburgh Steelers", price: -120, point: -3 }
                    ]
                },
                {
                    key: "totals",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Over", price: -110, point: 41.5 },
                        { name: "Under", price: -110, point: 41.5 }
                    ]
                }
            ]
        }]
    },
    {
        id: "b6cfdcbafa61ce220ba87dc2d9b80c77",
        sport_key: "americanfootball_nfl",
        sport_title: "NFL",
        commence_time: "2026-09-13T17:00:00Z",
        home_team: "Indianapolis Colts",
        away_team: "Baltimore Ravens",
        bookmakers: [{
            key: "draftkings",
            title: "DraftKings",
            last_update: "2026-08-03T18:17:19Z",
            markets: [
                {
                    key: "spreads",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Baltimore Ravens", price: -110, point: -3.5 },
                        { name: "Indianapolis Colts", price: -110, point: 3.5 }
                    ]
                },
                {
                    key: "totals",
                    last_update: "2026-08-03T18:17:17Z",
                    outcomes: [
                        { name: "Over", price: -110, point: 48.5 },
                        { name: "Under", price: -110, point: 48.5 }
                    ]
                }
            ]
        }]
    }
];

beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({ data: REAL_ODDS_API_RESPONSE });
});

describe('getGames', () => {
    describe('parsing real API response', () => {
        it('returns the correct number of games', async () => {
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            expect(games).toHaveLength(4);
        });

        it('correctly parses a home favorite (Seattle -3.5)', async () => {
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            const game = games.find(g => g.home_team === 'Seattle Seahawks');
            expect(game.gameId).toBe('8c94552d022acec4a0458d70c19d3da9');
            expect(game.home_team).toBe('Seattle Seahawks');
            expect(game.away_team).toBe('New England Patriots');
            expect(game.home_spread).toBe('-3.5');
            expect(game.away_spread).toBe('3.5');
            expect(game.over).toBe('44.5');
            expect(game.under).toBe('44.5');
            expect(game.commence_time).toBe('2026-09-10T00:15:00Z');
        });

        it('correctly parses a home favorite (LA Rams -3.5)', async () => {
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            const game = games.find(g => g.home_team === 'Los Angeles Rams');
            expect(game.home_spread).toBe('-3.5');
            expect(game.away_spread).toBe('3.5');
            expect(game.over).toBe('48.5');
            expect(game.under).toBe('48.5');
        });

        it('correctly parses an away favorite (Baltimore -3.5 at Indianapolis)', async () => {
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            const game = games.find(g => g.home_team === 'Indianapolis Colts');
            expect(game.home_spread).toBe('3.5');
            expect(game.away_spread).toBe('-3.5');
        });

        it('correctly parses a whole number spread (Pittsburgh -3)', async () => {
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            const game = games.find(g => g.home_team === 'Pittsburgh Steelers');
            expect(game.home_spread).toBe('-3');
            expect(game.away_spread).toBe('3');
        });

        it('returns null spreads/totals if bookmakers is empty', async () => {
            jest.resetAllMocks();
            axios.get.mockResolvedValueOnce({
                data: [{
                    id: 'no-lines',
                    commence_time: '2026-09-13T17:00:00Z',
                    home_team: 'Buffalo Bills',
                    away_team: 'Miami Dolphins',
                    bookmakers: []
                }]
            });
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            expect(games[0].home_spread).toBeNull();
            expect(games[0].away_spread).toBeNull();
            expect(games[0].over).toBeNull();
            expect(games[0].under).toBeNull();
        });

        it('returns empty array if API call throws', async () => {
            jest.resetAllMocks();
            axios.get.mockRejectedValueOnce(new Error('Network error'));
            const games = await getGames(new Date('2026-09-08'), new Date('2026-09-15'));
            expect(games).toEqual([]);
        });
    });
});
