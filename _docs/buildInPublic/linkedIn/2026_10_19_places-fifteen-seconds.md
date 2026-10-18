# LinkedIn post - Places: log a coffee in 15 seconds

Video: the before (35s) and after ([X]s) recordings side by side, or the after recording alone.
Put the GitHub / dev.to link in the FIRST comment, not the body, so the post is not down-ranked for an outbound link.
Fill in [X] with the re-recorded time before posting.

---

I asked Nayara to log one coffee on my open source app and record her screen.

It worked. It took 35 seconds.

Watching it frame by frame, almost none of that time was the app being slow. It was the form getting in the way:

- The iPhone keyboard pushed the form's header off the screen and hid the Save button
- Safari decided a field called "Payment" meant a credit card form and offered to fill it in
- The place she picked showed up as raw coordinates
- Typing "4,50" with a decimal comma silently emptied the amount
- After saving, she had to pinch the map to find what she'd just added

None of these would fail a test, and every one of them cost her time.

So I wrote the goal down as a number: same person, same flow, under 15 seconds.

10 small PRs later, each one checked on a real iPhone before the next merged, the same coffee takes [X] seconds.

Most of the fixes were one line:
→ visualViewport to keep the sheet above the keyboard
→ autocomplete off and neutral field names to stop the card autofill
→ inputMode="decimal" instead of type="number"
→ touch-action: pan-x pan-y to stop the whole page zooming

The rest swapped typing for tapping: chips built from past entries, payment preselected, and the map flying to the new pin after you save.

What I'm taking from it: "make it smoother" is a wish. "Under 15 seconds, recorded on her phone" is something you can finish. Once we hit it, I closed three of the four nice-to-have issues as not needed.

Code and the full write-up in the first comment 👇

#OpenSource #WebDev #UX #NextJS #BuildInPublic
