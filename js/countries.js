/* ==========================================================================
   Countries + official languages
   ========================================================================== */
const COUNTRIES=[
  {code:'US',name:'United States',languages:['English'],englishSpeaking:true},
  {code:'GB',name:'United Kingdom',languages:['English'],englishSpeaking:true},
  {code:'CA',name:'Canada',languages:['English','French'],englishSpeaking:true},
  {code:'AU',name:'Australia',languages:['English'],englishSpeaking:true},
  {code:'NZ',name:'New Zealand',languages:['English'],englishSpeaking:true},
  {code:'IE',name:'Ireland',languages:['English','Irish'],englishSpeaking:true},
  {code:'SG',name:'Singapore',languages:['English','Chinese','Malay','Tamil'],englishSpeaking:true},
  {code:'DE',name:'Germany',languages:['German'],englishSpeaking:false},
  {code:'AT',name:'Austria',languages:['German'],englishSpeaking:false},
  {code:'CH',name:'Switzerland',languages:['German','French','Italian','Romansh'],englishSpeaking:false},
  {code:'FR',name:'France',languages:['French'],englishSpeaking:false},
  {code:'BE',name:'Belgium',languages:['Dutch','French','German'],englishSpeaking:false},
  {code:'NL',name:'Netherlands',languages:['Dutch'],englishSpeaking:false},
  {code:'ES',name:'Spain',languages:['Spanish','Catalan','Basque','Galician'],englishSpeaking:false},
  {code:'IT',name:'Italy',languages:['Italian'],englishSpeaking:false},
  {code:'PT',name:'Portugal',languages:['Portuguese'],englishSpeaking:false},
  {code:'BR',name:'Brazil',languages:['Portuguese'],englishSpeaking:false},
  {code:'SE',name:'Sweden',languages:['Swedish'],englishSpeaking:false},
  {code:'NO',name:'Norway',languages:['Norwegian'],englishSpeaking:false},
  {code:'DK',name:'Denmark',languages:['Danish'],englishSpeaking:false},
  {code:'FI',name:'Finland',languages:['Finnish','Swedish'],englishSpeaking:false},
  {code:'CN',name:'China',languages:['Chinese'],englishSpeaking:false},
  {code:'HK',name:'Hong Kong SAR',languages:['Chinese','English'],englishSpeaking:false},
  {code:'JP',name:'Japan',languages:['Japanese'],englishSpeaking:false},
  {code:'KR',name:'South Korea',languages:['Korean'],englishSpeaking:false},
  {code:'IN',name:'India',languages:['Hindi','English'],englishSpeaking:false},
  {code:'ZA',name:'South Africa',languages:['English','Afrikaans','Zulu'],englishSpeaking:false},
  {code:'MX',name:'Mexico',languages:['Spanish'],englishSpeaking:false}
];
function countryByCode(c){return COUNTRIES.find(x=>x.code===c)||null}

const APP_META={version:'0.9.0',developerEmail:'studhub@proton.me',bugEmail:'studhub@proton.me',ideaEmail:'studhub@proton.me',lastUpdated:'September 2026',company:'Studhub'};
