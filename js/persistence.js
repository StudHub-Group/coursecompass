/* ==========================================================================
   Persistence
   ========================================================================== */
const MSG_KEY='cc-messages-v6'; // contact/feedback history only — not part of the Firestore schema yet, stays local
function loadJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

let DB={};      // in-memory cache: DB[universityId] = {code,name,...,faculties,courses,reviews}, populated by loadUniversity()
let user=null;  // in-memory session user, populated by afterAuthSuccess() after Firebase confirms a session
let messages=loadJSON(MSG_KEY,[]);
let globalStats={universities:0,courses:0,reviews:0}; // site-wide counts for the landing/about pages, see refreshGlobalStats()

// List of valid languages for "languages taught at this university" — kept in
// languages.json (must sit next to this HTML file) so new languages can be
// added by editing that one file, with no code changes. This fallback list
// only covers what's referenced by COUNTRIES above, so the country-based
// suggestion chips keep working even if the fetch below fails.
let VALID_LANGUAGES=['English','French','German','Italian','Spanish','Portuguese','Dutch','Swedish','Norwegian','Danish','Finnish','Chinese','Japanese','Korean','Hindi','Malay','Tamil','Catalan','Basque','Galician','Romansh','Irish','Afrikaans','Zulu'];
async function loadLanguageDictionary(){
  try{
    const res=await fetch('languages.json');
    if(!res.ok) return;
    const list=await res.json();
    if(Array.isArray(list)&&list.length) VALID_LANGUAGES=list;
  }catch(e){ /* keep the fallback list above — likely opened without a local server */ }
}
