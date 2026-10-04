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
    // courses and reviews require signedIn() to read directly, so this page
    // (shown to signed-out visitors) can't query those collections itself —
    // instead each university document carries its own public, write-once
    // counter fields (student_count / course_count / review_count), bumped
    // by signup / course creation / review creation respectively. Summing
    // those across every university (universities IS publicly readable)
    // gives accurate site-wide stats without exposing the private
    // collections themselves. There's also no admin-approval workflow for
    // universities, so this still counts all of them, not just 'approved'.
    const snap=await db.collection('universities').get();
    let courses=0,reviews=0,students=0;
    snap.docs.forEach(doc=>{
      const u=doc.data();
      courses+=u.course_count||0;
      reviews+=u.review_count||0;
      students+=u.student_count||0;
    });
    globalStats={universities:snap.size||0,courses:courses,reviews:reviews,students:students};
  }catch(e){
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
  // Double opt-in gate. We primarily trust our own EmailJS-delivered link
  // (profile.verified), since Firebase's own verification mail often gets
  // filtered by university mail systems — see the setup notes. Firebase's
  // native authUser.emailVerified is still honored too, as a bonus signal
  // for any institution whose filters don't block firebaseapp.com. Checking
  // this from the same read used to build the profile below (rather than a
  // separate round trip) also means a signup's early onAuthStateChanged
  // firing — which can race ahead of finishSignup() creating the profile
  // doc — just quietly reads "not verified yet" instead of erroring.
  const profileData=profileSnap.exists?profileSnap.data():null;
  const verified=authUser.emailVerified||(profileData&&profileData.verified===true);
  if(!verified){
    // If we're here because verify.js sent an unauthenticated visitor to
    // sign in first, this is the moment right after that sign-in succeeds —
    // finish redeeming their link now instead of stranding them on a
    // generic check-email screen with no memory of what they clicked.
    if(state.pendingVerify&&state.pendingVerify.uid===authUser.uid){
      const{uid,token}=state.pendingVerify;
      state.pendingVerify=null;
      const outcome=await attemptVerifyToken(uid,token);
      if(outcome==='success'){
        await afterAuthSuccess(opts); // re-run now that verified is true
        return;
      }
      // token invalid/expired/error — fall through to the normal screen below
    }
    enterCheckEmailStep(authUser.email);
    return;
  }
  if(!profileSnap.exists){toast(t('toast.could_not_load_profile'));return}
  const profile=profileData;

  if(profile.role==='admin'){
    user={
      id:authUser.uid,
      name:profile.full_name||nameFromEmail(authUser.email),
      email:authUser.email,
      isAdmin:true,
      inst:null,
      program:'',year:'',faculty:'',
      interfaceLang:profile.interface_lang||'',
      prefs:{anonDefault:false,publicProfile:false}
    };
    await ensureLangLoaded(LANG_CODES[user.interfaceLang]);
    applyDocDir();
    location.hash='#/admin';
    render();
    return;
  }

  if(!profile.university_id){toast(t('toast.could_not_link_university'));return}
  await loadUniversity(profile.university_id);
  user={
    id:authUser.uid,
    name:profile.full_name||nameFromEmail(authUser.email),
    email:authUser.email,
    inst:profile.university_id,
    program:profile.program||'Undeclared',year:profile.year||'2nd year',faculty:profile.faculty||'',
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
