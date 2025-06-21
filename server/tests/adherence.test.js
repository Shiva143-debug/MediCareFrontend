// server/tests/adherence.test.js
import { describe, it, expect } from 'vitest';
import { calculateAdherence } from '../utils/adherence';

describe('Adherence Calculation', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateAdherence(0, 0)).toBe(0);
  });

  it('calculates correct percentage', () => {
    expect(calculateAdherence(2, 4)).toBe(50.00);
  });

  it('handles full adherence', () => {
    expect(calculateAdherence(5, 5)).toBe(100.00);
  });
});
