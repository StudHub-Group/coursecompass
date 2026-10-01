/* ==========================================================================
   EmailJS (verification-email delivery)
   ========================================================================== */
// Values from your EmailJS account — Email Services (Service ID), Templates
// (Template ID), Account → General (Public Key). The public key is safe to
// expose client-side; EmailJS is designed for that, unlike a Resend-style
// secret API key.
const EMAILJS_SERVICE_ID='service_nmolbih';
const EMAILJS_VERIFY_TEMPLATE_ID='template_kr36z29';
// TODO: create a second EmailJS template for contact/feedback messages (see
// the setup notes) and paste its Template ID here.
const EMAILJS_CONTACT_TEMPLATE_ID='template_3uz1xys';
const EMAILJS_PUBLIC_KEY='mSV_pJ0gw0GY0guSf';

emailjs.init({
  publicKey:EMAILJS_PUBLIC_KEY,
  // Light built-in cooldown so a mis-click or a double-tapped "resend" /
  // "send" button can't fire two sends back to back.
  limitRate:{id:'studhub-email',throttle:10000}
});

// Template must use these exact variable names: {{to_email}}, {{to_name}},
// {{verify_link}} — see the template-setup notes.
function sendVerificationEmail(toEmail,toName,verifyLink){
  return emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_VERIFY_TEMPLATE_ID,{
    to_email:toEmail,to_name:toName||nameFromEmail(toEmail),verify_link:verifyLink
  });
}

// Template must use these exact variable names: {{to_email}}, {{from_name}},
// {{from_email}} (set the template's Reply To field to {{from_email}} so
// replies go straight to whoever wrote in), {{kind_label}}, {{subject}},
// {{message}}. from_email falls back to your own address when the visitor
// left theirs blank, so Reply To is never sent empty.
function sendContactEmail(opts){
  return emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_CONTACT_TEMPLATE_ID,{
    to_email:opts.toEmail,
    from_name:opts.fromName||'Someone on CourseCompass',
    from_email:opts.fromEmail||APP_META.developerEmail,
    kind_label:opts.kindLabel,
    subject:opts.subject,
    message:opts.body
  });
}
