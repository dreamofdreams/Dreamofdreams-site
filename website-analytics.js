'use strict';
(function(w){
 if(!w.document||!w.fetch||!w.crypto||w.navigator.doNotTrack==='1'||w.navigator.globalPrivacyControl===true)return;
 const endpoint='https://dod-social-auth-gateway-190c9rby.uc.gateway.dev/website/analytics/events',key='dod_visit_v1';
 const id=()=>Array.from(w.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const safe=value=>typeof value==='string'&&/^[a-z0-9_.-]{1,80}$/i.test(value)?value.toLowerCase():'direct';
 let session,newSession=false;const now=Date.now();
 try{session=JSON.parse(w.sessionStorage.getItem(key));}catch(_){}
 if(!session||typeof session.lastAt!=='number'||now-session.lastAt>30*60*1000){
  newSession=true;const query=new URLSearchParams(w.location.search);let source='direct',medium='none';
  if(query.get('utm_source')){source=safe(query.get('utm_source'));medium=safe(query.get('utm_medium')||'campaign');}
  else if(w.document.referrer){try{const host=new URL(w.document.referrer).hostname.replace(/^www\./,'');if(!['dreamofdreams.com','dod-social-auth-gateway-190c9rby.uc.gateway.dev'].includes(host)){source=safe(host);medium='referral';}}catch(_){}}
  session={source,medium,lastAt:now};
 }
 session.lastAt=now;try{w.sessionStorage.setItem(key,JSON.stringify(session));}catch(_){}
 function track(event){
  const payload={id:id(),event,path:w.location.pathname,newSession:event==='page_view'&&newSession,source:session.source,medium:session.medium};
  w.fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'omit'}).then(r=>{if(!r.ok)throw Error('METRICS');}).catch(()=>{});
 }
 w.DODAnalyticsTrack=track;
 function start(){
  track('page_view');
  w.document.addEventListener('click',event=>{
   const link=event.target.closest?.('a[href]');if(!link)return;let url;try{url=new URL(link.href,w.location.href);}catch(_){return;}
   if(!['https:','http:'].includes(url.protocol))return;
   if(/chapter.*(?:sample|\.pdf)|chapter-1-sample/i.test(url.pathname))track('chapter_sample_click');
   else if(/(^|\.)amazon\./.test(url.hostname)&&/pre.?order|ebook|kindle/i.test(link.textContent))track('ebook_preorder_click');
   else if(/(^|\.)bookvault\.app$|(^|\.)bookvault\.com$|(^|\.)bookvault\.shop$/.test(url.hostname)||/bookvault|buy hardcover/i.test(link.textContent))track('hardcover_click');
   else if(/community\/dashboard/.test(url.pathname)||/join community/i.test(link.textContent))track('community_click');
   else if(/early.access/i.test(link.textContent))track('early_access_click');
  });
 }
 if(w.document.readyState==='loading')w.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
