/* ==========================================================================
   Settings
   ========================================================================== */
function switchHtml(key,checked){return '<button type="button" role="switch" class="switch" data-switch="'+key+'" aria-checked="'+checked+'" data-state="'+(checked?'checked':'unchecked')+'"><span class="switch-thumb" data-state="'+(checked?'checked':'unchecked')+'"></span></button>'}
function settingRow(title,desc,key,checked){return '<div class="flex items-center justify-between gap-6 rounded-lg border border-border/70 px-4 py-3"><div><p class="text-sm font-medium">'+title+'</p><p class="text-xs text-muted-foreground">'+desc+'</p></div>'+switchHtml(key,checked)+'</div>'}

function renderSettings(){
  const i=inst();
  const faculties=i.faculties;
  const facultyOptions='<option value="">'+t('settings.faculty_not_selected')+'</option>'+faculties.map(f=>'<option value="'+f.id+'"'+(user.faculty===f.id?' selected':'')+'>'+esc(f.name)+'</option>').join('');
  const uniLangs=(i.languages&&i.languages.length)?i.languages:[];
  const langOptions=Array.from(new Set(['English',...uniLangs]));
  const currentLang=user.interfaceLang||'English';
  const langSelect='<option value="">'+t('settings.language_not_selected')+'</option>'+langOptions.map(l=>'<option value="'+esc(l)+'"'+(currentLang===l?' selected':'')+'>'+esc(langNativeName(l))+'</option>').join('');
  const extraOpts=VALID_LANGUAGES.filter(l=>!langOptions.includes(l)).slice().sort((a,b)=>langNativeName(a).localeCompare(langNativeName(b))).map(l=>'<option value="'+esc(l)+'"'+(currentLang===l?' selected':'')+'>'+esc(langNativeName(l))+'</option>').join('');
  return '<main class="mx-auto w-full max-w-3xl px-4 py-10"><h1 class="font-display text-3xl tracking-tight">'+t('settings.title')+'</h1><p class="mt-1 text-muted-foreground">'+t('settings.institution_note',{code:esc(DB[user.inst].code)})+'</p>'+
    '<section class="mt-8 rounded-2xl border border-border bg-card p-6"><h2 class="font-display text-xl">'+t('settings.profile_heading')+'</h2>'+
    '<div class="mt-4 grid gap-4 sm:grid-cols-2">'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="s-name">'+t('settings.display_name_label')+'</label><input class="input" id="s-name" value="'+esc(user.name)+'"></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="s-email">'+t('settings.email_label')+'</label><input class="input" id="s-email" disabled value="'+esc(user.email)+'"></div>'+
      '<div class="space-y-1.5 sm:col-span-2"><label class="text-sm font-medium" for="s-faculty">'+t('settings.faculty_label')+'</label><div class="relative"><select class="select" id="s-faculty">'+facultyOptions+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div><p class="text-xs text-muted-foreground">'+t('settings.faculty_hint',{code:esc(DB[user.inst].code)})+'</p></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="s-program">'+t('settings.program_label')+'</label><input class="input" id="s-program" placeholder="'+t('settings.program_placeholder')+'" value="'+esc(user.program)+'"></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="s-year">'+t('settings.year_label')+'</label><input class="input" id="s-year" value="'+esc(user.year)+'"></div>'+
    '</div><button class="btn btn-primary mt-5" data-action="save-profile">'+t('settings.save_changes')+'</button></section>'+

    '<section class="mt-6 rounded-2xl border border-border bg-card p-6"><h2 class="font-display text-xl">'+t('settings.language_heading')+'</h2>'+
      '<p class="mt-1 text-sm text-muted-foreground">'+(uniLangs.length?t('settings.language_body_with_langs',{langs:esc(uniLangs.map(langNativeName).join(', '))}):t('settings.language_body_default'))+'</p>'+
      '<div class="mt-4 grid gap-4 sm:grid-cols-2">'+
        '<div class="space-y-1.5 sm:col-span-2"><label class="text-sm font-medium" for="s-lang">'+t('settings.language_label')+'</label><div class="relative"><select class="select" id="s-lang">'+langSelect+(extraOpts?'<optgroup label="'+t('settings.language_other_group')+'">'+extraOpts+'</optgroup>':'')+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div><p class="text-xs text-muted-foreground">'+t('settings.language_hint')+'</p></div>'+
      '</div></section>'+

    '<section class="mt-6 rounded-2xl border border-border bg-card p-6"><h2 class="font-display text-xl">'+t('settings.privacy_heading')+'</h2><div class="mt-4 space-y-3">'+settingRow(t('settings.anon_default_title'),t('settings.anon_default_desc'),'anonDefault',user.prefs.anonDefault)+settingRow(t('settings.public_profile_title'),t('settings.public_profile_desc'),'publicProfile',user.prefs.publicProfile)+'</div></section>'+
    '<section class="mt-6 rounded-2xl border border-border bg-card p-6"><h2 class="font-display text-xl">'+t('settings.help_heading')+'</h2><p class="mt-1 text-sm text-muted-foreground">'+t('settings.help_body')+'</p><div class="mt-4 flex flex-wrap gap-2"><a href="#/contact" class="btn btn-outline btn-sm">'+ICONS.mail+' '+t('settings.contact_feedback')+'</a><a href="#/about" class="btn btn-ghost btn-sm">'+ICONS.info+' '+t('settings.about_link')+'</a></div></section></main>';
}

function bindSettings(){
  const langSel=$('#s-lang');
  if(langSel) langSel.addEventListener('change',async e=>{
    const lang=e.target.value||'English';
    langSel.disabled=true;
    try{
      await db.collection('profiles').doc(user.id).update({interface_lang:lang});
    }catch(error){
      langSel.disabled=false;
      toast(t('toast.could_not_save_language',{error:error.message}));
      return;
    }
    langSel.disabled=false;
    await ensureLangLoaded(LANG_CODES[lang]);
    user.interfaceLang=lang;
    applyDocDir();
    toast(t('toast.language_set_to',{lang:langNativeName(lang)}));
    render();
  });
  const save=$('[data-action="save-profile"]');
  if(save) save.addEventListener('click',async ()=>{
    const name=$('#s-name').value.trim();if(!name){toast(t('toast.display_name_empty'));return}
    save.disabled=true;
    try{
      await db.collection('profiles').doc(user.id).update({full_name:name});
    }catch(error){
      save.disabled=false;
      toast(t('toast.could_not_save',{error:error.message}));
      return;
    }
    save.disabled=false;
    user.name=name;
    // Not yet part of the schema — kept for this session only, so they display
    // correctly right now but won't survive a page reload.
    user.faculty=$('#s-faculty').value||'';user.program=$('#s-program').value.trim()||'Undeclared';user.year=$('#s-year').value.trim()||'—';
    toast(t('toast.settings_saved'));render();
  });
  $$('[data-switch]').forEach(btn=>btn.addEventListener('click',async ()=>{
    const key=btn.dataset.switch;const next=!user.prefs[key];user.prefs[key]=next;
    btn.dataset.state=next?'checked':'unchecked';btn.setAttribute('aria-checked',String(next));
    const thumb=$('.switch-thumb',btn);thumb.dataset.state=next?'checked':'unchecked';
    if(key==='anonDefault'){
      try{
        await db.collection('profiles').doc(user.id).update({anon_default:next});
      }catch(error){
        toast(t('toast.could_not_save',{error:error.message}));
      }
      render();
    }
    // publicProfile isn't in the schema yet — session-only for now.
  }));
}
