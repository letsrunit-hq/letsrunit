/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDateEngine } from '../../src';

const engine = createDateEngine();

describe('createDateEngine query/queryAll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = '';

    // Set a fixed date for relative date testing: 2026-01-05
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));
  });

  it('finds element with "today" (Jan 5, 2026)', () => {
    document.body.innerHTML = `
      <div>Not a date</div>
      <div>Jan 5, 2026</div>
      <div>Another random text</div>
    `;
    const found = engine.query(document, 'today');
    expect(found?.textContent).to.eq('Jan 5, 2026');
  });

  it('finds element with "tomorrow" (Jan 6, 2026)', () => {
    document.body.innerHTML = `
      <div>Jan 5, 2026</div>
      <div>Jan 6, 2026</div>
      <div>Jan 7, 2026</div>
    `;
    const found = engine.query(document, 'tomorrow');
    expect(found?.textContent).to.eq('Jan 6, 2026');
  });

  it('finds element with "yesterday" (Jan 4, 2026)', () => {
    document.body.innerHTML = `
      <p>Post date: Jan 4, 2026</p>
      <p>Edit date: Jan 5, 2026</p>
    `;
    const found = engine.query(document, 'yesterday');
    expect(found?.textContent).to.eq('Post date: Jan 4, 2026');
  });

  it('finds element with relative date "2 days ago" (Jan 3, 2026)', () => {
    document.body.innerHTML = `
      <ul>
        <li>Jan 1, 2026</li>
        <li>Jan 2, 2026</li>
        <li>Jan 3, 2026</li>
        <li>Jan 4, 2026</li>
      </ul>
    `;
    const found = engine.query(document, '2 days ago');
    expect(found?.textContent).to.eq('Jan 3, 2026');
  });

  it('finds element with relative date "1 month from now" (Feb 5, 2026)', () => {
    document.body.innerHTML = `<div>Feb 5, 2026</div>`;
    const found = engine.query(document, '1 month from now');
    expect(found?.textContent).to.eq('Feb 5, 2026');
  });

  it('finds element with an absolute date string', () => {
    document.body.innerHTML = `<div>Dec 25, 2025</div>`;
    const found = engine.query(document, 'Dec 25, 2025');
    expect(found?.textContent).to.eq('Dec 25, 2025');
  });

  it('finds element with different date formatting in same locale', () => {
    document.body.innerHTML = `<div>01/05/2026</div>`;
    const found = engine.query(document, 'today');
    expect(found?.textContent).to.eq('01/05/2026');
  });

  it('returns all matches', () => {
    document.body.innerHTML = `
      <ul>
        <li>Jan 5, 2026</li>
        <li>2026-01-05</li>
        <li>Other</li>
      </ul>
    `;
    const all = engine.queryAll(document, 'today');
    expect(all).to.have.length(2);
    expect(all[0].textContent).to.eq('Jan 5, 2026');
    expect(all[1].textContent).to.eq('2026-01-05');
  });

  it('handles "ago" with other units like "1 year ago"', () => {
    document.body.innerHTML = `<div>Jan 5, 2025</div>`;
    const found = engine.query(document, '1 year ago');
    expect(found?.textContent).to.eq('Jan 5, 2025');
  });

  describe('different date formats', () => {
    it('finds short date format (MM/DD/YY)', () => {
      document.body.innerHTML = `<div>01/05/26</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('01/05/26');
    });

    it('finds long date format (Month D, YYYY)', () => {
      document.body.innerHTML = `<div>January 5, 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('January 5, 2026');
    });

    it('finds abbreviated month format (Jan 5, 2026)', () => {
      document.body.innerHTML = `<div>Jan 5, 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('Jan 5, 2026');
    });

    it('finds ISO format (YYYY-MM-DD)', () => {
      document.body.innerHTML = `<div>2026-01-05</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('2026-01-05');
    });

    it('finds dots as separators (05.01.2026)', () => {
      document.body.innerHTML = `<div>05.01.2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05.01.2026');
    });

    it('finds US format with dashes (01-05-2026)', () => {
      document.body.innerHTML = `<div>01-05-2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('01-05-2026');
    });

    it('finds date with ordinal suffix (January 5th, 2026)', () => {
      document.body.innerHTML = `<div>January 5th, 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('January 5th, 2026');
    });

    it('finds abbreviated month without year (Jan 5)', () => {
      document.body.innerHTML = `<div>Jan 5</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('Jan 5');
    });

    it('finds full month without year (January 5)', () => {
      document.body.innerHTML = `<div>January 5</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('January 5');
    });
  });

  describe('date with time', () => {
    it('finds date with time (Jan 5, 2026, 12:00 PM)', () => {
      document.body.innerHTML = `<div>Jan 5, 2026, 12:00 PM</div>`;
      const found = engine.query(document, 'Jan 5, 2026, 12:00 PM');
      expect(found?.textContent).to.eq('Jan 5, 2026, 12:00 PM');
    });

    it('finds today with specific time', () => {
      document.body.innerHTML = `<div>Jan 5, 2026, 3:00 PM</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('Jan 5, 2026, 3:00 PM');
    });

    it('finds tomorrow with specific time', () => {
      document.body.innerHTML = `<div>Jan 6, 2026, 10:00 AM</div>`;
      const found = engine.query(document, 'tomorrow at 10:00');
      expect(found?.textContent).to.eq('Jan 6, 2026, 10:00 AM');
    });

    it('finds date and time in 24h format', () => {
      document.body.innerHTML = `<div>2026-01-05 15:00</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('2026-01-05 15:00');
    });

    it('finds date with time and seconds', () => {
      document.body.innerHTML = `<div>Jan 5, 2026, 15:00:45</div>`;
      const found = engine.query(document, 'today at 15:00:45');
      expect(found?.textContent).to.eq('Jan 5, 2026, 15:00:45');
    });

    it('finds date with time and timezone', () => {
      document.body.innerHTML = `<div>Jan 5, 2026, 15:00 GMT+1</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('Jan 5, 2026, 15:00 GMT+1');
    });

    it('finds date with time and AM/PM without space', () => {
      document.body.innerHTML = `<div>Jan 5, 2026 3:00PM</div>`;
      const found = engine.query(document, 'today at 3:00 PM');
      expect(found?.textContent).to.eq('Jan 5, 2026 3:00PM');
    });
  });

  describe('Dutch locale (nl-NL)', () => {
    beforeEach(() => {
      document.documentElement.lang = 'nl-NL';
    });

    it('finds element with "today" in Dutch (5 jan. 2026)', () => {
      document.body.innerHTML = `
        <div>5 jan. 2025</div>
        <div>5 jan. 2026</div>
        <div>5 jan. 2027</div>
      `;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 jan. 2026');
    });

    it('finds element with "tomorrow" in Dutch (6 jan. 2026)', () => {
      document.body.innerHTML = `
        <span>6 jan. 2026</span>
        <span>7 jan. 2026</span>
      `;
      const found = engine.query(document, 'tomorrow');
      expect(found?.textContent).to.eq('6 jan. 2026');
    });

    it('finds element with "yesterday" in Dutch (4 jan. 2026)', () => {
      document.body.innerHTML = `<div>4 jan. 2026</div>`;
      const found = engine.query(document, 'yesterday');
      expect(found?.textContent).to.eq('4 jan. 2026');
    });

    it('finds element with relative date "2 days ago" in Dutch (3 jan. 2026)', () => {
      document.body.innerHTML = `<div>3 jan. 2026</div>`;
      const found = engine.query(document, '2 days ago');
      expect(found?.textContent).to.eq('3 jan. 2026');
    });

    it('finds long date format (5 januari 2026)', () => {
      document.body.innerHTML = `<div>5 januari 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 januari 2026');
    });

    it('finds short date format (05-01-2026)', () => {
      document.body.innerHTML = `<div>05-01-2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05-01-2026');
    });

    it('finds abbreviated month format (5 jan. 2026)', () => {
      document.body.innerHTML = `<div>5 jan. 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 jan. 2026');
    });

    it('finds date with time (5 jan. 2026 om 15:00)', () => {
      document.body.innerHTML = `<div>5 jan. 2026 om 15:00</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('5 jan. 2026 om 15:00');
    });

    it('finds date without year in Dutch (5 januari)', () => {
      document.body.innerHTML = `<div>5 januari</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 januari');
    });

    it('finds date with dots in Dutch (05.01.2026)', () => {
      document.body.innerHTML = `<div>05.01.2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05.01.2026');
    });

    it('finds date with slashes in Dutch (05/01/2026)', () => {
      document.body.innerHTML = `<div>05/01/2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05/01/2026');
    });

    it('finds date with abbreviated month and no dots (5 jan 2026)', () => {
      document.body.innerHTML = `<div>5 jan 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 jan 2026');
    });

    it('finds date with time including seconds in Dutch (5 jan. 2026 15:00:10)', () => {
      document.body.innerHTML = `<div>5 jan. 2026 15:00:10</div>`;
      const found = engine.query(document, 'today at 15:00:10');
      expect(found?.textContent).to.eq('5 jan. 2026 15:00:10');
    });

    it('finds date with full month and time (5 januari 2026, 15:00)', () => {
      document.body.innerHTML = `<div>5 januari 2026, 15:00</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('5 januari 2026, 15:00');
    });
  });

  describe('Japanese locale (ja-JP)', () => {
    beforeEach(() => {
      document.documentElement.lang = 'ja-JP';
    });

    it('finds date in Japanese format (2026/01/05)', () => {
      document.body.innerHTML = `<div>2026/01/05</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('2026/01/05');
    });

    it('finds date with kanji (2026年1月5日)', () => {
      document.body.innerHTML = `<div>2026年1月5日</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('2026年1月5日');
    });

    it('finds date with time in Japanese (2026年1月5日 15:00)', () => {
      document.body.innerHTML = `<div>2026年1月5日 15:00</div>`;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent).to.eq('2026年1月5日 15:00');
    });
  });

  describe('German locale (de-DE)', () => {
    beforeEach(() => {
      document.documentElement.lang = 'de-DE';
    });

    it('finds date in German format (05.01.2026)', () => {
      document.body.innerHTML = `<div>05.01.2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05.01.2026');
    });

    it('finds long date format in German (5. Januar 2026)', () => {
      document.body.innerHTML = `<div>5. Januar 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5. Januar 2026');
    });
  });

  describe('French locale (fr-FR)', () => {
    beforeEach(() => {
      document.documentElement.lang = 'fr-FR';
    });

    it('finds date in French format (05/01/2026)', () => {
      document.body.innerHTML = `<div>05/01/2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('05/01/2026');
    });

    it('finds long date format in French (5 janvier 2026)', () => {
      document.body.innerHTML = `<div>5 janvier 2026</div>`;
      const found = engine.query(document, 'today');
      expect(found?.textContent).to.eq('5 janvier 2026');
    });
  });

  describe('fragmented date parts', () => {
    it('finds date when time is in a separate bold element', () => {
      document.body.innerHTML = `
        <div>Other info</div>
        <div>Jan 5, 2026 <b>15:00</b></div>
        <div>More noise</div>
      `;
      const found = engine.query(document, 'today at 15:00');
      expect(found?.textContent?.trim()).to.eq('Jan 5, 2026 15:00');
    });

    it('finds date when month and day are in different spans', () => {
      document.body.innerHTML = `
        <div>
          <div>Not this one</div>
          <div><span>Jan</span> <span>5</span>, 2026</div>
        </div>
      `;
      const found = engine.query(document, 'today');
      expect((found?.textContent ?? '').replace(/\s+/g, ' ').trim()).to.eq('Jan 5, 2026');
    });

    it('finds date when parts are deeply nested', () => {
      document.body.innerHTML = `
        <div>
          <span>
            <b>Jan</b> 5,
          </span>
          <i>2026</i>
        </div>
      `;
      const found = engine.query(document, 'today');
      expect((found?.textContent ?? '').replace(/\s+/g, ' ').trim()).to.eq('Jan 5, 2026');
    });

    it('finds date across multiple div children', () => {
      document.body.innerHTML = `
        <div id="noise">
          <div>Yesterday</div>
          <div>Jan 4, 2026</div>
        </div>
        <div id="target">
          <div>Jan 5</div>
          <div>2026</div>
        </div>
        <div id="noise2">
          <div>Tomorrow</div>
          <div>Jan 6, 2026</div>
        </div>
      `;
      const found = engine.query(document, 'today');
      expect(found?.id).to.eq('target');
    });
  });
});
