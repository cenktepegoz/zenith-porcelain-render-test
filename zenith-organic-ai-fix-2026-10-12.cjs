#!/usr/bin/env node
'use strict';
// Scoped source overlay, run after every existing deployment overlay.
// Usage: node patch.cjs /absolute/reconstructed/source [--check]
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || process.cwd());
const check = process.argv.includes('--check');
const pending = new Map();
function read(file) { const text = fs.readFileSync(path.join(root, file), 'utf8'); pending.set(file, text); return text; }
function once(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 anchor, got ${count}; no files written`);
  return text.replace(before, after);
}
function replace(file, before, after) { pending.set(file, once(pending.get(file) ?? read(file), before, after, file)); }
function solution(slug, fields, questions) {
  const file = 'app/site-data.ts';
  const source = pending.get(file) ?? read(file);
  const lines = source.split('\n');
  const found = lines.map((line, i) => line.trimStart().startsWith(`{slug:"${slug}",`) ? i : -1).filter(i => i >= 0);
  if (found.length !== 1) throw new Error(`${slug}: unique compact solution anchor absent; no files written`);
  const i = found[0];
  let line = lines[i];
  for (const [before, after] of fields) line = once(line, before, after, slug);
  line = once(line, 'faqs:[', `faqs:[${questions.map(q => JSON.stringify(q)).join(',')},`, slug);
  lines[i] = line;
  pending.set(file, lines.join('\n'));
}
const cities = ['Eskişehir', 'Ankara', 'Bursa', 'Kütahya', 'Bilecik', 'Yalova', 'Afyonkarahisar'];
replace('app/region-data.ts', 'export const regions: Region[] = [', `// User-confirmed on-site countertop measurement and installation scope.\nexport const countertopServiceCities = ${JSON.stringify(cities)};\n\nexport const regions: Region[] = [`);
replace('app/layout.tsx', 'import { regions } from "./region-data";', 'import { countertopServiceCities } from "./region-data";');
replace('app/layout.tsx', '...regions.map(({ city }) => ({ "@type": "City", name: city })),', '...countertopServiceCities.map((city) => ({ "@type": "City", name: city })),');
replace('app/bolge/page.tsx', 'import { regions } from "../region-data";', 'import { regions, countertopServiceCities } from "../region-data";');
replace('app/bolge/page.tsx', 'Eskişehir, Ankara, Bursa ve Kütahya’da porselen mutfak tezgâhı için yerinde ölçü, özel üretim, teslimat ve montaj. Şehrinizin hizmet kapsamını inceleyin.', 'Eskişehir, Ankara, Bursa, Kütahya, Bilecik, Yalova ve Afyonkarahisar’da porselen mutfak tezgâhı için yerinde ölçü ve montaj hizmeti.');
replace('app/bolge/page.tsx', 'Ankara, Bursa, Eskişehir ve Kütahya porselen mutfak tezgâhı hizmet sayfaları.', 'Yedi ilde porselen mutfak tezgâhı için yerinde ölçü ve montaj hizmeti.');
replace('app/bolge/page.tsx', '    "@graph": [', '    "@graph": [\n      { "@type": "Service", name: "Porselen mutfak tezgâhı ölçü ve montaj hizmeti", provider: { "@id": "https://zenithporcelain.com/#organization" }, areaServed: countertopServiceCities.map((name) => ({ "@type": "City", name })) },');
replace('app/bolge/page.tsx', 'Dört şehirde porselen<br />mutfak tezgâhı.', 'Yedi ilde mutfak tezgâhı<br />ölçü ve montaj hizmeti.');
replace('app/bolge/page.tsx', 'Eskişehir, Ankara, Bursa ve Kütahya’da yerinde ölçü, özel üretim, teslimat ve montaj hizmeti sunuyoruz. Konut sahipleri, mimarlar, mutfak üreticileri ve inşaat şirketleri için tezgâhları Eskişehir tesisimizde projeye özel hazırlıyoruz.', 'Zenith Porcelain; Eskişehir, Ankara, Bursa, Kütahya, Bilecik, Yalova ve Afyonkarahisar’da mutfak tezgâhları için yerinde ölçü ve montaj hizmeti sunar. Projenizin ölçülerine ve uygulama yerine göre üretim, teslimat ve montaj kapsamını teklif aşamasında birlikte netleştiriyoruz.');
replace('app/bolge/page.tsx', 'Bursa ve Kütahya talepleri Eskişehir üretim tesisinden proje bazlı planlanır; bu şehirlerde fiziksel Zenith şubesi bulunduğu iddia edilmez.', 'Bursa, Kütahya, Bilecik, Yalova ve Afyonkarahisar talepleri Eskişehir üretim tesisinden proje bazlı planlanır. Hizmet bölgeleri ayrı şubeler anlamına gelmez; ekibimiz uygulama adresine gelir.');
replace('app/page.tsx', '<dt>Montaj ağı</dt><dd>Türkiye çapında hizmet</dd>', '<dt>Ölçü ve montaj</dt><dd>Yedi ilde yerinde hizmet</dd>');
replace('app/page.tsx', '<a href="/uretim-teknolojileri">Makine parkını ve süreci inceleyin', '<p>Mutfak tezgâhlarında Eskişehir, Ankara, Bursa, Kütahya, Bilecik, Yalova ve Afyonkarahisar’da yerinde ölçü ve montaj hizmeti veriyoruz. Porselen lavabo, masa ve masa tablası siparişlerini Türkiye geneline sevk ediyoruz. Teslimat ve montaj kapsamı ürün ve projeye göre ayrıca belirlenir.</p><a href="/uretim-teknolojileri">Makine parkını ve süreci inceleyin');
solution('mutfak-tezgahlari', [], [{q:'Hangi şehirlerde ölçü ve montaj hizmeti veriyorsunuz?', a:'Eskişehir, Ankara, Bursa, Kütahya, Bilecik, Yalova ve Afyonkarahisar’da yerinde ölçü ve montaj hizmeti veriyoruz. Üretim, teslimat ve montaj kapsamı her proje için yazılı teklifte netleştirilir.'}]);
solution('porselen-lavabo-cozumleri', [], [
  {q:'Tek adet porselen lavabo sipariş edebilir miyim?', a:'Evet. Tek adet porselen lavabo siparişi kabul ediyoruz. Ölçü ve uygulama detaylarını paylaşarak projenize uygun teklif alabilirsiniz.'},
  {q:'Porselen lavabo üretimi ne kadar sürer?', a:'Ortalama üretim süresi yaklaşık iki haftadır. Üretim ve sevkiyat tarihleri, ürünün ölçüleri ve teknik özellikleri değerlendirilerek sipariş sırasında teyit edilir.'},
  {q:'Türkiye geneline gönderim yapıyor musunuz?', a:'Evet, Türkiye geneline sevkiyat yapıyoruz. Yerleştirme ve bağlantı koşulları sipariş öncesinde netleştirilir. Gerekli tesisat bağlantıları için uygun uzman desteği alınmalıdır.'},
  {q:'Lavaboyla birlikte banyo dolabı da geliyor mu?', a:'Hayır. Porselen lavabo teklifi yalnızca lavabo içindir; banyo dolabı dahil değildir. Ürün kapsamı, nakliye ve diğer teslimat koşulları yazılı teklifte belirtilir.'},
]);
solution('porselen-masa-ve-sehpalar', [['title:"Porselen masa ve sehpa tablaları"','title:"Porselen masalar ve masa tablaları"']], [
  {q:'Tamamlanmış masa mı, yalnızca masa tablası mı satıyorsunuz?', a:'Her ikisini de sunuyoruz. Tamamlanmış porselen masa veya yalnızca porselen masa tablası için ölçü, model ve adet bilgileriyle teklif alabilirsiniz.'},
  {q:'Açılır-kapanır porselen masa seçenekleriniz var mı?', a:'Evet, açılır-kapanır masa seçeneklerimiz bulunuyor. Ölçü, model ve mekanizma seçimi sipariş öncesinde birlikte netleştirilir.'},
  {q:'Üretim süresi ne kadar?', a:'Ortalama üretim süresi yaklaşık üç haftadır. Kesin üretim ve teslimat takvimi, seçilen model, ölçü ve adet üzerinden sipariş sırasında teyit edilir.'},
  {q:'Türkiye geneline teslimat yapıyor musunuz?', a:'Evet. Türkiye geneline teslimat yapıyoruz. Nakliye bedeli ve teslimat organizasyonu, varış yeri ve sipariş adedine göre belirlenir.'},
  {q:'Mobilya üreticileri ve toplu projeler için üretim yapıyor musunuz?', a:'Mobilya ve masa üreticileri, mimarlar, otel, kafe ve restoran projeleri için çalışıyoruz. Ölçü, adet ve teknik ihtiyaçlara göre projeye özel teklif hazırlıyoruz.'},
]);
const decisions = [
  {number:'01',title:'Kullanım alanı ve ölçüler',text:'Masa, sehpa veya mobilya yüzeyinin kullanım amacı, yerleşimi ve parça ölçüleri birlikte değerlendirilir.'},
  {number:'02',title:'Malzeme ve katman yapısı',text:'Porselen marka/modeli, cam ve ara katman seçimi projenin teknik ihtiyaçlarına göre netleştirilir.'},
  {number:'03',title:'Kenar, taşıyıcı ve bağlantılar',text:'Kenar bitişleri, özel kesimler, alt yapı, destek noktaları ve bağlantı detayları üretim öncesinde değerlendirilir.'},
  {number:'04',title:'Adet ve teslimat',text:'Üretim adedi, teslimat yeri ve sevkiyat organizasyonu teklif aşamasında belirlenir.'},
];
solution('cam-porselen-laminasyonu', [['process:[',`decisions:${JSON.stringify(decisions)},process:[`]], [
  {q:'Teklif için hangi bilgileri paylaşmalıyım?', a:'Kullanım alanını, ölçüleri, porselen marka ve modelini, adedi, taşıyıcı ve bağlantı detaylarını ve teslimat yerini paylaşın. Katman yapısı ve üretilebilirlik teknik değerlendirmeyle netleştirilir.'},
  {q:'Hangi markaların porselenlerini işliyorsunuz?', a:'Laminam, Kale, NG Kütahya, Anatolia ve Neolith dahil farklı üreticilerin porselenlerini işliyoruz. Seçilen marka ve modelin projeye uygunluğu teknik değerlendirmeyle belirlenir.'},
]);
replace('app/cozumler/[slug]/page.tsx', 'import { solutions } from "../../site-data";', 'import { solutions } from "../../site-data";\nimport { countertopServiceCities } from "../../region-data";');
replace('app/cozumler/[slug]/page.tsx', 'Ankara, Bursa, Eskişehir ve Kütahya hizmet kapsamını inceleyin.', 'Yedi ilde yerinde ölçü ve montaj hizmet kapsamını inceleyin.');
replace('app/cozumler/[slug]/page.tsx', 'areaServed: ["Türkiye", "Europe", "Middle East"],', 'areaServed: ["mutfak-tezgahlari", "yeni-nesil-mutfak-tezgahi-detaylari"].includes(slug)\n      ? countertopServiceCities.map((name) => ({ "@type": "City", name }))\n      : ["Türkiye", "Europe", "Middle East"],');
// Validate every anchor before committing any file; untouched analytics and routes remain byte-identical.
for (const [file, text] of pending) {
  if (!text.length) throw new Error(`Empty output: ${file}`);
  console.log(`${check ? 'WOULD PATCH' : 'PATCH'} ${file}`);
}
if (!check) for (const [file, text] of pending) fs.writeFileSync(path.join(root, file), text);
