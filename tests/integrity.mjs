import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const catalogue=await import('data:text/javascript;base64,'+read('catalogue.js').toString('base64'));
assert.equal(catalogue.categories.length,6);
assert.equal(catalogue.records.length,43);
assert.equal(new Set(catalogue.records.map(r=>r.id)).size,43);
for(const r of catalogue.records){
 assert.ok(r.name && r.kind && r.visual);
 assert.ok(Number.isFinite(r.value)&&r.value>0);
 assert.ok(Number.isInteger(r.cat)&&r.cat>=0&&r.cat<6);
 if(r.verified) assert.match(r.source,/^https:\/\//);
 if(r.image) assert.ok(existsSync(new URL('../'+r.image,import.meta.url)),r.image);
}
const rights=JSON.parse(read('RIGHTS.json'));
for(const a of rights.assets){
 assert.ok(a.creator&&a.license&&a.source&&a.license_url);
 assert.equal(createHash('sha256').update(read(a.file)).digest('hex'),a.sha256,a.file);
}
console.log('Catalogue and registered asset integrity checks passed.');
