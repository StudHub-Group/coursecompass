/* ==========================================================================
   Language picker overlay
   ========================================================================== */
function renderLanguagePrompt(){
  const i=inst();
  const uniLangs=(i&&i.languages&&i.languages.length)?i.languages:[];
  const options=Array.from(new Set(['English',...uniLangs]));
  const current=user.interfaceLang||'English';
  return '<div class="fixed inset-0 z-50 overflow-y-auto">'+
    '<div class="fixed inset-0 bg-black/80"></div>'+
    '<div class="relative flex min-h-full items-center justify-center p-4">'+
      '<div role="dialog" aria-modal="true" class="cc-dialog-in relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">'+
        '<div class="flex flex-col space-y-1.5 text-center sm:text-left">'+
          '<p class="text-xs uppercase tracking-wider text-muted-foreground">'+t('langPrompt.eyebrow')+'</p>'+
          '<h2 class="font-display text-xl font-semibold tracking-tight">'+t('langPrompt.title')+'</h2>'+
          '<p class="text-sm text-muted-foreground">'+t('langPrompt.body')+'</p></div>'+
        '<div class="mt-5 space-y-2">'+
          options.map(l=>'<button type="button" data-lang-pick="'+esc(l)+'" class="flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors '+(current===l?'border-primary bg-secondary':'border-border hover:border-primary/40')+'"><span class="text-sm font-medium">'+esc(langNativeName(l))+'</span>'+(current===l?ICONS.check:'')+'</button>').join('')+
        '</div>'+
        '<button class="btn btn-primary mt-5 w-full" data-action="confirm-lang">'+t('langPrompt.continue')+'</button>'+
      '</div>'+
    '</div></div>';
}
