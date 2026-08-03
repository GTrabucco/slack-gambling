import { describe, it, expect } from '@jest/globals';
import { calculatePickResult } from '../processpicksnew.js';

// Real game from 2025 Week 1: Philadelphia Eagles (home) 24, Dallas Cowboys (away) 20
const GAME = { homeTeam: 'Philadelphia Eagles', awayTeam: 'Dallas Cowboys', homeScore: '24', awayScore: '20' };

describe('calculatePickResult', () => {

    describe('favorite', () => {
        it('wins when home favorite covers (+1)', () => {
            // Eagles -3.5: 24 - 3.5 - 20 = 0.5 > 0
            expect(calculatePickResult({ type: 'favorite', text: 'Philadelphia Eagles -3.5', value: -3.5, ...GAME }, GAME)).toBe(1);
        });

        it('loses when home favorite fails to cover (-1)', () => {
            // Eagles -4.5: 24 - 4.5 - 20 = -0.5 < 0
            expect(calculatePickResult({ type: 'favorite', text: 'Philadelphia Eagles -4.5', value: -4.5, ...GAME }, GAME)).toBe(-1);
        });

        it('pushes when spread is exactly the margin (0)', () => {
            // Eagles -4: 24 - 4 - 20 = 0
            expect(calculatePickResult({ type: 'favorite', text: 'Philadelphia Eagles -4', value: -4, ...GAME }, GAME)).toBe(0);
        });

        it('wins when away dog covers (+1)', () => {
            // Cowboys +4.5: 20 + 4.5 - 24 = 0.5 > 0
            expect(calculatePickResult({ type: 'dog', text: 'Dallas Cowboys +4.5', value: 4.5, ...GAME }, GAME)).toBe(1);
        });

        it('loses when away dog fails to cover (-1)', () => {
            // Cowboys +3.5: 20 + 3.5 - 24 = -0.5 < 0
            expect(calculatePickResult({ type: 'dog', text: 'Dallas Cowboys +3.5', value: 3.5, ...GAME }, GAME)).toBe(-1);
        });

        it('throws on team name mismatch', () => {
            expect(() =>
                calculatePickResult({ type: 'favorite', text: 'Green Bay Packers -3', value: -3, ...GAME }, GAME)
            ).toThrow('Team mismatch');
        });
    });

    describe('over / under', () => {
        // Total = 24 + 20 = 44

        it('over wins when line is below total (+1)', () => {
            expect(calculatePickResult({ type: 'over', text: 'Over 43.5', value: 43.5, ...GAME }, GAME)).toBe(1);
        });

        it('over loses when line is above total (-1)', () => {
            expect(calculatePickResult({ type: 'over', text: 'Over 44.5', value: 44.5, ...GAME }, GAME)).toBe(-1);
        });

        it('over pushes when line equals total (0)', () => {
            expect(calculatePickResult({ type: 'over', text: 'Over 44', value: 44, ...GAME }, GAME)).toBe(0);
        });

        it('under wins when line is above total (+1)', () => {
            expect(calculatePickResult({ type: 'under', text: 'Under 44.5', value: 44.5, ...GAME }, GAME)).toBe(1);
        });

        it('under loses when line is below total (-1)', () => {
            expect(calculatePickResult({ type: 'under', text: 'Under 43.5', value: 43.5, ...GAME }, GAME)).toBe(-1);
        });

        it('under pushes when line equals total (0)', () => {
            expect(calculatePickResult({ type: 'under', text: 'Under 44', value: 44, ...GAME }, GAME)).toBe(0);
        });
    });

    describe('gotw', () => {
        it('spread win (+1)', () => {
            // Eagles -3.5: 24 - 3.5 - 20 = 0.5 > 0
            expect(calculatePickResult({ type: 'gotw', text: 'Philadelphia Eagles -3.5', value: -3.5, ...GAME }, GAME)).toBe(1);
        });

        it('spread loss (-1)', () => {
            expect(calculatePickResult({ type: 'gotw', text: 'Philadelphia Eagles -4.5', value: -4.5, ...GAME }, GAME)).toBe(-1);
        });

        it('over win (+1)', () => {
            expect(calculatePickResult({ type: 'gotw', text: 'Cowboys Eagles Over 43.5', value: 43.5, ...GAME }, GAME)).toBe(1);
        });

        it('over loss (-1)', () => {
            expect(calculatePickResult({ type: 'gotw', text: 'Cowboys Eagles Over 44.5', value: 44.5, ...GAME }, GAME)).toBe(-1);
        });

        it('under win (+1)', () => {
            expect(calculatePickResult({ type: 'gotw', text: 'Cowboys Eagles Under 44.5', value: 44.5, ...GAME }, GAME)).toBe(1);
        });

        it('under loss (-1)', () => {
            expect(calculatePickResult({ type: 'gotw', text: 'Cowboys Eagles Under 43.5', value: 43.5, ...GAME }, GAME)).toBe(-1);
        });
    });

    describe('invalid input', () => {
        it('throws on unknown pick type', () => {
            expect(() =>
                calculatePickResult({ type: 'mystery', text: 'foo', value: 3, ...GAME }, GAME)
            ).toThrow('Unknown pick type');
        });

        it('throws when score is not a number', () => {
            const badGame = { homeTeam: 'Philadelphia Eagles', awayTeam: 'Dallas Cowboys', homeScore: 'N/A', awayScore: '20' };
            expect(() =>
                calculatePickResult({ type: 'favorite', text: 'Philadelphia Eagles -3.5', value: -3.5, ...badGame }, badGame)
            ).toThrow();
        });
    });
});
