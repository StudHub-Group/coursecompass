/* ==========================================================================
   About
   ========================================================================== */
function renderAbout(){
  const feature=(icon,title,body)=>'<div class="rounded-xl border border-border bg-card p-5"><div class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">'+icon+'</div><p class="mt-3 font-medium">'+title+'</p><p class="mt-1 text-sm text-muted-foreground">'+body+'</p></div>';
  const faq=(q,a)=>'<details class="group rounded-xl border border-border bg-card p-5"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium"><span>'+q+'</span><span class="text-muted-foreground transition-transform group-open:rotate-45">+</span></summary><p class="mt-3 text-sm text-muted-foreground">'+a+'</p></details>';
  return '<main class="mx-auto w-full max-w-4xl px-4 py-12"><a href="#/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">'+ICONS.arrowLeft+' '+t('about.home')+'</a>'+
    '<section class="mt-6"><p class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">'+ICONS.info+' '+t('about.eyebrow')+'</p><h1 class="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">'+t('about.title')+'</h1><p class="mt-4 max-w-2xl text-lg text-muted-foreground">'+t('about.body1')+'</p><p class="mt-4 max-w-2xl text-muted-foreground">'+t('about.body2')+'</p></section>'+
    '<section class="mt-10 grid gap-4 sm:grid-cols-3"><div class="rounded-xl border border-border bg-card p-5"><p class="font-display text-3xl">'+globalStats.universities+'</p><p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">'+t('about.stat_universities')+'</p></div><div class="rounded-xl border border-border bg-card p-5"><p class="font-display text-3xl">'+globalStats.courses+'</p><p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">'+t('about.stat_courses')+'</p></div><div class="rounded-xl border border-border bg-card p-5"><p class="font-display text-3xl">'+globalStats.reviews+'</p><p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">'+t('about.stat_reviews')+'</p></div></section>'+
    '<section class="mt-12"><h2 class="font-display text-2xl">'+t('about.what_you_can_do')+'</h2><div class="mt-4 grid gap-4 sm:grid-cols-2">'+feature(ICONS.sliders,t('about.feature1_title'),t('about.feature1_body'))+feature(ICONS.shield,t('about.feature2_title'),t('about.feature2_body'))+feature(ICONS.pen,t('about.feature3_title'),t('about.feature3_body'))+feature(ICONS.bug,t('about.feature4_title'),t('about.feature4_body'))+'</div></section>'+
    '<section class="mt-12"><h2 class="font-display text-2xl">'+t('about.faq_heading')+'</h2><div class="mt-4 space-y-3">'+
      faq(t('about.faq1_q'),t('about.faq1_a'))+
      faq(t('about.faq2_q'),t('about.faq2_a'))+
      faq(t('about.faq3_q'),t('about.faq3_a'))+
      faq(t('about.faq4_q'),t('about.faq4_a'))+
      faq(t('about.faq5_q'),t('about.faq5_a'))+
      faq(t('about.faq6_q'),t('about.faq6_a'))+
    '</div></section>'+
    '<section class="mt-12 rounded-2xl border border-border bg-card p-6"><div class="flex flex-wrap items-center justify-between gap-4"><div><h2 class="font-display text-xl">'+t('about.get_in_touch_heading')+'</h2><p class="mt-1 text-sm text-muted-foreground">'+t('about.get_in_touch_body')+'</p></div><div class="flex flex-wrap gap-2"><a href="#/contact" class="btn btn-primary btn-sm">'+ICONS.mail+' '+t('about.open_form')+'</a><a href="mailto:'+APP_META.developerEmail+'" class="btn btn-outline btn-sm">'+ICONS.mail+' '+esc(APP_META.developerEmail)+'</a></div></div><div class="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground"><span>'+t('about.footer_line',{company:esc(APP_META.company),version:esc(APP_META.version)})+'</span></div></section></main>';
}
