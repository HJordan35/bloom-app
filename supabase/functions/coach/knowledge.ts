// The coach's brewing primer, in our own words. Bump KNOWLEDGE_VERSION on every change.
export const KNOWLEDGE_VERSION = "k1";

export const KNOWLEDGE = `# Brewing knowledge

## What the cup is telling you

Extraction runs sour → sweet → bitter. Too little and the cup is sour, sharp, salty, thin, with a quick finish. Too much and it's bitter, drying (astringent), hollow, with a harsh lingering finish. Strength is separate: watery or heavy is about ratio, not extraction.

- Sour, sharp, thin, salty → extract more: grind finer; or hotter water; or more contact time or agitation.
- Bitter, drying, harsh → extract less: grind coarser; or cooler water; or less agitation.
- Sour AND bitter together, or drying with a fast brew → uneven extraction (channeling, a tilted bed, clumps, poor pouring). Fix evenness before grind: gentler, more even pours, a level bed, a swirl after the bloom, better puck prep for espresso.
- Weak, watery but balanced → more coffee per water (tighter ratio). Too heavy, intense → more water per coffee.
- Flat, dull, papery → stale coffee or too-cool water; rinse the paper; for very fresh coffee (under a week off roast) gassy, sharp cups improve with rest or a longer bloom.
- Good but muted sweetness → slightly finer or slightly hotter, one small step.

## Which lever first

1. Grind: the biggest lever, and the first to move. Small steps: one or two clicks on a hand grinder, a small notch on an electric one.
2. Ratio: for strength.
3. Temperature: a finishing lever, about 2–3°C (5°F) at a time.
4. Agitation and pour structure: more pours, higher pours, stirring and swirling all extract more.
5. Time is mostly a result of grind and pouring in pour-over, not something to set directly. Use it as a reading: a drawdown far longer than usual means too fine or a clogged bed.

Change one thing per brew, keep the rest fixed.

## Roast level

- Light: dense, harder to extract. Hotter water (96–100°C / 205–212°F), finer grind, more agitation, longer ratios (1:16–1:17). Sour is the usual fault.
- Medium: 92–96°C / 198–205°F, 1:15–1:16.
- Dark: soluble and fragile. Cooler water (85–92°C / 185–198°F), coarser grind, less agitation, tighter ratios (1:14–1:15). Bitter is the usual fault.

Washed coffees take more extraction than naturals; naturals and very fresh coffee produce more fines and gas, so brew them a touch coarser with a longer bloom. Decaf grinds and extracts easily: go coarser and a little cooler.

## Methods

### V60
Cone, fast flow, rewards technique. Start: 15 g to 250 g (1:16.5), medium-fine, 2:30–3:30 total. Bloom with 2–3× the dose in water for 30–45 s and swirl or stir to wet everything. Then either one steady pour (cleaner, lighter body) or several pulses (more extraction). A gentle swirl after the last pour levels the bed. Hoffmann's well-known approach: boiling water, a 45 s bloom with a swirl, pour to 60% by 1:15 and the rest by 1:45, a gentle stir and a swirl, done near 3:30. A common five-pour approach (Kasuya's 4:6) uses a coarser grind and splits the water 40/60 to steer sweetness against strength. Stalled or slow drawdown: coarser, or less agitation, since fines are clogging the paper.

### Kalita (Wave)
Flat bed, three small holes: forgiving and even, a bit more body than V60. Start: 20 g to 320 g (1:16), medium, 3:00–3:30. Bloom 30–45 s, then pulse pours of about 50–60 g, keeping the bed covered. Keep the stream off the filter's ridges. If it stalls, the holes are blocked by fines: grind coarser.

### BeeHouse
Wedge with two small holes: slower and more restricted than a V60, so it behaves between pour-over and immersion and tolerates plain pouring. Start: 20 g to 320 g (1:16), medium (a touch coarser than V60), 3:00–3:30. Bloom 30–45 s, then two or three even pours. Its restriction adds contact time, so bitterness usually means go coarser before anything else.

### Chemex
Thick paper: very clean, light body, slow flow. Start: 30 g to 500 g (1:16.5), medium-coarse, 4:00–5:00. Rinse the filter well, keep the three-layer side on the spout. Bloom 45 s, then two or three large pours. The thick paper strips oils, so it suits light and medium roasts; if it tastes thin, go finer or tighten the ratio. A drawdown past 5:30 means too fine.

### Pulsar
No-bypass brewer with a valve, so you control flow and contact time, and all the water goes through the bed. Extraction is high: grind noticeably coarser than for V60 and use longer ratios (1:17 and up). Start: 20 g to 340 g, medium-coarse. Close the valve, bloom with 3× the dose for 1–2 minutes with a swirl, open the valve, and add the rest in two to four gentle pours, letting the bed nearly drain between them; 4–6 minutes total. Keep agitation low; the dispersion cap does the work. Bitter or drying: coarser first. Hedrick's published approach for it is a long closed-valve bloom followed by slow, low-agitation pours.

### AeroPress
Immersion plus pressure; very forgiving and easy to steer. Start: 15 g to 230 g (about 1:15), medium-fine, water 85–95°C depending on roast, steep 2:00, then a slow 30 s press, stopping at the hiss. Hoffmann's approach: 11 g to 200 g, light roasts with boiling water, no bloom, wait 2 minutes, swirl, wait 30 s, press gently. Sour: finer, hotter, or a longer steep. Bitter: coarser or cooler. Inverted or not matters little; a gentle press matters more.

### French Press
Full immersion, metal filter: heavy body. Start: 30 g to 500 g (1:16–1:17), medium-coarse to coarse, water just off the boil. Steep 4 minutes, break the crust and skim the foam, then wait another 5 minutes or more for the grounds to settle before pouring gently, without plunging deep (Hoffmann's method). Muddy or bitter: coarser, and don't agitate after the steep. Weak: finer or more coffee, rather than a longer steep.

### Espresso
Ratio by weight, dose to yield. Start: 18 g in, 36 g out (1:2) in 25–32 s, 93°C / 200°F. Light roasts: longer ratios (1:2.5–1:3), hotter (94–96°C), often longer shots. Dark roasts: shorter ratios (1:1.5–1:2), cooler (88–91°C). Keep the dose fixed for the basket and dial with grind first: sour and fast → finer; bitter and slow → coarser. Then use yield for balance: sour → more yield; bitter or harsh → less. Sour and bitter at once, spurting, or an uneven puck means channeling: fix distribution (stir the grounds, level, tamp flat) before touching grind. For espresso, volume_ml is the yield and brew time is the shot time.

### Moka
Steam pressure pushes water through the bed; easy to scorch. Fill the base with hot water to just below the valve, fill the basket level without tamping, grind fine but coarser than espresso. Medium-low heat, lid open; when the stream turns pale and starts to sputter, take it off and cool the base under the tap to stop it. Bitter or burnt: lower heat, stop earlier, grind coarser. Sour or thin: finer, or start with hotter water. It makes a strong, short cup (about 1:7–1:10); dilute to taste.
`;
