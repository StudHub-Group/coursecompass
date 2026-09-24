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

// Guards against re-processing the same link when render() re-dispatches to
// bindVerify() after we call render() ourselves below to show the outcome.
let _verifyingKey=null;

async function bindVerify(){
  const {uid,token}=parseVerifyParams();
  const key=uid+':'+token;
  if(_verifyingKey===key) return;
  _verifyingKey=key;

  if(!uid||!token){state.verifyStatus='invalid';render();return}

  // The write below only succeeds if you're signed in as this exact account
  // (see the Firestore rule note) — clicking the link on a different device
  // needs you signed in there first.
  if(!auth.currentUser||auth.currentUser.uid!==uid){
    state.verifyStatus='need-signin';render();return;
  }

  state.verifyStatus='checking';render();
  try{
    const ref=db.collection('profiles').doc(uid);
    const snap=await ref.get();
    if(!snap.exists){state.verifyStatus='invalid';render();return}
    const profile=snap.data();

    if(profile.verified===true){
      // Already verified — e.g. the link was clicked twice. Just finish
      // signing them in rather than calling it invalid.
      state.verifyStatus='success';render();
      await afterAuthSuccess({showLangPrompt:true});
      return;
    }

    const hash=await sha256Hex(token);
    if(!profile.verificationHash||profile.verificationHash!==hash){
      state.verifyStatus='invalid';render();return;
    }

    await ref.update({verified:true,verificationHash:FieldValue.delete()});
    state.verifyStatus='success';render();
    await afterAuthSuccess({showLangPrompt:true});
  }catch(error){
    console.error(error);
    state.verifyStatus='invalid';render();
  }
}
