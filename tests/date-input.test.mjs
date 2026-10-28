import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateInput, parseDateInput } from '../src/scripts/shared/date-input.js';

test('ambiguous input follows the page language and maps equivalent dates to the same ISO value', () => {
    assert.equal(parseDateInput('06/09/1997', true), '1997-09-06');
    assert.equal(parseDateInput('06/09/1997', false), '1997-06-09');
    assert.equal(parseDateInput('09/06/1997', true), parseDateInput('06/09/1997', false));
    assert.equal(formatDateInput('1997-06-09', true), '09/06/1997');
    assert.equal(formatDateInput('1997-06-09', false), '06/09/1997');
});

test('keyboard input accepts compact digits and normalizes short day/month components', () => {
    for (const br of [true, false]) {
        assert.equal(parseDateInput('29022000', br), br ? '2000-02-29' : null);
        assert.equal(parseDateInput('02292000', br), br ? null : '2000-02-29');
        assert.equal(formatDateInput(parseDateInput('6/9/1997', br), br), '06/09/1997');
        assert.equal(parseDateInput(' 06/09/1997 ', br), parseDateInput('06/09/1997', br));
    }
});

test('invalid calendar dates and malformed formats are rejected without rollover or locale guessing', () => {
    for (const br of [true, false]) {
        assert.equal(parseDateInput('', br), '');
        for (const value of ['1997-06-09', '31/02/2001', '02/31/2001', '29/02/1900', '02/29/1900', '00/01/2000', '01/00/2000', '6/9/97', 'hello', '06-09-1997', '01/01/0000']) {
            assert.equal(parseDateInput(value, br), null, `${value} (${br ? 'PT-BR' : 'EN'})`);
        }
    }
});
