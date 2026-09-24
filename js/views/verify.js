/* ==========================================================================
   Email verification (EmailJS link click-through)
   ========================================================================== */
function parseVerifyParams(){
  const hash=location.hash||'';
  const qIndex=hash.indexOf('?');
  const qs=new URLSearchParams(qIndex>=0?hash.slice(qIndex+1):'');
  return {uid:qs.get('uid')||'',token:qs.get('token')||''};
}

function renderVerify(){
  const status=state.verifyStatus||'checking';
  const panels={
    checking:'<p class="text-sm text-muted-foreground">'+t('verify.checking')+'</p>',
    'need-signin':'<p class="text-sm text-muted-foreground">'+t('verify.need_signin')+'</p><a href="#/" class="btn btn-primary btn-sm mt-4">'+t('verify.go_signin')+'</a>',
    invalid:'<p class="text-sm text-muted-foreground">'+t('verify.invalid')+'</p><a href="#/" class="btn btn-primary btn-sm mt-4">'+t('verify.go_signin')+'</a>',
    success:'<p class="text-sm text-muted-foreground">'+t('verify.success')+'</p>'
  };
  return '<main class="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">'+
    '<h1 class="font-display text-2xl">'+t('verify.title')+'</h1>'+
    '<div class="mt-4">'+(panels[status]||panels.checking)+'</div></main>';
}

// Shared by bindVerify() (visiting the link directly, already signed in) and
// by afterAuthSuccess() (resuming a pending link right after a sign-in that
// was only reached because this same link sent them to sign in first).
// Returns 'success' | 'invalid' | 'error'. Requires being signed in as uid —
// that's what the Firestore rule checks — the caller is responsible for that.
async function attemptVerifyToken(uid,token){
  try{
    const ref=db.collection('profiles').doc(uid);
    const snap=await ref.get();
    if(!snap.exists) return 'invalid';
    const profile=snap.data();
    if(profile.verified===true) return 'success'; // already done — e.g. link clicked twice
    const hash=await sha256Hex(token);
    if(!profile.verificationHash||profile.verificationHash!==hash) return 'invalid';
    await ref.update({verified:true,verificationHash:FieldValue.delete()});
    return 'success';
  }catch(error){
    console.error(error);
    return 'error';
  }
}

// Guards against re-processing the same link when render() re-dispatches to
// bindVerify() after we call render() ourselves below to show the outcome.
// Scoped to the "actually doing the check" path only, so a need-signin
// screen followed by a real retry (after signing in, on a fresh page load)
// isn't silently swallowed by this guard.
let _verifyingKey=null;

async function bindVerify(){
  const {uid,token}=parseVerifyParams();
  if(!uid||!token){state.verifyStatus='invalid';render();return}

  if(!auth.currentUser||auth.currentUser.uid!==uid){
    // Remember this link so signing in picks up right where this left off —
    // afterAuthSuccess() checks state.pendingVerify once the sign-in
    // succeeds, instead of dead-ending here with no way forward.
    state.pendingVerify={uid,token};
    state.verifyStatus='need-signin';
    state.tab='signin';
    render();
    return;
  }

  const key=uid+':'+token;
  if(_verifyingKey===key) return;
  _verifyingKey=key;

  state.verifyStatus='checking';render();
  const outcome=await attemptVerifyToken(uid,token);
  if(outcome==='success'){
    state.verifyStatus='success';render();
    await afterAuthSuccess({showLangPrompt:true});
  }else{
    state.verifyStatus='invalid';render();
  }
}
