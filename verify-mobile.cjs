const { chromium }=require('playwright');
const {spawn}=require('child_process');
const assert=require('assert');
const path=require('path');
const fs=require('fs');
const captures=process.env.CAPTURES||path.join(__dirname,'test-results','mobile');
fs.mkdirSync(captures,{recursive:true});
const server=process.env.LIVE?null:spawn('python3',['-m','http.server','8061','--bind','127.0.0.1'],{cwd:__dirname,stdio:'ignore'});
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
try{for(const width of [320,390,1280]){const p=await b.newPage({viewport:{width,height:844},reducedMotion:process.env.REDUCED?'reduce':'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.LIVE||'http://127.0.0.1:8061/',{waitUntil:'networkidle'});await p.locator('.journey-marker').first().waitFor();
assert(await p.locator('#mission-panel').isHidden());await p.screenshot({path:`${captures}/huck-${process.env.LIVE?'live':'local'}-map-${width}.png`});
await p.locator('#mission-toggle').click();await p.locator('#mission-panel').waitFor({state:'visible'});assert.equal(await p.locator('#mission-toggle').getAttribute('aria-expanded'),'true');await p.screenshot({path:`${captures}/huck-${process.env.LIVE?'live':'local'}-mission-${width}.png`});
await p.locator('#play-pause-btn').click();assert.equal(await p.locator('#play-pause-btn').getAttribute('aria-label'),'Pause Mission');await p.locator('#play-pause-btn').click();
await p.locator('#timeline-slider').fill('50');assert.notEqual(await p.locator('#hud-distance').textContent(),'0');await p.locator('#timeline-slider').fill('0');
await p.locator('#terminal-toggle').click();await p.locator('#terminal-input').fill('LIST');await p.locator('#terminal-input').press('Enter');assert((await p.locator('#terminal-output').textContent()).includes('KNOWN LOCATIONS'));await p.screenshot({path:`${captures}/huck-${process.env.LIVE?'live':'local'}-terminal-${width}.png`});await p.keyboard.press('Escape');assert(await p.locator('#terminal-container').isHidden());assert.equal(await p.evaluate(()=>document.activeElement.id),'mission-toggle');
let count=await p.locator('.journey-marker').count();for(let i=0;i<count;i++){await p.locator('.journey-marker').nth(i).focus();await p.keyboard.press('Enter');assert(await p.locator('#story-panel').isVisible());let r=await p.locator('#story-panel').boundingBox();assert(r.x>=0&&r.x+r.width<=width+1&&r.y+r.height<=844);await p.locator('#story-panel').evaluate(e=>e.scrollTop=e.scrollHeight);r=await p.locator('#close-panel').boundingBox();assert(r.y>=0&&r.y+r.height<=844);await p.keyboard.press('Escape');assert(await p.locator('#story-panel').isHidden());}
// Pointer interaction at the shared pursuit/first-place location.
await p.reload({waitUntil:'networkidle'});await p.locator('.journey-marker').first().click();await p.screenshot({path:`${captures}/huck-${process.env.LIVE?'live':'local'}-detail-${width}.png`});await p.keyboard.press('Escape');
// Genuine decision, prediction, return-to-timeline, then both routes.
for(const choice of [0,1]){
 await p.reload({waitUntil:'networkidle'});await p.locator('#mission-toggle').click();await p.locator('#play-pause-btn').click();await p.locator('#decision-modal.active').waitFor();
 await p.locator('.sim-btn-trigger').first().click();await p.getByRole('button',{name:'EXECUTE SIMULATION',exact:true}).click();await p.locator('#sim-output').filter({hasText:'SUCCESS PROBABILITY'}).waitFor();
 await p.screenshot({path:`${captures}/huck-${process.env.LIVE?'live':'local'}-prediction-${width}.png`});
 await p.getByRole('button',{name:'BACK',exact:true}).click();
 if(choice===0){await p.getByRole('button',{name:'Return to timeline',exact:true}).click();assert(await p.locator('#mission-panel').isVisible());await p.locator('#timeline-slider').fill('0');await p.locator('#play-pause-btn').click();await p.locator('#decision-modal.active').waitFor();}
 await p.locator('.decision-btn').nth(choice).click();await p.locator('#decision-modal.active').waitFor({state:'hidden'});
 if(choice===1){await p.locator('#mission-toggle').click();await p.locator('#play-pause-btn').click();const ids=await p.locator('.journey-marker').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));assert(ids.some(x=>x.includes('Ohio River')));}
}
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log(width,count,'places, controls, terminal, timeline and focus pass');await p.close();}
}finally{await b.close();if(server)server.kill();}})().catch(e=>{console.error(e);if(server)server.kill();process.exit(1)});
