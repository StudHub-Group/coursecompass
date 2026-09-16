/* ==========================================================================
   Contact
   ========================================================================== */
const CONTACT_KINDS={bug:{labelKey:'contact.kind_bug',icon:ICONS.bug,to:APP_META.bugEmail,hintKey:'contact.kind_bug_hint'},idea:{labelKey:'contact.kind_idea',icon:ICONS.bulb,to:APP_META.ideaEmail,hintKey:'contact.kind_idea_hint'},course:{labelKey:'contact.kind_course',icon:ICONS.book,to:APP_META.bugEmail,hintKey:'contact.kind_course_hint'},other:{labelKey:'contact.kind_other',icon:ICONS.mail,to:APP_META.developerEmail,hintKey:'contact.kind_other_hint'}};
function contactKindLabel(k){return t((CONTACT_KINDS[k]||CONTACT_KINDS.other).labelKey)}
function contactKindHint(k){return t((CONTACT_KINDS[k]||CONTACT_KINDS.other).hintKey)}

function renderContact(){
  const kind=state.contactKind in CONTACT_KINDS?state.contactKind:'bug';
  const pref=state.contactPrefill;
  const kindTab=(k,cfg)=>{const active=k===kind;return '<button type="button" data-kind="'+k+'" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors '+(active?'border-primary bg-secondary text-foreground':'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground')+'">'+cfg.icon+'<span class="font-medium">'+contactKindLabel(k)+'</span></button>'};
  const inbox=messages.slice().reverse().slice(0,5).map(m=>{const cfg=CONTACT_KINDS[m.kind]||CONTACT_KINDS.other;return '<div class="rounded-lg border border-border/70 px-4 py-3"><div class="flex flex-wrap items-center justify-between gap-2"><div class="flex items-center gap-2">'+cfg.icon+'<span class="text-sm font-medium">'+esc(m.subject||t('contact.no_subject'))+'</span></div><span class="text-xs text-muted-foreground">'+esc(m.sentAt)+'</span></div><p class="mt-1 line-clamp-2 text-xs text-muted-foreground">'+esc((m.body||'').split('\n')[0])+'</p></div>'}).join('');
  return '<main class="mx-auto w-full max-w-3xl px-4 py-12"><a href="#/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">'+ICONS.arrowLeft+' '+t('contact.home')+'</a>'+
    '<header class="mt-6"><p class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">'+ICONS.mail+' '+t('contact.eyebrow')+'</p><h1 class="mt-4 font-display text-4xl leading-tight tracking-tight">'+t('contact.title')+'</h1><p class="mt-3 max-w-2xl text-muted-foreground">'+t('contact.subhead')+'</p></header>'+
    '<section class="mt-8"><p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('contact.what_about')+'</p><div class="mt-3 grid gap-2 sm:grid-cols-2">'+Object.keys(CONTACT_KINDS).map(k=>kindTab(k,CONTACT_KINDS[k])).join('')+'</div><p class="mt-3 text-xs text-muted-foreground">'+contactKindHint(kind)+'</p></section>'+
    '<form id="contact-form" class="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6" novalidate>'+
      '<div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1.5"><label class="text-sm font-medium" for="cf-name">'+t('contact.name_label')+' <span class="text-muted-foreground">'+t('contact.optional')+'</span></label><input class="input" id="cf-name" placeholder="Alex Weber" value="'+esc(user?user.name:'')+'"></div><div class="space-y-1.5"><label class="text-sm font-medium" for="cf-email">'+t('contact.email_label')+' <span class="text-muted-foreground">'+t('contact.optional')+'</span></label><input class="input" id="cf-email" type="email" placeholder="you@example.com" value="'+esc(user?user.email:'')+'"></div></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="cf-subject">'+t('contact.subject_label')+'</label><input class="input" id="cf-subject" placeholder="'+t('contact.subject_placeholder')+'" value="'+esc(pref.subject)+'"></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="cf-body">'+t('contact.message_label')+'</label><textarea class="input" id="cf-body" rows="7" placeholder="'+t('contact.message_placeholder')+'">'+esc(pref.body)+'</textarea></div>'+
      '<label class="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" id="cf-cc" class="mt-0.5 h-3.5 w-3.5 rounded border-input"><span>'+t('contact.cc_me')+'</span></label>'+
      '<p class="hidden text-sm text-red-600" id="cf-error"></p>'+
      '<div class="flex flex-wrap gap-2"><button type="submit" class="btn btn-primary">'+ICONS.mail+' '+t('contact.submit')+'</button><button type="submit" class="btn btn-outline" data-action="save-only">'+t('contact.save_draft')+'</button></div>'+
      '<p class="text-xs text-muted-foreground">'+t('contact.mailto_note',{email:'<span class="font-mono">'+esc(CONTACT_KINDS[kind].to)+'</span>'})+'</p></form>'+
    '<section class="mt-10"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-display text-xl">'+t('contact.sent_messages_heading')+'</h2>'+(messages.length?'<button class="btn btn-ghost btn-sm" data-action="clear-messages">'+t('contact.clear_history')+'</button>':'')+'</div><div class="mt-3 space-y-2">'+(messages.length?inbox:'<p class="text-sm text-muted-foreground">'+t('contact.nothing_sent')+'</p>')+'</div></section></main>';
}

function bindContact(){
  $$('[data-kind]').forEach(b=>b.addEventListener('click',()=>{state.contactKind=b.dataset.kind;render()}));
  const form=$('#contact-form');if(!form) return;
  const err=$('#cf-error');const fail=m=>{err.textContent=m;err.classList.remove('hidden')};
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const kind=state.contactKind;
    const name=$('#cf-name').value.trim(),email=$('#cf-email').value.trim(),subject=$('#cf-subject').value.trim(),body=$('#cf-body').value.trim(),cc=$('#cf-cc').checked;
    err.classList.add('hidden');
    if(!subject) return fail(t('toast.add_subject_short'));
    if(!body||body.length<10) return fail(t('toast.describe_few_words'));
    if(email && !isValidEmail(email)) return fail(t('toast.reply_email_invalid'));
    const saveOnly=e.submitter && e.submitter.dataset.action==='save-only';
    messages.push({id:'m'+Date.now(),kind:kind,name:name,email:email,subject:subject,body:body,to:CONTACT_KINDS[kind].to,sentAt:new Date().toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}),status:'saved'});
    persistMsgs();
    if(saveOnly){toast(t('toast.saved_locally'));state.contactPrefill={subject:'',body:''};render();return}
    const sEnc=encodeURIComponent('['+contactKindLabel(kind)+'] '+subject);
    const bEnc=encodeURIComponent([body,'','—',name?'From: '+name:null,email?'Reply-to: '+email:null,'Page: '+location.href].filter(Boolean).join('\n'));
    const ccParam=cc&&email?'&cc='+encodeURIComponent(email):'';
    window.location.href='mailto:'+CONTACT_KINDS[kind].to+'?subject='+sEnc+'&body='+bEnc+ccParam;
    toast(t('toast.saved_opening_mail'));
    state.contactPrefill={subject:'',body:''};
    setTimeout(render,400);
  });
  const clear=$('[data-action="clear-messages"]');
  if(clear) clear.addEventListener('click',()=>{if(!confirm(t('contact.clear_confirm'))) return;messages=[];persistMsgs();toast(t('toast.message_history_cleared'));render()});
}
