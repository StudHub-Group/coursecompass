/* ==========================================================================
   Landing
   ========================================================================== */
function renderLanding(){
  const stat=(icon,v,l)=>'<div class="border-l-2 border-accent/60 pl-4">'+icon+'<dd class="mt-2 font-display text-3xl">'+v+'</dd><dt class="text-sm text-muted-foreground">'+l+'</dt></div>';
  return '<main class="mx-auto grid w-full max-w-6xl gap-14 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">'+
    '<section><h1 class="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">'+t('landing.headline')+'</h1>'+
    '<p class="mt-5 max-w-xl text-lg text-muted-foreground">'+t('landing.subhead')+'</p>'+
    '<dl class="mt-10 grid gap-6 sm:grid-cols-3">'+stat(ICONS.cap,globalStats.universities,t('landing.stat_universities'))+stat(ICONS.book,globalStats.courses,t('landing.stat_courses'))+stat(ICONS.shield,globalStats.reviews,t('landing.stat_reviews'))+'</dl>'+
    '<div class="mt-8 flex items-center gap-3 text-xs text-muted-foreground"><span>'+t('landing.built_by')+'</span>'+studhubLogo(20)+'</div></section>'+
    '<section class="lg:pt-10"><div class="rounded-2xl border border-border bg-card p-6 shadow-sm">'+renderAuthCard()+'</div></section></main>';
}

async function handleSignupAdvance(){
  const err=$('#auth-error');const fail=m=>{err.textContent=m;err.classList.remove('hidden')};err.classList.add('hidden');
  const nameEl=$('#name');const email=$('#email').value.trim();const name=nameEl?nameEl.value.trim():'';
  const password=$('#password')?$('#password').value:'';
  const password2El=$('#password2');const password2=password2El?password2El.value:'';
  if(state.tab==='signup'&&!name) return fail(t('toast.enter_full_name'));
  if(!isValidEmail(email)) return fail(t('toast.invalid_email'));
  if(!password) return fail(t('toast.enter_password'));
  if(state.tab==='signup'&&password.length<8) return fail(t('toast.password_min_length'));
  if(state.tab==='signup'&&password!==password2) return fail(t('toast.passwords_no_match'));
  state.signup.name=name;state.signup.email=email;state.signup.domain=domainOf(email);state.signup.password=password;

  setAuthBusy(true);
  const found=await findUniversityByDomain(email);
  setAuthBusy(false);

  if(state.tab==='signin'){
    if(!found) return fail(t('toast.no_university_for_domain',{domain:'@'+state.signup.domain}));
    await finishSignup(found.id,{nameOverride:nameFromEmail(email)});
    return;
  }
  if(found){state.signup.matched={key:found.id,name:found.name,code:found.abbreviation||'',status:found.status};state.signup.step='confirm'}
  else {state.signup.matched=null;state.signup.step='pick'}
  render();
}

async function finishSignup(instKey,opts){
  opts=opts||{};
  const s=state.signup;

  if(state.tab==='signin'){
    try{
      await auth.signInWithEmailAndPassword(s.email,s.password);
    }catch(error){
      const badCreds=['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(error.code);
      showAuthError(badCreds?t('toast.incorrect_credentials'):error.message);
      return;
    }
    await afterAuthSuccess({showLangPrompt:false});
    return;
  }

  const fullName=opts.nameOverride||s.name||nameFromEmail(s.email);

  // Firebase has no server-side trigger like Supabase's handle_new_user, so
  // signup is an explicit 3-step client sequence: create the auth account,
  // optionally create a new (pending) university, then create the profile
  // document that links the two. createUserWithEmailAndPassword signs the
  // user in immediately, which is what makes the writes below permitted by
  // the security rules (they require request.auth to be set).
  let cred;
  try{
    cred=await auth.createUserWithEmailAndPassword(s.email,s.password);
  }catch(error){
    showAuthError(error.message);
    return;
  }
  const uid=cred.user.uid;
  let rawToken,verifyLink;

  try{
    let universityId=instKey;
    if(!universityId&&opts.newUniversity){
      const uniData=Object.assign({
        status:'pending',tagline:'',local_name:null,created_by:uid,
        created_at:FieldValue.serverTimestamp()
      },opts.newUniversity);
      const uniRef=await db.collection('universities').add(uniData);
      universityId=uniRef.id;
      _uniCache=null; // invalidate the search cache so the new entry is findable
    }
    if(!universityId) throw new Error('No university to link this account to.');

    // Double opt-in: a random token that only ever exists in the email
    // itself — Firestore stores just its SHA-256 hash, so reading your own
    // profile doc never reveals anything a verify link could be forged from.
    rawToken=randomToken();
    const verificationHash=await sha256Hex(rawToken);
    verifyLink=window.location.origin+window.location.pathname+'#/verify?uid='+encodeURIComponent(uid)+'&token='+encodeURIComponent(rawToken);

    await db.collection('profiles').doc(uid).set({
      full_name:fullName,email:s.email,university_id:universityId,
      interface_lang:'',anon_default:false,created_at:FieldValue.serverTimestamp(),
      verified:false,verificationHash:verificationHash
    });
  }catch(error){
    showAuthError(error.message);
    // best-effort cleanup so a failed signup doesn't leave a stranded auth
    // account the person can never sign into cleanly again
    try{ await cred.user.delete(); }catch(e){}
    return;
  }

  // Email delivery is separate from account creation — if either send fails
  // the account still exists, and the check-email screen's Resend button
  // covers retrying. EmailJS is the primary path, since it's what actually
  // reaches university inboxes; Firebase's own mail is a free bonus attempt
  // in case it *does* get through for some institution's filters — either
  // one satisfies the gate in afterAuthSuccess().
  sendVerificationEmail(s.email,fullName,verifyLink).catch(error=>console.error(error));
  const actionCodeSettings={url:window.location.origin+window.location.pathname};
  cred.user.sendEmailVerification(actionCodeSettings).catch(error=>console.error(error));

  await afterAuthSuccess({showLangPrompt:true});
}

// Shared by finishSignup() right after a fresh signup and by
// afterAuthSuccess() whenever it finds an unverified session (a blocked
// sign-in attempt, or a page reload that restored an unverified account) —
// one place decides what "not verified yet" looks like.
function enterCheckEmailStep(email){
  state.signup.email=email;
  state.signup.step='check-email';
  render();
}

async function handleResendVerification(btn){
  if(!auth.currentUser) return;
  btn.disabled=true;
  try{
    const uid=auth.currentUser.uid;
    const rawToken=randomToken();
    const verificationHash=await sha256Hex(rawToken);
    await db.collection('profiles').doc(uid).update({verificationHash:verificationHash});
    const verifyLink=window.location.origin+window.location.pathname+'#/verify?uid='+encodeURIComponent(uid)+'&token='+encodeURIComponent(rawToken);
    await sendVerificationEmail(auth.currentUser.email,state.signup.name,verifyLink);
    const actionCodeSettings={url:window.location.origin+window.location.pathname};
    auth.currentUser.sendEmailVerification(actionCodeSettings).catch(()=>{});
    toast(t('toast.verification_email_sent'));
  }catch(error){
    toast(t('toast.could_not_send_verification',{error:error.message}));
  }
  btn.disabled=false;
}

async function handleCheckVerification(btn){
  if(!auth.currentUser) return;
  btn.disabled=true;
  try{
    await auth.currentUser.reload().catch(()=>{}); // refreshes Firebase's own bonus signal too, best-effort
    const snap=await db.collection('profiles').doc(auth.currentUser.uid).get();
    const verified=auth.currentUser.emailVerified||(snap.exists&&snap.data().verified===true);
    if(!verified){
      btn.disabled=false;
      toast(t('toast.still_not_verified'));
      return;
    }
  }catch(error){
    btn.disabled=false;
    toast(t('toast.could_not_check_verification'));
    return;
  }
  // showLangPrompt:false — render()'s own first-login check still shows the
  // prompt for a brand-new profile that has no interfaceLang yet.
  await afterAuthSuccess({showLangPrompt:false});
}

function renderAuthCheckEmail(){
  const s=state.signup;
  return '<div class="flex flex-col items-center space-y-3 py-4 text-center">'+
    '<h2 class="font-display text-xl font-semibold tracking-tight">'+t('auth.check_email_title')+'</h2>'+
    '<p class="text-sm text-muted-foreground">'+t('auth.check_email_body',{email:'<span class="font-medium text-foreground">'+esc(s.email)+'</span>'})+'</p>'+
    '<div class="mt-2 flex flex-col gap-2 sm:flex-row"><button class="btn btn-primary btn-sm" data-action="check-verification">'+t('auth.check_email_continue')+'</button><button class="btn btn-outline btn-sm" data-action="resend-verification">'+t('auth.check_email_resend')+'</button></div>'+
    '<button class="btn btn-ghost btn-sm" data-action="back-to-signin">'+t('auth.check_email_back')+'</button></div>';
}

function showLanguagePrompt(){
  const root=$('#modal-root');
  document.body.style.overflow='hidden';
  root.innerHTML=renderLanguagePrompt();
  let picked='English';
  $$('[data-lang-pick]').forEach(b=>b.addEventListener('click',()=>{
    picked=b.dataset.langPick;
    $$('[data-lang-pick]').forEach(x=>{
      x.className='flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors '+(x.dataset.langPick===picked?'border-primary bg-secondary':'border-border hover:border-primary/40');
      const existing=x.querySelector('svg'); if(existing) existing.remove();
      if(x.dataset.langPick===picked) x.insertAdjacentHTML('beforeend',ICONS.check);
    });
  }));
  const ok=$('[data-action="confirm-lang"]');
  if(ok) ok.addEventListener('click',async ()=>{
    ok.disabled=true;
    try{
      await db.collection('profiles').doc(user.id).update({interface_lang:picked});
    }catch(error){
      ok.disabled=false;
      toast(t('toast.could_not_save_language',{error:error.message}));
      return;
    }
    ok.disabled=false;
    await ensureLangLoaded(LANG_CODES[picked]);
    user.interfaceLang=picked;
    applyDocDir();
    closeLangPrompt();
    toast(t('toast.language_set_to',{lang:langNativeName(picked)}));
    render();
  });
}
function closeLangPrompt(){const root=$('#modal-root');root.innerHTML='';document.body.style.overflow=''}

async function handleCreateUniversity(){
  const err=$('#cu-error');const fail=m=>{err.textContent=m;err.classList.remove('hidden')};err.classList.add('hidden');
  const name=$('#cu-name').value.trim();
  const abbr=$('#cu-abbr').value.trim();
  const country=$('#cu-country').value;
  const localEl=$('#cu-local');
  const localName=localEl?localEl.value.trim():'';
  const domain=state.signup.domain;
  const languages=state.signup.newLanguages.slice();
  const terms=state.signup.newTerms.slice();

  if(!country) return fail(t('toast.please_choose_country'));
  if(!name) return fail(t('toast.please_enter_university_name'));
  if(!abbr) return fail(t('toast.please_enter_abbreviation'));
  if(abbr.length>8) return fail(t('toast.abbreviation_too_long'));
  if(!domain) return fail(t('toast.no_domain_available'));
  if(!languages.length) return fail(t('toast.select_one_language'));
  if(!terms.length) return fail(t('toast.select_one_term'));

  await finishSignup(null,{newUniversity:{
    name:name,local_name:localName||null,abbreviation:abbr.toUpperCase(),
    country:country,languages:languages,terms:terms,domains:[domain]
  }});
}

function bindLanding(){
  $$('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;state.signup.step='form';state.signup.password='';render()}));

  const form=$('#auth-form');
  if(form) form.addEventListener('submit',async e=>{e.preventDefault();state.signup.name=$('#name')?$('#name').value.trim():'';state.signup.email=$('#email').value.trim();state.signup.password=$('#password')?$('#password').value:'';state.signup.password2=$('#password2')?$('#password2').value:'';await handleSignupAdvance()});

  const cm=$('[data-action="confirm-match"]');
  if(cm) cm.addEventListener('click',async ()=>{const m=state.signup.matched;if(!m) return;cm.disabled=true;await finishSignup(m.key);cm.disabled=false});
  const rm=$('[data-action="reject-match"]');
  if(rm) rm.addEventListener('click',()=>{state.signup.step='pick';render()});
  const bt3=$('[data-action="back-to-signin"]');
  if(bt3) bt3.addEventListener('click',()=>{auth.signOut().catch(()=>{});state.signup.step='form';state.tab='signin';render()});
  const resendBtn=$('[data-action="resend-verification"]');
  if(resendBtn) resendBtn.addEventListener('click',()=>handleResendVerification(resendBtn));
  const checkBtn=$('[data-action="check-verification"]');
  if(checkBtn) checkBtn.addEventListener('click',()=>handleCheckVerification(checkBtn));

  let uniSearchTimer=null;
  const runUniSearch=async q=>{
    const list=$('#uni-list');
    if(!list) return;
    if(!q||q.trim().length<2){list.innerHTML='<p class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">'+t('auth.pick_type_hint')+'</p>';return}
    list.innerHTML='<p class="text-xs text-muted-foreground px-1">'+t('auth.pick_searching')+'</p>';
    const rows=await searchUniversities(q);
    const el=$('#uni-list'); if(!el) return; // user may have navigated away while awaiting
    el.innerHTML=renderUniListHtml(rows,q);
    $$('[data-pick-uni]').forEach(b=>b.addEventListener('click',()=>handlePickUni(b.dataset.pickUni)));
  };
  const search=$('#uni-search');
  if(search){
    search.addEventListener('input',e=>{state.signup.pickQuery=e.target.value;clearTimeout(uniSearchTimer);uniSearchTimer=setTimeout(()=>runUniSearch(e.target.value),300)});
    setTimeout(()=>{const f=$('#uni-search');if(f&&document.activeElement!==f) f.focus()},0);
    if(state.signup.pickQuery&&state.signup.pickQuery.trim().length>=2) runUniSearch(state.signup.pickQuery);
  }
  const cu=$('[data-action="create-uni"]'); if(cu) cu.addEventListener('click',()=>{state.signup.step='create';render()});
  const bt1=$('[data-action="back-to-form"]'); if(bt1) bt1.addEventListener('click',()=>{state.signup.step='form';render()});
  const bt2=$('[data-action="back-to-pick"]'); if(bt2) bt2.addEventListener('click',()=>{state.signup.step='pick';render()});

  // Create university form bindings
  const country=$('#cu-country');
  if(country) country.addEventListener('change',e=>{
    const code=e.target.value;
    state.signup.newCountry=code;
    // reset languages and pre-select suggested
    const c=countryByCode(code);
    state.signup.newLanguages=c?c.languages.slice():[];
    // keep typed name if user already entered it
    state.signup.newName=$('#cu-name')?$('#cu-name').value:state.signup.newName;
    state.signup.newAbbr=$('#cu-abbr')?$('#cu-abbr').value:state.signup.newAbbr;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value:state.signup.newLocalName;
    render();
  });
  $$('[data-suggest]').forEach(b=>b.addEventListener('click',()=>{
    const l=b.dataset.suggest;
    const arr=state.signup.newLanguages;
    const i=arr.indexOf(l); if(i>=0) arr.splice(i,1); else arr.push(l);
    // capture current form values before re-render
    state.signup.newName=$('#cu-name')?$('#cu-name').value:state.signup.newName;
    state.signup.newAbbr=$('#cu-abbr')?$('#cu-abbr').value:state.signup.newAbbr;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value:state.signup.newLocalName;
    render();
  }));
  $$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{
    const l=b.dataset.lang;
    const arr=state.signup.newLanguages;
    const i=arr.indexOf(l); if(i>=0) arr.splice(i,1);
    state.signup.newName=$('#cu-name')?$('#cu-name').value:state.signup.newName;
    state.signup.newAbbr=$('#cu-abbr')?$('#cu-abbr').value:state.signup.newAbbr;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value:state.signup.newLocalName;
    render();
  }));
  $$('[data-term]').forEach(b=>b.addEventListener('click',()=>{
    const tm=b.dataset.term;
    const arr=state.signup.newTerms;
    const i=arr.indexOf(tm); if(i>=0) arr.splice(i,1); else arr.push(tm);
    state.signup.newName=$('#cu-name')?$('#cu-name').value:state.signup.newName;
    state.signup.newAbbr=$('#cu-abbr')?$('#cu-abbr').value:state.signup.newAbbr;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value:state.signup.newLocalName;
    render();
  }));
  const addLangBtn=$('[data-action="add-lang"]');
  if(addLangBtn) addLangBtn.addEventListener('click',()=>{
    const inp=$('#cu-custom-lang'); if(!inp) return;
    const langErr=$('#lang-error'); if(langErr){langErr.textContent='';langErr.classList.add('hidden')}
    const v=inp.value.trim(); if(!v) return;
    const canonical=VALID_LANGUAGES.find(l=>l.toLowerCase()===v.toLowerCase());
    if(!canonical){
      if(langErr){langErr.textContent=t('toast.language_not_in_list',{value:v});langErr.classList.remove('hidden')}
      return;
    }
    if(!state.signup.newLanguages.includes(canonical)) state.signup.newLanguages.push(canonical);
    state.signup.customLangInput='';
    state.signup.newName=$('#cu-name')?$('#cu-name').value:state.signup.newName;
    state.signup.newAbbr=$('#cu-abbr')?$('#cu-abbr').value:state.signup.newAbbr;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value:state.signup.newLocalName;
    render();
  });

  const cf=$('#create-uni-form');
  if(cf) cf.addEventListener('submit',async e=>{
    e.preventDefault();
    state.signup.newName=$('#cu-name').value.trim();
    state.signup.newAbbr=$('#cu-abbr').value.trim();
    state.signup.newCountry=$('#cu-country').value;
    state.signup.newLocalName=$('#cu-local')?$('#cu-local').value.trim():'';
    await handleCreateUniversity();
  });
}

async function handlePickUni(key){await finishSignup(key)}
