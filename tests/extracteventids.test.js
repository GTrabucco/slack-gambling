import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractEventIds } from '../processpicksnew.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const boxscore = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'test-boxscore.json'), 'utf8')
);

const EXPECTED_IDS = [
    '401772510', '401772714', '401772830', '401772829',
    '401772719', '401772720', '401772718', '401772721',
    '401772827', '401772828', '401772832', '401772831',
    '401772722', '401772723', '401772918', '401772810',
];

describe('extractEventIds', () => {
    it('extracts all 16 event IDs from the real boxscore response', () => {
        const ids = extractEventIds({ data: boxscore });
        expect(ids).toHaveLength(16);
    });

    it('extracts IDs in the correct order', () => {
        const ids = extractEventIds({ data: boxscore });
        expect(ids).toEqual(EXPECTED_IDS);
    });

    it('strips query params from the ref URL', () => {
        const ids = extractEventIds({ data: boxscore });
        expect(ids.every(id => !id.includes('?'))).toBe(true);
    });

    it('returns only numeric strings', () => {
        const ids = extractEventIds({ data: boxscore });
        expect(ids.every(id => /^\d+$/.test(id))).toBe(true);
    });

    it('returns empty array when items is empty', () => {
        const ids = extractEventIds({ data: { items: [] } });
        expect(ids).toEqual([]);
    });

    it('returns empty array when response has no data', () => {
        const ids = extractEventIds({});
        expect(ids).toEqual([]);
    });
});
