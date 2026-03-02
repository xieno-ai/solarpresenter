/**
 * Quick Playwright script to extract all data from a SunPitch proposal page.
 * Captures: page text, DOM structure, network API responses, and all data attributes.
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://app.sunpitch.com/facing/proposals/db9b7ee9-349f-4047-a9f1-0b61610712a0';

console.log(`\n=== SunPitch Data Extractor ===`);
console.log(`URL: ${URL}\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});

const page = await context.newPage();

// Intercept all network requests to capture API responses
const apiResponses = [];
page.on('response', async (response) => {
  const url = response.url();
  const contentType = response.headers()['content-type'] || '';

  // Capture JSON API responses
  if (contentType.includes('application/json') || url.includes('/api/') || url.includes('proposal')) {
    try {
      const body = await response.text();
      // Skip tiny responses (likely not data)
      if (body.length > 50) {
        apiResponses.push({
          url: url,
          status: response.status(),
          contentType,
          bodyLength: body.length,
          body: body.substring(0, 50000) // Cap at 50k chars
        });
      }
    } catch (e) {
      // Some responses can't be read
    }
  }
});

console.log('Loading page...');
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

// Wait for the preloader to disappear and real content to appear
console.log('Waiting for content to render...');
try {
  // Wait for preloader to go away
  await page.waitForSelector('.preloader', { state: 'hidden', timeout: 30000 }).catch(() => {});
  // Give the SPA time to render
  await page.waitForTimeout(10000);
  // Try to wait for any meaningful content
  await page.waitForSelector('img, table, canvas, [class*="proposal"], [class*="slide"], [class*="page"]', { timeout: 15000 }).catch(() => {
    console.log('No proposal-specific elements found, continuing with what we have...');
  });
  await page.waitForTimeout(3000);
} catch (e) {
  console.log('Content wait note:', e.message);
}

// === 1. Capture all API responses ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 1: INTERCEPTED API RESPONSES');
console.log('='.repeat(80));

if (apiResponses.length === 0) {
  console.log('No JSON API responses captured.');
} else {
  for (const resp of apiResponses) {
    console.log(`\n--- ${resp.url} (${resp.status}) ---`);
    console.log(`Content-Type: ${resp.contentType}`);
    console.log(`Body length: ${resp.bodyLength}`);
    try {
      const parsed = JSON.parse(resp.body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(resp.body);
    }
  }
}

// === 2. Extract all visible text organized by sections ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 2: PAGE TEXT CONTENT (organized by sections)');
console.log('='.repeat(80));

const textContent = await page.evaluate(() => {
  const sections = [];

  // Try to find major sections/containers
  const candidates = document.querySelectorAll('section, [class*="section"], [class*="page"], [class*="slide"], [class*="card"], [class*="panel"], main > div, .container > div');

  if (candidates.length > 0) {
    candidates.forEach((el, i) => {
      const text = el.innerText?.trim();
      if (text && text.length > 10) {
        sections.push({
          tag: el.tagName,
          classes: el.className,
          id: el.id,
          text: text.substring(0, 5000)
        });
      }
    });
  }

  // Also get full page text
  const fullText = document.body?.innerText?.trim() || '';

  return { sections, fullText: fullText.substring(0, 30000) };
});

if (textContent.sections.length > 0) {
  console.log(`\nFound ${textContent.sections.length} content sections:\n`);
  textContent.sections.forEach((s, i) => {
    console.log(`\n--- Section ${i + 1} (${s.tag}.${s.classes}) ---`);
    console.log(s.text);
  });
}

console.log('\n--- FULL PAGE TEXT ---');
console.log(textContent.fullText || '(no text content found)');

// === 3. Extract all tables ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 3: TABLES');
console.log('='.repeat(80));

const tables = await page.evaluate(() => {
  const results = [];
  document.querySelectorAll('table').forEach((table, i) => {
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('td, th').forEach(cell => {
        cells.push(cell.innerText?.trim());
      });
      if (cells.length > 0) rows.push(cells);
    });
    if (rows.length > 0) {
      results.push({ index: i, rows });
    }
  });
  return results;
});

if (tables.length === 0) {
  console.log('No tables found.');
} else {
  tables.forEach(t => {
    console.log(`\n--- Table ${t.index + 1} ---`);
    t.rows.forEach(row => console.log(row.join(' | ')));
  });
}

// === 4. Extract all numbers/data from the page ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 4: DATA ELEMENTS (inputs, data attributes, key-value pairs)');
console.log('='.repeat(80));

const dataElements = await page.evaluate(() => {
  const data = {};

  // All input/select values
  const inputs = [];
  document.querySelectorAll('input, select, textarea').forEach(el => {
    inputs.push({
      name: el.name || el.id || el.getAttribute('data-field'),
      type: el.type,
      value: el.value,
      placeholder: el.placeholder
    });
  });
  data.inputs = inputs;

  // All data attributes
  const dataAttrs = [];
  document.querySelectorAll('[data-value], [data-amount], [data-kwh], [data-rate]').forEach(el => {
    const attrs = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-')) {
        attrs[attr.name] = attr.value;
      }
    }
    attrs._text = el.innerText?.trim();
    dataAttrs.push(attrs);
  });
  data.dataAttributes = dataAttrs;

  // Look for key-value patterns (label: value)
  const kvPairs = [];
  document.querySelectorAll('dt, .label, .key, [class*="label"]').forEach(label => {
    const next = label.nextElementSibling;
    if (next) {
      kvPairs.push({
        label: label.innerText?.trim(),
        value: next.innerText?.trim()
      });
    }
  });
  data.keyValuePairs = kvPairs;

  return data;
});

console.log(JSON.stringify(dataElements, null, 2));

// === 5. Get the full DOM structure (simplified) ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 5: DOM STRUCTURE (depth 4)');
console.log('='.repeat(80));

const domStructure = await page.evaluate(() => {
  function mapNode(el, depth = 0, maxDepth = 4) {
    if (depth > maxDepth || !el) return null;
    const children = [];
    if (el.children) {
      for (const child of el.children) {
        const mapped = mapNode(child, depth + 1, maxDepth);
        if (mapped) children.push(mapped);
      }
    }
    const text = el.childNodes?.length === 1 && el.childNodes[0].nodeType === 3
      ? el.childNodes[0].textContent?.trim().substring(0, 100)
      : null;

    return {
      tag: el.tagName?.toLowerCase(),
      id: el.id || undefined,
      class: el.className?.toString()?.substring(0, 100) || undefined,
      text: text || undefined,
      children: children.length > 0 ? children : undefined
    };
  }
  return mapNode(document.body);
});

console.log(JSON.stringify(domStructure, null, 2).substring(0, 20000));

// === 6. Extract all images ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 6: IMAGES');
console.log('='.repeat(80));

const images = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    classes: img.className
  }));
});

console.log(JSON.stringify(images, null, 2));

// === 7. Chart data (canvas/svg) ===
console.log('\n' + '='.repeat(80));
console.log('SECTION 7: CHARTS/CANVAS/SVG');
console.log('='.repeat(80));

const charts = await page.evaluate(() => {
  const canvases = document.querySelectorAll('canvas');
  const svgs = document.querySelectorAll('svg');
  return {
    canvasCount: canvases.length,
    svgCount: svgs.length,
    svgContent: Array.from(svgs).slice(0, 5).map(svg => ({
      classes: svg.className?.baseVal,
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      childCount: svg.children.length
    }))
  };
});

console.log(JSON.stringify(charts, null, 2));

await browser.close();
console.log('\n=== Extraction complete ===');
