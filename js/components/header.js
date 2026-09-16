/* ==========================================================================
   Header
   ========================================================================== */
function renderHeader(){
  const signedIn=!!user;
  const navLink=(href,label,match)=>{const active=state.route===match;return '<a href="'+href+'" class="rounded-md px-3 py-1.5 transition-colors '+(active?'bg-secondary text-foreground':'text-muted-foreground hover:bg-secondary hover:text-foreground')+'">'+label+'</a>'};
  let right='';
  if(signedIn){
    right='<nav class="hidden items-center gap-1 text-sm md:flex">'+navLink('#/dashboard',t('header.nav_courses'),'#/dashboard')+navLink('#/profile',t('header.nav_my_reviews'),'#/profile')+navLink('#/settings',t('header.nav_settings'),'#/settings')+navLink('#/about',t('header.nav_about'),'#/about')+'</nav>'+
      '<div class="ml-auto flex items-center gap-3"><span class="hidden text-xs text-muted-foreground sm:inline">'+esc(DB[user.inst].code)+' · '+esc(user.email)+'</span><button class="btn btn-ghost btn-sm" data-action="signout">'+ICONS.logout+t('header.sign_out')+'</button></div>';
  } else {
    right='<nav class="hidden items-center gap-1 text-sm md:flex">'+navLink('#/',t('header.sign_in'),'#/')+navLink('#/about',t('header.nav_about'),'#/about')+navLink('#/contact',t('header.nav_contact'),'#/contact')+'</nav>'+
      '<div class="ml-auto"><a href="#/" class="btn btn-primary btn-sm" data-action="goto-signin">'+t('header.sign_in')+'</a></div>';
  }
  return '<header class="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur"><div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">'+
    '<a href="'+(signedIn?'#/dashboard':'#/')+'" class="flex items-center gap-2.5">'+ICONS.cap+'<span class="font-display text-lg tracking-tight">CourseCompass</span></a>'+right+
  '</div></header>';
}
