/* ==========================================================================
   Auth flow
   ========================================================================== */
function renderAuthCard(){
  const s=state.signup;
  if(s.step==='check-email') return renderAuthCheckEmail();
  if(s.step==='confirm') return renderAuthConfirm();
  if(s.step==='pick') return renderAuthPick();
  if(s.step==='create') return renderAuthCreate();
  return renderAuthForm();
}

function renderAuthForm(){
  const tab=state.tab,s=state.signup;
  return '<div class="grid w-full grid-cols-2 rounded-lg bg-muted p-1 text-muted-foreground">'+
    '<button type="button" data-tab="signup" class="rounded-md px-3 py-1 text-sm font-medium transition-all '+(tab==='signup'?'bg-background text-foreground shadow':'')+'">'+t('auth.tab_create_account')+'</button>'+
    '<button type="button" data-tab="signin" class="rounded-md px-3 py-1 text-sm font-medium transition-all '+(tab==='signin'?'bg-background text-foreground shadow':'')+'">'+t('auth.tab_sign_in')+'</button></div>'+
  '<form class="mt-5 space-y-4" id="auth-form" novalidate>'+
    (tab==='signup'?'<div class="space-y-1.5"><label class="text-sm font-medium" for="name">'+t('auth.full_name_label')+'</label><input class="input" id="name" placeholder="Alex Weber" autocomplete="name" value="'+esc(s.name)+'"></div>':'')+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="email">'+t('auth.email_label')+'</label><input class="input" id="email" type="email" placeholder="alex.weber@youruniversity.edu" autocomplete="email" value="'+esc(s.email)+'"><p class="text-xs text-muted-foreground">'+t('auth.email_hint')+'</p></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="password">'+t('auth.password_label')+'</label><input class="input" id="password" type="password" placeholder="'+(tab==='signup'?t('auth.password_placeholder_signup'):'••••••••')+'" autocomplete="'+(tab==='signup'?'new-password':'current-password')+'" '+(tab==='signup'?'minlength="8"':'')+' value="'+esc(s.password||'')+'"></div>'+
    (tab==='signup'?'<div class="space-y-1.5"><label class="text-sm font-medium" for="password2">'+t('auth.password2_label')+'</label><input class="input" id="password2" type="password" placeholder="'+t('auth.password2_placeholder')+'" autocomplete="new-password" minlength="8" value="'+esc(s.password2||'')+'"></div>':'')+
    '<p class="hidden text-sm text-red-600" id="auth-error"></p>'+
    '<button class="btn btn-primary w-full" type="submit">'+(tab==='signup'?t('auth.submit_signup'):t('auth.submit_signin'))+'</button></form>';
}

function renderAuthConfirm(){
  const m=state.signup.matched||{};
  const pendingNote=m.status==='pending'
    ? '<p class="mt-2 text-xs text-amber-700">'+t('auth.confirm_pending_note')+'</p>'
    : '';
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left">'+
    '<p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('auth.step2of3')+'</p>'+
    '<h2 class="font-display text-xl font-semibold tracking-tight">'+t('auth.confirm_title')+'</h2>'+
    '<p class="text-sm text-muted-foreground">'+t('auth.confirm_body',{domain:'<span class="font-mono">@'+esc(state.signup.domain)+'</span>'})+'</p></div>'+
  '<div class="mt-4 rounded-xl border border-border bg-secondary/50 p-4"><div class="flex items-start gap-3">'+
    '<div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground">'+esc(m.code||'')+'</div>'+
    '<div class="min-w-0"><p class="font-medium leading-snug">'+esc(m.name||'')+'</p>'+pendingNote+'</div>'+
  '</div></div>'+
  '<div class="mt-5 flex flex-col gap-2 sm:flex-row">'+
    '<button class="btn btn-primary flex-1" data-action="confirm-match">'+ICONS.check+' '+t('auth.confirm_yes')+'</button>'+
    '<button class="btn btn-outline flex-1" data-action="reject-match">'+t('auth.confirm_no')+'</button></div>'+
  '<button class="btn btn-ghost btn-sm mt-3 w-full" data-action="back-to-form">'+t('common.back')+'</button>';
}

// Firestore has no server-side "contains" text search like Postgres ilike, so
// we cache the (small) universities directory client-side once and filter it
// in memory. For a much larger catalogue, swap this for a dedicated search
// service (e.g. Algolia/Typesense) — see the setup guide.
let _uniCache=null;
async function loadUniversitiesCache(force){
  if(_uniCache&&!force) return _uniCache;
  const snap=await db.collection('universities').get();
  _uniCache=snap.docs.map(d=>Object.assign({id:d.id},d.data()));
  return _uniCache;
}
async function searchUniversities(q){
  const needle=q.trim().toLowerCase();
  if(!needle) return [];
  try{
    const all=await loadUniversitiesCache();
    return all.filter(u=>(u.name&&u.name.toLowerCase().includes(needle))||(u.abbreviation&&u.abbreviation.toLowerCase().includes(needle))).slice(0,20);
  }catch(e){console.error(e);return[]}
}

function uniListItemHtml(u){
  const c=countryByCode(u.country);
  const pendingBadge=u.status==='pending'?' <span class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 align-middle">'+t('auth.pick_pending_badge')+'</span>':'';
  return '<button type="button" data-pick-uni="'+u.id+'" class="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40">'+
    '<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-medium">'+esc(u.abbreviation||'')+'</div>'+
    '<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">'+esc(u.name)+pendingBadge+'</p>'+
    '<p class="mt-0.5 text-xs text-muted-foreground">'+((u.domains&&u.domains[0])?'@'+esc(u.domains[0])+' · ':'')+(c?esc(c.name):'')+'</p></div>'+
  '</button>';
}

function renderUniListHtml(list,q){
  if(!list.length) return '<p class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">'+t('auth.pick_no_match',{query:esc(q)})+'</p>';
  return list.map(uniListItemHtml).join('');
}

function renderAuthPick(){
  const s=state.signup;
  const domainText=s.domain?t('auth.pick_body_no_domain',{domain:'<span class="font-mono">@'+esc(s.domain)+'</span>'}):t('auth.pick_body_default');
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left">'+
    '<p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('auth.step2of3')+'</p>'+
    '<h2 class="font-display text-xl font-semibold tracking-tight">'+t('auth.pick_title')+'</h2>'+
    '<p class="text-sm text-muted-foreground">'+domainText+'</p></div>'+
  '<div class="mt-4 space-y-3"><div class="relative">'+ICONS.search+'<input class="input pl-9" id="uni-search" placeholder="'+t('auth.pick_search_placeholder')+'" value="'+esc(s.pickQuery)+'" autocomplete="off"></div><div class="space-y-2 max-h-72 overflow-y-auto pr-1" id="uni-list"><p class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">'+t('auth.pick_type_hint')+'</p></div></div>'+
  '<button class="btn btn-outline w-full mt-4" data-action="create-uni">'+ICONS.plus+' '+t('auth.pick_not_listed')+'</button>'+
  '<button class="btn btn-ghost btn-sm mt-2 w-full" data-action="back-to-form">'+t('common.back')+'</button>';
}

function renderAuthCreate(){
  const s=state.signup;
  const c=countryByCode(s.newCountry);
  const countryOpts='<option value="">'+t('auth.create_country_placeholder')+'</option>'+COUNTRIES.map(x=>'<option value="'+x.code+'"'+(s.newCountry===x.code?' selected':'')+'>'+esc(countryLabel(x))+'</option>').join('');
  const suggestedLangs=c?c.languages:[];
  const nonEnglish=c&&!c.englishSpeaking;
  const langChips=s.newLanguages.length
    ? s.newLanguages.map(l=>'<span class="chip-toggle" data-active="1" data-lang="'+esc(l)+'">'+esc(langNativeName(l))+' '+XSMALL+'</span>').join('')
    : '<span class="text-xs text-muted-foreground">'+t('auth.create_languages_none')+'</span>';
  const suggestChips=suggestedLangs.length
    ? suggestedLangs.map(l=>{const on=s.newLanguages.includes(l);return '<button type="button" class="chip-toggle" data-active="'+(on?'1':'0')+'" data-suggest="'+esc(l)+'">'+esc(langNativeName(l))+'</button>'}).join('')
    : '';
  const termChips=TERMS.map(tm=>{const on=s.newTerms.includes(tm);return '<button type="button" class="chip-toggle" data-active="'+(on?'1':'0')+'" data-term="'+esc(tm)+'">'+esc(enumLabel('season',tm))+'</button>'}).join('');
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left">'+
    '<p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('auth.step3of3')+'</p>'+
    '<h2 class="font-display text-xl font-semibold tracking-tight">'+t('auth.create_title')+'</h2>'+
    '<p class="text-sm text-muted-foreground">'+t('auth.create_body')+'</p></div>'+
  '<form class="mt-4 space-y-3" id="create-uni-form" novalidate>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="cu-country">'+t('auth.create_country_label')+'</label>'+
      '<div class="relative"><select class="select" id="cu-country">'+countryOpts+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="cu-name">'+t('auth.create_name_label')+'</label><input class="input" id="cu-name" placeholder="Stanford University" value="'+esc(s.newName)+'" autocomplete="organization"></div>'+
    (nonEnglish?'<div class="space-y-1.5"><label class="text-sm font-medium" for="cu-local">'+t('auth.create_local_label')+'</label><input class="input" id="cu-local" placeholder="e.g. Technische Universität München" value="'+esc(s.newLocalName)+'"><p class="text-xs text-muted-foreground">'+t('auth.create_local_hint')+'</p></div>':'')+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="cu-abbr">'+t('auth.create_abbr_label')+'</label><input class="input" id="cu-abbr" placeholder="SU" maxlength="8" value="'+esc(s.newAbbr)+'" autocomplete="off"><p class="text-xs text-muted-foreground">'+t('auth.create_abbr_hint')+'</p></div>'+
    '<div class="space-y-2"><label class="text-sm font-medium">'+t('auth.create_languages_label')+'</label>'+
      (suggestChips?'<div class="space-y-1.5"><p class="text-xs text-muted-foreground">'+t('auth.create_languages_suggested',{country:esc(countryLabel(c))})+'</p><div class="flex flex-wrap gap-1.5">'+suggestChips+'</div></div>':'')+
      '<div class="flex flex-wrap gap-1.5" id="lang-chips">'+langChips+'</div>'+
      '<div class="flex gap-2"><input class="input" id="cu-custom-lang" list="lang-options" placeholder="'+t('auth.create_languages_add_placeholder')+'" value="'+esc(s.customLangInput)+'"><button type="button" class="btn btn-outline" data-action="add-lang">'+t('auth.create_languages_add')+'</button></div>'+
      '<datalist id="lang-options">'+VALID_LANGUAGES.map(l=>'<option value="'+esc(l)+'">').join('')+'</datalist>'+
      '<p class="text-xs text-red-600 hidden" id="lang-error"></p>'+
    '</div>'+
    '<div class="space-y-2"><label class="text-sm font-medium">'+t('auth.create_terms_label')+'</label>'+
      '<p class="text-xs text-muted-foreground">'+t('auth.create_terms_hint')+'</p>'+
      '<div class="flex flex-wrap gap-1.5" id="term-chips">'+termChips+'</div>'+
    '</div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="cu-domain">'+t('auth.create_domain_label')+'</label><input class="input" id="cu-domain" disabled value="'+esc(s.domain)+'"></div>'+
    '<p class="hidden text-sm text-red-600" id="cu-error"></p>'+
    '<div class="flex flex-col gap-2 sm:flex-row sm:justify-end pt-1">'+
      '<button type="button" class="btn btn-ghost" data-action="back-to-pick">'+t('common.back')+'</button>'+
      '<button type="submit" class="btn btn-primary">'+ICONS.check+' '+t('auth.create_submit')+'</button></div>'+
  '</form>';
}
