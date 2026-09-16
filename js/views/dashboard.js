/* ==========================================================================
   Dashboard
   ========================================================================== */
function filteredCourses(){
  let list=inst().courses.slice();
  const f=state.filters;
  if(f.faculty) list=list.filter(c=>c.faculty===f.faculty);
  if(f.level)   list=list.filter(c=>c.level===f.level);
  if(f.term)    list=list.filter(c=>(c.terms||[]).includes(f.term));
  if(f.q){const q=f.q.toLowerCase();list=list.filter(c=>(c.title+' '+c.code+' '+c.prof).toLowerCase().includes(q))}
  const rate=c=>{const a=courseAvg(c.id);return a==null?-1:a};
  if(f.sort==='rating')  list.sort((a,b)=>rate(b)-rate(a)||a.code.localeCompare(b.code));
  if(f.sort==='reviews') list.sort((a,b)=>reviewsFor(b.id).length-reviewsFor(a.id).length);
  if(f.sort==='code')    list.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
  if(f.sort==='title')   list.sort((a,b)=>a.title.localeCompare(b.title));
  return list;
}

function courseCardHtml(c){
  const avg=courseAvg(c.id);const count=reviewsFor(c.id).length;
  return '<a href="#/courses/'+c.id+'" class="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"><div class="flex flex-wrap items-start justify-between gap-4">'+
    '<div class="min-w-0"><p class="font-mono text-xs text-muted-foreground">'+esc(c.code)+'</p><h3 class="mt-1 font-display text-xl leading-tight">'+esc(c.title)+'</h3><p class="mt-1 text-sm text-muted-foreground">'+esc(c.prof)+' · '+c.credits+' credits · '+esc(termsLabel(c.terms))+' · '+esc(enumLabel('level',c.level))+'</p></div>'+
    '<div class="text-right"><p class="font-display text-3xl leading-none">'+(avg==null?'–':fmt1(avg))+'</p>'+Stars(avg,14,'mt-1.5 justify-end')+'<p class="mt-1 text-xs text-muted-foreground">'+(count===0?t('dashboard.review_count_zero'):tp('dashboard.review_count',count))+'</p></div>'+
  '</div></a>';
}

function courseListHtml(){
  const list=filteredCourses();
  if(!list.length) return '<div class="rounded-xl border border-dashed border-border p-10 text-center"><p class="text-sm text-muted-foreground">'+t('dashboard.no_courses_match')+'</p><button class="btn btn-outline btn-sm mt-4" data-action="clear-filters">'+t('dashboard.clear_filters')+'</button></div>';
  return list.map(courseCardHtml).join('');
}

function renderDashboard(){
  const i=inst();
  const stat=(v,l)=>'<div><p class="font-display text-3xl leading-none">'+v+'</p><p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">'+l+'</p></div>';
  const facultyCard=f=>{const s=facultyStats(f.id);const active=state.filters.faculty===f.id;return '<button type="button" data-faculty-card="'+f.id+'" class="rounded-xl border p-4 text-left transition-colors '+(active?'border-primary bg-secondary':'border-border bg-card hover:border-primary/40')+'">'+ICONS.building+'<p class="mt-2 font-medium leading-snug">'+esc(f.name)+'</p><p class="mt-1 line-clamp-2 text-xs text-muted-foreground">'+esc(f.desc)+'</p><p class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">'+Stars(s.avg,12)+(s.avg==null?t('dashboard.no_ratings'):fmt1(s.avg))+' · '+tp('dashboard.course_count',s.count)+'</p></button>'};
  const facultyOptions='<option value="">'+t('dashboard.filter_all_faculties')+'</option>'+i.faculties.map(f=>'<option value="'+f.id+'"'+(state.filters.faculty===f.id?' selected':'')+'>'+esc(f.name)+'</option>').join('');
  const termOptions='<option value="">'+t('dashboard.filter_all_terms')+'</option>'+uniqueTerms().map(tm=>'<option value="'+esc(tm)+'"'+(state.filters.term===tm?' selected':'')+'>'+esc(enumLabel('season',tm))+'</option>').join('');
  const selectWrap=(id,inner,w)=>'<div class="relative '+w+'"><select class="select" id="'+id+'">'+inner+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div>';
  const expanded=state.facultyExpanded||!!state.filters.faculty;
  const facultyGrid=expanded?'<div class="mt-4 grid gap-3 md:grid-cols-3">'+(i.faculties.length?i.faculties.map(facultyCard).join(''):'<p class="text-sm text-muted-foreground">'+t('dashboard.no_faculties')+'</p>')+'</div>':'<p class="mt-3 text-xs text-muted-foreground">'+t('dashboard.faculties_collapsed_hint')+'</p>';
  return '<main class="mx-auto w-full max-w-6xl px-4 py-10">'+
    (i.status==='pending'?'<div class="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">'+t('dashboard.pending_banner')+'</div>':'')+
    '<section class="rounded-2xl border border-border bg-card p-6"><p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">'+t('dashboard.signed_in_as',{name:esc(user.name)})+'</p><h1 class="mt-2 font-display text-4xl tracking-tight">'+esc(i.name)+'</h1>'+(i.localName?'<p class="mt-1 text-sm text-muted-foreground italic">'+esc(i.localName)+'</p>':'')+'<p class="mt-2 text-muted-foreground">'+esc(i.tagline||'')+'</p>'+
    '<div class="mt-6 flex flex-wrap gap-8">'+stat(i.faculties.length,t('dashboard.stat_faculties'))+stat(i.courses.length,t('dashboard.stat_courses'))+stat(i.reviews.length,t('dashboard.stat_reviews'))+'</div></section>'+
    '<section class="mt-10"><div class="flex items-center justify-between gap-4"><button type="button" data-action="toggle-faculties" class="group flex items-center gap-2 text-left" aria-expanded="'+expanded+'"><span class="transition-transform '+(expanded?'rotate-90':'')+' text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span><h2 class="font-display text-2xl">'+t('dashboard.faculties_heading')+'</h2><span class="text-sm text-muted-foreground">('+i.faculties.length+')</span></button><button class="btn btn-outline btn-sm" data-action="add-faculty">'+ICONS.plus+t('dashboard.add_faculty')+'</button></div>'+facultyGrid+'</section>'+
    '<section class="mt-10"><div class="flex flex-wrap items-center justify-between gap-4"><h2 class="font-display text-2xl">'+t('dashboard.courses_heading')+'</h2><button class="btn btn-primary btn-sm" data-action="add-course">'+ICONS.plus+t('dashboard.add_course')+'</button></div>'+
    '<div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]"><div class="relative">'+ICONS.search+'<input class="input pl-9" id="course-search" placeholder="'+t('dashboard.search_placeholder')+'" value="'+esc(state.filters.q)+'"></div>'+selectWrap('filter-faculty',facultyOptions,'md:w-56')+selectWrap('filter-term',termOptions,'md:w-36')+selectWrap('filter-level','<option value="">'+t('dashboard.filter_all_levels')+'</option>'+['Bachelor','Master','PhD'].map(l=>'<option value="'+l+'"'+(state.filters.level===l?' selected':'')+'>'+enumLabel('level',l)+'</option>').join(''),'md:w-32')+selectWrap('filter-sort','<option value="rating"'+(state.filters.sort==='rating'?' selected':'')+'>'+t('dashboard.sort_rating')+'</option><option value="reviews"'+(state.filters.sort==='reviews'?' selected':'')+'>'+t('dashboard.sort_reviews')+'</option><option value="code"'+(state.filters.sort==='code'?' selected':'')+'>'+t('dashboard.sort_code')+'</option><option value="title"'+(state.filters.sort==='title'?' selected':'')+'>'+t('dashboard.sort_title')+'</option>','md:w-40')+'</div>'+
    '<div class="mt-5 space-y-3" id="course-list">'+courseListHtml()+'</div></section></main>';
}

function refreshCourseList(){const el=$('#course-list');if(el)el.innerHTML=courseListHtml()}

function bindDashboard(){
  const s=$('#course-search');if(s)s.addEventListener('input',e=>{state.filters.q=e.target.value;refreshCourseList()});
  const fac=$('#filter-faculty');if(fac)fac.addEventListener('change',e=>{state.filters.faculty=e.target.value;refreshCourseList()});
  const term=$('#filter-term');if(term)term.addEventListener('change',e=>{state.filters.term=e.target.value;refreshCourseList()});
  const lvl=$('#filter-level');if(lvl)lvl.addEventListener('change',e=>{state.filters.level=e.target.value;refreshCourseList()});
  const srt=$('#filter-sort');if(srt)srt.addEventListener('change',e=>{state.filters.sort=e.target.value;refreshCourseList()});
  $$('[data-faculty-card]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.facultyCard;state.filters.faculty=state.filters.faculty===id?'':id;render()}));
  const t=$('[data-action="toggle-faculties"]');if(t)t.addEventListener('click',()=>{state.facultyExpanded=!state.facultyExpanded;render()});
  $$('[data-action="clear-filters"]').forEach(b=>b.addEventListener('click',()=>{state.filters={q:'',faculty:'',level:'',term:'',sort:'rating'};render()}));
  const addF=$('[data-action="add-faculty"]');if(addF)addF.addEventListener('click',openFacultyDialog);
  const addC=$('[data-action="add-course"]');if(addC)addC.addEventListener('click',openCourseDialog);
}
