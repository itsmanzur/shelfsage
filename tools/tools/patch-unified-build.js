'use strict';
/**
 * Run after rebuilding admin UI assets (Vite → assets/assets/index-Cv9gTzef.js etc.).
 * Patterns are skipped if already applied (idempotent for most steps).
 */
const fs = require('fs');
const pathIndex = __dirname + '/../assets/assets/index-Cv9gTzef.js';
const pathAdmin = __dirname + '/../assets/shelfsage-admin.js';

let s = fs.readFileSync(pathIndex, 'utf8');
const repIndex = [
	[
		'const t=(Pi=window.rmssAdminSettings)==null?void 0:Pi.isPro',
		'const t=!0',
	],
	[
		't&&i.jsx("span",{className:"bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1",children:"👑 PRO ACTIVE"})',
		'null',
	],
	[
		'{id:"pro_features",label:t?"License & Features":"Pro Features"',
		'{id:"pro_features",label:"Features overview"',
	],
	[
		'n==="pro_features"?"ShelfSage Pro Features"',
		'n==="pro_features"?"Features"',
	],
	[
		'children:t?"Your Professional License":"Upgrade to ShelfSage Pro"',
		'children:"ShelfSage"',
	],
	[
		'children:t?"You have access to all premium features. Thank you for supporting ShelfSage!":"Unlock the full potential of your bookshelves with these advanced features."',
		'children:"This package includes every ShelfSage feature. There is no separate free or pro edition."',
	],
	['children:"Deactivate License"', 'children:""'],
];
for (const [a, b] of repIndex) {
	const n = s.split(a).length - 1;
	if (n === 0) {
		console.warn('[ShelfSage patch] skip (already applied?):', a.slice(0, 64));
		continue;
	}
	if (n !== 1) {
		console.error('index-Cv9gTzef.js: expected 1 occurrence, found', n, ':', a.slice(0, 72));
		process.exit(1);
	}
	s = s.split(a).join(b);
}
// Multiple upgrade CTAs reference the legacy pricing URL.
s = s.split('href:"https://shelfsage.com/pricing"').join('href:"https://codecanyon.net"');
fs.writeFileSync(pathIndex, s);

let a = fs.readFileSync(pathAdmin, 'utf8');
const ad = '[!ye&&e.jsx';
const adRep = '[false&&e.jsx';
const nAdmin = a.split(ad).length - 1;
if (nAdmin >= 1) {
	a = a.split(ad).join(adRep);
} else {
	console.warn('[ShelfSage patch] shelfsage-admin.js overlay already patched?');
}
a = a.split('href:"https://shelfsage.com/pro"').join('href:"#"');
fs.writeFileSync(pathAdmin, a);
// Extra copy tweaks (safe to run multiple times).
const stage2 = [
	['children:"License Active"', 'children:"Included"'],
	['Get ShelfSage Pro - $39', 'ShelfSage'],
	['Professional-grade metadata fetching via ShelfSage Pro', 'Server-side Google Books metadata fetching'],
];
let s2 = fs.readFileSync(pathIndex, 'utf8');
for (const [a, b] of stage2) {
	if (s2.includes(a)) s2 = s2.split(a).join(b);
}
fs.writeFileSync(pathIndex, s2);

const docOld =
	't?i.jsx("span",{className:"text-green-600 font-bold",children:"Pro Plan"}):i.jsx("span",{className:"text-gray-600 font-bold",children:"Free Plan"})';
const docNew =
	'i.jsx("span",{className:"text-green-600 font-bold",children:"ShelfSage"})';
let s3 = fs.readFileSync(pathIndex, 'utf8');
if (s3.includes(docOld)) s3 = s3.split(docOld).join(docNew);
s3 = s3.split('label:"Pro Features"').join('label:"All features"');
s3 = s3.split('children:"Pro Features"').join('children:"All features"');
fs.writeFileSync(pathIndex, s3);

console.log('Unified build patch OK:', pathIndex, pathAdmin);
