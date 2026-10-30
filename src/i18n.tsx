import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Lang, Localised } from './types';

const STRINGS: Record<string, Localised> = {
  'a11y.skip': { en: 'Skip to main content', hi: 'मुख्य सामग्री पर जाएँ' },

  'topbar.ministry': {
    en: 'Ministry of Road Transport and Highways · Government of India',
    hi: 'सड़क परिवहन और राजमार्ग मंत्रालय · भारत सरकार',
  },
  'topbar.demo': { en: 'Unofficial redesign concept — demo only', hi: 'अनौपचारिक पुनर्डिज़ाइन कॉन्सेप्ट — केवल डेमो' },

  'brand.sub': { en: 'Driving licence services', hi: 'ड्राइविंग लाइसेंस सेवाएँ' },
  'nav.services': { en: 'Services', hi: 'सेवाएँ' },
  'nav.track': { en: 'Track application', hi: 'आवेदन की स्थिति' },
  'nav.appointments': { en: 'Appointments', hi: 'अपॉइंटमेंट' },
  'nav.help': { en: 'Help', hi: 'सहायता' },
  'nav.resume': { en: 'Resume application', hi: 'आवेदन फिर खोलें' },
  'nav.menu': { en: 'Menu', hi: 'मेन्यू' },
  'nav.language': { en: 'Language', hi: 'भाषा' },
  'header.delhi': { en: 'Delhi · demo data', hi: 'दिल्ली · डेमो डेटा' },
  'header.delhiTitle': {
    en: 'This prototype is seeded with Delhi RTO centres. Choosing a state is not a gate.',
    hi: 'इस प्रोटोटाइप में दिल्ली के RTO केंद्र हैं। राज्य चुनना कोई बाधा नहीं है।',
  },

  'home.eyebrow': { en: 'Delhi · demo data', hi: 'दिल्ली · डेमो डेटा' },
  'home.h1': { en: 'Licence services, without the runaround.', hi: 'लाइसेंस सेवाएँ, बिना भागदौड़।' },
  'home.lede': {
    en: 'Apply, pay and book your test in one guided flow. Everything saves as you go, so you can pick up where you left off on any device.',
    hi: 'एक ही निर्देशित प्रक्रिया में आवेदन करें, शुल्क भरें और टेस्ट बुक करें। सब कुछ अपने आप सहेजा जाता है, इसलिए आप किसी भी डिवाइस पर वहीं से शुरू कर सकते हैं।',
  },
  'home.searchLabel': { en: 'Search services', hi: 'सेवाएँ खोजें' },
  'home.searchPlaceholder': {
    en: "Search services — try 'renew', 'slot' or 'duplicate'",
    hi: "सेवा खोजें — जैसे 'नवीनीकरण', 'स्लॉट' या 'डुप्लिकेट'",
  },
  'home.searchButton': { en: 'Search', hi: 'खोजें' },
  'home.quick.learner': { en: 'Learner licence', hi: 'लर्नर लाइसेंस' },
  'home.quick.renew': { en: 'Renew licence', hi: 'लाइसेंस नवीनीकरण' },
  'home.quick.duplicate': { en: 'Duplicate licence', hi: 'डुप्लिकेट लाइसेंस' },
  'home.quick.track': { en: 'Track application', hi: 'आवेदन ट्रैक करें' },
  'home.track.title': { en: 'Track an application', hi: 'आवेदन की स्थिति देखें' },
  'home.track.desc': {
    en: 'Enter your reference number to see the live timeline.',
    hi: 'लाइव टाइमलाइन देखने के लिए अपना संदर्भ नंबर दर्ज करें।',
  },
  'home.track.label': { en: 'Reference number', hi: 'संदर्भ संख्या' },
  'home.track.button': { en: 'Track', hi: 'देखें' },
  'home.track.example': { en: 'It looks like DL-2026-AB12CD.', hi: 'यह DL-2026-AB12CD जैसा दिखता है।' },
  'home.trust': {
    en: 'No account needed · Autosaves as you type · Works on mobile',
    hi: 'खाते की ज़रूरत नहीं · टाइप करते ही सेव होता है · मोबाइल पर काम करता है',
  },
  'home.recent.title': { en: 'Continue where you left off', hi: 'जहाँ छोड़ा था वहीं से जारी रखें' },
  'home.recent.continue': { en: 'Continue application', hi: 'आवेदन जारी रखें' },
  'home.recent.saved': { en: 'Last saved {time}', hi: 'अंतिम बार {time} पर सहेजा' },
  'home.recent.track': { en: 'Track instead', hi: 'इसके बजाय ट्रैक करें' },
  'home.recent.forget': { en: 'Remove from list', hi: 'सूची से हटाएँ' },
  'home.popular.title': { en: 'Popular right now', hi: 'अभी लोकप्रिय' },
  'home.popular.desc': { en: 'The services people start most often.', hi: 'सबसे अधिक शुरू की जाने वाली सेवाएँ।' },
  'home.all.title': { en: 'All services', hi: 'सभी सेवाएँ' },
  'home.all.desc': { en: 'Search by what you need, not by department.', hi: 'विभाग से नहीं, अपनी ज़रूरत से खोजें।' },
  'home.all.count': { en: '{count} services', hi: '{count} सेवाएँ' },
  'home.all.countOne': { en: '1 service', hi: '1 सेवा' },
  'home.all.empty': {
    en: 'No services match “{query}”. Try “licence”, “slot” or “documents”.',
    hi: '“{query}” से कोई सेवा नहीं मिली। “लाइसेंस”, “स्लॉट” या “दस्तावेज़” आज़माएँ।',
  },
  'home.all.clear': { en: 'Clear filters', hi: 'फ़िल्टर हटाएँ' },
  'home.all.filterLabel': { en: 'Filter by category', hi: 'श्रेणी से फ़िल्टर करें' },
  'home.how.title': {
    en: 'Designed around the citizen, not the form',
    hi: 'नागरिक को केंद्र में रखकर बनाया गया, फ़ॉर्म को नहीं',
  },
  'home.how.desc': { en: 'Four things the old portal made hard.', hi: 'चार चीज़ें जो पुराने पोर्टल में मुश्किल थीं।' },
  'home.how.1.title': { en: 'Find it by name', hi: 'नाम से खोजें' },
  'home.how.1.desc': {
    en: 'Search plain-language service names and see fees, documents and time up front.',
    hi: 'आसान नामों से खोजें और शुल्क, दस्तावेज़ व समय पहले ही देखें।',
  },
  'home.how.2.title': { en: 'Know before you start', hi: 'शुरू करने से पहले जानें' },
  'home.how.2.desc': {
    en: 'Eligibility, checklists and required documents are shown before the first field.',
    hi: 'पहला फ़ील्ड भरने से पहले पात्रता, चेकलिस्ट और ज़रूरी दस्तावेज़ दिखते हैं।',
  },
  'home.how.3.title': { en: 'Leave and come back', hi: 'बीच में रुकें और लौटें' },
  'home.how.3.desc': {
    en: 'Every change is saved to a draft. Resume with your reference and an OTP.',
    hi: 'हर बदलाव ड्राफ़्ट में सहेजा जाता है। संदर्भ नंबर और OTP से फिर खोलें।',
  },
  'home.how.4.title': { en: 'See the finish line', hi: 'मंज़िल सामने देखें' },
  'home.how.4.desc': {
    en: 'A live timeline shows payment, slot and test. No separate status page to remember.',
    hi: 'लाइव टाइमलाइन भुगतान, स्लॉट और टेस्ट दिखाती है। अलग स्टेटस पेज याद रखने की ज़रूरत नहीं।',
  },
  'home.help.title': { en: 'Need a hand?', hi: 'मदद चाहिए?' },
  'home.help.desc': { en: 'This is a demo, but the support paths are real.', hi: 'यह डेमो है, लेकिन सहायता के रास्ते असली हैं।' },
  'home.help.a11y.title': { en: 'Accessibility', hi: 'सुगम्यता' },
  'home.help.a11y.desc': { en: 'Keyboard, zoom, contrast and language settings.', hi: 'कीबोर्ड, ज़ूम, कंट्रास्ट और भाषा सेटिंग्स।' },
  'home.help.faq.title': { en: 'Questions', hi: 'सवाल' },
  'home.help.faq.desc': { en: 'Documents, fees, timelines and common errors.', hi: 'दस्तावेज़, शुल्क, समय और आम गलतियाँ।' },
  'home.help.official.title': { en: 'Official portal', hi: 'आधिकारिक पोर्टल' },
  'home.help.official.desc': { en: 'For real applications, go to parivahan.gov.in.', hi: 'असली आवेदन के लिए parivahan.gov.in पर जाएँ।' },

  'common.home': { en: 'Home', hi: 'होम' },
  'common.loading': { en: 'Loading…', hi: 'लोड हो रहा है…' },
  'common.tryAgain': { en: 'Try again', hi: 'फिर कोशिश करें' },
  'common.required': { en: 'Required', hi: 'आवश्यक' },
  'common.optional': { en: 'Optional', hi: 'वैकल्पिक' },
  'common.online': { en: 'Online', hi: 'ऑनलाइन' },
  'common.minutes': { en: '{n} min', hi: '{n} मिनट' },
  'common.duration': { en: 'Time', hi: 'समय' },
  'common.free': { en: 'Free', hi: 'मुफ़्त' },
  'common.step': { en: 'Step {n} of {total}', hi: 'चरण {n}/{total}' },
  'common.back': { en: 'Back', hi: 'पीछे' },
  'common.next': { en: 'Continue', hi: 'आगे बढ़ें' },
  'common.edit': { en: 'Edit', hi: 'बदलें' },
  'common.remove': { en: 'Remove', hi: 'हटाएँ' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'common.copy': { en: 'Copy', hi: 'कॉपी' },
  'common.copied': { en: 'Copied', hi: 'कॉपी हुआ' },
  'common.print': { en: 'Print', hi: 'प्रिंट करें' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.all': { en: 'All', hi: 'सभी' },
  'common.fee': { en: 'Fee', hi: 'शुल्क' },
  'common.viewService': { en: 'View service', hi: 'सेवा देखें' },
  'common.guideOnly': { en: 'Guide only', hi: 'केवल गाइड' },
  'common.fullFlow': { en: 'Full demo flow', hi: 'पूरा डेमो प्रवाह' },
  'common.demo': { en: 'Demo', hi: 'डेमो' },
  'common.autoSaved': { en: 'Saved {time}', hi: '{time} पर सहेजा' },
  'common.saving': { en: 'Saving…', hi: 'सहेजा जा रहा है…' },
  'common.readMore': { en: 'Read more', hi: 'और पढ़ें' },
  'common.useDemoData': { en: 'Demo data only', hi: 'केवल डेमो डेटा' },
  'common.notFound': { en: 'Page not found', hi: 'पेज नहीं मिला' },
  'common.notFoundDesc': {
    en: 'That link does not exist in this demo. The service catalogue is a good place to restart.',
    hi: 'यह लिंक इस डेमो में नहीं है। सेवा सूची से फिर शुरू करें।',
  },
  'common.backHome': { en: 'Back to home', hi: 'होम पर जाएँ' },

  'service.breadcrumbAll': { en: 'All services', hi: 'सभी सेवाएँ' },
  'service.online': { en: 'Apply online', hi: 'ऑनलाइन आवेदन' },
  'service.guideOnly': { en: 'Guide only in this demo', hi: 'इस डेमो में केवल गाइड' },
  'service.start': { en: 'Start application', hi: 'आवेदन शुरू करें' },
  'service.startDemo': { en: 'Start the learner licence demo', hi: 'लर्नर लाइसेंस डेमो शुरू करें' },
  'service.resume': { en: 'Resume a saved application', hi: 'सहेजा आवेदन फिर खोलें' },
  'service.track': { en: 'Track my application', hi: 'मेरा आवेदन ट्रैक करें' },
  'service.eligibility': { en: 'Who can apply', hi: 'कौन आवेदन कर सकता है' },
  'service.documents': { en: 'What you need', hi: 'आपको क्या चाहिए' },
  'service.steps': { en: 'How it works', hi: 'यह कैसे होता है' },
  'service.fees': { en: 'Fees', hi: 'शुल्क' },
  'service.about': { en: 'About this service', hi: 'इस सेवा के बारे में' },
  'service.required': { en: 'Required', hi: 'आवश्यक' },
  'service.optional': { en: 'Optional', hi: 'वैकल्पिक' },
  'service.sidebarTitle': { en: 'At a glance', hi: 'एक नज़र में' },
  'service.sidebarNote': {
    en: 'Fees are indicative. Final amounts come from your state transport department.',
    hi: 'शुल्क सांकेतिक हैं। अंतिम राशि आपके राज्य परिवहन विभाग से तय होती है।',
  },
  'service.noAccount': { en: 'No account needed', hi: 'खाते की ज़रूरत नहीं' },
  'service.autosave': { en: 'Autosaves as you go', hi: 'अपने आप सहेजा जाता है' },
  'service.guideNote': {
    en: 'This demo wires the learner licence journey end to end. Other services show the guide, documents and fees that the same engine would use.',
    hi: 'यह डेमो लर्नर लाइसेंस यात्रा को पूरी तरह जोड़ता है। अन्य सेवाएँ वही गाइड, दस्तावेज़ और शुल्क दिखाती हैं जो यही इंजन इस्तेमाल करेगा।',
  },
  'service.related': { en: 'Related services', hi: 'संबंधित सेवाएँ' },
  'service.helpTitle': { en: 'Not sure this is the right service?', hi: 'क्या यह सही सेवा है?' },
  'service.helpText': {
    en: 'The help page explains the difference between learner and permanent licences, and what to do if your details have changed.',
    hi: 'सहायता पेज लर्नर और स्थायी लाइसेंस के अंतर और विवरण बदलने पर क्या करें, यह बताता है।',
  },
  'service.helpLink': { en: 'Read the help page', hi: 'सहायता पेज पढ़ें' },
  'service.loading': { en: 'Loading service…', hi: 'सेवा लोड हो रही है…' },
  'service.notFound': { en: 'We could not find that service.', hi: 'वह सेवा नहीं मिली।' },
  'service.time': { en: 'About {n} minutes', hi: 'लगभग {n} मिनट' },
  'service.feeFrom': { en: '{amount}', hi: '{amount}' },

  'wizard.step1': { en: 'Eligibility', hi: 'पात्रता' },
  'wizard.step2': { en: 'Your details', hi: 'आपका विवरण' },
  'wizard.step3': { en: 'Documents', hi: 'दस्तावेज़' },
  'wizard.step4': { en: 'Review', hi: 'समीक्षा' },
  'wizard.step5': { en: 'Payment', hi: 'भुगतान' },
  'wizard.step6': { en: 'Test slot', hi: 'टेस्ट स्लॉट' },
  'wizard.step7': { en: 'Done', hi: 'पूर्ण' },
  'wizard.stepProgress': { en: 'Step {n} of {total}', hi: 'चरण {n}/{total}' },
  'wizard.back': { en: 'Back', hi: 'पीछे' },
  'wizard.continue': { en: 'Continue', hi: 'आगे बढ़ें' },
  'wizard.saveExit': { en: 'Save and exit', hi: 'सहेजें और बाहर जाएँ' },
  'wizard.saving': { en: 'Saving…', hi: 'सहेजा जा रहा है…' },
  'wizard.savedAt': { en: 'Saved {time}', hi: '{time} पर सहेजा' },
  'wizard.saveError': { en: 'Changes are not saved yet. Check your connection.', hi: 'बदलाव अभी सहेजे नहीं गए। कनेक्शन जाँचें।' },
  'wizard.conflictTitle': { en: 'This application was updated elsewhere.', hi: 'यह आवेदन कहीं और अपडेट हुआ।' },
  'wizard.conflictBody': { en: 'Reload the latest version before editing again.', hi: 'दोबारा बदलाव से पहले नया संस्करण लोड करें।' },
  'wizard.reload': { en: 'Reload latest', hi: 'नया संस्करण लोड करें' },
  'wizard.errorsTitle': { en: 'Please check these fields', hi: 'कृपया ये फ़ील्ड जाँचें' },
  'wizard.errorsCount': { en: '{n} fields need attention.', hi: '{n} फ़ील्ड ठीक करनी हैं।' },
  'wizard.errorsCountOne': { en: '1 field needs attention.', hi: '1 फ़ील्ड ठीक करनी है।' },
  'wizard.submitting': { en: 'Submitting…', hi: 'जमा हो रहा है…' },
  'wizard.loading': { en: 'Opening your application…', hi: 'आपका आवेदन खुल रहा है…' },
  'wizard.notFound': { en: 'We could not find that application.', hi: 'वह आवेदन नहीं मिला।' },
  'wizard.demoNote': {
    en: 'Demo flow — sample data only. Autosaves to the local server.',
    hi: 'डेमो प्रक्रिया — केवल नमूना डेटा। स्थानीय सर्वर पर अपने आप सहेजा जाता है।',
  },
  'wizard.reference': { en: 'Reference', hi: 'संदर्भ' },
  'wizard.locked': {
    en: 'This application is submitted. Continue with payment or the next step.',
    hi: 'यह आवेदन जमा हो चुका है। भुगतान या अगले चरण के साथ जारी रखें।',
  },
  'wizard.backToStatus': { en: 'Back to status', hi: 'स्थिति पर वापस जाएँ' },
  'wizard.missingDocs': { en: '{n} documents still needed', hi: '{n} दस्तावेज़ अभी बाकी' },
  'wizard.demoCard': { en: 'Use demo card', hi: 'डेमो कार्ड भरें' },

  'step1.title': { en: 'Check you are eligible', hi: 'पात्रता जाँचें' },
  'step1.desc': {
    en: 'This takes a moment. We will only ask for details that apply to you.',
    hi: 'इसमें थोड़ा समय लगेगा। हम केवल वही जानकारी माँगेंगे जो आप पर लागू हो।',
  },
  'step1.category': { en: 'Applicant category', hi: 'आवेदक श्रेणी' },
  'step1.categoryHint': {
    en: 'Most applicants choose General. This affects the documents you need.',
    hi: 'ज़्यादातर लोग सामान्य चुनते हैं। इससे ज़रूरी दस्तावेज़ बदलते हैं।',
  },
  'step1.history': { en: 'Licence history', hi: 'लाइसेंस इतिहास' },
  'step1.classes': { en: 'Which vehicle class do you want?', hi: 'आप कौन-सा वाहन वर्ग चाहते हैं?' },
  'step1.classesHint': {
    en: 'Pick one or more. You must be 18 for a car or geared motorcycle, 16 for a gearless scooter.',
    hi: 'एक या अधिक चुनें। कार या गियर वाली मोटरसाइकिल के लिए 18 वर्ष, गियरलेस स्कूटर के लिए 16 वर्ष आवश्यक।',
  },
  'step1.note': {
    en: 'This demo uses the Delhi process. Fees and document rules vary by state.',
    hi: 'यह डेमो दिल्ली की प्रक्रिया दिखाता है। शुल्क और दस्तावेज़ नियम राज्य के अनुसार बदलते हैं।',
  },
  'step1.eligibility': { en: 'Who can apply', hi: 'कौन आवेदन कर सकता है' },

  'step2.title': { en: 'Tell us about you', hi: 'अपने बारे में बताएँ' },
  'step2.desc': {
    en: 'This is demo data only. Please use made-up details, not your real Aadhaar or address.',
    hi: 'यह केवल डेमो डेटा है। कृपया काल्पनिक विवरण भरें, अपना असली आधार या पता नहीं।',
  },
  'step2.fullName': { en: 'Full name', hi: 'पूरा नाम' },
  'step2.fullNameHint': { en: 'As you want it printed on the licence.', hi: 'जैसा लाइसेंस पर छपा चाहिए।' },
  'step2.dob': { en: 'Date of birth', hi: 'जन्म तिथि' },
  'step2.gender': { en: 'Gender', hi: 'लिंग' },
  'step2.genderSelect': { en: 'Select gender', hi: 'लिंग चुनें' },
  'step2.mobile': { en: 'Mobile number', hi: 'मोबाइल नंबर' },
  'step2.mobileHint': {
    en: 'Used for OTP and status updates. Use a sample 10-digit number starting with 6–9.',
    hi: 'OTP और स्थिति अपडेट के लिए। 6–9 से शुरू होने वाला नमूना 10 अंकों का नंबर दें।',
  },
  'step2.email': { en: 'Email (optional)', hi: 'ईमेल (वैकल्पिक)' },
  'step2.address': { en: 'Address', hi: 'पता' },
  'step2.addressHint': { en: 'House, street and area.', hi: 'मकान, गली और इलाक़ा।' },
  'step2.city': { en: 'City or district', hi: 'शहर या ज़िला' },
  'step2.state': { en: 'State', hi: 'राज्य' },
  'step2.pincode': { en: 'PIN code', hi: 'पिन कोड' },
  'step2.privacy': {
    en: 'These details stay in your local demo database and are never sent to a government system.',
    hi: 'यह जानकारी आपके स्थानीय डेमो डेटाबेस में रहती है और कभी सरकारी सिस्टम को नहीं भेजी जाती।',
  },
  'gender.female': { en: 'Female', hi: 'महिला' },
  'gender.male': { en: 'Male', hi: 'पुरुष' },
  'gender.other': { en: 'Other / prefer not to say', hi: 'अन्य / नहीं बताना' },
  'history.none': { en: 'I do not hold any driving or learner licence in India', hi: 'भारत में मेरे पास कोई ड्राइविंग या लर्नर लाइसेंस नहीं है' },
  'history.noneDesc': { en: 'Most first-time applicants choose this.', hi: 'ज़्यादातर नए आवेदक यह चुनते हैं।' },
  'history.dl': { en: 'I hold a driving licence', hi: 'मेरे पास ड्राइविंग लाइसेंस है' },
  'history.dlDesc': { en: 'You will add a learner licence for a new vehicle class.', hi: 'आप नए वाहन वर्ग के लिए लर्नर लाइसेंस जोड़ेंगे।' },
  'history.ll': { en: 'I hold a learner licence', hi: 'मेरे पास लर्नर लाइसेंस है' },
  'history.llDesc': { en: 'Use renewal or duplicate services if you need a change.', hi: 'बदलाव चाहिए तो नवीनीकरण या डुप्लिकेट सेवा इस्तेमाल करें।' },
  'cat.general': { en: 'General', hi: 'सामान्य' },
  'cat.diplomat': { en: 'Diplomat (foreigner)', hi: 'राजनयिक (विदेशी)' },
  'cat.foreigner': { en: 'Foreigner (not diplomat)', hi: 'विदेशी (राजनयिक नहीं)' },
  'cat.oci': { en: 'OCI card holder', hi: 'OCI कार्ड धारक' },
  'cat.divyang': { en: 'Divyang (differently abled)', hi: 'दिव्यांग' },
  'cat.repatriate': { en: 'Repatriate', hi: 'प्रत्यावर्तित' },
  'cat.refugee': { en: 'Refugee', hi: 'शरणार्थी' },
  'cat.exServicemen': { en: 'Ex-servicemen', hi: 'भूतपूर्व सैनिक' },
  'class.LMV': { en: 'Car (LMV)', hi: 'कार (LMV)' },
  'class.LMVDesc': { en: 'Light motor vehicle — car, jeep or van.', hi: 'हल्का मोटर वाहन — कार, जीप या वैन।' },
  'class.MCWG': { en: 'Motorcycle with gear (MCWG)', hi: 'गियर वाली मोटरसाइकिल (MCWG)' },
  'class.MCWGDesc': { en: 'Any motorcycle with a manual gearbox.', hi: 'मैनुअल गियरबॉक्स वाली मोटरसाइकिल।' },
  'class.MCWOG': { en: 'Scooter without gear (MCWOG)', hi: 'बिना गियर स्कूटर (MCWOG)' },
  'class.MCWOGDesc': { en: 'Gearless two-wheeler up to 50cc; available from age 16.', hi: '50cc तक की गियरलेस दोपहिया; 16 वर्ष से उपलब्ध।' },

  'step3.title': { en: 'Add your documents', hi: 'अपने दस्तावेज़ जोड़ें' },
  'step3.desc': {
    en: 'Upload a sample file for each item. Images and PDFs are checked on the server before they are accepted.',
    hi: 'हर मद के लिए नमूना फ़ाइल अपलोड करें। स्वीकार करने से पहले सर्वर पर इमेज और PDF जाँचे जाते हैं।',
  },
  'step3.upload': { en: 'Choose file', hi: 'फ़ाइल चुनें' },
  'step3.replace': { en: 'Replace file', hi: 'फ़ाइल बदलें' },
  'step3.uploaded': { en: 'Uploaded', hi: 'अपलोड हुआ' },
  'step3.uploading': { en: 'Uploading…', hi: 'अपलोड हो रहा है…' },
  'step3.view': { en: 'View', hi: 'देखें' },
  'step3.privacy': {
    en: 'Demo uploads are stored on this computer only. Use a blank or sample image, not real ID.',
    hi: 'डेमो अपलोड केवल इस कंप्यूटर पर रहते हैं। असली ID नहीं, खाली या नमूना इमेज इस्तेमाल करें।',
  },
  'step3.accepted': { en: 'JPG, PNG or PDF', hi: 'JPG, PNG या PDF' },
  'step3.acceptedPhoto': { en: 'JPG or PNG', hi: 'JPG या PNG' },
  'step3.maxSize': { en: 'Max {size}', hi: 'अधिकतम {size}' },

  'step4.title': { en: 'Review and submit', hi: 'समीक्षा करें और जमा करें' },
  'step4.desc': {
    en: 'Check everything once. You can edit any section before submitting.',
    hi: 'एक बार सब जाँच लें। जमा करने से पहले किसी भी भाग में बदलाव कर सकते हैं।',
  },
  'step4.eligibility': { en: 'Eligibility', hi: 'पात्रता' },
  'step4.personal': { en: 'Personal details', hi: 'व्यक्तिगत विवरण' },
  'step4.address': { en: 'Address', hi: 'पता' },
  'step4.documents': { en: 'Documents', hi: 'दस्तावेज़' },
  'step4.declaration': { en: 'Declaration', hi: 'घोषणा' },
  'step4.declarationText': {
    en: 'I declare that the information and documents in this demo are sample data, and I understand this is not a government application.',
    hi: 'मैं घोषित करता/करती हूँ कि इस डेमो में दी गई जानकारी और दस्तावेज़ नमूना डेटा हैं, और मैं समझता/समझती हूँ कि यह सरकारी आवेदन नहीं है।',
  },
  'step4.submit': { en: 'Submit application', hi: 'आवेदन जमा करें' },
  'step4.note': {
    en: 'You can still edit until you submit. After that, changes go through the resume flow.',
    hi: 'जमा करने तक आप बदलाव कर सकते हैं। उसके बाद बदलाव रीज़्यूम प्रक्रिया से होंगे।',
  },

  'step5.title': { en: 'Pay the fee', hi: 'शुल्क भरें' },
  'step5.desc': {
    en: 'The amount is calculated by the server from the service you chose. Retries cannot charge you twice.',
    hi: 'राशि सर्वर द्वारा आपकी चुनी सेवा से तय होती है। दोबारा कोशिश पर दुगुना शुल्क नहीं लगता।',
  },
  'pay.amount': { en: 'Amount due', hi: 'देय राशि' },
  'pay.total': { en: 'Total', hi: 'कुल' },
  'pay.cardName': { en: 'Name on card', hi: 'कार्ड पर नाम' },
  'pay.cardNumber': { en: 'Card number', hi: 'कार्ड नंबर' },
  'pay.expiry': { en: 'Expiry (MM/YY)', hi: 'समाप्ति (MM/YY)' },
  'pay.cvv': { en: 'CVV', hi: 'CVV' },
  'pay.useDemo': { en: 'Fill demo card', hi: 'डेमो कार्ड भरें' },
  'pay.forceFailure': { en: 'Simulate a declined payment (testing)', hi: 'भुगतान अस्वीकृति का परीक्षण करें' },
  'pay.pay': { en: 'Pay {amount}', hi: '{amount} का भुगतान करें' },
  'pay.processing': { en: 'Processing payment…', hi: 'भुगतान हो रहा है…' },
  'pay.gatewayNote': {
    en: 'Mock gateway — no real money moves. Use the demo card.',
    hi: 'मॉक गेटवे — असली पैसा नहीं जाता। डेमो कार्ड इस्तेमाल करें।',
  },
  'pay.declined': {
    en: 'The gateway declined this payment. Your application is safe. Try again with a different card.',
    hi: 'गेटवे ने भुगतान अस्वीकार किया। आपका आवेदन सुरक्षित है। दूसरे कार्ड से फिर कोशिश करें।',
  },
  'pay.retry': { en: 'Try again', hi: 'फिर कोशिश करें' },
  'pay.receipt': { en: 'Receipt', hi: 'रसीद' },
  'pay.card': { en: 'Card', hi: 'कार्ड' },
  'pay.secureNote': { en: 'We only keep the last four digits of the card.', hi: 'हम कार्ड के केवल अंतिम चार अंक रखते हैं।' },
  'pay.method': { en: 'Card payment', hi: 'कार्ड भुगतान' },

  'step6.title': { en: 'Book your learner test', hi: 'अपना लर्नर टेस्ट बुक करें' },
  'step6.desc': {
    en: 'Choose a centre and a time. Seats are live; the server checks availability again when you confirm.',
    hi: 'केंद्र और समय चुनें। सीटें लाइव हैं; पुष्टि के समय सर्वर फिर उपलब्धता जाँचता है।',
  },
  'slot.centre': { en: 'Test centre', hi: 'टेस्ट केंद्र' },
  'slot.selectCentre': { en: 'Choose a centre', hi: 'केंद्र चुनें' },
  'slot.date': { en: 'Date', hi: 'तारीख़' },
  'slot.time': { en: 'Time', hi: 'समय' },
  'slot.seats': { en: '{n} seats left', hi: '{n} सीटें बचीं' },
  'slot.full': { en: 'Full', hi: 'भर गया' },
  'slot.confirm': { en: 'Confirm this slot', hi: 'यह स्लॉट पक्का करें' },
  'slot.choose': { en: 'Choose a time above', hi: 'ऊपर समय चुनें' },
  'slot.skip': { en: 'Skip for now', hi: 'अभी छोड़ें' },
  'slot.loading': { en: 'Loading live availability…', hi: 'लाइव उपलब्धता लोड हो रही है…' },
  'slot.error': { en: 'Could not load slots. Try again.', hi: 'स्लॉट लोड नहीं हुए। फिर कोशिश करें।' },
  'slot.noSlots': {
    en: 'No slots available in the next ten days. Please check back tomorrow.',
    hi: 'अगले दस दिनों में कोई स्लॉट नहीं है। कल फिर देखें।',
  },
  'slot.demoNote': { en: 'Demo availability — five centres, ten days.', hi: 'डेमो उपलब्धता — पाँच केंद्र, दस दिन।' },
  'slot.bookedTitle': { en: 'Your test slot', hi: 'आपका टेस्ट स्लॉट' },
  'slot.booking': { en: 'Booking…', hi: 'बुक हो रहा है…' },
  'slot.change': { en: 'Change slot', hi: 'स्लॉट बदलें' },

  'step7.title': { en: 'You are all set', hi: 'सब तैयार है' },
  'step7.desc': {
    en: 'Save your reference number and bring the originals on test day.',
    hi: 'अपना संदर्भ नंबर सहेजें और टेस्ट के दिन मूल दस्तावेज़ लाएँ।',
  },
  'done.title': { en: 'Application submitted', hi: 'आवेदन जमा हुआ' },
  'done.desc': {
    en: 'Track everything from one page — payment, slot and what to bring.',
    hi: 'सब कुछ एक ही पेज से ट्रैक करें — भुगतान, स्लॉट और क्या लाना है।',
  },
  'done.reference': { en: 'Reference number', hi: 'संदर्भ संख्या' },
  'done.next': { en: 'What happens next', hi: 'आगे क्या होगा' },
  'done.next1': { en: 'Keep your payment receipt ready for test day.', hi: 'टेस्ट के दिन भुगतान रसीद तैयार रखें।' },
  'done.next2': { en: 'Reach the centre 30 minutes early with the original documents.', hi: 'मूल दस्तावेज़ों के साथ केंद्र 30 मिनट पहले पहुँचें।' },
  'done.next3': { en: 'Track the status any time using your reference number.', hi: 'संदर्भ संख्या से कभी भी स्थिति देखें।' },
  'done.status': { en: 'Open status page', hi: 'स्थिति पेज खोलें' },
  'done.print': { en: 'Print acknowledgement', hi: 'पावती प्रिंट करें' },
  'done.newApp': { en: 'Start another application', hi: 'दूसरा आवेदन शुरू करें' },
  'done.bookSlot': { en: 'Book your test slot', hi: 'अपना टेस्ट स्लॉट बुक करें' },

  'status.title': { en: 'Track your application', hi: 'अपने आवेदन की स्थिति देखें' },
  'status.desc': { en: 'One live view of details, payment, slot and test.', hi: 'विवरण, भुगतान, स्लॉट और टेस्ट का एक लाइव दृश्य।' },
  'status.reference': { en: 'Reference number', hi: 'संदर्भ संख्या' },
  'status.check': { en: 'Show status', hi: 'स्थिति दिखाएँ' },
  'status.notFound': { en: 'No application matches that reference number.', hi: 'उस संदर्भ संख्या से कोई आवेदन नहीं मिला।' },
  'status.loading': { en: 'Loading application…', hi: 'आवेदन लोड हो रहा है…' },
  'status.applicant': { en: 'Applicant', hi: 'आवेदक' },
  'status.service': { en: 'Service', hi: 'सेवा' },
  'status.lastUpdated': { en: 'Last updated {time}', hi: 'अंतिम अपडेट {time}' },
  'status.maskedNote': {
    en: 'For privacy, the mobile number is partially hidden. Resume with OTP for full access.',
    hi: 'गोपनीयता के लिए मोबाइल नंबर आंशिक रूप से छिपा है। पूरी पहुँच के लिए OTP से खोलें।',
  },
  'status.timeline': { en: 'Timeline', hi: 'टाइमलाइन' },
  'status.payment': { en: 'Payment', hi: 'भुगतान' },
  'status.booking': { en: 'Test slot', hi: 'टेस्ट स्लॉट' },
  'status.documents': { en: 'Documents', hi: 'दस्तावेज़' },
  'status.noPayment': { en: 'No payment yet.', hi: 'अभी कोई भुगतान नहीं।' },
  'status.noBooking': { en: 'No slot booked yet.', hi: 'अभी कोई स्लॉट बुक नहीं हुआ।' },
  'status.paid': { en: 'Paid', hi: 'भुगतान हुआ' },
  'status.failed': { en: 'Declined', hi: 'अस्वीकृत' },
  'status.receipt': { en: 'Receipt', hi: 'रसीद' },
  'status.continue': { en: 'Continue application', hi: 'आवेदन जारी रखें' },
  'status.bookSlot': { en: 'Book a test slot', hi: 'टेस्ट स्लॉट बुक करें' },
  'status.resume': { en: 'Resume with OTP', hi: 'OTP से खोलें' },
  'status.statusLabel': { en: 'Status', hi: 'स्थिति' },
  'status.st.DRAFT': { en: 'In progress — not submitted', hi: 'प्रगति में — जमा नहीं हुआ' },
  'status.st.AWAITING_PAYMENT': { en: 'Submitted — payment due', hi: 'जमा — भुगतान बाकी' },
  'status.st.PAID': { en: 'Paid — book your test slot', hi: 'भुगतान हुआ — टेस्ट स्लॉट बुक करें' },
  'status.st.SLOT_BOOKED': { en: 'Test booked', hi: 'टेस्ट बुक हुआ' },
  'status.journey': { en: 'Your journey', hi: 'आपकी यात्रा' },
  'status.journey.start': { en: 'Application started', hi: 'आवेदन शुरू' },
  'status.journey.details': { en: 'Details and documents', hi: 'विवरण और दस्तावेज़' },
  'status.journey.submit': { en: 'Submitted', hi: 'जमा' },
  'status.journey.pay': { en: 'Fee paid', hi: 'शुल्क भुगतान' },
  'status.journey.slot': { en: 'Test slot', hi: 'टेस्ट स्लॉट' },
  'status.journey.test': { en: 'Attend test', hi: 'टेस्ट में शामिल हों' },
  'status.current': { en: 'Current step', hi: 'वर्तमान चरण' },
  'status.done': { en: 'Done', hi: 'पूर्ण' },
  'status.upcoming': { en: 'Upcoming', hi: 'आगे' },
  'status.print': { en: 'Print this page', hi: 'यह पेज प्रिंट करें' },
  'status.help': { en: 'Need help with this application?', hi: 'इस आवेदन में मदद चाहिए?' },
  'status.helpLink': { en: 'Contact support', hi: 'सहायता से संपर्क करें' },
  'status.demoNote': {
    en: 'Demo status view. A real portal would require an OTP to show personal details.',
    hi: 'डेमो स्थिति दृश्य। असली पोर्टल व्यक्तिगत विवरण के लिए OTP माँगेगा।',
  },
  'status.noRef': { en: 'Enter your reference number to begin.', hi: 'शुरू करने के लिए अपना संदर्भ नंबर दर्ज करें।' },
  'status.find': { en: 'Find your reference', hi: 'अपना संदर्भ खोजें' },
  'status.findDesc': {
    en: 'It is shown on your confirmation page and in the demo receipt.',
    hi: 'यह आपके पुष्टि पेज और डेमो रसीद पर दिखता है।',
  },
  'status.when': { en: 'When', hi: 'कब' },
  'status.noDocs': { en: 'No documents uploaded yet.', hi: 'अभी कोई दस्तावेज़ अपलोड नहीं हुआ।' },
  'status.recentHint': {
    en: 'Open your saved reference, or use Resume with OTP for full access.',
    hi: 'अपना सहेजा संदर्भ खोलें, या पूरी पहुँच के लिए OTP से खोलें।',
  },

  'resume.title': { en: 'Resume a saved application', hi: 'सहेजा आवेदन फिर खोलें' },
  'resume.desc': {
    en: 'Enter your reference number. We will send a one-time code to the mobile number on the application.',
    hi: 'अपना संदर्भ नंबर दर्ज करें। हम आवेदन में दर्ज मोबाइल नंबर पर एक बार का कोड भेजेंगे।',
  },
  'resume.send': { en: 'Send code', hi: 'कोड भेजें' },
  'resume.sending': { en: 'Sending…', hi: 'भेज रहे हैं…' },
  'resume.sent': { en: 'Code sent to {mobile}', hi: '{mobile} पर कोड भेजा गया' },
  'resume.otp': { en: 'One-time code', hi: 'एक बार का कोड' },
  'resume.verify': { en: 'Verify and open', hi: 'सत्यापित करें और खोलें' },
  'resume.demoOtp': { en: 'Demo code: 123456', hi: 'डेमो कोड: 123456' },
  'resume.fill': { en: 'Fill demo code', hi: 'डेमो कोड भरें' },
  'resume.change': { en: 'Use a different reference', hi: 'दूसरा संदर्भ नंबर' },
  'resume.note': {
    en: 'In a live system the code would arrive by SMS. This demo shows it on screen.',
    hi: 'असली सिस्टम में कोड SMS से आएगा। यह डेमो उसे स्क्रीन पर दिखाता है।',
  },
  'resume.noRef': { en: 'No reference number?', hi: 'संदर्भ संख्या नहीं है?' },
  'resume.noRefDesc': {
    en: 'Start a new application or use the status page with the reference you saved.',
    hi: 'नया आवेदन शुरू करें या सहेजे गए संदर्भ के साथ स्थिति पेज इस्तेमाल करें।',
  },
  'resume.startNew': { en: 'Start a learner licence application', hi: 'लर्नर लाइसेंस आवेदन शुरू करें' },

  'help.title': { en: 'Help and accessibility', hi: 'सहायता और सुगम्यता' },
  'help.desc': {
    en: 'Answers about the demo, plus the accessibility features built into this redesign.',
    hi: 'डेमो के जवाब, और इस रीडिज़ाइन में बने सुगम्यता फ़ीचर।',
  },
  'help.faqTitle': { en: 'Common questions', hi: 'आम सवाल' },
  'help.q1': { en: 'Is this the official Sarathi website?', hi: 'क्या यह आधिकारिक सारथी वेबसाइट है?' },
  'help.a1': {
    en: 'No. It is an independent design concept built to show how the driving-licence journey could work. Use parivahan.gov.in for real applications.',
    hi: 'नहीं। यह एक स्वतंत्र डिज़ाइन कॉन्सेप्ट है जो दिखाता है कि ड्राइविंग लाइसेंस की प्रक्रिया कैसी हो सकती है। असली आवेदन के लिए parivahan.gov.in इस्तेमाल करें।',
  },
  'help.q2': { en: 'Do you store my real documents?', hi: 'क्या आप मेरे असली दस्तावेज़ रखते हैं?' },
  'help.a2': {
    en: 'No. Use made-up details and sample files. Everything stays on the local demo server running on your computer.',
    hi: 'नहीं। काल्पनिक विवरण और नमूना फ़ाइलें इस्तेमाल करें। सब कुछ आपके कंप्यूटर पर चल रहे स्थानीय डेमो सर्वर में रहता है।',
  },
  'help.q3': { en: 'What is the OTP for resuming?', hi: 'फिर खोलने का OTP क्या है?' },
  'help.a3': { en: 'In this demo the code is always 123456.', hi: 'इस डेमो में कोड हमेशा 123456 है।' },
  'help.q4': { en: 'Which card should I use?', hi: 'कौन-सा कार्ड इस्तेमाल करूँ?' },
  'help.a4': {
    en: 'Use 4242 4242 4242 4242. No money moves. Turn on the decline toggle to test failure and retry.',
    hi: '4242 4242 4242 4242 इस्तेमाल करें। कोई पैसा नहीं जाता। अस्वीकृति और दोबारा कोशिश जाँचने के लिए डिक्लाइन टॉगल चालू करें।',
  },
  'help.q5': { en: 'Why does my draft not appear in another browser?', hi: 'मेरा ड्राफ़्ट दूसरे ब्राउज़र में क्यों नहीं दिखता?' },
  'help.a5': {
    en: 'Drafts live on the demo server and are tied to your reference number. Use Resume with the reference and OTP.',
    hi: 'ड्राफ़्ट डेमो सर्वर पर रहते हैं और संदर्भ संख्या से जुड़े होते हैं। संदर्भ और OTP से फिर खोलें।',
  },
  'help.q6': { en: 'Can I get a real learner licence here?', hi: 'क्या यहाँ असली लर्नर लाइसेंस मिल सकता है?' },
  'help.a6': {
    en: 'No. Nothing is sent to any government system.',
    hi: 'नहीं। कुछ भी किसी सरकारी सिस्टम को नहीं भेजा जाता।',
  },
  'help.a11yTitle': { en: 'Accessibility statement', hi: 'सुगम्यता विवरण' },
  'help.a11yIntro': {
    en: 'This concept was built to the WCAG 2.2 AA intent. The list below is what you can check here.',
    hi: 'यह कॉन्सेप्ट WCAG 2.2 AA की भावना से बनाया गया है। नीचे वह सूची है जो आप यहाँ जाँच सकते हैं।',
  },
  'help.a11y.1': { en: 'Browser zoom and pinch-zoom are enabled; nothing locks the viewport scale.', hi: 'ब्राउज़र ज़ूम और पिंच-ज़ूम चालू हैं; व्यूपोर्ट स्केल नहीं रोका गया।' },
  'help.a11y.2': { en: 'Text is 17px by default, with 44px minimum touch targets and visible focus rings.', hi: 'टेक्स्ट डिफ़ॉल्ट 17px, कम से कम 44px टच टारगेट और स्पष्ट फ़ोकस रिंग।' },
  'help.a11y.3': { en: 'Every form field is labelled, errors are summarised with links to the field, and autosave is announced.', hi: 'हर फ़ील्ड लेबल है, गलतियाँ फ़ील्ड लिंक के साथ दिखती हैं और ऑटोसेव की घोषणा होती है।' },
  'help.a11y.4': { en: 'Navigation and the wizard work with a keyboard alone, including a skip link.', hi: 'नेविगेशन और विज़ार्ड स्किप लिंक सहित केवल कीबोर्ड से चलते हैं।' },
  'help.a11y.5': { en: 'The page language is set for screen readers and changes with the language switcher.', hi: 'स्क्रीन रीडर के लिए पेज भाषा सेट है और भाषा बदलने पर बदलती है।' },
  'help.a11y.6': { en: 'Reduced-motion preferences are respected and no overlay blocks the page.', hi: 'कम गति की प्राथमिकता का सम्मान होता है और कोई ओवरले पेज नहीं रोकता।' },
  'help.contactTitle': { en: 'Contact and support', hi: 'संपर्क और सहायता' },
  'help.contactBody': {
    en: 'This demo has no support desk. For a real application, use the official helpline and grievance links on parivahan.gov.in.',
    hi: 'इस डेमो में सहायता डेस्क नहीं है। असली आवेदन के लिए parivahan.gov.in पर आधिकारिक हेल्पलाइन और शिकायत लिंक देखें।',
  },
  'help.officialLink': { en: 'Open parivahan.gov.in', hi: 'parivahan.gov.in खोलें' },

  'about.title': { en: 'About this concept', hi: 'इस कॉन्सेप्ट के बारे में' },
  'about.lede': {
    en: 'A redesign of the Sarathi learner-licence journey — structure, accessibility and the backend plumbing the old portal makes painful.',
    hi: 'सारथी लर्नर-लाइसेंस यात्रा का रीडिज़ाइन — संरचना, सुगम्यता और वह बैकएंड जो पुराने पोर्टल में मुश्किल बनाता है।',
  },
  'about.disclaimerTitle': { en: 'What this is — and is not', hi: 'यह क्या है — और क्या नहीं' },
  'about.disclaimer': {
    en: 'Independent, unofficial concept. Not affiliated with the Ministry of Road Transport and Highways. No real applications, payments, Aadhaar, OTPs or documents are processed. Do not enter real personal data.',
    hi: 'स्वतंत्र, अनौपचारिक कॉन्सेप्ट। सड़क परिवहन और राजमार्ग मंत्रालय से संबद्ध नहीं। कोई असली आवेदन, भुगतान, आधार, OTP या दस्तावेज़ संसाधित नहीं होते। असली व्यक्तिगत जानकारी न भरें।',
  },
  'about.auditTitle': { en: 'What changed', hi: 'क्या बदला' },
  'about.auditDesc': {
    en: 'Observed on the live portal on 30 October 2026, then addressed here.',
    hi: '30 अक्टूबर 2026 को लाइव पोर्टल पर देखा गया, फिर यहाँ सुधारा गया।',
  },
  'about.issue': { en: 'Issue on the live portal', hi: 'लाइव पोर्टल पर समस्या' },
  'about.fix': { en: 'Fix in this prototype', hi: 'इस प्रोटोटाइप में सुधार' },
  'about.where': { en: 'See it', hi: 'कहाँ देखें' },
  'about.i1': { en: 'Direct links returned 403 and the state choice lived only in the session.', hi: 'सीधे लिंक 403 देते थे और राज्य का चयन केवल सत्र में रहता था।' },
  'about.f1': { en: 'Every service and application has a real URL; state is stored with the draft, not as a gate.', hi: 'हर सेवा और आवेदन का असली URL है; राज्य ड्राफ़्ट के साथ रहता है, बाधा के रूप में नहीं।' },
  'about.i2': { en: '20 home tiles competed with roughly 50 dropdown links, with no search.', hi: 'होम के 20 टाइल और लगभग 50 ड्रॉपडाउन लिंक, बिना खोज के।' },
  'about.f2': { en: 'One searchable catalogue grouped by task, with fees, time and documents visible before you start.', hi: 'कार्य के अनुसार एक खोजने योग्य सूची, शुरू करने से पहले शुल्क, समय और दस्तावेज़ दिखते हैं।' },
  'about.i3': { en: 'Eight application stages were static text with no progress or save.', hi: 'आठ चरण स्थिर टेक्स्ट थे, कोई प्रगति या सहेजना नहीं।' },
  'about.f3': { en: 'A seven-step wizard with a progress bar, autosave and resume by OTP.', hi: 'प्रगति पट्टी, ऑटोसेव और OTP से फिर खोलने वाला सात-चरण विज़ार्ड।' },
  'about.i4': { en: 'Payment verification was a separate service citizens had to remember.', hi: 'भुगतान सत्यापन अलग सेवा थी जिसे नागरिकों को याद रखना पड़ता था।' },
  'about.f4': { en: 'Payment, receipt, slot and test live in one timeline on one status URL.', hi: 'भुगतान, रसीद, स्लॉट और टेस्ट एक ही टाइमलाइन और एक ही स्टेटस URL पर।' },
  'about.i5': { en: 'The homepage stacked a contactless modal, a chatbot and moving banners over the content.', hi: 'होमपेज ने सामग्री के ऊपर कॉन्टैक्टलेस मोडल, चैटबॉट और चलते बैनर रखे थे।' },
  'about.f5': { en: 'No blocking overlays, no auto-moving banners, and dismissible notices only.', hi: 'कोई अवरोधक ओवरले नहीं, कोई अपने आप चलता बैनर नहीं, केवल बंद होने वाले नोटिस।' },
  'about.i6': { en: 'Zoom was disabled, text was 14px and the state link was 24px tall.', hi: 'ज़ूम बंद था, टेक्स्ट 14px और राज्य लिंक 24px ऊँचा था।' },
  'about.f6': { en: 'Zoom enabled, 17px base text, 44px targets and high-visibility focus states.', hi: 'ज़ूम चालू, 17px आधार टेक्स्ट, 44px टारगेट और स्पष्ट फ़ोकस।' },
  'about.i7': { en: 'Service names and instructions were English-only and inconsistent.', hi: 'सेवा नाम और निर्देश केवल अंग्रेज़ी में और असंगत थे।' },
  'about.f7': { en: 'A complete English/Hindi switch, including form errors, with the page language announced.', hi: 'फ़ॉर्म गलतियों सहित पूरा अंग्रेज़ी/हिंदी स्विच, पेज भाषा की घोषणा के साथ।' },
  'about.i8': { en: 'Payment retries risked duplicate charges; last-slot races broke the page.', hi: 'भुगतान दोबारा करने पर दुगुना शुल्क लगने का जोखिम; आख़िरी स्लॉट की रेस पेज तोड़ देती थी।' },
  'about.f8': { en: 'Idempotency keys and a transactional slot check return clear conflicts instead of duplicates or crashes.', hi: 'इडेम्पोटेंसी कुंजियाँ और ट्रांज़ैक्शनल स्लॉट जाँच दोहराव या क्रैश के बजाय स्पष्ट संघर्ष देती हैं।' },
  'about.i9': { en: 'Uploads accepted files with little server-side checking.', hi: 'अपलोड में सर्वर-साइड जाँच बहुत कम थी।' },
  'about.f9': { en: 'Magic-byte, MIME and size validation per document type, with readable error codes.', hi: 'हर दस्तावेज़ प्रकार के लिए मैजिक-बाइट, MIME और आकार जाँच, पठनीय त्रुटि कोड के साथ।' },
  'about.i10': { en: 'There was no way to resume on another device, and slot data was stale.', hi: 'दूसरे डिवाइस पर फिर खोलने का तरीका नहीं था और स्लॉट डेटा पुराना था।' },
  'about.f10': { en: 'Reference + OTP resume from any browser, plus live seat counts refreshed at booking time.', hi: 'किसी भी ब्राउज़र से संदर्भ + OTP रीज़्यूम, और बुकिंग के समय ताज़ा सीटें।' },
  'about.backendTitle': { en: 'Backend fixes in the demo', hi: 'डेमो में बैकएंड सुधार' },
  'about.backend.1': { en: 'Idempotent payments: repeating a request returns the original receipt, not a second charge.', hi: 'इडेम्पोटेंट भुगतान: अनुरोध दोहराने पर मूल रसीद मिलती है, दूसरा शुल्क नहीं।' },
  'about.backend.2': { en: 'The server decides the amount; the browser cannot choose what to pay.', hi: 'राशि सर्वर तय करता है; ब्राउज़र यह नहीं चुन सकता कि कितना देना है।' },
  'about.backend.3': { en: 'Optimistic concurrency on drafts: a stale tab gets 409 instead of overwriting newer data.', hi: 'ड्राफ़्ट पर ऑप्टिमिस्टिक कॉन्करेंसी: पुराना टैब नया डेटा मिटाने के बजाय 409 पाता है।' },
  'about.backend.4': { en: 'Slot booking runs in a transaction; a full slot returns 409 SLOT_FULL with a clear next step.', hi: 'स्लॉट बुकिंग ट्रांज़ैक्शन में चलती है; भरा स्लॉट स्पष्ट अगले कदम के साथ 409 SLOT_FULL देता है।' },
  'about.backend.5': { en: 'OTP resume is rate limited; the demo code is fixed at 123456 and shown on screen.', hi: 'OTP रीज़्यूम दर-सीमित है; डेमो कोड 123456 है और स्क्रीन पर दिखता है।' },
  'about.backend.6': { en: 'Documents are checked by magic bytes, not just the extension, and capped per type.', hi: 'दस्तावेज़ एक्सटेंशन नहीं, मैजिक बाइट्स से जाँचे जाते हैं और प्रकार के अनुसार सीमित हैं।' },
  'about.backend.7': { en: 'A single error contract (code, message, fields) and honest HTTP status codes.', hi: 'एक ही त्रुटि अनुबंध (कोड, संदेश, फ़ील्ड) और सही HTTP स्टेटस कोड।' },
  'about.backend.8': { en: 'Every significant action is written to an audit timeline; no third-party trackers.', hi: 'हर महत्वपूर्ण क्रिया ऑडिट टाइमलाइन में दर्ज होती है; कोई तीसरा ट्रैकर नहीं।' },
  'about.dataTitle': { en: 'Demo data and reset', hi: 'डेमो डेटा और रीसेट' },
  'about.dataBody': {
    en: 'Delhi RTO centres and sample slots are seeded automatically. Applications and uploads live in server/data and server/uploads. Reset clears everything.',
    hi: 'दिल्ली RTO केंद्र और नमूना स्लॉट अपने आप बनते हैं। आवेदन और अपलोड server/data और server/uploads में रहते हैं। रीसेट सब हटा देता है।',
  },
  'about.reset': { en: 'Reset demo data', hi: 'डेमो डेटा रीसेट करें' },
  'about.resetConfirm': {
    en: 'This deletes every demo application, payment and uploaded file. Continue?',
    hi: 'इससे सभी डेमो आवेदन, भुगतान और अपलोड फ़ाइलें हट जाएँगी। जारी रखें?',
  },
  'about.resetDone': { en: 'Demo data cleared. New applications start fresh.', hi: 'डेमो डेटा हट गया। नए आवेदन नए सिरे से शुरू होंगे।' },
  'about.resetError': { en: 'Could not reset demo data.', hi: 'डेमो डेटा रीसेट नहीं हुआ।' },
  'about.stack': {
    en: "Built with React, TypeScript, Vite and Express on Node's built-in SQLite. Tests cover validation, autosave, payments and slot races.",
    hi: 'React, TypeScript, Vite और Express, Node के अंतर्निहित SQLite के साथ। टेस्ट सत्यापन, ऑटोसेव, भुगतान और स्लॉट रेस को कवर करते हैं।',
  },
  'about.stackTitle': { en: 'Stack and official sources', hi: 'स्टैक और आधिकारिक स्रोत' },

  'footer.desc': { en: 'A citizen-first concept for driving licence services.', hi: 'ड्राइविंग लाइसेंस सेवाओं के लिए नागरिक-केंद्रित कॉन्सेप्ट।' },
  'footer.colServices': { en: 'Services', hi: 'सेवाएँ' },
  'footer.colHelp': { en: 'Help', hi: 'सहायता' },
  'footer.colOfficial': { en: 'Official links', hi: 'आधिकारिक लिंक' },
  'footer.learner': { en: 'Learner licence', hi: 'लर्नर लाइसेंस' },
  'footer.renew': { en: 'Renew licence', hi: 'लाइसेंस नवीनीकरण' },
  'footer.duplicate': { en: 'Duplicate licence', hi: 'डुप्लिकेट लाइसेंस' },
  'footer.track': { en: 'Track application', hi: 'आवेदन ट्रैक करें' },
  'footer.a11y': { en: 'Accessibility', hi: 'सुगम्यता' },
  'footer.faq': { en: 'Questions', hi: 'सवाल' },
  'footer.about': { en: 'About the concept', hi: 'कॉन्सेप्ट के बारे में' },
  'footer.parivahan': { en: 'Parivahan (official)', hi: 'परिवहन (आधिकारिक)' },
  'footer.morth': { en: 'Ministry of Road Transport', hi: 'सड़क परिवहन मंत्रालय' },
  'footer.disclaimer': {
    en: 'Unofficial concept. Not affiliated with the Government of India. Do not enter real personal data.',
    hi: 'अनौपचारिक कॉन्सेप्ट। भारत सरकार से संबद्ध नहीं। असली व्यक्तिगत जानकारी न भरें।',
  },
  'footer.conceptTag': { en: 'Demo build', hi: 'डेमो बिल्ड' },

  'errors.FULL_NAME_REQUIRED': { en: 'Enter your full name.', hi: 'अपना पूरा नाम दर्ज करें।' },
  'errors.FULL_NAME_INVALID': { en: 'Use letters, spaces, dots or hyphens (2–80 characters).', hi: 'अक्षर, स्पेस, बिंदु या हाइफ़न इस्तेमाल करें (2–80 अक्षर)।' },
  'errors.DOB_REQUIRED': { en: 'Enter your date of birth.', hi: 'अपनी जन्म तिथि दर्ज करें।' },
  'errors.DOB_INVALID': { en: 'Use a valid date.', hi: 'सही तारीख़ दर्ज करें।' },
  'errors.DOB_TOO_YOUNG': {
    en: 'You must be at least 18 for a car or geared motorcycle, or 16 for a gearless scooter.',
    hi: 'कार या गियर वाली मोटरसाइकिल के लिए कम से कम 18 वर्ष, गियरलेस स्कूटर के लिए 16 वर्ष आवश्यक।',
  },
  'errors.VEHICLE_CLASS_REQUIRED': { en: 'Choose at least one vehicle class.', hi: 'कम से कम एक वाहन वर्ग चुनें।' },
  'errors.VEHICLE_CLASS_INVALID': { en: 'That vehicle class is not recognised.', hi: 'यह वाहन वर्ग मान्य नहीं है।' },
  'errors.GENDER_REQUIRED': { en: 'Choose a gender option.', hi: 'लिंग चुनें।' },
  'errors.GENDER_INVALID': { en: 'Choose a valid gender option.', hi: 'मान्य लिंग विकल्प चुनें।' },
  'errors.MOBILE_REQUIRED': { en: 'Enter your mobile number.', hi: 'अपना मोबाइल नंबर दर्ज करें।' },
  'errors.MOBILE_INVALID': { en: 'Enter a 10-digit mobile number starting with 6–9.', hi: '6–9 से शुरू होने वाला 10 अंकों का मोबाइल नंबर दर्ज करें।' },
  'errors.EMAIL_INVALID': { en: 'Enter a valid email address, or leave it blank.', hi: 'सही ईमेल दर्ज करें, या खाली छोड़ें।' },
  'errors.ADDRESS_REQUIRED': { en: 'Enter your address.', hi: 'अपना पता दर्ज करें।' },
  'errors.ADDRESS_TOO_SHORT': { en: 'The address looks too short. Add house, street and area.', hi: 'पता बहुत छोटा लगता है। मकान, गली और इलाक़ा जोड़ें।' },
  'errors.CITY_REQUIRED': { en: 'Enter your city or district.', hi: 'शहर या ज़िला दर्ज करें।' },
  'errors.STATE_REQUIRED': { en: 'Choose your state.', hi: 'अपना राज्य चुनें।' },
  'errors.PINCODE_REQUIRED': { en: 'Enter your PIN code.', hi: 'पिन कोड दर्ज करें।' },
  'errors.PINCODE_INVALID': { en: 'Enter a 6-digit PIN code.', hi: '6 अंकों का पिन कोड दर्ज करें।' },
  'errors.CATEGORY_INVALID': { en: 'Choose an applicant category.', hi: 'आवेदक श्रेणी चुनें।' },
  'errors.HISTORY_INVALID': { en: 'Choose your licence history.', hi: 'अपना लाइसेंस इतिहास चुनें।' },
  'errors.DECLARATION_REQUIRED': { en: 'Tick the declaration to submit.', hi: 'जमा करने के लिए घोषणा पर टिक करें।' },
  'errors.DOCUMENT_REQUIRED': { en: 'Upload this document.', hi: 'यह दस्तावेज़ अपलोड करें।' },
  'errors.DOCUMENT_KIND_INVALID': { en: 'That document type is not part of this application.', hi: 'यह दस्तावेज़ प्रकार इस आवेदन का हिस्सा नहीं है।' },
  'errors.DOCUMENT_DATA_INVALID': { en: 'That file could not be read. Try another file.', hi: 'यह फ़ाइल पढ़ी नहीं जा सकी। दूसरी फ़ाइल आज़माएँ।' },
  'errors.DOCUMENT_TYPE_INVALID': { en: 'Use a JPG or PNG for photos and signatures.', hi: 'फ़ोटो और हस्ताक्षर के लिए JPG या PNG इस्तेमाल करें।' },
  'errors.DOCUMENT_TOO_LARGE': {
    en: 'That file is too large. Photos and signatures must be under 1 MB; other documents under 2 MB.',
    hi: 'फ़ाइल बहुत बड़ी है। फ़ोटो और हस्ताक्षर 1 MB से कम, अन्य दस्तावेज़ 2 MB से कम।',
  },
  'errors.DOCUMENT_UNREADABLE': { en: 'This file is not a valid image or PDF.', hi: 'यह फ़ाइल मान्य इमेज या PDF नहीं है।' },
  'errors.DOCUMENT_TYPE_MISMATCH': { en: 'The file content does not match its extension.', hi: 'फ़ाइल की सामग्री उसके एक्सटेंशन से मेल नहीं खाती।' },
  'errors.CARD_INVALID': { en: 'Check the card number. Use 4242 4242 4242 4242 for the demo.', hi: 'कार्ड नंबर जाँचें। डेमो के लिए 4242 4242 4242 4242 इस्तेमाल करें।' },
  'errors.CARD_NAME_INVALID': { en: 'Enter the name printed on the card.', hi: 'कार्ड पर छपा नाम दर्ज करें।' },
  'errors.EXPIRY_INVALID': { en: 'Enter expiry as MM/YY.', hi: 'समाप्ति MM/YY में दर्ज करें।' },
  'errors.EXPIRY_PAST': { en: 'That card has expired.', hi: 'यह कार्ड समाप्त हो चुका है।' },
  'errors.CVV_INVALID': { en: 'Enter the 3 or 4 digit CVV.', hi: '3 या 4 अंकों का CVV दर्ज करें।' },
  'errors.VALIDATION_FAILED': { en: 'Some details need attention.', hi: 'कुछ विवरण ठीक करने हैं।' },
  'errors.VERSION_CONFLICT': { en: 'This application changed in another tab.', hi: 'यह आवेदन दूसरे टैब में बदला।' },
  'errors.APPLICATION_LOCKED': { en: 'This application is locked for editing.', hi: 'यह आवेदन बदलाव के लिए लॉक है।' },
  'errors.ALREADY_SUBMITTED': { en: 'This application has already been submitted.', hi: 'यह आवेदन पहले ही जमा हो चुका है।' },
  'errors.NOT_SUBMITTED': { en: 'Submit the application before paying.', hi: 'भुगतान से पहले आवेदन जमा करें।' },
  'errors.ALREADY_PAID': { en: 'This application has already been paid.', hi: 'इस आवेदन का भुगतान हो चुका है।' },
  'errors.PAYMENT_DECLINED': { en: 'The gateway declined this payment.', hi: 'गेटवे ने यह भुगतान अस्वीकार किया।' },
  'errors.PAYMENT_REQUIRED': { en: 'Pay the fee before booking a slot.', hi: 'स्लॉट बुक करने से पहले शुल्क भरें।' },
  'errors.SLOT_FULL': { en: 'That slot just filled up. Pick another time.', hi: 'यह स्लॉट अभी भर गया। दूसरा समय चुनें।' },
  'errors.SLOT_NOT_FOUND': { en: 'That slot is no longer available.', hi: 'यह स्लॉट अब उपलब्ध नहीं है।' },
  'errors.RATE_LIMITED': { en: 'Too many attempts. Please wait a minute and try again.', hi: 'बहुत अधिक कोशिशें। एक मिनट रुककर फिर कोशिश करें।' },
  'errors.APPLICATION_NOT_FOUND': { en: 'No application matches that reference number.', hi: 'उस संदर्भ संख्या से कोई आवेदन नहीं मिला।' },
  'errors.PROFILE_INCOMPLETE': { en: 'This application does not have a mobile number yet.', hi: 'इस आवेदन में अभी मोबाइल नंबर नहीं है।' },
  'errors.CHALLENGE_EXPIRED': { en: 'That code expired. Send a new one.', hi: 'कोड की अवधि खत्म। नया कोड भेजें।' },
  'errors.OTP_INVALID': { en: 'That code is not correct.', hi: 'यह कोड सही नहीं है।' },
  'errors.TOO_MANY_ATTEMPTS': { en: 'Too many wrong codes. Send a new one.', hi: 'बहुत सारे गलत कोड। नया कोड भेजें।' },
  'errors.IDEMPOTENCY_KEY_REUSED': { en: 'This payment attempt belongs to another application.', hi: 'यह भुगतान प्रयास दूसरे आवेदन का है।' },
  'errors.INTERNAL': { en: 'Something went wrong on our side. Try again.', hi: 'हमारी ओर कुछ गड़बड़ हुई। फिर कोशिश करें।' },
  'errors.NETWORK': { en: 'Could not reach the demo server. Is it running?', hi: 'डेमो सर्वर तक नहीं पहुँच सके। क्या वह चल रहा है?' },
  'errors.UNKNOWN': { en: 'Something went wrong.', hi: 'कुछ गड़बड़ हुई।' },
};

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (value: Localised | undefined) => string;
  errorText: (code: string | undefined, fallback?: string) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem('sarathi.lang');
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    // Storage can be blocked; fall back to the browser language.
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('hi')) return 'hi';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('sarathi.lang', lang);
    } catch {
      // Ignore storage failures.
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = STRINGS[key];
      let value = entry ? entry[lang] : key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [lang],
  );

  const L = useCallback((value: Localised | undefined) => (value ? value[lang] : ''), [lang]);

  const errorText = useCallback(
    (code: string | undefined, fallback?: string) => {
      if (code && STRINGS[`errors.${code}`]) return STRINGS[`errors.${code}`][lang];
      return fallback ?? STRINGS['errors.UNKNOWN'][lang];
    },
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t, L, errorText }),
    [lang, setLang, t, L, errorText],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) throw new Error('useLang must be used inside LanguageProvider');
  return context;
}
