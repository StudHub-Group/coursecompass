/* ==========================================================================
   EmailJS (verification-email delivery)
   ========================================================================== */
// TODO: replace these three with the values from your EmailJS account —
// Email Services (Service ID), Templates (Template ID), Account → General
// (Public Key). The public key is safe to expose client-side; EmailJS is
// designed for that, unlike a Resend-style secret API key.
const EMAILJS_SERVICE_ID='service_rx1dk7c';
const EMAILJS_VERIFY_TEMPLATE_ID='template_uq4c1oe';
const EMAILJS_PUBLIC_KEY='mSV_pJ0gw0GY0guSf';

emailjs.init({
  publicKey:EMAILJS_PUBLIC_KEY,
  // Light built-in cooldown so a mis-click or a double-tapped "resend"
  // button can't fire two sends back to bac k.
  limitRate:{id:'verify-email',throttle:10000}
});

// Template must use these exact variable names: {{to_email}}, {{to_name}},
// {{verify_link}} — see the template-setup notes.
function sendVerificationEmail(toEmail,toName,verifyLink){
  return emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_VERIFY_TEMPLATE_ID,{
    to_email:toEmail,to_name:toName||nameFromEmail(toEmail),verify_link:verifyLink
  });
}
