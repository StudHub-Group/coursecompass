/* ==========================================================================
   Firestore data loading
   ========================================================================== */
async function findUniversityByDomain(email){
  const d=domainOf(email); if(!d) return null;
  try{
    const snap=await db.collection('universities').where('domains','array-contains',d).limit(1).get();
    if(snap.empty) return null;
    const doc=snap.docs[0];
    return Object.assign({id:doc.id},doc.data()); // {id,name,abbreviation,status,...}
  }catch(e){console.error(e);return null}
}

// Populates DB[universityId] from Firestore, mapping document fields onto the
// shape the render functions already expect (prof/desc/courseId/text/etc).
async function loadUniversity(universityId){
  try{
    const [uniSnap,facSnap,courseSnap,reviewSnap]=await Promise.all([
      db.collection('universities').doc(universityId).get(),
      db.collection('faculties').where('university_id','==',universityId).orderBy('name').get(),
      db.collection('courses').where('university_id','==',universityId).orderBy('code').get(),
      db.collection('reviews').where('university_id','==',universityId).get() // denormalized field, see reviews.university_id in the setup guide
    ]);
    if(!uniSnap.exists){toast(t('toast.could_not_load_university'));return}
    const u=uniSnap.data();
    DB[universityId]={
      code:u.abbreviation||'',name:u.name,domain:(u.domains&&u.domains[0])||'',country:u.country,
      languages:u.languages||[],terms:u.terms||[],localName:u.local_name||'',tagline:u.tagline||'',status:u.status,
      faculties:facSnap.docs.map(d=>{const f=d.data();return {id:d.id,name:f.name,desc:f.description||''}}),
      // c.terms is the current (array) field; c.term is a fallback for courses
      // written before multi-term support existed, so older data still displays.
      courses:courseSnap.docs.map(d=>{const c=d.data();return {id:d.id,code:c.code,title:c.title,prof:c.professor||'TBA',credits:c.credits||0,terms:c.terms||(c.term?[c.term]:[]),level:c.level,faculty:c.faculty_id,desc:c.description||''}}),
      reviews:reviewSnap.docs.map(d=>{const r=d.data();const created=r.created_at&&r.created_at.toDate?r.created_at.toDate():new Date();return {id:d.id,courseId:r.course_id,authorId:r.author_id,author:r.is_anonymous?null:(r.author_name||'Student'),season:r.season,year:String(r.year),date:created.toLocaleDateString('en-US',{month:'short',year:'numeric'}),overall:r.overall,difficulty:r.difficulty,workload:r.workload,professor:r.professor,text:r.body}})
    };
  }catch(e){console.error(e);toast(t('toast.could_not_load_university'))}
}

async function refreshGlobalStats(){
  try{
    // Note: there's no admin-approval workflow in this app yet — every
    // self-signup university is created with status:'pending' and nothing
    // ever flips it to 'approved'. Counting only 'approved' universities
    // would make this stat permanently stuck at 0, so we count all of them.
    const [uc,cc,rc]=await Promise.all([
      db.collection('universities').count().get(),
      db.collection('courses').count().get(),
      db.collection('reviews').count().get()
    ]);
    globalStats={universities:uc.data().count||0,courses:cc.data().count||0,reviews:rc.data().count||0};
  }catch(e){
    // If these still read 0 after this fix, open the browser console on the
    // sign-in page — this catch logs the real Firestore error (most likely
    // a Security Rules issue: 'universities' is already readable while
    // signed out for the university search during signup, but 'courses'
    // and 'reviews' may not have a public read rule yet, since they're
    // normally only ever read after sign-in via loadUniversity()).
    console.error(e);
  }
  if(state.route==='#/'||state.route===''||state.route==='#'||state.route==='#/about') render();
}

function showAuthError(msg){
  const err=$('#auth-error');
  if(err){err.textContent=msg;err.classList.remove('hidden')}
  else toast(msg);
}

function setAuthBusy(busy){
  const btn=document.querySelector('#auth-form button[type="submit"]');
  if(btn){btn.disabled=busy;btn.textContent=busy?t('auth.please_wait'):(state.tab==='signup'?t('auth.submit_signup'):t('auth.submit_signin'))}
}

// Called once we know a Firebase Auth session exists — right after sign-in,
// right after signup, and on page load if a session was already persisted
// (see the auth.onAuthStateChanged listener near the bottom of this file).
async function afterAuthSuccess(opts){
  opts=opts||{};
  const authUser=auth.currentUser;
  if(!authUser) return;
  let profileSnap;
  try{
    profileSnap=await db.collection('profiles').doc(authUser.uid).get();
  }catch(e){console.error(e);toast(t('toast.could_not_load_profile'));return}
  if(!profileSnap.exists){toast(t('toast.could_not_load_profile'));return}
  const profile=profileSnap.data();
  if(!profile.university_id){toast(t('toast.could_not_link_university'));return}
  await loadUniversity(profile.university_id);
  user={
    id:authUser.uid,
    name:profile.full_name||nameFromEmail(authUser.email),
    email:authUser.email,
    inst:profile.university_id,
    program:'Undeclared',year:'2nd year',faculty:'',
    interfaceLang:profile.interface_lang||'',
    prefs:{anonDefault:!!profile.anon_default,publicProfile:false}
  };
  await ensureLangLoaded(LANG_CODES[user.interfaceLang]);
  applyDocDir();
  state.signup={step:'form',name:'',email:'',domain:'',password:'',password2:'',matched:null,pickQuery:'',newName:'',newAbbr:'',newCountry:'',newLanguages:[],newTerms:[],newLocalName:'',newIntlName:'',customLangInput:''};
  state.filters={q:'',faculty:'',level:'',term:'',sort:'rating'};
  state.facultyExpanded=true;
  location.hash='#/dashboard';
  render();
  if(opts.showLangPrompt) showLanguagePrompt();
}
