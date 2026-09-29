/* ==========================================================================
   Guide (how to use the site)
   ========================================================================== */
// Placeholder walkthrough content — edit the title/body text below directly
// (not routed through i18n, since this is the part meant to be rewritten).
// `img` accepts either one filename ('2.png') or an array of filenames
// (['2.png','2b.png','2c.png']) for a swipeable gallery on that step. Files
// go in images/guide/, next to index.html. Leaving img null keeps the
// placeholder frame so the layout still looks right in the meantime.
const GUIDE_STEPS=[
  {title:'Creating your account',body:'Enter your full name and your university email address. Your email is automatically matched to your university where possible. Choose a password and make sure to remember it — there\u2019s currently no password recovery option.',img:'2.png'},
  {title:'Matching or adding your university',body:'Based on your email, you\u2019re automatically assigned to a university. If that\u2019s the wrong one, you can pick your actual university instead. If your university isn\u2019t listed yet, you can add it: select where it\u2019s located, then enter its name. If it\u2019s in a non-English-speaking country, you\u2019ll also need to provide the official name and its English equivalent. Enter the university\u2019s abbreviation, then select the languages classes are taught in \u2014 you\u2019ll see suggestions based on the country you chose \u2014 and the terms your university offers courses in.',img:['4.png','6.png']},
  {title:'Verifying your email',body:'After signing up, a verification email is sent to your address. Once you\u2019ve confirmed it, you\u2019re ready to sign in.',img:null},
  {title:'Choosing your interface language',body:'The first time you sign in, you can choose your interface language. You can always change it again later from the Settings tab.',img:null},
  {title:'Adding faculties and courses',body:'On the Courses tab, you can create a faculty by entering its name \u2014 a description is optional. Once a faculty exists, you can add a course to it: assign it to a faculty, then enter the course code, number of credits, title, professor, the term it\u2019s offered in, its level, and an optional short description. Once a course is created, people can start writing reviews for it.',img:null},
  {title:'Finding your courses',body:'Placeholder text \u2014 explain the course directory: browsing by faculty, searching, and the filter/sort controls.',img:null},
  {title:'Reading a course page',body:'Placeholder text \u2014 explain the overall rating and the difficulty / workload / professor scores, plus reading past reviews.',img:null},
  {title:'Writing a review',body:'Placeholder text \u2014 explain rating a course, writing the review, and the anonymous-by-default option.',img:null},
  {title:'Managing your profile and settings',body:'Placeholder text \u2014 explain editing your profile info (program, year, faculty), the anonymous-by-default and public-profile toggles, and editing or deleting your own reviews.',img:null}
];

const GUIDE_CHEVRON_LEFT='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const GUIDE_CHEVRON_RIGHT='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// Fixed-height frame (not a fixed aspect ratio) so screenshots of any size or
// shape sit centered without being cropped — object-contain, not
// object-cover. Same height used for the placeholder, a single image, and
// every slide of a carousel, so the page keeps a consistent rhythm no matter
// which state a given step is in.
function guideFrame(inner){
  return '<div class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">'+inner+'</div>';
}

function guidePlaceholderInner(){
  const imgIcon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-muted-foreground/60" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  return '<div class="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2"><span class="h-2.5 w-2.5 rounded-full bg-border"></span><span class="h-2.5 w-2.5 rounded-full bg-border"></span><span class="h-2.5 w-2.5 rounded-full bg-border"></span></div>'+
    '<div class="flex h-64 flex-col items-center justify-center gap-2 bg-muted/60 sm:h-80">'+imgIcon+'<p class="text-xs text-muted-foreground">'+t('guide.screenshot_placeholder')+'</p></div>';
}

function guideScreenshot(step,stepIndex){
  const imgs=Array.isArray(step.img)?step.img.filter(Boolean):(step.img?[step.img]:[]);

  if(!imgs.length) return guideFrame(guidePlaceholderInner());

  if(imgs.length===1){
    return guideFrame('<div class="flex h-64 items-center justify-center bg-muted/30 sm:h-80"><img src="images/guide/'+esc(imgs[0])+'" alt="'+esc(step.title)+'" class="max-h-full max-w-full object-contain"></div>');
  }

  // Multiple images: a swipeable gallery. Scroll-snap handles the actual
  // swipe gesture natively on touch, with no JS needed for that part — the
  // JS below only drives the desktop prev/next buttons and keeps the dot
  // indicators in sync with whatever's currently scrolled into view.
  const slides=imgs.map((src,i)=>'<div class="flex h-64 w-full shrink-0 snap-center items-center justify-center bg-muted/30 sm:h-80"><img src="images/guide/'+esc(src)+'" alt="'+esc(step.title)+' ('+(i+1)+'/'+imgs.length+')" class="max-h-full max-w-full object-contain"></div>').join('');
  const dots=imgs.map((_,i)=>'<button type="button" class="h-1.5 w-1.5 rounded-full '+(i===0?'bg-primary':'bg-border')+'" data-carousel-dot aria-label="'+t('guide.carousel_image_label',{n:i+1})+'"></button>').join('');

  return '<div class="relative" data-carousel="'+stepIndex+'">'+
    guideFrame('<div class="guide-carousel-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth" data-carousel-track>'+slides+'</div>')+
    '<button type="button" class="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm hover:bg-card" data-carousel-prev aria-label="'+t('guide.carousel_prev')+'">'+GUIDE_CHEVRON_LEFT+'</button>'+
    '<button type="button" class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm hover:bg-card" data-carousel-next aria-label="'+t('guide.carousel_next')+'">'+GUIDE_CHEVRON_RIGHT+'</button>'+
    '<div class="mt-2 flex justify-center gap-1.5" data-carousel-dots>'+dots+'</div>'+
  '</div>';
}

function guideStepHtml(step,i){
  const reversed=i%2===1; // alternate image side on wide screens; stacks image-then-text on mobile either way
  return '<div class="grid items-center gap-6 lg:grid-cols-2">'+
    '<div class="'+(reversed?'lg:order-2':'')+'">'+guideScreenshot(step,i)+'</div>'+
    '<div class="'+(reversed?'lg:order-1':'')+'">'+
      '<p class="font-mono text-xs text-muted-foreground">'+String(i+1).padStart(2,'0')+'</p>'+
      '<h3 class="mt-2 font-display text-2xl">'+esc(step.title)+'</h3>'+
      '<p class="mt-2 text-muted-foreground">'+esc(step.body)+'</p>'+
    '</div>'+
  '</div>';
}

function renderGuide(){
  return '<main class="mx-auto w-full max-w-4xl px-4 py-12">'+
    '<a href="#/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">'+ICONS.arrowLeft+' '+t('about.home')+'</a>'+
    '<section class="mt-6">'+
      '<p class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">'+ICONS.info+' '+t('guide.eyebrow')+'</p>'+
      '<h1 class="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">'+t('guide.title')+'</h1>'+
      '<p class="mt-4 max-w-2xl text-lg text-muted-foreground">'+t('guide.subhead')+'</p>'+
    '</section>'+
    '<section class="mt-14 space-y-14">'+GUIDE_STEPS.map(guideStepHtml).join('')+'</section>'+
    '<section class="mt-14 rounded-2xl border border-border bg-card p-6"><div class="flex flex-wrap items-center justify-between gap-4">'+
      '<div><h2 class="font-display text-xl">'+t('guide.help_heading')+'</h2><p class="mt-1 text-sm text-muted-foreground">'+t('guide.help_body')+'</p></div>'+
      '<a href="#/contact" class="btn btn-primary btn-sm">'+ICONS.mail+' '+t('guide.help_cta')+'</a>'+
    '</div></section>'+
  '</main>';
}

function bindGuide(){
  $$('[data-carousel]').forEach(carousel=>{
    const track=carousel.querySelector('[data-carousel-track]');
    const dots=Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const prev=carousel.querySelector('[data-carousel-prev]');
    const next=carousel.querySelector('[data-carousel-next]');
    if(!track) return;

    const setActiveDot=i=>{dots.forEach((dot,idx)=>{dot.className='h-1.5 w-1.5 rounded-full '+(idx===i?'bg-primary':'bg-border')})};
    const goTo=i=>{
      const clamped=Math.max(0,Math.min(dots.length-1,i));
      track.scrollTo({left:clamped*track.clientWidth,behavior:'smooth'});
      setActiveDot(clamped);
    };
    const current=()=>Math.round(track.scrollLeft/track.clientWidth);

    if(prev) prev.addEventListener('click',()=>goTo(current()-1));
    if(next) next.addEventListener('click',()=>goTo(current()+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>goTo(i)));
    // Keeps the dots in sync when someone swipes on a touch device instead
    // of using the buttons — native scroll-snap drives the movement, this
    // just watches where it landed.
    track.addEventListener('scroll',()=>setActiveDot(current()));
  });
}
