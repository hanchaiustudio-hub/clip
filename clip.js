(function () {
  'use strict';

  var VERSION = '1.1.0';

  var SVG = '<svg class="clip-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 50 V20 a8 8 0 0 1 16 0 V50 a6 6 0 0 1 -12 0 V22"/></svg>';

  var CSS = [
    '.clip-root{position:fixed;left:0;top:0;z-index:9999;display:flex;align-items:flex-end;gap:8px;pointer-events:none;opacity:0;visibility:hidden;transform:scale(var(--clip-scale,1));transform-origin:left bottom;perspective:600px;font-family:"Kanit","Segoe UI",system-ui,sans-serif}',
    '.clip-root.is-move{transition:left var(--clip-move,1200ms) ease-in-out,top var(--clip-move,1200ms) ease-in-out}',
    '.clip-root.is-on{opacity:1;visibility:visible;animation:clip-walk var(--clip-walk,2000ms) ease-out both}',
    '.clip-root.clip-from-right.is-on{animation-name:clip-walk-r}',
    '@keyframes clip-walk{0%{transform:translateX(-48px) scale(var(--clip-scale,1));opacity:0}70%{transform:translateX(3px) scale(var(--clip-scale,1));opacity:1}100%{transform:translateX(0) scale(var(--clip-scale,1));opacity:1}}',
    '@keyframes clip-walk-r{0%{transform:translateX(48px) scale(var(--clip-scale,1));opacity:0}70%{transform:translateX(-3px) scale(var(--clip-scale,1));opacity:1}100%{transform:translateX(0) scale(var(--clip-scale,1));opacity:1}}',
    '.clip-root.is-pop{animation:clip-pop var(--clip-pop,1000ms) ease-in forwards}',
    '@keyframes clip-pop{0%{transform:scale(var(--clip-scale,1));opacity:1}45%{transform:scale(calc(var(--clip-scale,1) * 1.18));opacity:1}100%{transform:scale(calc(var(--clip-scale,1) * .3));opacity:0}}',
    '.clip-body{position:relative;width:46px;height:46px;flex:0 0 auto;color:#4b6b1f;transition:transform var(--clip-turn,900ms) ease-in-out}',
    '.clip-body svg{display:block;width:46px;height:46px}',
    '.clip-eye{position:absolute;width:4px;height:4px;border-radius:50%;background:#2f3b17;transform-origin:center}',
    '.clip-eye:nth-of-type(1){left:54%;top:37%}',
    '.clip-eye:nth-of-type(2){left:72%;top:37%}',
    '.clip-root.is-blink2 .clip-eye{animation:clip-blink2 var(--clip-blink2,1400ms) ease-in-out}',
    '.clip-root.is-blink1 .clip-eye{animation:clip-blink1 var(--clip-blink1,800ms) ease-in-out}',
    '@keyframes clip-blink2{0%,60%,100%{transform:scaleY(1)}15%,45%{transform:scaleY(.12)}30%{transform:scaleY(1)}}',
    '@keyframes clip-blink1{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.12)}}',
    '.clip-bubble{background:#fffde7;border:1px solid #d4c56a;border-radius:10px;padding:6px 10px;font-size:13px;color:#1b2b1b;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.18);position:relative;margin-bottom:8px;opacity:0;transform:translateY(6px) scale(.7);transform-origin:left bottom;transition:opacity var(--clip-bubble,400ms) ease-out,transform var(--clip-bubble,400ms) ease-out}',
    '.clip-root.is-say .clip-bubble{opacity:1;transform:none}',
    '.clip-bubble::before{content:"";position:absolute;left:-6px;bottom:10px;border:6px solid transparent;border-right-color:#d4c56a;border-left:0}',
    '.clip-root.clip-no-pointer .clip-bubble::before{display:none}',
    '.clip-root.clip-dark .clip-body{color:#e2e8f0}',
    '.clip-root.clip-dark .clip-eye{background:#cbd5e1}',
    '.clip-root.clip-dark .clip-bubble{background:#0f172a;border-color:#334155;color:#f2f6f2}',
    '.clip-root.clip-dark .clip-bubble::before{border-right-color:#334155}',
    '.clip-root.clip-face-left .clip-body{transform:rotateY(180deg)}',
    '.clip-root.is-turn-spin-l .clip-body{animation:clip-turn-spin-l var(--clip-turn,900ms) ease-in-out}',
    '.clip-root.is-turn-spin-r .clip-body{animation:clip-turn-spin-r var(--clip-turn,900ms) ease-in-out}',
    '@keyframes clip-turn-spin-l{from{transform:rotateY(180deg)}to{transform:rotateY(540deg)}}',
    '@keyframes clip-turn-spin-r{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}',
    '@media (prefers-reduced-motion: reduce){.clip-root.is-on{animation-duration:1ms}.clip-root.is-pop{animation-duration:1ms}.clip-root .clip-body{transition-duration:1ms}}'
  ].join('\n');

  function injectStyles(opts) {
    if (opts && opts.autoStyle === false) return;
    if (typeof document === 'undefined') return;
    if (document.getElementById('clip-styles')) return;
    var s = document.createElement('style');
    s.id = 'clip-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function cfg(inst, opts, key, def) {
    if (opts && opts[key] != null) return opts[key];
    if (inst && inst.opts && inst.opts[key] != null) return inst.opts[key];
    return def;
  }

  function resolvePosition(opts) {
    var x = opts.x != null ? opts.x : 0;
    var y = opts.y != null ? opts.y : 0;
    if (opts.anchor && opts.anchor.getBoundingClientRect) {
      var r = opts.anchor.getBoundingClientRect();
      var off = opts.anchorOffset || {};
      x = r.left + (off.x != null ? off.x : 0);
      y = r.bottom + (off.y != null ? off.y : 0);
    }
    return { x: x, y: y };
  }

  function anim(inst, cls, ms) {
    inst.el.classList.add(cls);
    void inst.el.offsetWidth;
    return inst._delay(ms).then(function () { inst.el.classList.remove(cls); return inst; });
  }

  function Clip(el, opts) {
    this.el = el;
    this.opts = opts || {};
    this.bubble = el.querySelector('.clip-bubble');
    this.body = el.querySelector('.clip-body');
    this._timers = [];
    this._handlers = {};
  }

  Clip.prototype._delay = function (ms) {
    var self = this;
    ms = Math.max(0, ms | 0);
    if (!ms) return Promise.resolve(this);
    return new Promise(function (resolve) {
      var id = setTimeout(function () { resolve(self); }, ms);
      self._timers.push(id);
    });
  };

  Clip.prototype._emit = function (name, data) {
    (this._handlers[name] || []).forEach(function (fn) {
      try { fn(data); } catch (e) {}
    });
  };

  Clip.prototype.on = function (name, fn) {
    (this._handlers[name] = this._handlers[name] || []).push(fn);
    return this;
  };

  Clip.prototype.off = function (name, fn) {
    var a = this._handlers[name] || [];
    var i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
    return this;
  };

  Clip.prototype.getPosition = function () {
    return { x: parseFloat(this.el.style.left) || 0, y: parseFloat(this.el.style.top) || 0 };
  };

  Clip.prototype.setPosition = function (x, y) {
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
    return this;
  };

  Clip.prototype.appear = function (opts) {
    opts = opts || {};
    var d = opts.duration != null ? opts.duration : cfg(this, opts, 'walkMs', 2000);
    var from = opts.from || 'left';
    this.el.style.setProperty('--clip-walk', d + 'ms');
    this.el.classList.remove('is-pop', 'is-say', 'is-blink1', 'is-blink2');
    this.el.classList.toggle('clip-from-right', from === 'right');
    void this.el.offsetWidth;
    this.el.classList.add('is-on');
    this._emit('appear', { from: from });
    return this._delay(d);
  };

  Clip.prototype.disappear = function (opts) {
    opts = opts || {};
    var d = opts.duration != null ? opts.duration : 0;
    var self = this;
    if (d > 0) {
      this.el.style.transition = 'opacity ' + d + 'ms linear';
      return this._delay(d).then(function () {
        self.el.classList.remove('is-on', 'is-say');
        self.el.style.transition = '';
        self._emit('disappear');
        return self;
      });
    }
    this.el.classList.remove('is-on', 'is-say');
    this._emit('disappear');
    return Promise.resolve(this);
  };

  Clip.prototype.walkTo = function (x, y, opts) {
    opts = opts || {};
    var d = opts.duration != null ? opts.duration : cfg(this, opts, 'moveMs', 1200);
    this.el.style.setProperty('--clip-move', d + 'ms');
    this.el.classList.add('is-move');
    void this.el.offsetWidth;
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
    this._emit('move', { x: x, y: y });
    var self = this;
    return this._delay(d).then(function () { self.el.classList.remove('is-move'); return self; });
  };

  Clip.prototype.moveBy = function (dx, dy, opts) {
    var p = this.getPosition();
    return this.walkTo(p.x + dx, p.y + dy, opts);
  };

  Clip.prototype.blink = function (times, opts) {
    if (times && typeof times === 'object') { opts = times; times = opts.times; }
    opts = opts || {};
    times = times == null ? 1 : Math.max(1, Math.floor(times));
    var single = opts.duration != null ? opts.duration : cfg(this, opts, 'blinkMs', 800);
    var dbl = cfg(this, opts, 'blink2Ms', 1400);
    var self = this;
    this.el.style.setProperty('--clip-blink1', single + 'ms');
    this.el.style.setProperty('--clip-blink2', dbl + 'ms');
    var seq = Promise.resolve(this);
    var remaining = times;
    if (remaining >= 2) {
      seq = seq.then(function () { return anim(self, 'is-blink2', dbl); });
      remaining -= 2;
    }
    for (var i = 0; i < remaining; i++) {
      seq = seq.then(function () { return anim(self, 'is-blink1', single); });
    }
    this._emit('blink', { times: times });
    return seq;
  };

  Clip.prototype.say = function (text, opts) {
    opts = opts || {};
    var trans = cfg(this, opts, 'bubbleMs', 400);
    this.el.style.setProperty('--clip-bubble', trans + 'ms');
    this.bubble.textContent = text == null ? '' : String(text);
    this.el.classList.add('is-say');
    this._emit('say', { text: text });
    var self = this;
    var hold = opts.duration != null ? opts.duration : 0;
    if (hold > 0) {
      return this._delay(hold).then(function () { return self.hideBubble(); });
    }
    return this._delay(trans);
  };

  Clip.prototype.hideBubble = function (opts) {
    opts = opts || {};
    var trans = cfg(this, opts, 'bubbleMs', 400);
    this.el.style.setProperty('--clip-bubble', trans + 'ms');
    this.el.classList.remove('is-say');
    return this._delay(trans);
  };

  Clip.prototype.pop = function (opts) {
    opts = opts || {};
    var d = opts.duration != null ? opts.duration : cfg(this, opts, 'popMs', 1000);
    this.el.style.setProperty('--clip-pop', d + 'ms');
    this.el.classList.add('is-pop');
    this._emit('pop');
    var self = this;
    return this._delay(d).then(function () {
      self.el.classList.remove('is-on', 'is-pop', 'is-say', 'is-blink1', 'is-blink2');
      return self;
    });
  };

  Clip.prototype._turn = function (dir, opts) {
    opts = opts || {};
    var d = opts.duration != null ? opts.duration : cfg(this, opts, 'turnMs', 900);
    var wantLeft = dir === 'left';
    var isLeft = this.el.classList.contains('clip-face-left');
    this.el.style.setProperty('--clip-turn', d + 'ms');
    this._emit('turn', { direction: dir });
    var self = this;
    if (wantLeft === isLeft) {
      var spin = wantLeft ? 'is-turn-spin-l' : 'is-turn-spin-r';
      this.el.classList.add(spin);
      void this.el.offsetWidth;
      return this._delay(d).then(function () { self.el.classList.remove(spin); return self; });
    }
    this.el.classList.toggle('clip-face-left', wantLeft);
    return this._delay(d);
  };

  Clip.prototype.turnLeft = function (opts) { return this._turn('left', opts); };

  Clip.prototype.turnRight = function (opts) { return this._turn('right', opts); };

  Clip.prototype.greet = function (text, opts) {
    opts = opts || {};
    var self = this;
    var walk = cfg(this, opts, 'walkMs', 2000);
    var dbl = cfg(this, opts, 'blink2Ms', 1400);
    var single = cfg(this, opts, 'blinkMs', 800);
    var pop = cfg(this, opts, 'popMs', 1000);
    var hold = opts.hold != null ? opts.hold : 3000;
    this.el.style.setProperty('--clip-blink2', dbl + 'ms');
    this.el.style.setProperty('--clip-blink1', single + 'ms');
    return this.appear({ duration: walk, from: opts.from })
      .then(function () { return self._delay(200); })
      .then(function () { return anim(self, 'is-blink2', dbl); })
      .then(function () { return self.say(text); })
      .then(function () { return self._delay(Math.max(0, hold - single)); })
      .then(function () { return anim(self, 'is-blink1', single); })
      .then(function () { return self._delay(400); })
      .then(function () { return self.pop({ duration: pop }); });
  };

  Clip.prototype.play = function (steps) {
    var self = this;
    var seq = Promise.resolve(this);
    (steps || []).forEach(function (s) {
      seq = seq.then(function () {
        if (!s) return self;
        var name = s.do || s.action;
        if (typeof self[name] !== 'function') return self;
        return self[name].apply(self, s.args || []);
      });
    });
    return seq;
  };

  Clip.prototype.destroy = function () {
    this._timers.forEach(clearTimeout);
    this._timers.length = 0;
    this._handlers = {};
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
    this.bubble = null;
    this.body = null;
  };

  function create(opts) {
    opts = opts || {};
    injectStyles(opts);
    var el = document.createElement('div');
    el.className = 'clip-root' + (opts.dark ? ' clip-dark' : '') + (opts.pointer === false ? ' clip-no-pointer' : '');
    el.setAttribute('aria-hidden', 'true');
    el.style.position = opts.position || 'fixed';
    if (opts.zIndex != null) el.style.zIndex = opts.zIndex;
    if (opts.scale != null) el.style.setProperty('--clip-scale', opts.scale);
    el.innerHTML = '<div class="clip-body">' + SVG + '<span class="clip-eye"></span><span class="clip-eye"></span></div><div class="clip-bubble"></div>';
    (opts.container || document.body).appendChild(el);
    var pos = resolvePosition(opts);
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    return new Clip(el, opts);
  }

  window.Clip = { create: create, version: VERSION };
})();
