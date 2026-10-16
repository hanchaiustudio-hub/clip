# Clip

A tiny, dependency-free paperclip buddy for the web. One `<script>` tag, and you
get an animated character you can script with a Promise-based API.

Ported from the NuMAP viewer's "Clippy" easter egg (Ctrl + click the logo).

## Quick start

```html
<script src="./clip.js"></script>
<script>
  var clip = Clip.create({ x: 40, y: 300 });   // fixed-position, bottom-left area
  clip.greet('Hello!');                        // full walk-in -> blink -> say -> pop
</script>
```

`clip.js` injects its own styles automatically (a `<style id="clip-styles">`).
Prefer an external stylesheet instead? Load `clip.css` yourself and pass
`autoStyle: false`.

## Files

| File | Purpose |
| --- | --- |
| `clip.js` | The library. Exposes `window.Clip`. Self-contained (embeds CSS). |
| `clip.css` | The same styles as a standalone stylesheet. |
| `demo.html` | Interactive demo of every action. |

Open `demo.html` in a browser (or serve the folder) to try it.

## `Clip.create(options)`

Creates a character on the page and returns a `Clip` instance.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `container` | Element | `document.body` | Where the element is appended. |
| `position` | string | `'fixed'` | CSS `position` for the root. Use `'absolute'` for in-page staging. |
| `x`, `y` | number | `0` | Initial position in px. |
| `anchor` | Element | – | Position relative to this element instead of `x`/`y`. |
| `anchorOffset` | `{x,y}` | `{0,0}` | Offset from the anchor's bottom-left corner. |
| `dark` | boolean | `false` | Dark theme. |
| `pointer` | boolean | `true` | `false` hides the little speech-bubble tail. |
| `scale` | number | `1` | Visual scale. |
| `zIndex` | number | `9999` | Stacking order for the root. |
| `autoStyle` | boolean | `true` | Inject the built-in stylesheet. Set `false` to use `clip.css`. |
| `walkMs` | number | `2000` | Default walk-in duration. |
| `moveMs` | number | `1200` | Default `walkTo`/`moveBy` duration. |
| `blinkMs` | number | `800` | Default single-blink duration. |
| `blink2Ms` | number | `1400` | Default double-blink duration. |
| `bubbleMs` | number | `400` | Default speech-bubble transition. |
| `popMs` | number | `1000` | Default pop-out duration. |
| `turnMs` | number | `900` | Default turn (swivel) duration. |

Every method accepts an `options` object whose `duration` (or the matching
`*Ms` key) overrides the instance default for that call.

## API

All action methods return a `Promise` that resolves with the instance when the
action is finished, so they chain cleanly:

```js
clip.appear().then(function () { return clip.say('Hi'); }).then(function () {
  return clip.pop();
});
```

### Movement / visibility

| Method | Description |
| --- | --- |
| `appear(opts?)` | Fade/walk in. `opts.from` = `'left'` (default) or `'right'`; `opts.duration`. |
| `disappear(opts?)` | Hide instantly, or fade out over `opts.duration` ms. |
| `walkTo(x, y, opts?)` | Slide to `(x, y)` px. `opts.duration`. |
| `moveBy(dx, dy, opts?)` | Slide by a delta. `opts.duration`. |
| `setPosition(x, y)` | Jump to a position (no animation). Returns the instance. |
| `getPosition()` | Returns `{ x, y }`. |

### Orientation

The character faces right by default. Turning swivels it around its vertical axis
and the new facing persists until you change it.

| Method | Description |
| --- | --- |
| `turnLeft(opts?)` | Swivel to face left. `opts.duration`. Turning left while already facing left replays a full 360° spin. |
| `turnRight(opts?)` | Swivel to face right. `opts.duration`. Turning right while already facing right replays a full 360° spin. |

### Expression

| Method | Description |
| --- | --- |
| `blink(times?, opts?)` | Blink. `times` >= 2 uses the double-blink animation. |
| `say(text, opts?)` | Show the bubble. `opts.duration` = how long to hold, in ms (0/omitted = stay). Resolves once shown/held. |
| `hideBubble(opts?)` | Hide the bubble. |
| `pop(opts?)` | Shrink-and-vanish, then reset to hidden. |

### Sequences

| Method | Description |
| --- | --- |
| `greet(text, opts?)` | The full routine: walk in, blink twice, say `text`, blink, pop. `opts.hold` = how long the message stays (default `3000`). |
| `play(steps)` | Run an array of `{ do: 'method', args: [...] }` steps in order. |

```js
clip.play([
  { do: 'appear' },
  { do: 'blink', args: [2] },
  { do: 'say', args: ['Ready!', { duration: 1500 }] },
  { do: 'pop' }
]);
```

### Events & lifecycle

| Method | Description |
| --- | --- |
| `on(name, fn)` / `off(name, fn)` | Subscribe/unsubscribe. Names: `appear`, `disappear`, `move`, `turn`, `blink`, `say`, `pop`. |
| `destroy()` | Clear timers, handlers, and remove the element. |

## Styling

The look is driven by CSS classes and variables on `.clip-root`:

- State classes: `is-on`, `is-say`, `is-blink1`, `is-blink2`, `is-pop`, `is-move`, `clip-face-left`.
- Variables: `--clip-scale`, `--clip-walk`, `--clip-move`, `--clip-turn`, `--clip-blink1`,
  `--clip-blink2`, `--clip-bubble`, `--clip-pop`.
- Themes: `clip-dark`, `clip-no-pointer`.

Override any of them from your own stylesheet to restyle the character.

## Browser support

Modern browsers (native `Promise`, CSS custom properties, and CSS animations).
`prefers-reduced-motion` is respected.
