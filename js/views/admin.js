/* ==========================================================================
   Admin (university directory + create)
   ========================================================================== */
// Fetched fresh each time the admin page is opened — universities is already
// publicly readable (see the rules), so this is just a plain query, same as
// the university-picker cache in auth.js.
let _adminUniversities=null;

async function loadAdminUniversities(){
  const list=$('#admin-uni-list');
  try{
    const snap=await db.collection('universities').orderBy('name').get();
    _adminUniversities=snap.docs.map(d=>Object.assign({id:d.id},d.data()));
  }catch(error){
    console.error(error);
    _adminUniversities=[];
    toast(t('toast.could_not_load_university'));
  }
  if(list){list.innerHTML=adminUniListHtml();bindAdminUniList()}
}

function adminUniRowHtml(u){
  const pendingBadge=u.status==='pending'?' <span class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 align-middle">'+t('auth.pick_pending_badge')+'</span>':'';
  const c=countryByCode(u.country);
  return '<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">'+
    '<div class="flex min-w-0 items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-medium">'+esc(u.abbreviation||'')+'</div>'+
    '<div class="min-w-0"><p class="truncate font-medium">'+esc(u.name)+pendingBadge+'</p><p class="mt-0.5 text-xs text-muted-foreground">'+((u.domains&&u.domains.length)?u.domains.map(d=>'@'+d).join(', ')+' · ':'')+(c?esc(c.name):'')+'</p></div></div>'+
    '<button type="button" class="btn btn-outline btn-sm" data-admin-enter="'+u.id+'">'+t('admin.manage_button')+'</button>'+
  '</div>';
}

function adminUniListHtml(){
  if(_adminUniversities===null) return '<p class="text-sm text-muted-foreground">'+t('admin.loading')+'</p>';
  if(!_adminUniversities.length) return '<p class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">'+t('admin.no_universities')+'</p>';
  return '<div class="space-y-2">'+_adminUniversities.map(adminUniRowHtml).join('')+'</div>';
}

function adminCreateFormHtml(){
  const countryOpts='<option value="">'+t('auth.create_country_placeholder')+'</option>'+COUNTRIES.map(x=>'<option value="'+x.code+'">'+esc(countryLabel(x))+'</option>').join('');
  const termChips=TERMS.map(tm=>'<button type="button" class="chip-toggle" data-active="0" data-admin-term="'+esc(tm)+'">'+esc(enumLabel('season',tm))+'</button>').join('');
  return '<form id="admin-create-uni-form" class="mt-4 space-y-3" novalidate>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-country">'+t('auth.create_country_label')+'</label>'+
      '<div class="relative"><select class="select" id="au-country">'+countryOpts+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-name">'+t('auth.create_name_label')+'</label><input class="input" id="au-name" placeholder="Stanford University"></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-local">'+t('auth.create_local_label')+'</label><input class="input" id="au-local"><p class="text-xs text-muted-foreground">'+t('auth.create_local_hint')+'</p></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-abbr">'+t('auth.create_abbr_label')+'</label><input class="input" id="au-abbr" maxlength="8"><p class="text-xs text-muted-foreground">'+t('auth.create_abbr_hint')+'</p></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-domains">'+t('auth.create_domain_label')+'</label><input class="input" id="au-domains" placeholder="university.edu, mail.university.edu"><p class="text-xs text-muted-foreground">'+t('admin.domains_hint')+'</p></div>'+
    '<div class="space-y-1.5"><label class="text-sm font-medium" for="au-languages">'+t('auth.create_languages_label')+'</label><input class="input" id="au-languages" placeholder="English, German"></div>'+
    '<div class="space-y-2"><label class="text-sm font-medium">'+t('auth.create_terms_label')+'</label><p class="text-xs text-muted-foreground">'+t('auth.create_terms_hint')+'</p><div class="flex flex-wrap gap-1.5">'+termChips+'</div></div>'+
    '<p class="hidden text-sm text-red-600" id="admin-create-error"></p>'+
    '<button type="submit" class="btn btn-primary">'+t('auth.create_submit')+'</button>'+
  '</form>';
}

function renderAdmin(){
  return '<main class="mx-auto w-full max-w-3xl px-4 py-12">'+
    '<p class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">'+ICONS.shield+' '+t('admin.eyebrow')+'</p>'+
    '<h1 class="mt-4 font-display text-4xl tracking-tight">'+t('admin.title')+'</h1>'+
    '<p class="mt-2 max-w-xl text-muted-foreground">'+t('admin.subhead')+'</p>'+
    '<section class="mt-8 rounded-2xl border border-border bg-card p-6">'+
      '<button type="button" class="btn btn-outline btn-sm" data-action="toggle-admin-create">'+ICONS.plus+t('admin.create_toggle')+'</button>'+
      '<div id="admin-create-wrap" class="hidden">'+adminCreateFormHtml()+'</div>'+
    '</section>'+
    '<section class="mt-8"><h2 class="font-display text-xl">'+t('admin.list_heading')+'</h2><div class="mt-4" id="admin-uni-list">'+adminUniListHtml()+'</div></section>'+
  '</main>';
}

function bindAdminUniList(){
  $$('[data-admin-enter]').forEach(btn=>btn.addEventListener('click',async ()=>{
    const id=btn.dataset.adminEnter;
    btn.disabled=true;
    await loadUniversity(id);
    user.inst=id;
    state.filters={q:'',faculty:'',level:'',term:'',sort:'rating'};
    state.facultyExpanded=true;
    location.hash='#/dashboard';
    render();
  }));
}

async function handleAdminCreateUniversity(){
  const err=$('#admin-create-error');
  const fail=m=>{err.textContent=m;err.classList.remove('hidden')};
  err.classList.add('hidden');
  const name=$('#au-name').value.trim();
  const localName=$('#au-local').value.trim();
  const abbr=$('#au-abbr').value.trim();
  const country=$('#au-country').value;
  const domains=$('#au-domains').value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  // Match against the canonical language list the same way signup does, so
  // admin-created data stays consistent with self-signup-created data.
  const languages=$('#au-languages').value.split(',').map(s=>s.trim()).filter(Boolean)
    .map(s=>VALID_LANGUAGES.find(l=>l.toLowerCase()===s.toLowerCase())||s);
  const terms=$$('[data-admin-term]').filter(b=>b.dataset.active==='1').map(b=>b.dataset.adminTerm);

  if(!country) return fail(t('toast.please_choose_country'));
  if(!name) return fail(t('toast.please_enter_university_name'));
  if(!abbr) return fail(t('toast.please_enter_abbreviation'));
  if(abbr.length>8) return fail(t('toast.abbreviation_too_long'));
  if(!domains.length) return fail(t('toast.admin_enter_domain'));
  if(!languages.length) return fail(t('toast.select_one_language'));
  if(!terms.length) return fail(t('toast.select_one_term'));

  const btn=$('#admin-create-uni-form button[type="submit"]');
  btn.disabled=true;
  try{
    // status: 'approved' directly — unlike self-signup, an admin adding a
    // university here doesn't need the manual approval step (see the rules:
    // isAdmin() is the only path allowed to set status to 'approved' on create).
    await db.collection('universities').add({
      name:name,local_name:localName||null,abbreviation:abbr.toUpperCase(),
      country:country,languages:languages,terms:terms,domains:domains,
      status:'approved',tagline:'',created_by:user.id,created_at:FieldValue.serverTimestamp()
    });
  }catch(error){
    btn.disabled=false;
    fail(t('toast.admin_could_not_create_uni',{error:error.message}));
    return;
  }
  btn.disabled=false;
  toast(t('toast.admin_uni_created'));
  $('#admin-create-uni-form').reset();
  $$('[data-admin-term]').forEach(b=>b.dataset.active='0');
  loadAdminUniversities();
}

function bindAdmin(){
  const toggle=$('[data-action="toggle-admin-create"]');
  const wrap=$('#admin-create-wrap');
  if(toggle&&wrap) toggle.addEventListener('click',()=>wrap.classList.toggle('hidden'));

  $$('[data-admin-term]').forEach(chip=>chip.addEventListener('click',()=>{
    chip.dataset.active=chip.dataset.active==='1'?'0':'1';
  }));

  const form=$('#admin-create-uni-form');
  if(form) form.addEventListener('submit',e=>{e.preventDefault();handleAdminCreateUniversity()});

  loadAdminUniversities();
}
