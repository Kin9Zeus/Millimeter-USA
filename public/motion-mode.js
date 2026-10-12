/*
 * Motion mode — runs synchronously in <head> before first paint and sets
 * <html data-motion="on|off">. CSS and main.ts read it.
 *
 * Animations are ON by default on every device, including when the OS reports
 * prefers-reduced-motion (many Windows machines report it only because animation
 * effects are off for performance). Visitors who need less motion use the footer
 * switch ("Animations: on/off"), stored in localStorage `mm-motion`.
 *
 * Priority: ?motion=on|off (session) → visitor choice → Save-Data / 2G (off) → on.
 * External file (not inline) because the CSP is script-src 'self'.
 * Failsafe: if the motion bundle has not started after 6 s, fall back to the still version.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var q = /[?&]motion=(on|off)\b/.exec(location.search);
  var pref = null;
  try { pref = localStorage.getItem('mm-motion'); } catch (e) {}
  var conn = navigator.connection || {};
  var slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  var on = q ? q[1] === 'on' : pref === 'on' ? true : pref === 'off' ? false : !slow;
  root.dataset.motion = on ? 'on' : 'off';
  if (on) {
    setTimeout(function () {
      if (root.dataset.motionReady !== '1') { root.dataset.motion = 'off'; root.dataset.motionFailsafe = '1'; }
    }, 6000);
  }
})();
