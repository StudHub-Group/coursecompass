/* ==========================================================================
   Footer
   ========================================================================== */
function renderFooter(signedIn){
  return ''+
  '<footer class="mt-auto border-t border-border bg-card/60">'+
    '<div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 '+(signedIn?'lg:grid-cols-4':'lg:grid-cols-3')+'">'+
      '<div>'+
        '<div class="flex items-center gap-2">'+ICONS.cap+'<span class="font-display text-lg tracking-tight">CourseCompass</span></div>'+
        '<p class="mt-3 text-xs text-muted-foreground">'+t('footer.tagline',{version:esc(APP_META.version)})+'</p>'+
      '</div>'+
      (signedIn?'<div><p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('footer.product_heading')+'</p><ul class="mt-3 space-y-2 text-sm"><li><a href="#/dashboard" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.course_directory')+'</a></li><li><a href="#/profile" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.my_reviews')+'</a></li><li><a href="#/settings" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.settings')+'</a></li></ul></div>':'')+
      '<div><p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('footer.company_heading')+'</p><ul class="mt-3 space-y-2 text-sm"><li><a href="#/about" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.about')+'</a></li><li><a href="#/contact" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.contact_feedback')+'</a></li><li><a href="#/contact" data-contact-kind="bug" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.report_bug')+'</a></li><li><a href="#/contact" data-contact-kind="idea" class="text-muted-foreground transition-colors hover:text-foreground">'+t('footer.suggest_feature')+'</a></li></ul></div>'+
      '<div><p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('footer.get_in_touch')+'</p><ul class="mt-3 space-y-2 text-sm"><li><a class="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground" href="mailto:'+APP_META.bugEmail+'">'+ICONS.bug+esc(APP_META.bugEmail)+'</a></li><li><a class="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground" href="mailto:'+APP_META.ideaEmail+'">'+ICONS.bulb+esc(APP_META.ideaEmail)+'</a></li></ul></div>'+
    '</div>'+
    '<div class="border-t border-border"><div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground">'+
      '<div class="flex flex-wrap items-center gap-3"><span>© '+new Date().getFullYear()+'</span>'+studhubLogo(18)+'<span>· '+t('footer.build_note')+'</span></div>'+
      '<span>'+t('footer.last_updated',{date:esc(APP_META.lastUpdated)})+'</span>'+
    '</div></div>'+
  '</footer>';
}

function bindFooter(){$$('[data-contact-kind]').forEach(el=>el.addEventListener('click',()=>{state.contactKind=el.dataset.contactKind;if(location.hash==='#/contact')render()}))}
