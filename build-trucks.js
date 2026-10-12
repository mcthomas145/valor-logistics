#!/usr/bin/env node
/* Valor Logistics — auto-build SEO truck pages from the live feed.
   Runs in GitHub Actions. Fetches the public trucks feed, writes one static
   page per AVAILABLE truck, a /trucks/ index, real photo files, sitemap.xml
   and robots.txt. Dependency-free (Node 18+ global fetch). */
const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://valor-fleet.matt-c78.workers.dev/api/public/trucks';
const SITE = 'https://haulvalor.com';
const ROOT = process.cwd();                 // repo root
const today = new Date().toISOString().slice(0,10);

const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug = s => String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-+/g,'-');
const num = v => (v!=null && String(v).replace(/[.]/g,'').match(/^\d+$/)) ? Number(v) : null;
const commafy = n => n==null?'':Number(n).toLocaleString('en-US');

const CSS = `*{box-sizing:border-box}body{margin:0;background:#080c16;color:#eaf0fa;font-family:'Archivo',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:#5aa9f2}.wrap{max-width:1040px;margin:0 auto;padding:0 22px}
header{border-bottom:1px solid rgba(140,170,220,.12);background:linear-gradient(180deg,#0b1120,#080c16);position:sticky;top:0;z-index:5}
.bar{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;max-width:1040px;margin:0 auto}
.brand{display:flex;align-items:baseline;gap:8px;text-decoration:none}.brand .v{font-family:'Archivo';font-weight:800;letter-spacing:.14em;color:#fff;font-size:18px}.brand .s{font-weight:700;letter-spacing:.32em;color:#6c7a96;font-size:10px}
.cta{background:#2890e8;color:#fff;text-decoration:none;padding:9px 16px;border-radius:9px;font-weight:700;font-size:14px}
.back{font-size:13px;color:#9aa8c2;text-decoration:none}
h1{font-family:'Marcellus',serif;font-weight:400;font-size:clamp(1.8rem,4.2vw,2.6rem);margin:0 0 4px}
.sub{color:#9aa8c2;margin:0 0 22px;font-size:15px}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;align-items:start}
@media(max-width:760px){.grid{grid-template-columns:1fr}}
.photo{width:100%;border-radius:16px;border:1px solid rgba(140,170,220,.12);display:block}
.facts{background:#0f1626;border:1px solid rgba(140,170,220,.12);border-radius:16px;padding:6px 20px;margin:0}
.facts div{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid rgba(140,170,220,.1);font-size:15px}
.facts div:last-child{border-bottom:none}.facts .k{color:#9aa8c2}.facts .val{color:#fff;font-weight:700;text-align:right}
.pay{color:#5ce39a}.apply{display:inline-block;margin-top:18px;background:#2890e8;color:#fff;text-decoration:none;padding:14px 26px;border-radius:11px;font-weight:800;font-size:16px}
.apply:hover{background:#2363b0}.lede{color:#d6def0;margin:16px 0 0;font-size:15.5px}
.navlinks{margin-top:26px;font-size:14px}.navlinks a{margin-right:18px}
footer{border-top:1px solid rgba(140,170,220,.12);padding:26px 22px;text-align:center;color:#6c7a96;font-size:13px;margin-top:50px}
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin:26px 0 10px}
.card{background:#0f1626;border:1px solid rgba(140,170,220,.12);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;display:block;transition:border-color .15s}
.card:hover{border-color:rgba(90,169,242,.5)}.card img{width:100%;height:190px;object-fit:cover;display:block}
.card .body{padding:14px 16px}.card .ttl{font-weight:800;color:#fff;font-size:16px;margin-bottom:6px}
.card .meta{color:#9aa8c2;font-size:13.5px;line-height:1.5}.card .p{color:#5ce39a;font-weight:700}`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Archivo:wght@400;700;800&display=swap" rel="stylesheet">';
const HEADER = '<header><div class="bar"><a class="brand" href="/"><span class="v">VALOR</span><span class="s">LOGISTICS</span></a><a class="cta" href="/trucks/">Available Trucks</a></div></header>';
const FOOTER = '<footer>© <span id="yr"></span> Valor Logistics · $0 Down Lease Purchase Semi Trucks · Indianapolis, IN &nbsp;·&nbsp; <a href="/">Home</a> · <a href="/trucks/">Trucks</a> · <a href="/privacy.html">Privacy</a><script>document.getElementById("yr").textContent=new Date().getFullYear();</script></footer>';

async function getFeed(){
  if (process.env.FEED_FILE) return JSON.parse(fs.readFileSync(process.env.FEED_FILE,'utf8'));
  const r = await fetch(FEED_URL, {headers:{'accept':'application/json'}});
  if(!r.ok) throw new Error('feed fetch failed: '+r.status);
  return await r.json();
}
function rmrf(p){ if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true}); }

(async ()=>{
  const data = await getFeed();
  const all = data.trucks || (Array.isArray(data)?data:[]);
  const trucks = all.filter(t => String(t.status||'').toLowerCase()==='available');

  // clean previously generated content so sold trucks drop off
  rmrf(path.join(ROOT,'trucks'));
  rmrf(path.join(ROOT,'img','trucks'));
  fs.mkdirSync(path.join(ROOT,'trucks'),{recursive:true});
  fs.mkdirSync(path.join(ROOT,'img','trucks'),{recursive:true});

  const sitemap = [`${SITE}/`, `${SITE}/trucks/`, `${SITE}/privacy.html`];
  const cards = [];
  let built = 0;

  for (const t of trucks){
    const unit=String(t.unit||'').trim(), year=String(t.year||'').trim(), model=String(t.model||'').trim();
    const brand=model.split(' ')[0]||'', modelrest=model.split(' ').slice(1).join(' ')||model;
    const pay=String(t.payment||'').trim(), payamt=t.paymentAmount, freq=String(t.frequency||'weekly').trim();
    const nump=t.numPayments, sale=num(t.salePrice), miles=num(t.mileage);
    const trans=String(t.transmission||'').trim(), loc=String(t.location||'').trim(), tid=String(t.id||'').trim();
    const name=`${year} ${model}`.trim();
    const sl=`${slug(unit)}-${slug(year)}-${slug(model)}`.replace(/^-+|-+$/g,'');
    const url=`${SITE}/trucks/${sl}/`;
    // image
    let imgpath=`/img/trucks/${unit}-1.jpg`;
    const img=(t.image || (t.photos&&t.photos[0]) || '');
    if (typeof img==='string' && img.startsWith('data:')){
      try{ const b64=img.split(',')[1]; fs.writeFileSync(path.join(ROOT,'img','trucks',`${unit}-1.jpg`), Buffer.from(b64,'base64')); }
      catch(e){ imgpath=''; }
    } else { imgpath=''; }
    const milesF=commafy(miles);
    const title=`${name} – $0 Down Lease Purchase${pay?', '+pay:''} | Valor Logistics`;
    const desc=`${name}`+(trans?`, ${trans.toLowerCase()}`:'')+(milesF?`, ${milesF} miles`:'')+(loc?`, located in ${loc}`:'')+`. $0 down lease purchase`+(pay?` at ${pay}`:'')+(nump?` for ${nump} payments`:'')+`. Apply with Valor Logistics today.`;
    const applyUrl=`/?unit=${encodeURIComponent(unit)}&model=${encodeURIComponent(model)}`+(tid?`&id=${encodeURIComponent(tid)}`:'')+'#apply';
    const alt=`${name} lease purchase truck – unit ${unit}`;
    const ld={ "@context":"https://schema.org","@type":["Vehicle","Product"],"@id":url+"#vehicle",
      "name":`${name} – Unit ${unit}`,"sku":unit,"brand":{"@type":"Brand","name":brand},"model":modelrest||model,
      "vehicleModelDate":year,"vehicleTransmission":trans,"image":imgpath?SITE+imgpath:"","url":url,"description":desc,
      "offers":{"@type":"Offer","priceCurrency":"USD","availability":"https://schema.org/InStock",
        "availableAtOrFrom":{"@type":"Place","address":loc},"seller":{"@id":`${SITE}/#org`}} };
    if(sale!=null) ld.offers.price=sale;
    if(miles!=null) ld.mileageFromOdometer={"@type":"QuantitativeValue","value":miles,"unitCode":"SMI"};
    if(payamt!=null) ld.offers.priceSpecification={"@type":"UnitPriceSpecification","price":payamt,"priceCurrency":"USD","unitText":`weekly payment${nump?', '+nump+' payments':''}`,"referenceQuantity":{"@type":"QuantitativeValue","value":1,"unitCode":"WEE"}};
    const facts=[];
    if(pay) facts.push(["Payment",`<span class="pay">${esc(pay)}</span>`+(nump?` · ${nump} payments`:'')]);
    facts.push(["Down payment",'<span class="pay">$0</span>']);
    if(sale!=null) facts.push(["Sale price",`$${commafy(sale)}`]);
    if(milesF) facts.push(["Mileage",milesF]);
    if(trans) facts.push(["Transmission",esc(trans)]);
    if(loc) facts.push(["Location",esc(loc)]);
    facts.push(["Status","Available"]);
    const factsHtml=facts.map(([k,v])=>`<div><span class="k">${k}</span><span class="val">${v}</span></div>`).join('');
    const imgtag=imgpath?`<img class="photo" src="${imgpath}" alt="${esc(alt)}">`:'';
    const page=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
${imgpath?`<meta property="og:image" content="${SITE}${imgpath}">`:''}
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">
${JSON.stringify(ld,null,2)}
</script>
</head>
<body>
${HEADER}
<main class="wrap" style="padding-top:34px">
  <a class="back" href="/trucks/">&larr; All available trucks</a>
  <h1>${esc(name)} – Unit ${esc(unit)}</h1>
  <p class="sub">$0 Down Lease Purchase Semi Truck · ${esc(loc)}</p>
  <div class="grid">
    <div>${imgtag}</div>
    <div>
      <div class="facts">${factsHtml}</div>
      <a class="apply" href="${applyUrl}">Apply for this truck →</a>
      <p class="lede">Valor Logistics' $0 down lease purchase program puts qualified CDL-A drivers in their own truck with fixed ${esc(freq)} payments and a clear, honest path to full ownership — no large upfront cost. Every payment builds toward owning this ${esc(name)} outright.</p>
      <div class="navlinks"><a href="/trucks/">See all available trucks</a><a href="/">Home</a></div>
    </div>
  </div>
</main>
${FOOTER}
</body>
</html>`;
    fs.mkdirSync(path.join(ROOT,'trucks',sl),{recursive:true});
    fs.writeFileSync(path.join(ROOT,'trucks',sl,'index.html'),page);
    sitemap.push(url); built++;
    cards.push(`<a class="card" href="/trucks/${sl}/">${imgpath?`<img src="${imgpath}" alt="${esc(alt)}" loading="lazy">`:''}<div class="body"><div class="ttl">${esc(name)}</div><div class="meta">Unit ${esc(unit)}${milesF?' · '+milesF+' mi':''}${loc?' · '+esc(loc):''}<br><span class="p">${esc(pay)}</span>${pay?' · $0 down':'$0 down'}</div></div></a>`);
  }

  const idxTitle='Available $0 Down Lease Purchase Semi Trucks | Valor Logistics';
  const idxDesc=`Browse ${built} available $0 down lease-purchase semi trucks from Valor Logistics. Fixed weekly payments, no large upfront cost, and a clear path to ownership for CDL-A drivers.`;
  const idx=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(idxTitle)}</title>
<meta name="description" content="${esc(idxDesc)}">
<link rel="canonical" href="${SITE}/trucks/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(idxTitle)}">
<meta property="og:description" content="${esc(idxDesc)}">
<meta property="og:url" content="${SITE}/trucks/">
${FONTS}
<style>${CSS}</style>
</head>
<body>
${HEADER}
<main class="wrap" style="padding-top:36px">
  <h1>Available $0 Down Lease Purchase Semi Trucks</h1>
  <p class="sub">${built} trucks ready now · Fixed weekly payments · $0 down · A clear path to ownership for CDL-A drivers.</p>
  <div class="tgrid">
  ${cards.join('\n  ')}
  </div>
  <div class="navlinks" style="margin-top:14px"><a href="/">← Back to home</a></div>
</main>
${FOOTER}
</body>
</html>`;
  fs.writeFileSync(path.join(ROOT,'trucks','index.html'),idx);

  let sm='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for(const u of sitemap){ const pr=u===`${SITE}/`?'1.0':(u===`${SITE}/trucks/`?'0.9':(u.includes('privacy')?'0.3':'0.8'));
    sm+=`  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>\n`; }
  sm+='</urlset>\n';
  fs.writeFileSync(path.join(ROOT,'sitemap.xml'),sm);
  fs.writeFileSync(path.join(ROOT,'robots.txt'),'User-agent: *\nAllow: /\n\nSitemap: https://haulvalor.com/sitemap.xml\n');

  console.log(`Built ${built} truck pages, ${sitemap.length} sitemap URLs.`);
})().catch(e=>{ console.error(e); process.exit(1); });
