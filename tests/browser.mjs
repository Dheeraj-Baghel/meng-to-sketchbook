import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'artifacts/testing');
await mkdir(out, { recursive: true });
const BASE = 'http://127.0.0.1:4336';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    let pathname = new URL(req.url, BASE).pathname;
    if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    if (pathname === '/') pathname = '/index.html';
    const data = await readFile(path.join(root, 'dist', pathname));
    res.writeHead(200, { 'content-type': mime[path.extname(pathname)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(4336, '127.0.0.1', r));
const results = [], errors = [], knownIssues = [], requests = new Set();
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); assert.ok(ok, name); };
const watchdog = setTimeout(() => process.exit(1), 180000); watchdog.unref();
const browser = await chromium.launch({ channel: 'chrome' });
function monitor(page) {
  page.setDefaultTimeout(15000);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => requests.add(r.url()));
}
async function loaded(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.landing-page-frame[data-state="ready"]');
  const frame = page.frames().find(f => f.url().includes('/landing-pages/'));
  await frame.waitForSelector('body[data-ready="1"]');
  await frame.waitForFunction(() => !introOn && idx === 6 && !turn, null, { timeout: 15000 });
  return frame;
}
async function stable(frame, target) {
  await frame.waitForFunction(i => !turn && idx === i, target, { timeout: 15000 });
}
async function select(frame, i) {
  await frame.locator('.plate').nth(i).click(); await stable(frame, i);
  await frame.evaluate(() => scrollTo(0, 0)); await frame.waitForTimeout(650);
}
async function drag(page, locator, dx, dy, finish = true) {
  const box = await locator.boundingBox(); assert.ok(box);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 18 });
  if (finish) await page.mouse.up();
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); monitor(page);
  const frame = await loaded(page);
  check('configured component loads canonical local frame', frame.url() === `${BASE}/landing-pages/meng-to-sketchbook.html`);
  const canonical = await (await page.request.get(frame.url())).body();
  check('served HTML is required byte-exact revision', canonical.length === 45528 && createHash('sha256').update(canonical).digest('hex') === 'e0330548b1ac905cf1b81698163ffa29f8a3a8c39b8d39f9b71ba5b9255b6dd1');
  const bundle = JSON.parse(await readFile(path.join(root, 'vendor/threeui/source-bundle.json'), 'utf8'));
  for (const asset of bundle.assets) {
    const data = await (await page.request.get(`${BASE}/${asset.path.replace(/^public\//, '')}`)).body();
    assert.equal(data.length, asset.bytes); assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256);
  }
  check('all 17 served binary assets match registered hashes', true);
  const typography = await frame.evaluate(() => ({ name: getComputedStyle(document.querySelector('.top .name')).fontFamily, body: getComputedStyle(document.body).fontFamily, weight: getComputedStyle(document.querySelector('.top .name')).fontWeight, size: getComputedStyle(document.querySelector('.top .name')).fontSize, tracking: getComputedStyle(document.querySelector('.top .name')).letterSpacing, ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(), fonts: document.fonts.check('30px "Instrument Serif"') && document.fonts.check('20px "Newsreader"'), override: !!document.getElementById('threeui-page-typography') }));
  check('configured typography applied and local fonts loaded', typography.name.includes('Instrument Serif') && typography.body.includes('Newsreader') && typography.weight === '400' && typography.size === '30px' && typography.tracking === '0.3px' && typography.ink === '#2b2721' && typography.fonts && typography.override, JSON.stringify(typography));
  check('authored intro finishes on Marina Bay Skyline', await frame.locator('#sbBook .sb-full img').getAttribute('alt') === 'Marina Bay Skyline');
  await page.screenshot({ path: path.join(out, 'desktop.png') });
  check('nine editorial plates initialized', await frame.locator('.plate').count() === 9);
  for (let i = 0; i < 9; i++) {
    await select(frame, i);
    assert.equal(await frame.locator('.plate[aria-current="true"] .t').textContent(), await frame.locator('#sbCaptions .sb-caption').textContent());
    assert.ok(await frame.locator('#sbBook .sb-full img').evaluate(im => im.complete && im.naturalWidth > 0));
  }
  check('every index item selects matching caption and complete image', true);
  // Native clicks, not synthetic onclick invocation: the required revision
  // captures pointerup on the stage, preventing side-arrow clicks. Preserve
  // the exact source and report the issue separately from passing workflows.
  await frame.locator('#sbRight').click(); await frame.waitForTimeout(400);
  assert.equal(await frame.evaluate(() => idx), 8);
  await frame.locator('#sbLeft').click(); await frame.waitForTimeout(400);
  assert.equal(await frame.evaluate(() => idx), 8);
  knownIssues.push('Native side-arrow clicks are swallowed by sbStage pointer capture; keyboard and book taps/drags work.');
  console.log('KNOWN SOURCE ISSUE: side-arrow pointer clicks');
  await frame.locator('#sbRight').focus(); await page.keyboard.press('ArrowRight'); await stable(frame, 0);
  await page.keyboard.press('ArrowLeft'); await stable(frame, 8);
  check('keyboard arrows turn both directions and wrap at both ends', true);
  await select(frame, 0);
  const w = await frame.locator('#sbBook').evaluate(e => e.clientWidth);
  await drag(page, frame.locator('.sb-next'), -w * .32, 0, false);
  check('drag creates curved leaf with 18 strips and two faces each', await frame.locator('#sbBook .strip').count() === 18 && await frame.locator('#sbBook .face').count() === 36 && await frame.evaluate(() => turn.t > .3 && turn.t < .8));
  await page.screenshot({ path: path.join(out, 'curled-page.png') });
  await page.mouse.up(); await stable(frame, 1);
  check('long page drag commits next plate', true);
  await drag(page, frame.locator('.sb-next'), -w * .08, 0, false); await frame.waitForTimeout(250); await page.mouse.up(); await stable(frame, 1);
  check('short held drag cancels without changing plate', true);
  await frame.locator('#zIn').click();
  await frame.waitForFunction(() => Math.abs(view.z - view.tz) < .002);
  check('zoom in changes readout and book scale', await frame.locator('#zRead').textContent() === '116%' && await frame.evaluate(() => view.z > 1.15));
  for (let i = 0; i < 4 && !await frame.locator('#zIn').isDisabled(); i++) await frame.locator('#zIn').click();
  check('zoom caps at 150% and disables plus', await frame.locator('#zRead').textContent() === '150%' && await frame.locator('#zIn').isDisabled());
  for (let i = 0; i < 5 && !await frame.locator('#zOut').isDisabled(); i++) await frame.locator('#zOut').click();
  check('zoom floors at 90% and disables minus', await frame.locator('#zRead').textContent() === '90%' && await frame.locator('#zOut').isDisabled());
  await frame.locator('#sbStage').dispatchEvent('dblclick'); await frame.waitForFunction(() => Math.abs(view.z - 1) < .002);
  check('double-click handler restores 100% zoom', await frame.locator('#zRead').textContent() === '100%');
  await frame.locator('#loupeBtn').click();
  check('magnifier toggle hides glass and updates pressed state', await frame.locator('#loupeBtn').getAttribute('aria-pressed') === 'false' && !await frame.locator('#loupe').evaluate(e => e.classList.contains('on')));
  await frame.locator('#loupeBtn').click();
  const old = await frame.locator('#loupe').evaluate(e => e.style.transform);
  // Earlier turns shove the glass to alternating sides. Drag from its actual
  // current location to the page interior rather than assuming its boot pose.
  const delta = await frame.evaluate(() => ({ x: book.clientWidth * .58 - lx, y: book.clientHeight * .5 - ly }));
  await drag(page, frame.locator('#loupe .ring'), delta.x, delta.y);
  const glass = await frame.evaluate(() => ({ transform: loupe.style.transform, opacity: +zoomWrap.style.opacity, mask: zoomWrap.style.maskImage, scale: zoomInner.style.transform, z: view.z, lx, ly }));
  check('glass drags independently with magnified masked book', glass.transform !== old && glass.opacity > .8 && glass.mask.includes('radial-gradient') && Math.abs(glass.z - 1) < .002 && glass.scale.includes('scale(2.3'), JSON.stringify(glass));
  await page.screenshot({ path: path.join(out, 'magnifier.png') });
  await frame.locator('#zIn').focus(); await page.keyboard.press('ArrowRight'); await stable(frame, 2);
  await frame.waitForFunction(() => !lTarget);
  check('turn shoves glass away from turning page', await frame.evaluate(() => ly > book.clientHeight * .8));
  await frame.locator('.top nav a[href="#about"]').click(); await frame.waitForTimeout(400);
  check('about navigation scrolls inner document', await frame.evaluate(() => location.hash === '#about' && scrollY > 200));
  await frame.locator('.top nav a[href="#plates"]').click(); await frame.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'editorial-index.png') });
  check('journal navigation reveals authored index', await frame.evaluate(() => location.hash === '#plates'));
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); monitor(mobile);
  const mf = await loaded(mobile);
  check('phone skips intro, hides loupe and has no horizontal overflow', await mf.evaluate(() => !introOn && getComputedStyle(loupe).display === 'none' && document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: path.join(out, 'mobile.png') });
  const mb = await mf.locator('.sb-next').boundingBox();
  await mobile.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2); await stable(mf, 7);
  await select(mf, 3);
  check('phone touch page turn and index selection work', true);
  const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); monitor(reduced);
  const rf = await loaded(reduced); await rf.locator('#sbRight').focus(); await reduced.keyboard.press('ArrowRight'); await stable(rf, 7);
  check('reduced-motion skips riffle and directly commits turns', await rf.evaluate(() => REDUCED && !introOn && !spring));
  check('no external runtime downloads', [...requests].every(url => url.startsWith(BASE) || url.startsWith('data:')));
  check('no browser errors or failed requests', errors.length === 0, errors.join('\n'));
} finally {
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ results, knownIssues, errors, requests: [...requests] }, null, 2));
  await browser.close(); await new Promise(r => server.close(r)); clearTimeout(watchdog);
}
