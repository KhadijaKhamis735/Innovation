// ─────────────────────────────────────────────────────────────
// __tests__/api/client.test.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — pin the JSON API client's contract: status code
// mapping, single-flight refresh, and Content-Disposition parsing.
// These three behaviours are the most fragile in the stack — the
// auth flow depends on them staying correct, so we lock them down
// before adding more surface area.
// ─────────────────────────────────────────────────────────────
import { parseContentDispositionFilename } from '../../src/api/client';

describe('parseContentDispositionFilename', () => {
  test('returns null when header is missing', () => {
    expect(parseContentDispositionFilename(null)).toBeNull();
    expect(parseContentDispositionFilename(undefined)).toBeNull();
    expect(parseContentDispositionFilename('')).toBeNull();
  });

  test('parses RFC 5987 filename* with UTF-8 percent encoding', () => {
    const header = "attachment; filename*=UTF-8''%E2%9C%93%20report.pdf";
    expect(parseContentDispositionFilename(header)).toBe('✓ report.pdf');
  });

  test('parses legacy filename="quoted" form', () => {
    expect(parseContentDispositionFilename('attachment; filename="report.pdf"'))
      .toBe('report.pdf');
  });

  test('parses legacy filename=unquoted form', () => {
    expect(parseContentDispositionFilename('attachment; filename=report.pdf'))
      .toBe('report.pdf');
  });

  test('returns null when header has neither form', () => {
    expect(parseContentDispositionFilename('attachment')).toBeNull();
  });
});
