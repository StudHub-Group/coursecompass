/* ==========================================================================
   Router
   ========================================================================== */
async function signOut(){
  const bye=t('toast.signed_out');
  await auth.signOut();
  user=null;DB={};
  state.filters={q:'',faculty:'',level:'',term:'',sort:'rating'};
  state.facultyExpanded=true;
  state.signup={step:'form',name:'',email:'',domain:'',password:'',password2:'',matched:null,pickQuery:'',newName:'',newAbbr:'',newCountry:'',newLanguages:[],newTerms:[],newLocalName:'',newIntlName:'',customLangInput:''};
  state.tab='signup';
  applyDocDir();
  closeLangPrompt();
  location.hash='#/';
  toast(bye);
  render();
}

function render(){
  const app=$('#app');
  const hash=state.route;
  const signedIn=!!user;
  if((hash==='#/'||hash===''||hash==='#')&&user){location.hash='#/dashboard';return}
  let body='';
  if(hash==='#/'||hash===''||hash==='#'){body=renderLanding()}
  else if(hash==='#/about'){body=renderAbout()}
  else if(hash==='#/contact'){body=renderContact()}
  else if(!user){body='<main class="mx-auto w-full max-w-2xl px-4 py-24 text-center"><h1 class="font-display text-3xl">'+t('guest.title')+'</h1><p class="mt-2 text-muted-foreground">'+t('guest.body')+'</p><div class="mt-6 flex flex-wrap justify-center gap-2"><a href="#/" class="btn btn-primary">'+t('guest.back_to_signin')+'</a><a href="#/about" class="btn btn-outline">'+t('header.nav_about')+'</a><a href="#/contact" class="btn btn-outline">'+t('header.nav_contact')+'</a></div></main>'}
  else if(hash==='#/dashboard'){body=renderDashboard()}
  else if(hash.startsWith('#/courses/')){body=renderCourse(hash.replace('#/courses/','').split('?')[0])}
  else if(hash==='#/profile'){body=renderProfile()}
  else if(hash==='#/settings'){body=renderSettings()}
  else {body='<main class="mx-auto w-full max-w-3xl px-4 py-24 text-center"><h1 class="font-display text-3xl">'+t('notfound.title')+'</h1><p class="mt-2 text-muted-foreground">'+t('notfound.body')+'</p><div class="mt-6 flex flex-wrap justify-center gap-2"><a href="'+(user?'#/dashboard':'#/')+'" class="btn btn-primary">'+t('notfound.go_home')+'</a><a href="#/contact" class="btn btn-outline">'+t('notfound.report_link')+'</a></div></main>'}
  app.innerHTML=renderHeader()+body+renderFooter(signedIn);
  bindHeader();bindFooter();
  applyDocDir();
  const fab=$('#feedback-fab');
  if(fab){fab.title=t('feedback.title');const fabText=$('#feedback-fab-text');if(fabText)fabText.textContent=t('feedback.fab_label')}
  if(hash==='#/'||hash===''||hash==='#') bindLanding();
  else if(hash==='#/contact') bindContact();
  else if(hash==='#/dashboard') bindDashboard();
  else if(hash.startsWith('#/courses/')) bindCourse();
  else if(hash==='#/profile') bindProfile();
  else if(hash==='#/settings') bindSettings();
  // First-login language prompt
  if(user && !user.interfaceLang && !state.dialog && hash==='#/dashboard'){
    setTimeout(showLanguagePrompt,50);
  }
}

function bindHeader(){
  const out=$('[data-action="signout"]');if(out)out.addEventListener('click',signOut);
  const goIn=$('[data-action="goto-signin"]');
  if(goIn)goIn.addEventListener('click',e=>{e.preventDefault();state.tab='signin';state.signup.step='form';if(location.hash!=='#/'&&location.hash!==''&&location.hash!=='#'){location.hash='#/'}else{render();const f=$('#email');if(f)f.focus()}});
}

$('#feedback-fab').addEventListener('click',()=>{openFeedbackDialog()});

window.addEventListener('hashchange',()=>{state.route=location.hash||'#/';closeDialog();render()});

state.route=location.hash||'#/';

// Firebase's onAuthStateChanged fires once immediately with whatever session
// is already persisted (replacing Supabase's separate getSession() check on
// boot) and again on every future sign-in/out, so one listener covers both.
auth.onAuthStateChanged(async (authUser)=>{
  if(authUser&&!user){
    await afterAuthSuccess({showLangPrompt:false});
  } else if(!authUser&&user){
    // session ended elsewhere (e.g. token expired, or signed out in another tab)
    user=null;DB={};render();
  }
});

render(); // paint something immediately rather than a blank screen while we check for a session
refreshGlobalStats();
loadLanguageDictionary();
