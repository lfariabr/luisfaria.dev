import {
  EXPLICIT_SCREAMS,
  FILTERED_SCREAMS,
  GOGGINS_SIGN_OFF,
  pickScream,
} from '../../data/gogginsScreams';

describe('Goggins mode messages', () => {
  it('has 20 distinct lines per tone', () => {
    for (const pool of [FILTERED_SCREAMS, EXPLICIT_SCREAMS]) {
      expect(pool).toHaveLength(20);
      expect(new Set(pool).size).toBe(20);
    }
  });

  it('keeps the filtered set free of profanity, masked or not', () => {
    for (const line of FILTERED_SCREAMS) {
      expect(line).not.toMatch(/[#$*]|damn|hell|bullsh/i);
    }
  });

  it('picks from the pool that matches the tone, with the sign-off', () => {
    const filtered = pickScream(false, null, () => 0);
    const explicit = pickScream(true, null, () => 0);
    expect(filtered).toBe(`${FILTERED_SCREAMS[0]}\n\n${GOGGINS_SIGN_OFF}`);
    expect(explicit).toBe(`${EXPLICIT_SCREAMS[0]}\n\n${GOGGINS_SIGN_OFF}`);
  });

  it('never repeats the previous message for that email', () => {
    const previous = pickScream(false, null, () => 0);
    // A random value that would land on the same line again
    expect(pickScream(false, previous, () => 0)).not.toBe(previous);
  });
});
