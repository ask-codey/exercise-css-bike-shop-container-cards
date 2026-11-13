// Checks your Spoke & Chain cards: the card spots are named containers, @container rules (not a media query) put
// each card side by side when its spot has room, and the card title has a fluid size with clamp().
// jsdom, the browser these tests use, reads @container rules but can't lay out a page, so it never measures a
// container. The tests read your rules instead; the README's checklist covers how the page looks at each width.
// Run it with: npm test (run npm install once first). You don't need to change this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

const dom = new JSDOM(html);
const window = dom.window;
const page = window.document;

// The tests read styles.css themselves and add it to the page, as the browser does through the <link>.
const style = page.createElement('style');
style.textContent = css;
page.head.appendChild(style);
const sheet = style.sheet;

const all = (selector) => [...page.querySelectorAll(selector)];
const computed = (element) => window.getComputedStyle(element);
const spots = all('.card-spot');
const cards = all('.bike-card');
const titles = all('.bike-card-title');
const titleOf = (element) => element.closest('.card-spot')?.querySelector('.bike-card-title')?.textContent.trim() || 'a card';
// The card and everything inside it: what a card rule can style.
const cardParts = cards.flatMap((card) => [card, ...card.querySelectorAll('*')]);

const isContainerRule = (rule) => rule.cssText.startsWith('@container');
const isMediaRule = (rule) => rule.cssText.startsWith('@media');

// Every style rule in the sheet, in source order, with the @container or @media rules it sits inside.
function styleRules(rules = sheet.cssRules, inside = []) {
  const found = [];
  for (const rule of rules) {
    if (rule.selectorText && rule.style) found.push({ rule, inside });
    else if (rule.cssRules) found.push(...styleRules(rule.cssRules, [...inside, rule]));
  }
  return found;
}

function containerRules(rules = sheet.cssRules) {
  const found = [];
  for (const rule of rules) {
    if (isContainerRule(rule)) found.push(rule);
    if (rule.cssRules) found.push(...containerRules(rule.cssRules));
  }
  return found;
}

const matches = (element, selectorText) => selectorText.split(',').some((selector) => {
  try { return element.matches(selector.trim()); } catch { return false; }
});

// The width a query asks for, in pixels (1rem = 1em = 16px): (min-width: 30rem), (width >= 30rem), (30rem <= width).
function minWidthOf(query) {
  const patterns = [
    /min-width\s*:\s*([\d.]+)(rem|em|px)/,
    /width\s*>=?\s*([\d.]+)(rem|em|px)/,
    /([\d.]+)(rem|em|px)\s*<=?\s*width/,
  ];
  for (const pattern of patterns) {
    const m = query.match(pattern);
    if (m) return parseFloat(m[1]) * (m[2] === 'px' ? 1 : 16);
  }
  return null;
}

// A box's container type and name, from container-type and container-name or the container shorthand.
function containerOf(element) {
  const style = computed(element);
  let type = style.getPropertyValue('container-type').trim();
  let name = style.getPropertyValue('container-name').trim();
  // jsdom keeps the container shorthand as it was written, and says "see individual properties" when there is none.
  const shorthand = style.getPropertyValue('container').trim();
  if (shorthand && shorthand !== 'see individual properties') {
    const [shortName, shortType] = shorthand.split('/').map((part) => part.trim());
    if (!name || name === 'none') name = shortName;
    if ((!type || type === 'normal') && shortType) type = shortType;
  }
  return { type: type || 'normal', names: name && name !== 'none' ? name.split(/\s+/) : [] };
}

// How many columns a grid-template-columns value makes: "2fr 3fr" is 2, "repeat(2, 1fr)" is 2.
function columnCount(value) {
  let count = 0;
  let depth = 0;
  let token = '';
  const tokens = [];
  for (const ch of value.trim() + ' ') {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) { if (token) tokens.push(token); token = ''; } else token += ch;
  }
  for (const t of tokens) {
    const repeat = t.match(/^repeat\(\s*(\d+|auto-fit|auto-fill)\s*,\s*(.*)\)$/);
    if (repeat) count += (/^\d+$/.test(repeat[1]) ? Number(repeat[1]) : 2) * Math.max(1, repeat[2].split(/\s+(?![^(]*\))/).length);
    else if (!t.startsWith('[')) count += 1;
  }
  return count;
}

// The three values inside clamp( , , ), split at the top-level commas.
function clampParts(value) {
  const m = value.trim().match(/^clamp\((.*)\)$/);
  if (!m) return null;
  const parts = [];
  let depth = 0;
  let part = '';
  for (const ch of m[1]) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(part.trim()); part = ''; } else part += ch;
  }
  parts.push(part.trim());
  return parts;
}

// The bike-spot @container rules with a width, in source order.
function bikeSpotRules() {
  return containerRules()
    .filter((rule) => (rule.containerName || '').trim() === 'bike-spot')
    .map((rule) => ({ rule, width: minWidthOf(rule.containerQuery || rule.conditionText || '') }))
    .filter((found) => found.width !== null);
}

// The last font-size your rules give the card title, anywhere in the sheet.
function titleFontSize() {
  let last = null;
  for (const { rule } of styleRules()) {
    if (!titles.some((title) => matches(title, rule.selectorText))) continue;
    const value = rule.style.getPropertyValue('font-size').trim();
    if (value) last = value;
  }
  return last;
}

test('1) the page links styles.css and still has its five card spots', () => {
  assert.ok(page.querySelector('link[rel="stylesheet"][href="styles.css"]'), 'Keep the <link> to styles.css in the <head> of index.html.');
  assert.equal(spots.length, 5, 'index.html should still have its five card spots, each a <div class="card-spot">.');
  for (const spot of spots) {
    assert.ok(spot.querySelector(':scope > .bike-card'), 'Each .card-spot should still hold its <article class="bike-card">.');
  }
});

test('2) every card spot is a container that measures its width', () => {
  for (const spot of spots) {
    const { type } = containerOf(spot);
    assert.equal(type, 'inline-size',
      `The spot holding the ${titleOf(spot)} card has container-type: ${type}. Give .card-spot container-type: inline-size, so a container query can measure its width.`);
  }
});

test('3) every card spot is named bike-spot', () => {
  for (const spot of spots) {
    const { names } = containerOf(spot);
    assert.ok(names.includes('bike-spot'),
      `The spot holding the ${titleOf(spot)} card has no container name bike-spot${names.length ? ` (it has ${names.join(' ')})` : ''}. Give .card-spot container-name: bike-spot.`);
  }
});

test('4) no media query changes the card: the screen-width rule is gone', () => {
  for (const { rule, inside } of styleRules()) {
    const media = inside.find(isMediaRule);
    if (!media || inside.some(isContainerRule)) continue;
    const styled = cardParts.find((element) => matches(element, rule.selectorText));
    assert.ok(!styled,
      `The rule for ${rule.selectorText} sits inside @media ${media.conditionText || media.media?.mediaText}, so it changes the cards by the screen's width. Delete "The problem" media query and use @container bike-spot rules instead.`);
  }
});

test('5) an @container rule for bike-spot puts the card side by side', () => {
  const rules = bikeSpotRules();
  assert.ok(rules.length > 0,
    'There is no @container bike-spot rule with a width yet. Write one such as @container bike-spot (min-width: 30rem) { ... }.');
  const sideBySide = rules.filter(({ rule }) => [...rule.cssRules].some((inner) =>
    inner.selectorText && cards.some((card) => matches(card, inner.selectorText)) &&
    columnCount(inner.style.getPropertyValue('grid-template-columns')) >= 2));
  assert.ok(sideBySide.length > 0,
    'No @container bike-spot rule gives .bike-card two columns yet. Inside it, give .bike-card a grid-template-columns with two columns, such as 2fr 3fr.');
  const first = sideBySide[0];
  assert.ok(first.width >= 26 * 16 && first.width <= 34 * 16,
    `The side-by-side rule starts at ${first.width / 16}rem. Make it somewhere from 26rem to 34rem: narrower, and the photo gets squeezed; wider, and the catalog's cards never get there.`);
});

test('6) a second, wider @container rule for bike-spot comes after the first', () => {
  const rules = bikeSpotRules();
  assert.ok(rules.length >= 2, `There ${rules.length === 1 ? 'is one @container bike-spot rule' : 'are no @container bike-spot rules'} with a width. Add a second, wider one for the bike-of-the-month spot.`);
  const [first, ...later] = rules;
  const wider = later.find(({ width }) => width >= first.width + 8 * 16);
  assert.ok(wider,
    `Your first bike-spot rule starts at ${first.width / 16}rem. Write the wider one after it, starting at least 8rem wider (${first.width / 16 + 8}rem or more). Small spots first, then more room.`);
  const styles = [...wider.rule.cssRules].some((inner) =>
    inner.selectorText && inner.style.length > 0 && cardParts.some((element) => matches(element, inner.selectorText)));
  assert.ok(styles, `The ${wider.width / 16}rem @container rule doesn't change anything in the card yet. Give the card, or something inside it, its wide-spot look.`);
});

test('7) the card title has a fluid size with clamp(), with its limits in rem', () => {
  const value = titleFontSize();
  const parts = value ? clampParts(value) : null;
  assert.ok(parts, `.bike-card-title has font-size: ${value}. Give it a fluid size with clamp(minimum, preferred, maximum), after the ready rule.`);
  assert.equal(parts.length, 3, `font-size: ${value} has ${parts.length} values inside clamp(). It needs three, separated by commas: the minimum, the preferred size and the maximum.`);
  const [min, , max] = parts;
  const rem = (text) => text.match(/^([\d.]+)rem$/);
  assert.ok(rem(min) && rem(max), `The title's minimum is ${min} and its maximum is ${max}. Write both in rem, so they follow the reader's font size setting.`);
  assert.ok(parseFloat(min) < parseFloat(max), `The title's minimum (${min}) should be smaller than its maximum (${max}).`);
});

test("8) the title's preferred size mixes rem and cqi", () => {
  const value = titleFontSize();
  const parts = value ? clampParts(value) : null;
  assert.ok(parts && parts.length === 3, `.bike-card-title has font-size: ${value}. Give it clamp() with three values first (test 7).`);
  const preferred = parts[1];
  assert.match(preferred, /[\d.]+cqi/, `The title's preferred size is ${preferred}. Use cqi in it, so the title grows with its card's space, not the window.`);
  assert.match(preferred, /[\d.]+rem/, `The title's preferred size is ${preferred}. Add a rem to it, such as 0.75rem + 3cqi, so the title still grows when the reader zooms in.`);
});
