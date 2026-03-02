import assert from 'node:assert';
import { d, toFixed, toNumber, toJSON, fromJSON, Decimal } from './index';

// Test 1: Decimal.js precision - IEEE 754 issue resolved
assert.strictEqual(
  d('0.1').plus('0.2').toString(),
  '0.3',
  'Precision: d("0.1").plus("0.2") must equal "0.3"'
);

// Test 2: ROUND_HALF_UP rounding behavior
assert.strictEqual(
  d('1.005').toFixed(2),
  '1.01',
  'Rounding: d("1.005").toFixed(2) must equal "1.01" (ROUND_HALF_UP)'
);

// Test 3: toFixed helper
assert.strictEqual(
  toFixed(d('1234.5'), 2),
  '1234.50',
  'toFixed: toFixed(d("1234.5"), 2) must equal "1234.50"'
);

// Test 4: toFixed default 2 places
assert.strictEqual(
  toFixed(d('99.9')),
  '99.90',
  'toFixed default: toFixed(d("99.9")) must equal "99.90"'
);

// Test 5: toNumber conversion
assert.strictEqual(
  toNumber(d('42.5')),
  42.5,
  'toNumber: toNumber(d("42.5")) must equal 42.5'
);

// Test 6: toJSON serialization
assert.strictEqual(
  toJSON(d('123.456')),
  '123.456',
  'toJSON: toJSON(d("123.456")) must equal "123.456"'
);

// Test 7: fromJSON deserialization
assert.ok(
  fromJSON('123.456') instanceof Decimal,
  'fromJSON: fromJSON("123.456") must be instance of Decimal'
);

// Test 8: Serialization roundtrip
assert.ok(
  fromJSON(toJSON(d('123.456'))).eq(d('123.456')),
  'Roundtrip: fromJSON(toJSON(d("123.456"))) must equal d("123.456")'
);

// Test 9: Precision configuration - 20 significant digits
assert.strictEqual(
  d('1').div('3').toString().length > 15,
  true,
  'Precision config: 1/3 should have more than 15 digits of precision'
);

// Test 10: d() constructor from string
assert.ok(
  d('100').eq(new Decimal('100')),
  'd() constructor: d("100") must create valid Decimal'
);

console.log('All decimal tests passed.');
