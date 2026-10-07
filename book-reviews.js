(() => {
'use strict';
const base='https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
const list=document.getElementById('book-review-list');
if(!list)return;
const form=document.getElementById('book-review-form'), status=document.getElementById('review-status');
const remove=document.getElementById('review-delete');
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
async function request(path,options={}) {
 const response=await fetch(base+path,{credentials:'include',signal:AbortSignal.timeout(20000),...options});
 const payload=response.status===204?null:await response.json();
 if(!response.ok)throw new Error(payload?.error||(response.status===401?'Sign in with Google to write a review.':'The review service is unavailable. Please try again.'));
 return payload;
}
async function loadReviews() {
 try {
  const data=await request('/community/reviews');list.replaceChildren();
  if(!data.reviews.length)list.append(el('p','No reader reviews yet. Be the first to review.','elementor-testimonial__text'));
  data.reviews.forEach(review=>{
   const card=el('article',null,'book-review-card elementor-testimonial');
   card.append(el('p',review.displayName,'review-name'));
   const stars=el('p','★'.repeat(review.rating)+'☆'.repeat(5-review.rating),'review-stars');stars.setAttribute('aria-label',review.rating+' out of 5 stars');card.append(stars);
   card.append(el('p','Signed in with Google · '+new Date(review.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),'review-meta'));
   const text=el('p',review.text,'elementor-testimonial__text');
   if(review.spoiler){const details=el('details');details.append(el('summary','Contains spoilers — show review'),text);card.append(details);}else card.append(text);
   list.append(card);
  });
 }catch(e){list.replaceChildren(el('p','Reviews could not be loaded. Please try again shortly.'));}
}
async function loadOwn() {
 try {
  const own=await request('/community/reviews/me');
  if(!own.authenticated)return;
  document.getElementById('review-signin').hidden=true;form.hidden=false;
  document.getElementById('review-author').textContent='Posting as '+own.displayName;
  document.getElementById('review-rating').value=own.review?.rating||'';
  document.getElementById('review-text').value=own.review?.text||'';
  document.getElementById('review-spoiler').checked=own.review?.spoiler||false;
  remove.hidden=!own.review;
  if(own.review)status.textContent=own.review.status==='approved'?'Your review is approved and published.':own.review.status==='rejected'?'Your review was not approved. You may edit and submit it again.':'Your review is awaiting approval.';
  form.querySelector('[type=submit]').textContent='Submit';
 }catch(e){if(location.hash==='#reader-reviews') status.textContent='Sign in with Google to write a review. If you just signed in, your browser may be blocking the community session cookie.';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='Saving your review…';
 try {
  await request('/community/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:Number(document.getElementById('review-rating').value),text:document.getElementById('review-text').value,spoiler:document.getElementById('review-spoiler').checked})});
  status.textContent='Your review was submitted for approval.';await Promise.all([loadReviews(),loadOwn()]);
 }catch(e){status.textContent=e.message;}finally{button.disabled=false;}
});
remove.addEventListener('click',async()=>{
 if(!window.confirm('Remove your review?'))return;
 remove.disabled=true;
 try{await request('/community/reviews/me',{method:'DELETE'});status.textContent='Your review was removed.';await Promise.all([loadReviews(),loadOwn()]);}catch(e){status.textContent=e.message;}finally{remove.disabled=false;}
});
void loadReviews();void loadOwn();
})();
