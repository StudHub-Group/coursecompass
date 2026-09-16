/* ==========================================================================
   Helpers
   ========================================================================== */
function inst(){return user?DB[user.inst]:null}
function getCourse(id){const i=inst();return i?i.courses.find(c=>c.id===id):null}
function reviewsFor(id){return inst().reviews.filter(r=>r.courseId===id)}
function courseAvg(id){const r=reviewsFor(id);return r.length?r.reduce((a,x)=>a+x.overall,0)/r.length:null}
function courseMetric(id,k){const r=reviewsFor(id);return r.length?r.reduce((a,x)=>a+(x[k]||0),0)/r.length:null}
function facultyName(fid){const f=inst().faculties.find(x=>x.id===fid);return f?f.name:'Unassigned'}
function facultyStats(fid){const cs=inst().courses.filter(c=>c.faculty===fid);const rated=cs.map(c=>courseAvg(c.id)).filter(v=>v!=null);return{count:cs.length,avg:rated.length?rated.reduce((a,b)=>a+b,0)/rated.length:null}}
function uniqueTerms(){return Array.from(new Set(inst().courses.flatMap(c=>c.terms||[]))).filter(Boolean).sort()}
function termsLabel(terms){return (terms&&terms.length)?terms.map(tm=>enumLabel('season',tm)).join(' / '):'—'}
function isValidEmail(e){return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e||''))}
function domainOf(e){return (String(e).split('@')[1]||'').toLowerCase()}
function nameFromEmail(email){
  const local=(String(email).split('@')[0]||'student');
  const parts=local.split(/[._-]+/).filter(Boolean);
  if(!parts.length) return 'Student';
  return parts.map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
}
// Lightweight client-side stand-in for the Postgres trigram-similarity RPCs
// (search_similar_faculties / search_similar_courses). Good enough for a
// "did you mean…" hint; not a real fuzzy-match algorithm.
function findSimilar(list,val,key){
  const v=val.trim().toLowerCase();
  if(!v) return null;
  return list.find(item=>{
    const name=(item[key]||'').toLowerCase();
    return name&&(name===v||name.includes(v)||v.includes(name));
  })||null;
}
function termString(r){return (r.season||'')+' '+(r.year||'')}
function termLabel(r){return enumLabel('season',r.season)+' '+(r.year||'')}
function persistMsgs(){saveJSON(MSG_KEY,messages)}

function toast(msg){
  const root=$('#toast-root');
  const el=document.createElement('div');
  el.className='rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg transition-all duration-300 opacity-0 translate-y-2';
  el.textContent=msg;
  root.appendChild(el);
  requestAnimationFrame(()=>el.classList.remove('opacity-0','translate-y-2'));
  setTimeout(()=>{el.classList.add('opacity-0','translate-y-2');setTimeout(()=>el.remove(),300)},2600);
}
