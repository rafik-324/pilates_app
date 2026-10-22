import { contrastRatio } from '../contrast';
import { themes } from '../themes';

const AA = 4.5;

describe.each(Object.values(themes))('Theme $id: WCAG-AA-Kontraste', (theme) => {
  describe.each(['light', 'dark'] as const)('%s', (scheme) => {
    const c = theme.colors[scheme];
    const pairs: [string, string, string][] = [
      ['text/background', c.text, c.background],
      ['text/surface', c.text, c.surface],
      ['textMuted/background', c.textMuted, c.background],
      ['accentText/background', c.accentText, c.background],
      ['successText/background', c.successText, c.background],
      ['dangerText/background', c.dangerText, c.background],
      ['onInverse/inverse', c.onInverse, c.inverse],
      ['onAccent/accent', c.onAccent, c.accent],
      ['onAccent/accentGradient[0]', c.onAccent, c.accentGradient[0]],
      ['onAccent/accentGradient[1]', c.onAccent, c.accentGradient[1]],
      ['onSuccess/success', c.onSuccess, c.success],
      ['onDanger/danger', c.onDanger, c.danger],
    ];
    it.each(pairs)('%s', (_name, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
    });
  });
});
