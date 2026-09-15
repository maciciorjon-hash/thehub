// Render the record PDF and the bench sheet of seeded experiments to PDF files, for inspection.
import { chromium } from 'playwright';
const OUT = process.argv[2];
const URL0 = 'http://127.0.0.1:8899/apps/labbook/labbook.html';
const SEED = `(function(){
  function d(off){ var x=new Date(); x.setHours(12,0,0,0); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); }
  var p=LB.data.projects[1], s=p.sections[0]; var out={};
  function mk(type,title,off){ selectNode('expsec',p.id,s.id); openNew(); el('nm-type').value=type; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value=d(off); el('nm-title').value=title; nmUpdateCode(); nmPreview(); NM_PLATE=true; createExperiment(); return SEL.page; }
  out.bio=mk('NB_BIO_RTX96','BET biosensor run',-2);
  out.screen=mk('NB_SPARK_SCREEN96','SPARK screen',0);
  out.wb=mk('WB','Western blot of BRD4',-3);
  var e=LB.data.experiments[out.bio]; e.aim='Does compound X engage BRD4 BD1 in cells?'; e.blocks[0].done=true; e.blocks[0].completedAt=Date.now(); e.blocks[1].done=true; e.blocks[1].completedAt=Date.now();
  e.html='<p>Cells looked healthy at seeding. Plate 1 slightly bubbly in row H.</p>';
  e.results=[{compound:'EDA-099',target:'BRD4 BD1',potency:12.4,effect:88,hill:1.1,r2:0.99,label:'IC50'},{compound:'EDA-100',target:'BRD4 BD1',potency:230,effect:70,hill:0.9,r2:0.97,label:'IC50',flag:'shallow'}];
  save(); return out;
})()`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:1280,height:900} });
const page = await ctx.newPage();
await page.goto(URL0); await page.waitForTimeout(600);
await page.evaluate(`try{localStorage.clear()}catch(e){}`); await page.reload(); await page.waitForTimeout(600);
const ids = await page.evaluate(SEED);
for (const [name,id] of Object.entries(ids)) {
  await page.evaluate(`openExp('${id}'); var pr=el('print-root'); pr.innerHTML=buildPrintDoc();`);
  await page.waitForTimeout(300);
  await page.emulateMedia({ media:'print' });
  await page.pdf({ path: OUT+'/'+name+'-record.pdf', format:'A4', preferCSSPageSize:true, printBackground:true });
  await page.emulateMedia({ media:'screen' });
  await page.evaluate(`var pr=el('print-root'); pr.innerHTML=buildLabSheet(LB.data.experiments['${id}']);`);
  await page.waitForTimeout(300);
  await page.emulateMedia({ media:'print' });
  await page.pdf({ path: OUT+'/'+name+'-bench.pdf', format:'A4', preferCSSPageSize:true, printBackground:true });
  await page.emulateMedia({ media:'screen' });
  console.log(name, 'done');
}
await browser.close();
