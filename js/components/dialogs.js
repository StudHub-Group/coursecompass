/* ==========================================================================
   Dialogs
   ========================================================================== */
const SEASONS=['Fall','Spring','Summer','Winter'];
const TERMS=['Fall','Spring','Winter','Summer'];
const LEVELS=['Bachelor','Master','PhD'];

function openDialog(cfg){state.dialog=cfg;renderDialog()}
function closeDialog(){state.dialog=null;renderDialog()}

function renderDialog(){
  const root=$('#modal-root');
  if(!state.dialog){root.innerHTML='';document.body.style.overflow='';return}
  document.body.style.overflow='hidden';
  const d=state.dialog;
  let inner='';
  if(d.type==='review') inner=reviewDialogHtml(getCourse(d.courseId));
  if(d.type==='faculty') inner=facultyDialogHtml();
  if(d.type==='course') inner=courseDialogHtml();
  if(d.type==='feedback') inner=feedbackDialogHtml();
  root.innerHTML='<div class="fixed inset-0 z-50 overflow-y-auto"><div class="fixed inset-0 bg-black/80" data-close></div><div class="relative flex min-h-full items-center justify-center p-4"><div role="dialog" aria-modal="true" class="cc-dialog-in relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto"><button type="button" class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100" data-close aria-label="'+t('common.close')+'">'+ICONS.x+'</button>'+inner+'</div></div></div>';
  bindDialogBody();
  bindDialogOverlay();
}

function bindDialogOverlay(){
  $$('[data-close]').forEach(el=>el.addEventListener('click',closeDialog));
  if(!bindDialogOverlay._bound){bindDialogOverlay._bound=true;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.dialog)closeDialog()})}
}

function starPickerRow(name,label){
  const v=(state.dialog && state.dialog.ratings[name])||0;
  const buttons=[1,2,3,4,5].map(i=>'<button type="button" class="p-0.5 transition-transform hover:scale-110" data-star="'+i+'" data-pick="'+name+'" aria-label="'+label+': '+i+'">'+starSvg(20,i<=v?'fill-accent text-accent':'text-muted-foreground/40')+'</button>').join('');
  return '<div class="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-2"><span class="text-sm text-foreground">'+label+'</span><div class="flex items-center gap-1" data-picker="'+name+'">'+buttons+'</div></div>';
}

function reviewDialogHtml(course){
  const d=state.dialog;
  const editing=!!d.reviewId;
  const currentYear=new Date().getFullYear();
  const seasonOptions=SEASONS.map(s=>'<option value="'+s+'"'+(d.season===s?' selected':'')+'>'+enumLabel('season',s)+'</option>').join('');
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left"><h2 class="font-display text-xl font-semibold tracking-tight">'+(editing?t('review.title_edit'):t('review.title_new',{code:esc(course.code)}))+'</h2><p class="text-sm text-muted-foreground">'+esc(course.title)+' · '+esc(course.prof)+'</p>'+(d.hint?'<p class="text-xs text-amber-700">'+esc(d.hint)+'</p>':'')+'</div>'+
    '<div class="mt-4 space-y-3">'+starPickerRow('overall',t('review.rating_overall'))+starPickerRow('difficulty',t('review.rating_difficulty'))+starPickerRow('workload',t('review.rating_workload'))+starPickerRow('professor',t('review.rating_professor'))+
      '<div class="grid grid-cols-2 gap-3"><div class="space-y-1.5"><label class="text-sm font-medium">'+t('review.season_label')+'</label><div class="relative"><select class="select" id="rv-season">'+seasonOptions+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div></div><div class="space-y-1.5"><label class="text-sm font-medium" for="rv-year">'+t('review.year_label')+'</label><input class="input" id="rv-year" type="number" min="1990" max="2100" step="1" value="'+esc(d.year||String(currentYear))+'"></div></div>'+
      '<div class="space-y-1.5"><label class="text-sm font-medium" for="rv-text">'+t('review.experience_label')+'</label><textarea class="input" id="rv-text" rows="5" placeholder="'+t('review.experience_placeholder')+'">'+esc(d.text)+'</textarea></div>'+
      '<div class="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"><div><p class="text-sm font-medium">'+t('review.anon_title')+'</p><p class="text-xs text-muted-foreground">'+t('review.anon_desc')+'</p></div>'+switchHtml('rv-anon',d.anon)+'</div>'+
    '</div>'+
    '<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button class="btn btn-ghost" data-close>'+t('common.cancel')+'</button><button class="btn btn-primary" data-action="publish-review">'+(editing?t('review.save_changes'):t('review.publish'))+'</button></div>';
}

function facultyDialogHtml(){
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left"><h2 class="font-display text-xl font-semibold tracking-tight">'+t('faculty.title')+'</h2><p class="text-sm text-muted-foreground">'+t('faculty.body',{code:esc(DB[user.inst].code)})+'</p></div>'+
    '<div class="mt-4 space-y-3"><div class="space-y-1.5"><label class="text-sm font-medium" for="fac-name">'+t('faculty.name_label')+'</label><input class="input" id="fac-name" placeholder="'+t('faculty.name_placeholder')+'"><p class="text-xs text-amber-700" id="fac-dup-hint"></p></div><div class="space-y-1.5"><label class="text-sm font-medium" for="fac-desc">'+t('faculty.desc_label')+'</label><textarea class="input" id="fac-desc" rows="3" placeholder="'+t('faculty.desc_placeholder')+'"></textarea></div></div>'+
    '<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button class="btn btn-ghost" data-close>'+t('common.cancel')+'</button><button class="btn btn-primary" data-action="create-faculty">'+t('faculty.submit')+'</button></div>';
}

function courseDialogHtml(){
  const facultyOptions=inst().faculties.map(f=>'<option value="'+f.id+'">'+esc(f.name)+'</option>').join('');
  // Only offer the terms this university said it runs (set when the
  // university was created); universities created before that field existed
  // have an empty list, so fall back to the full fixed set for those.
  const availableTerms=(inst().terms&&inst().terms.length)?inst().terms:TERMS;
  const d=state.dialog;
  const termChips=availableTerms.map(tm=>{const on=d.terms.includes(tm);return '<button type="button" class="chip-toggle" data-active="'+(on?'1':'0')+'" data-course-term="'+esc(tm)+'">'+esc(enumLabel('season',tm))+'</button>'}).join('');
  const levelOptions=LEVELS.map(l=>'<option value="'+l+'">'+enumLabel('level',l)+'</option>').join('');
  const sel=(id,options)=>'<div class="relative"><select class="select" id="'+id+'">'+options+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div>';
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left"><h2 class="font-display text-xl font-semibold tracking-tight">'+t('courseDialog.title')+'</h2><p class="text-sm text-muted-foreground">'+t('courseDialog.body')+'</p></div>'+
    '<div class="mt-4 space-y-3"><div class="space-y-1.5"><label class="text-sm font-medium">'+t('courseDialog.faculty_label')+'</label>'+sel('c-faculty',facultyOptions)+'</div><div class="grid grid-cols-2 gap-3"><div class="space-y-1.5"><label class="text-sm font-medium" for="c-code">'+t('courseDialog.code_label')+'</label><input class="input" id="c-code" placeholder="IN0002"></div><div class="space-y-1.5"><label class="text-sm font-medium" for="c-credits">'+t('courseDialog.credits_label')+'</label><input class="input" id="c-credits" type="number" value="6"></div></div><div class="space-y-1.5"><label class="text-sm font-medium" for="c-title">'+t('courseDialog.title_label')+'</label><input class="input" id="c-title" placeholder="'+t('courseDialog.title_placeholder')+'"><p class="text-xs text-amber-700" id="c-dup-hint"></p></div><div class="space-y-1.5"><label class="text-sm font-medium" for="c-prof">'+t('courseDialog.professor_label')+'</label><input class="input" id="c-prof" placeholder="Prof. …"></div><div class="space-y-1.5"><label class="text-sm font-medium">'+t('courseDialog.term_label')+'</label><div class="flex flex-wrap gap-1.5" id="c-term-chips">'+termChips+'</div></div><div class="space-y-1.5"><label class="text-sm font-medium">'+t('courseDialog.level_label')+'</label>'+sel('c-level',levelOptions)+'</div><div class="space-y-1.5"><label class="text-sm font-medium" for="c-desc">'+t('courseDialog.desc_label')+'</label><textarea class="input" id="c-desc" rows="3"></textarea></div></div>'+
    '<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button class="btn btn-ghost" data-close>'+t('common.cancel')+'</button><button class="btn btn-primary" data-action="create-course">'+t('courseDialog.submit')+'</button></div>';
}

function feedbackDialogHtml(){
  const d=state.dialog;
  const kindOptions=Object.keys(CONTACT_KINDS).map(k=>'<option value="'+k+'"'+(d.kind===k?' selected':'')+'>'+contactKindLabel(k)+'</option>').join('');
  return '<div class="flex flex-col space-y-1.5 text-center sm:text-left"><h2 class="font-display text-xl font-semibold tracking-tight">'+t('feedback.title')+'</h2><p class="text-sm text-muted-foreground">'+t('feedback.body',{company:esc(APP_META.company)})+'</p></div>'+
    '<div class="mt-4 space-y-3"><div class="space-y-1.5"><label class="text-sm font-medium">'+t('feedback.type_label')+'</label><div class="relative"><select class="select" id="fb-kind">'+kindOptions+'</select><span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">'+CHEVRON+'</span></div></div><div class="space-y-1.5"><label class="text-sm font-medium" for="fb-subject">'+t('feedback.subject_label')+'</label><input class="input" id="fb-subject" placeholder="'+t('feedback.subject_placeholder')+'" value="'+esc(d.subject||'')+'"></div><div class="space-y-1.5"><label class="text-sm font-medium" for="fb-body">'+t('feedback.message_label')+'</label><textarea class="input" id="fb-body" rows="4" placeholder="'+t('feedback.message_placeholder')+'">'+esc(d.body||'')+'</textarea></div><div class="space-y-1.5"><label class="text-sm font-medium" for="fb-email">'+t('feedback.reply_to_label')+' <span class="text-muted-foreground">'+t('contact.optional')+'</span></label><input class="input" id="fb-email" type="email" value="'+esc(user?user.email:'')+'"></div></div>'+
    '<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button class="btn btn-ghost" data-close>'+t('common.cancel')+'</button><button class="btn btn-outline" data-action="open-contact-full">'+t('feedback.open_full_form')+'</button><button class="btn btn-primary" data-action="send-feedback">'+t('feedback.submit')+'</button></div>';
}

function bindDialogBody(){
  const d=state.dialog;if(!d) return;
  if(d.type==='review'){
    $$('[data-pick]').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.pick;const value=parseInt(btn.dataset.star,10);d.ratings[name]=value;const row=btn.closest('[data-picker]');$$('[data-pick]',row).forEach(b=>{const i=parseInt(b.dataset.star,10);b.innerHTML=starSvg(20,i<=value?'fill-accent text-accent':'text-muted-foreground/40')})}));
    const season=$('#rv-season');if(season)season.addEventListener('change',e=>{d.season=e.target.value});
    const year=$('#rv-year');if(year)year.addEventListener('input',e=>{d.year=e.target.value});
    const ta=$('#rv-text');if(ta)ta.addEventListener('input',e=>{d.text=e.target.value});
    const anon=$('[data-switch="rv-anon"]');
    if(anon)anon.addEventListener('click',()=>{d.anon=!d.anon;anon.dataset.state=d.anon?'checked':'unchecked';anon.setAttribute('aria-checked',String(d.anon));const thumb=$('.switch-thumb',anon);thumb.dataset.state=d.anon?'checked':'unchecked'});
    const pub=$('[data-action="publish-review"]');
    if(pub)pub.addEventListener('click',async ()=>{
      const r=d.ratings;
      if(!r.overall||!r.difficulty||!r.workload||!r.professor){toast(t('toast.rate_all_categories'));return}
      if(!d.text.trim()||d.text.trim().length<10){toast(t('toast.write_short_sentence'));return}
      const yr=parseInt(d.year,10);
      if(!yr||yr<1990||yr>2100){toast(t('toast.enter_valid_year'));return}
      const season=d.season||'Fall';
      pub.disabled=true;pub.textContent=d.reviewId?t('review.saving'):t('review.publishing');
      if(d.reviewId){
        try{
          await db.collection('reviews').doc(d.reviewId).update({
            overall:r.overall,difficulty:r.difficulty,workload:r.workload,professor:r.professor,
            season:season,year:yr,body:d.text.trim(),is_anonymous:d.anon,author_name:d.anon?null:user.name
          });
        }catch(error){
          toast(t('toast.could_not_save',{error:error.message}));pub.disabled=false;pub.textContent=t('review.save_changes');return;
        }
        await loadUniversity(user.inst);closeDialog();toast(t('toast.review_saved'));render();
      } else {
        // Postgres enforced the 3-reviews-per-course cap with a trigger;
        // Firestore has no equivalent, so we check with a query first. This
        // is a best-effort client check (see the setup guide for the
        // Cloud Function alternative if you need this to be tamper-proof).
        try{
          const existing=await db.collection('reviews')
            .where('course_id','==',d.courseId)
            .where('author_id','==',user.id)
            .get();
          if(existing.size>=3){
            toast(t('toast.review_limit_reached'));pub.disabled=false;pub.textContent=t('review.publish');return;
          }
          await db.collection('reviews').add({
            course_id:d.courseId,university_id:user.inst,author_id:user.id,is_anonymous:d.anon,author_name:d.anon?null:user.name,
            overall:r.overall,difficulty:r.difficulty,workload:r.workload,professor:r.professor,season:season,year:yr,body:d.text.trim(),
            created_at:FieldValue.serverTimestamp()
          });
        }catch(error){
          toast(t('toast.could_not_publish_review',{error:error.message}));pub.disabled=false;pub.textContent=t('review.publish');return;
        }
        await loadUniversity(user.inst);closeDialog();toast(t('toast.review_published'));render();
      }
    });
  }
  if(d.type==='faculty'){
    const nameInput=$('#fac-name');
    if(nameInput){
      let debounceTimer=null;
      nameInput.addEventListener('input',()=>{
        clearTimeout(debounceTimer);
        const val=nameInput.value.trim();
        const hint=$('#fac-dup-hint'); if(hint) hint.textContent='';
        if(val.length<3) return;
        // Faculties for this university are already cached from loadUniversity(),
        // so the "did you mean" hint is a local lookup — no round trip needed,
        // unlike the Postgres RPC this replaces.
        debounceTimer=setTimeout(()=>{
          const match=findSimilar(inst().faculties,val,'name');
          const h=$('#fac-dup-hint');
          if(h) h.textContent=match?t('faculty.similar_hint',{name:match.name}):'';
        },350);
      });
    }
    const go=$('[data-action="create-faculty"]');
    if(go)go.addEventListener('click',async ()=>{
      const name=$('#fac-name').value.trim();const desc=$('#fac-desc').value.trim();
      if(!name){toast(t('toast.give_faculty_name'));return}
      // Firestore has no unique constraint like the Postgres schema did, so
      // duplicate names are checked client-side before writing.
      if(inst().faculties.some(f=>f.name.trim().toLowerCase()===name.toLowerCase())){toast(t('toast.faculty_exists'));return}
      go.disabled=true;
      try{
        await db.collection('faculties').add({university_id:user.inst,name:name,description:desc||null,created_by:user.id,created_at:FieldValue.serverTimestamp()});
      }catch(error){
        go.disabled=false;
        toast(t('toast.could_not_add_faculty',{error:error.message}));
        return;
      }
      go.disabled=false;
      await loadUniversity(user.inst);state.facultyExpanded=true;closeDialog();toast(t('toast.faculty_added'));render();
    });
  }
  if(d.type==='course'){
    $$('[data-course-term]').forEach(chip=>chip.addEventListener('click',()=>{
      const tm=chip.dataset.courseTerm;
      const i=d.terms.indexOf(tm);
      if(i>=0) d.terms.splice(i,1); else d.terms.push(tm);
      chip.dataset.active=d.terms.includes(tm)?'1':'0';
    }));
    const titleInput=$('#c-title');
    if(titleInput){
      let debounceTimer=null;
      titleInput.addEventListener('input',()=>{
        clearTimeout(debounceTimer);
        const val=titleInput.value.trim();
        const hint=$('#c-dup-hint'); if(hint) hint.textContent='';
        if(val.length<3) return;
        // Courses for this university are already cached from loadUniversity(),
        // so this is a local lookup — no round trip needed, unlike the
        // Postgres RPC this replaces.
        debounceTimer=setTimeout(()=>{
          const match=findSimilar(inst().courses,val,'title');
          const h=$('#c-dup-hint');
          if(h) h.textContent=match?t('courseDialog.similar_hint',{code:match.code,title:match.title}):'';
        },350);
      });
    }
    const go=$('[data-action="create-course"]');
    if(go)go.addEventListener('click',async ()=>{
      const code=$('#c-code').value.trim(),title=$('#c-title').value.trim(),prof=$('#c-prof').value.trim(),credits=parseInt($('#c-credits').value,10)||0,facultyId=$('#c-faculty').value,terms=d.terms.slice(),level=$('#c-level').value,desc=$('#c-desc').value.trim();
      if(!code){toast(t('toast.course_code_required'));return}
      if(!title){toast(t('toast.course_title_required'));return}
      if(!facultyId){toast(t('toast.add_faculty_first'));return}
      if(!terms.length){toast(t('toast.select_one_course_term'));return}
      // Firestore has no unique constraint like the Postgres schema did, so
      // duplicate course codes are checked client-side before writing.
      if(inst().courses.some(c=>c.code.trim().toLowerCase()===code.toLowerCase())){toast(t('toast.course_code_exists',{code:code}));return}
      go.disabled=true;
      try{
        await db.collection('courses').add({
          university_id:user.inst,faculty_id:facultyId,code:code,title:title,
          professor:prof||'TBA',credits:credits,terms:terms,level:level,description:desc||null,created_by:user.id,
          created_at:FieldValue.serverTimestamp()
        });
      }catch(error){
        go.disabled=false;
        toast(t('toast.could_not_add_course',{error:error.message}));
        return;
      }
      go.disabled=false;
      await loadUniversity(user.inst);closeDialog();toast(t('toast.course_added'));render();
    });
  }
  if(d.type==='feedback'){
    const kind=$('#fb-kind');if(kind)kind.addEventListener('change',e=>{d.kind=e.target.value});
    const send=$('[data-action="send-feedback"]');
    if(send)send.addEventListener('click',()=>{
      const subject=$('#fb-subject').value.trim(),body=$('#fb-body').value.trim(),email=$('#fb-email').value.trim();
      const k=d.kind in CONTACT_KINDS?d.kind:'bug';
      if(!subject){toast(t('toast.add_subject'));return}
      if(!body||body.length<10){toast(t('toast.describe_few_words'));return}
      if(email && !isValidEmail(email)){toast(t('toast.reply_email_invalid'));return}
      messages.push({id:'m'+Date.now(),kind:k,name:user?user.name:'',email:email,subject:subject,body:body,to:CONTACT_KINDS[k].to,sentAt:new Date().toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}),status:'saved'});
      persistMsgs();
      const sEnc=encodeURIComponent('['+contactKindLabel(k)+'] '+subject);
      const bEnc=encodeURIComponent(body+'\n\n—\n'+(email?'Reply-to: '+email+'\n':'')+'Page: '+location.href);
      window.location.href='mailto:'+CONTACT_KINDS[k].to+'?subject='+sEnc+'&body='+bEnc;
      closeDialog();toast(t('toast.saved_opening_mail'));
    });
    const openFull=$('[data-action="open-contact-full"]');
    if(openFull)openFull.addEventListener('click',()=>{
      state.contactKind=d.kind in CONTACT_KINDS?d.kind:'bug';
      state.contactPrefill={subject:$('#fb-subject').value.trim(),body:$('#fb-body').value.trim()};
      closeDialog();location.hash='#/contact';
      if(location.hash==='#/contact') render();
    });
  }
}

function openReviewDialog(courseId){
  const mineCount=inst().reviews.filter(r=>r.courseId===courseId&&r.authorId===user.id).length;
  if(mineCount>=3){toast(t('toast.max_reviews_reached'));return}
  openDialog({type:'review',courseId:courseId,ratings:{overall:0,difficulty:0,workload:0,professor:0},season:'Fall',year:String(new Date().getFullYear()),text:'',anon:user.prefs.anonDefault,hint:mineCount>0?t('review.already_reviewed_hint',{n:mineCount+1}):null});
}
function openEditReviewDialog(reviewId){const r=inst().reviews.find(x=>x.id===reviewId);if(!r){toast(t('toast.review_not_found'));return}openDialog({type:'review',courseId:r.courseId,reviewId:r.id,ratings:{overall:r.overall,difficulty:r.difficulty,workload:r.workload,professor:r.professor},season:r.season||'Fall',year:r.year||String(new Date().getFullYear()),text:r.text,anon:!r.author})}
function openFacultyDialog(){openDialog({type:'faculty'})}
function openCourseDialog(){openDialog({type:'course',terms:[]})}
function openFeedbackDialog(opts){opts=opts||{};openDialog({type:'feedback',kind:opts.kind||'bug',subject:opts.subject||'',body:opts.body||''})}
