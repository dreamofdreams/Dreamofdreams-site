(() => {
'use strict';
const base='https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
const list=document.getElementById('book-review-list');
if(!list)return;
const form=document.getElementById('book-review-form'), status=document.getElementById('review-status');
const remove=document.getElementById('review-delete');
const signin=document.getElementById('review-signin');
const photoInput=document.getElementById('review-photo'),photoPreview=document.getElementById('review-photo-preview'),photoImage=document.getElementById('review-photo-image');
const photoConsent=document.getElementById('review-photo-consent'),photoConsentLabel=document.getElementById('review-photo-consent-label');
let selectedPhoto=null,removePhoto=false,previewObjectUrl=null;
// The photo API allows credentialed CORS; use it for saved photos and private previews.
function showPhoto(url){photoPreview.hidden=!url;photoConsentLabel.hidden=!url;photoConsent.required=Boolean(url);if(url){photoImage.crossOrigin='use-credentials';photoImage.src=url;}else photoImage.removeAttribute('src');}
function resetLocalPhoto(){if(previewObjectUrl)URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null;selectedPhoto=null;photoInput.value='';}
document.getElementById('review-add-photo').addEventListener('click',()=>photoInput.click());
photoInput.addEventListener('change',()=>{
 const file=photoInput.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){status.textContent='Choose a JPEG, PNG or WebP photo up to 10 MB.';photoInput.value='';return;}
 resetLocalPhoto();selectedPhoto=file;removePhoto=false;previewObjectUrl=URL.createObjectURL(file);showPhoto(previewObjectUrl);photoConsent.checked=false;status.textContent='Photo selected. It will be checked with your review before publication.';
});
document.getElementById('review-remove-photo').addEventListener('click',()=>{resetLocalPhoto();removePhoto=true;showPhoto(null);photoConsent.checked=false;});
async function preparePhoto(file){
 const bitmap=await createImageBitmap(file);try{
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  let data;for(const quality of [.85,.7,.55]){data=canvas.toDataURL('image/jpeg',quality).split(',')[1];if(data.length<=1000000)return data;}
  throw new Error('This photo is too detailed to upload. Please choose a smaller image.');
 }finally{bitmap.close();}
}
form.hidden=true;
signin.hidden=false;
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
   const content=el('div');content.append(text);
   if(review.photoUrl){try{const url=new URL(review.photoUrl);if(url.origin===base&&url.pathname==='/community/reviews'&&url.searchParams.has('photo')){const image=el('img',null,'review-reader-photo');image.crossOrigin='use-credentials';image.src=url.href;image.alt='Reader photo shared with '+review.displayName+'’s review';image.loading='lazy';image.decoding='async';content.append(image);}}catch{}}
   if(review.spoiler){const details=el('details');details.append(el('summary','Contains spoilers — show review'),content);card.append(details);}else card.append(content);
   list.append(card);
  });
 }catch(e){list.replaceChildren(el('p','Reviews could not be loaded. Please try again shortly.'));}
}
async function loadOwn() {
 try {
  const own=await request('/community/reviews/me');
  if(own.authenticated!==true){form.hidden=true;signin.hidden=false;return;}
  signin.hidden=true;form.hidden=false;
  document.getElementById('review-author').textContent='Posting as '+own.displayName;
  document.getElementById('review-rating').value=own.review?.rating||'';
  document.getElementById('review-text').value=own.review?.text||'';
  document.getElementById('review-spoiler').checked=own.review?.spoiler||false;
  resetLocalPhoto();removePhoto=false;showPhoto(own.review?.photoUrl||null);photoConsent.checked=Boolean(own.review?.photoUrl);
  remove.hidden=!own.review;
  if(own.review)status.textContent=own.review.status==='approved'?'Your review is approved and published.':own.review.status==='rejected'?'Your review was not approved. You may edit and submit it again.':'Your review is awaiting approval.';
  form.querySelector('[type=submit]').textContent='Submit';
 }catch(e){if(location.hash==='#reader-reviews') status.textContent='Sign in with Google to write a review. If you just signed in, your browser may be blocking the community session cookie.';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='Saving your review…';
 try {
  const payload={rating:Number(document.getElementById('review-rating').value),text:document.getElementById('review-text').value,spoiler:document.getElementById('review-spoiler').checked};
  if(selectedPhoto){status.textContent='Preparing your photo…';payload.photo=await preparePhoto(selectedPhoto);payload.photoConsent=photoConsent.checked;}else if(removePhoto)payload.photo=null;
  status.textContent='Saving your review…';await request('/community/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
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
