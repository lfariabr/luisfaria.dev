/**
 * Goggins mode messages (#497). Original lines in a no-excuses tone, not quotes.
 * Two sets, matching the dialog's tone switch: `filtered` is clean, `explicit` masks
 * its profanity the way the old AI prompt asked for (f#ck).
 */

export const GOGGINS_SIGN_OFF = '- Goggins Mode';

export const FILTERED_SCREAMS: readonly string[] = [
  'Nobody is coming to save you. Get up, lace your shoes, and go be the person you keep promising yourself you will be.',
  'You are not tired. You are comfortable. Comfort is where your potential goes to die. Move.',
  'The voice telling you to stop is lying. You have barely touched what you have left. Go find out.',
  'You missed yesterday. Fine. Today is the only rep that counts. Do it now, not after one more scroll.',
  'Discipline is doing it when the motivation has left the building. Be the one who stays.',
  'Stop negotiating with yourself. The decision was made. Execute.',
  'Every excuse you make today is a debt your future self has to pay. Stop borrowing.',
  'Pain is information, not a stop sign. Read it, respect it, and keep going.',
  'You want different results while living the same day on repeat? Break the loop. Start with the hard thing.',
  'Nobody remembers the easy days. Go make today one worth remembering.',
  'Your goals do not care how you feel this morning. Show up anyway.',
  'Be uncomfortable on purpose, every single day. That is how the callus forms.',
  'Average is a choice you make one small surrender at a time. Stop surrendering.',
  'The work you are avoiding is the work that will change you. Go get it.',
  'You do not rise to the occasion. You fall to the level of your training. Train.',
  'Quit looking for the shortcut. The long way is the only way that sticks.',
  'Hold yourself accountable before life does it for you, because life is not gentle about it.',
  'Finish what you started. Half-done is just a more comfortable way of quitting.',
  'Stop waiting to be ready. Ready is a feeling you earn after you begin.',
  'One more rep. One more page. One more mile. That one is where you find out who you are.',
];

export const EXPLICIT_SCREAMS: readonly string[] = [
  'Get your a$$ off the couch. Nobody is coming to drag you to greatness, so drag yourself.',
  'You are not tired, you are soft. Stop f#ck#ng around and go earn some sleep.',
  'Your excuses are bullsh#t and deep down you know it. Shut them up with work.',
  'Stop whining about how hard it is. It is supposed to be hard. That is the whole damn point.',
  'The snooze button is not your friend. Get the hell up and go to war with your day.',
  'You said you would do it. So do it. Stop running your mouth and start running your legs.',
  'Comfort is a liar and you keep believing it. Quit being its b#tch and go suffer a little.',
  'Nobody gives a damn about your plans. They care what you do. Go do something.',
  'Stop scrolling, stop stalling, stop f#ck#ng waiting. The clock is not on your side.',
  'You want it? Then bleed a little for it. Wanting is free. Earning it costs.',
  'Quit acting surprised that you are out of shape. You built that. Now tear it down.',
  'Your mind will quit a hundred times before your body does. Tell it to shut the hell up.',
  'Hard day? Good. Hard days are where the weak ones tap out. Do not be one of them.',
  'Stop asking if you can. Ask why the hell you have not started yet.',
  'You keep starting over on Monday. F#ck Monday. Start right now.',
  'Talent is cheap. Grinding when nobody is watching is what separates you. Go grind.',
  'Every rep you skip is a vote for the soft version of you. Stop voting for him.',
  'You are capable of so much more than this half-a$$ed effort. Prove it today.',
  'Pain is temporary. Quitting sticks with you for the rest of your damn life. Choose.',
  'Get after it. Not tomorrow, not later, not when you feel like it. Now, m*th#rf*ck#r.',
];

/**
 * Pick a message for this tone, never the same text as `previousText` when there is a
 * choice. `random` is injectable for tests.
 */
export function pickScream(
  explicitMode: boolean,
  previousText?: string | null,
  random: () => number = Math.random,
): string {
  const pool = explicitMode ? EXPLICIT_SCREAMS : FILTERED_SCREAMS;
  const withSignOff = pool.map((line) => `${line}\n\n${GOGGINS_SIGN_OFF}`);
  const candidates = withSignOff.filter((text) => text !== previousText);
  const from = candidates.length > 0 ? candidates : withSignOff;
  return from[Math.floor(random() * from.length)];
}
