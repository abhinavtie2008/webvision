/**
 * Demo service catalogue. Copy is bilingual; fees are indicative and only
 * used by the mock payment gateway.
 */

export const CATEGORIES = [
  { id: 'learn', label: { en: 'Learn to drive', hi: 'गाड़ी चलाना सीखें' } },
  { id: 'licence', label: { en: 'Manage your licence', hi: 'अपना लाइसेंस संभालें' } },
  { id: 'appointments', label: { en: 'Tests and appointments', hi: 'परीक्षण और अपॉइंटमेंट' } },
  { id: 'documents', label: { en: 'Documents and payments', hi: 'दस्तावेज़ और भुगतान' } },
  { id: 'support', label: { en: 'Help and records', hi: 'सहायता और रिकॉर्ड' } },
];

const DOC = {
  ageProof: {
    key: 'ageProof',
    required: true,
    label: { en: 'Age proof', hi: 'आयु का प्रमाण' },
    hint: { en: 'Aadhaar, birth certificate, or Class 10 certificate. PDF, JPG or PNG.', hi: 'आधार, जन्म प्रमाण पत्र या कक्षा 10 का प्रमाण पत्र। PDF, JPG या PNG।' },
  },
  addressProof: {
    key: 'addressProof',
    required: true,
    label: { en: 'Address proof', hi: 'पते का प्रमाण' },
    hint: { en: 'Aadhaar, passport, electricity bill, or rent agreement. PDF, JPG or PNG.', hi: 'आधार, पासपोर्ट, बिजली बिल या किरायानामा। PDF, JPG या PNG।' },
  },
  photo: {
    key: 'photo',
    required: true,
    label: { en: 'Passport photo', hi: 'पासपोर्ट फ़ोटो' },
    hint: { en: 'Plain background, JPG or PNG, up to 1 MB.', hi: 'सादा बैकग्राउंड, JPG या PNG, 1 MB तक।' },
  },
  signature: {
    key: 'signature',
    required: true,
    label: { en: 'Signature', hi: 'हस्ताक्षर' },
    hint: { en: 'On white paper, JPG or PNG, up to 1 MB.', hi: 'सफ़ेद कागज़ पर, JPG या PNG, 1 MB तक।' },
  },
};

const genericDocs = [DOC.ageProof, DOC.addressProof];
const genericSteps = [
  { en: 'Check the guide and gather your documents', hi: 'गाइड देखें और दस्तावेज़ तैयार रखें' },
  { en: 'Start the application and upload scans', hi: 'आवेदन शुरू करें और स्कैन अपलोड करें' },
  { en: 'Pay the fee and track the status here', hi: 'शुल्क भरें और यहीं स्थिति देखें' },
];
const genericEligibility = [
  { en: 'You must hold a valid licence issued in India.', hi: 'आपके पास भारत में जारी वैध लाइसेंस होना चाहिए।' },
  { en: 'Your mobile number must match the one on record.', hi: 'आपका मोबाइल नंबर रिकॉर्ड में दर्ज नंबर से मेल खाना चाहिए।' },
];

export const SERVICES = [
  {
    slug: 'learner-licence',
    category: 'learn',
    popular: true,
    applyFlow: true,
    title: { en: 'New learner licence', hi: 'नया लर्नर लाइसेंस' },
    summary: {
      en: 'Apply, pay, and book your learner test in one guided flow. Most applicants finish in about 20 minutes.',
      hi: 'एक ही निर्देशित प्रक्रिया में आवेदन करें, शुल्क भरें और टेस्ट स्लॉट बुक करें। अधिकतर लोग लगभग 20 मिनट में पूरा कर लेते हैं।',
    },
    description: {
      en: 'A learner licence lets you practise driving a motor vehicle under supervision before you take the permanent driving test. This demo walks the complete Delhi journey: eligibility, personal details, documents, fee, and test slot.',
      hi: 'लर्नर लाइसेंस आपको स्थायी ड्राइविंग टेस्ट से पहले पर्यवेक्षण में गाड़ी चलाने का अभ्यास करने देता है। यह डेमो दिल्ली की पूरी प्रक्रिया दिखाता है: पात्रता, व्यक्तिगत विवरण, दस्तावेज़, शुल्क और टेस्ट स्लॉट।',
    },
    fee: 500,
    feeNote: { en: '₹200 licence fee + ₹300 learner test (indicative)', hi: '₹200 लाइसेंस शुल्क + ₹300 लर्नर टेस्ट (सांकेतिक)' },
    minutes: 20,
    mode: ['online'],
    tags: ['learner', 'new driver', 'll', 'test'],
    documents: [DOC.ageProof, DOC.addressProof, DOC.photo, DOC.signature],
    eligibility: [
      { en: 'You are at least 18 years old for a car (LMV) licence, or 16 for a gearless two-wheeler up to 50cc.', hi: 'कार (LMV) लाइसेंस के लिए कम से कम 18 वर्ष, या 50cc तक की गियरलेस दोपहिया के लिए 16 वर्ष।' },
      { en: 'You do not already hold a valid learner licence for the same class of vehicle.', hi: 'उसी वर्ग के वाहन के लिए आपके पास पहले से वैध लर्नर लाइसेंस नहीं है।' },
      { en: 'Your Aadhaar name, date of birth and address are up to date, if you choose Aadhaar e-KYC.', hi: 'यदि आप आधार e-KYC चुनते हैं, तो आधार में नाम, जन्मतिथि और पता अपडेटेड हो।' },
    ],
    steps: [
      { en: 'Check eligibility and pick your vehicle class', hi: 'पात्रता जाँचें और वाहन वर्ग चुनें' },
      { en: 'Enter your details and upload documents', hi: 'अपना विवरण भरें और दस्तावेज़ अपलोड करें' },
      { en: 'Review, declare and pay the fee', hi: 'समीक्षा करें, घोषणा करें और शुल्क भरें' },
      { en: 'Book a learner test slot and attend the test', hi: 'लर्नर टेस्ट स्लॉट बुक करें और टेस्ट दें' },
    ],
  },
  {
    slug: 'learner-licence-test',
    category: 'learn',
    popular: true,
    title: { en: 'Book a learner test slot', hi: 'लर्नर टेस्ट स्लॉट बुक करें' },
    summary: {
      en: 'Pick an RTO centre, date and time. Slots refresh live, so you see availability before you commit.',
      hi: 'RTO केंद्र, तारीख़ और समय चुनें। स्लॉट लाइव अपडेट होते हैं, इसलिए पहले उपलब्धता दिखती है।',
    },
    description: {
      en: 'Already applied for a learner licence? Book or reschedule your computer-based test. The demo shows live seat counts per slot.',
      hi: 'लर्नर लाइसेंस के लिए आवेदन कर चुके हैं? कंप्यूटर आधारित परीक्षा बुक या रीशेड्यूल करें। डेमो में हर स्लॉट की लाइव सीटें दिखती हैं।',
    },
    fee: 0,
    feeNote: { en: 'Included in the learner licence fee', hi: 'लर्नर लाइसेंस शुल्क में शामिल' },
    minutes: 5,
    mode: ['online'],
    tags: ['slot', 'test', 'appointment', 'll'],
    documents: [],
    eligibility: [
      { en: 'Your learner application must be paid.', hi: 'आपका लर्नर आवेदन भुगतान हो चुका होना चाहिए।' },
    ],
    steps: [
      { en: 'Enter your application number', hi: 'अपना आवेदन नंबर दर्ज करें' },
      { en: 'Choose a centre, date and time', hi: 'केंद्र, तारीख़ और समय चुनें' },
      { en: 'Get your appointment slip', hi: 'अपॉइंटमेंट पर्ची पाएँ' },
    ],
  },
  {
    slug: 'mock-test',
    category: 'learn',
    popular: true,
    title: { en: 'Practise the learner test', hi: 'लर्नर टेस्ट का अभ्यास करें' },
    summary: {
      en: 'Free 15-question practice test based on road signs and rules. No login needed.',
      hi: 'सड़क संकेतों और नियमों पर आधारित मुफ़्त 15-प्रश्न अभ्यास टेस्ट। लॉगिन की ज़रूरत नहीं।',
    },
    description: {
      en: 'Get familiar with the format and timing of the learner licence test. This demo links to the official practice material.',
      hi: 'लर्नर लाइसेंस टेस्ट के प्रारूप और समय से परिचित हों। यह डेमो आधिकारिक अभ्यास सामग्री से जुड़ता है।',
    },
    fee: 0,
    feeNote: { en: 'Free', hi: 'मुफ़्त' },
    minutes: 15,
    mode: ['online'],
    tags: ['practice', 'test', 'mock'],
    documents: [],
    eligibility: [],
    steps: [
      { en: 'Open the practice test', hi: 'अभ्यास टेस्ट खोलें' },
      { en: 'Answer 15 questions in 15 minutes', hi: '15 मिनट में 15 प्रश्न हल करें' },
    ],
  },
  {
    slug: 'driving-school',
    category: 'learn',
    title: { en: 'Find a driving school', hi: 'ड्राइविंग स्कूल खोजें' },
    summary: {
      en: 'Search licensed driving schools near you, with course and fee details.',
      hi: 'अपने पास के लाइसेंस प्राप्त ड्राइविंग स्कूल खोजें, कोर्स और शुल्क विवरण के साथ।',
    },
    description: {
      en: 'Learning through a licensed school can shorten the wait for your driving test. The demo lists sample centres.',
      hi: 'लाइसेंस प्राप्त स्कूल से सीखने पर ड्राइविंग टेस्ट का इंतज़ार कम हो सकता है। डेमो में नमूना केंद्र सूचीबद्ध हैं।',
    },
    fee: 0,
    feeNote: { en: 'School fees vary', hi: 'स्कूल शुल्क अलग-अलग होता है' },
    minutes: 5,
    mode: ['online'],
    tags: ['school', 'training'],
    documents: [],
    eligibility: [],
    steps: [
      { en: 'Search by area', hi: 'क्षेत्र से खोजें' },
      { en: 'Compare courses and fees', hi: 'कोर्स और शुल्क की तुलना करें' },
    ],
  },
  {
    slug: 'dl-renewal',
    category: 'licence',
    popular: true,
    title: { en: 'Renew your driving licence', hi: 'ड्राइविंग लाइसेंस का नवीनीकरण' },
    summary: {
      en: 'Renew before it expires. Upload your photo and signature, pay, and get the new card by post.',
      hi: 'समाप्ति से पहले नवीनीकरण करें। फ़ोटो और हस्ताक्षर अपलोड करें, शुल्क भरें और नया कार्ड डाक से पाएँ।',
    },
    description: {
      en: 'Renew a non-transport driving licence online. If your address has changed, update it in the same application.',
      hi: 'गैर-परिवहन ड्राइविंग लाइसेंस का ऑनलाइन नवीनीकरण करें। पता बदला है तो उसी आवेदन में अपडेट करें।',
    },
    fee: 700,
    feeNote: { en: '₹200 renewal + ₹500 late fee if expired (indicative)', hi: '₹200 नवीनीकरण + समाप्त होने पर ₹500 विलंब शुल्क (सांकेतिक)' },
    minutes: 15,
    mode: ['online'],
    tags: ['renewal', 'expiry'],
    documents: [DOC.addressProof, DOC.photo, DOC.signature],
    eligibility: [
      { en: 'Your licence is within 1 year of expiry, or expired less than 5 years ago.', hi: 'आपका लाइसेंस समाप्ति के 1 वर्ष के भीतर है, या 5 वर्ष से कम पहले समाप्त हुआ है।' },
      { en: 'A medical certificate is required if you are over 40.', hi: '40 वर्ष से अधिक होने पर मेडिकल प्रमाण पत्र आवश्यक है।' },
    ],
    steps: genericSteps,
  },
  {
    slug: 'duplicate-dl',
    category: 'licence',
    title: { en: 'Duplicate licence', hi: 'डुप्लिकेट लाइसेंस' },
    summary: {
      en: 'Lost or damaged your licence? Request a replacement without visiting the RTO.',
      hi: 'लाइसेंस खो गया या खराब हो गया? RTO जाए बिना दूसरी प्रति मंगाएँ।',
    },
    description: {
      en: 'Apply for a duplicate driving licence if the original is lost, stolen or damaged. A police report is required for stolen cards.',
      hi: 'मूल लाइसेंस खोने, चोरी होने या खराब होने पर डुप्लिकेट ड्राइविंग लाइसेंस के लिए आवेदन करें। चोरी की स्थिति में पुलिस रिपोर्ट आवश्यक है।',
    },
    fee: 500,
    feeNote: { en: '₹500 indicative', hi: '₹500 सांकेतिक' },
    minutes: 10,
    mode: ['online'],
    tags: ['duplicate', 'lost', 'replace'],
    documents: [DOC.addressProof, DOC.photo, DOC.signature],
    eligibility: genericEligibility,
    steps: genericSteps,
  },
  {
    slug: 'change-of-address',
    category: 'licence',
    title: { en: 'Change address on licence', hi: 'लाइसेंस पर पता बदलें' },
    summary: {
      en: 'Update the address printed on your licence and keep your record current.',
      hi: 'लाइसेंस पर छपा पता अपडेट करें और रिकॉर्ड सही रखें।',
    },
    description: {
      en: 'Submit new address proof to update your driving licence record. You can also update your mobile number in the same request.',
      hi: 'ड्राइविंग लाइसेंस रिकॉर्ड अपडेट करने के लिए नए पते का प्रमाण दें। उसी अनुरोध में मोबाइल नंबर भी अपडेट कर सकते हैं।',
    },
    fee: 500,
    feeNote: { en: '₹500 indicative', hi: '₹500 सांकेतिक' },
    minutes: 10,
    mode: ['online'],
    tags: ['address', 'update'],
    documents: [DOC.addressProof],
    eligibility: genericEligibility,
    steps: genericSteps,
  },
  {
    slug: 'add-class',
    category: 'licence',
    title: { en: 'Add a vehicle class', hi: 'वाहन वर्ग जोड़ें' },
    summary: {
      en: 'Add a new class of vehicle to your existing driving licence after passing the test.',
      hi: 'टेस्ट पास करने के बाद अपने मौजूदा लाइसेंस में नया वाहन वर्ग जोड़ें।',
    },
    description: {
      en: 'For example, add a motorcycle class to a car licence. You will need to book and pass the relevant driving test.',
      hi: 'उदाहरण के लिए, कार लाइसेंस में मोटरसाइकिल वर्ग जोड़ें। संबंधित ड्राइविंग टेस्ट बुक करके पास करना होगा।',
    },
    fee: 500,
    feeNote: { en: '₹500 plus test fee (indicative)', hi: '₹500 और टेस्ट शुल्क (सांकेतिक)' },
    minutes: 15,
    mode: ['online'],
    tags: ['class', 'add', 'test'],
    documents: [DOC.photo, DOC.signature],
    eligibility: genericEligibility,
    steps: genericSteps,
  },
  {
    slug: 'idp',
    category: 'licence',
    title: { en: 'International driving permit', hi: 'अंतरराष्ट्रीय ड्राइविंग परमिट' },
    summary: {
      en: 'Drive abroad for up to one year with an IDP issued against your Indian licence.',
      hi: 'अपने भारतीय लाइसेंस के आधार पर एक वर्ष तक विदेश में गाड़ी चलाएँ।',
    },
    description: {
      en: 'An IDP is valid for one year and must be carried with your Indian licence. Apply online and collect it from your RTO.',
      hi: 'IDP एक वर्ष के लिए वैध होता है और भारतीय लाइसेंस के साथ रखना ज़रूरी है। ऑनलाइन आवेदन करें और RTO से लें।',
    },
    fee: 1000,
    feeNote: { en: '₹1,000 indicative', hi: '₹1,000 सांकेतिक' },
    minutes: 15,
    mode: ['online'],
    tags: ['idp', 'international', 'travel'],
    documents: [DOC.addressProof, DOC.photo, DOC.signature],
    eligibility: [
      { en: 'Your Indian driving licence is valid.', hi: 'आपका भारतीय ड्राइविंग लाइसेंस वैध है।' },
      { en: 'You hold a valid passport and visa for the destination country.', hi: 'आपके पास गंतव्य देश का वैध पासपोर्ट और वीज़ा है।' },
    ],
    steps: genericSteps,
  },
  {
    slug: 'dl-extract',
    category: 'licence',
    title: { en: 'Driving licence extract', hi: 'ड्राइविंग लाइसेंस एक्सट्रैक्ट' },
    summary: {
      en: 'Download a certified record of your licence history for visas, jobs or insurance.',
      hi: 'वीज़ा, नौकरी या बीमा के लिए अपने लाइसेंस इतिहास का प्रमाणित रिकॉर्ड डाउनलोड करें।',
    },
    description: {
      en: 'A DL extract lists your licence details and history. It is often needed for foreign licence conversions.',
      hi: 'DL एक्सट्रैक्ट में आपके लाइसेंस का विवरण और इतिहास होता है। विदेशी लाइसेंस बदलने में अक्सर इसकी ज़रूरत होती है।',
    },
    fee: 500,
    feeNote: { en: '₹500 indicative', hi: '₹500 सांकेतिक' },
    minutes: 10,
    mode: ['online'],
    tags: ['extract', 'history', 'record'],
    documents: [DOC.addressProof],
    eligibility: genericEligibility,
    steps: genericSteps,
  },
  {
    slug: 'book-dl-test',
    category: 'appointments',
    title: { en: 'Book a driving test slot', hi: 'ड्राइविंग टेस्ट स्लॉट बुक करें' },
    summary: {
      en: 'Choose an RTO and time for your practical driving test after holding a learner licence for 30 days.',
      hi: '30 दिन लर्नर लाइसेंस रखने के बाद व्यावहारिक ड्राइविंग टेस्ट के लिए RTO और समय चुनें।',
    },
    description: {
      en: 'Book the practical test that converts your learner licence into a permanent driving licence. Slots are released daily.',
      hi: 'वह व्यावहारिक टेस्ट बुक करें जो लर्नर लाइसेंस को स्थायी ड्राइविंग लाइसेंस में बदलता है। स्लॉट रोज़ जारी होते हैं।',
    },
    fee: 300,
    feeNote: { en: '₹300 test fee (indicative)', hi: '₹300 टेस्ट शुल्क (सांकेतिक)' },
    minutes: 5,
    mode: ['online'],
    tags: ['slot', 'driving test', 'appointment'],
    documents: [],
    eligibility: [
      { en: 'You have held a learner licence for at least 30 days.', hi: 'आपके पास कम से कम 30 दिन से लर्नर लाइसेंस है।' },
      { en: 'Your learner licence is still valid.', hi: 'आपका लर्नर लाइसेंस अभी वैध है।' },
    ],
    steps: [
      { en: 'Enter learner licence number', hi: 'लर्नर लाइसेंस नंबर दर्ज करें' },
      { en: 'Pick centre, date and time', hi: 'केंद्र, तारीख़ और समय चुनें' },
      { en: 'Pay and download the slip', hi: 'भुगतान करें और पर्ची डाउनलोड करें' },
    ],
  },
  {
    slug: 'cancel-slot',
    category: 'appointments',
    title: { en: 'Cancel or reschedule a slot', hi: 'स्लॉट रद्द करें या बदलें' },
    summary: {
      en: 'Cancel or move an existing appointment up to 24 hours before the test.',
      hi: 'टेस्ट से 24 घंटे पहले तक मौजूदा अपॉइंटमेंट रद्द या बदलें।',
    },
    description: {
      en: 'Plans changed? Cancel your slot or pick a new one. Cancellations within 24 hours may forfeit the fee.',
      hi: 'योजना बदल गई? अपना स्लॉट रद्द करें या नया चुनें। 24 घंटे के भीतर रद्द करने पर शुल्क ज़ब्त हो सकता है।',
    },
    fee: 0,
    feeNote: { en: 'No charge; refund rules apply', hi: 'कोई शुल्क नहीं; रिफ़ंड नियम लागू' },
    minutes: 5,
    mode: ['online'],
    tags: ['cancel', 'reschedule', 'appointment'],
    documents: [],
    eligibility: [
      { en: 'You have a confirmed appointment.', hi: 'आपका अपॉइंटमेंट पुष्ट है।' },
    ],
    steps: [
      { en: 'Find your appointment', hi: 'अपना अपॉइंटमेंट खोजें' },
      { en: 'Cancel or choose a new slot', hi: 'रद्द करें या नया स्लॉट चुनें' },
    ],
  },
  {
    slug: 'upload-documents',
    category: 'documents',
    title: { en: 'Upload documents', hi: 'दस्तावेज़ अपलोड करें' },
    summary: {
      en: 'Add pending scans to an existing application. Files are checked for type and size before upload.',
      hi: 'मौजूदा आवेदन में बाकी स्कैन जोड़ें। अपलोड से पहले फ़ाइल का प्रकार और आकार जाँचा जाता है।',
    },
    description: {
      en: 'Resume a saved application and upload documents that were still pending. The demo validates file signatures on the server.',
      hi: 'सहेजा गया आवेदन फिर खोलें और बाकी दस्तावेज़ अपलोड करें। डेमो सर्वर पर फ़ाइल हस्ताक्षर की जाँच करता है।',
    },
    fee: 0,
    feeNote: { en: 'Free', hi: 'मुफ़्त' },
    minutes: 5,
    mode: ['online'],
    tags: ['documents', 'upload', 'scan'],
    documents: [],
    eligibility: [
      { en: 'You have an application reference number.', hi: 'आपके पास आवेदन संदर्भ संख्या है।' },
    ],
    steps: [
      { en: 'Open your saved application', hi: 'अपना सहेजा आवेदन खोलें' },
      { en: 'Upload the pending scans', hi: 'बाकी स्कैन अपलोड करें' },
    ],
  },
  {
    slug: 'fee-payment',
    category: 'documents',
    title: { en: 'Pay an application fee', hi: 'आवेदन शुल्क भरें' },
    summary: {
      en: 'Pay a pending fee and get an instant receipt. Retries never charge you twice.',
      hi: 'बाकी शुल्क भरें और तुरंत रसीद पाएँ। दोबारा कोशिश पर दोगुना शुल्क नहीं लगता।',
    },
    description: {
      en: 'Complete payment for a saved application. The demo gateway is idempotent: the same attempt cannot create two receipts.',
      hi: 'सहेजे गए आवेदन का भुगतान पूरा करें। डेमो गेटवे एक जैसे प्रयास पर दो रसीदें नहीं बनाता।',
    },
    fee: 0,
    feeNote: { en: 'Amount depends on your service', hi: 'राशि आपकी सेवा पर निर्भर है' },
    minutes: 5,
    mode: ['online'],
    tags: ['payment', 'fee', 'receipt'],
    documents: [],
    eligibility: [
      { en: 'You have an application with a pending fee.', hi: 'आपके पास बकाया शुल्क वाला आवेदन है।' },
    ],
    steps: [
      { en: 'Open your application', hi: 'अपना आवेदन खोलें' },
      { en: 'Review the amount and pay', hi: 'राशि देखें और भुगतान करें' },
    ],
  },
  {
    slug: 'find-doctor',
    category: 'support',
    title: { en: 'Find a doctor for Form 1A', hi: 'फ़ॉर्म 1A के लिए डॉक्टर खोजें' },
    summary: {
      en: 'Locate an authorised medical practitioner to issue your fitness certificate.',
      hi: 'फ़िटनेस प्रमाण पत्र जारी करने वाले अधिकृत चिकित्सक खोजें।',
    },
    description: {
      en: 'Transport and some renewal applications need a medical certificate. Search empanelled doctors near your RTO.',
      hi: 'परिवहन और कुछ नवीनीकरण आवेदनों में मेडिकल प्रमाण पत्र चाहिए। अपने RTO के पास पैनल पर मौजूद डॉक्टर खोजें।',
    },
    fee: 0,
    feeNote: { en: 'Doctor fees apply', hi: 'डॉक्टर का शुल्क लागू' },
    minutes: 5,
    mode: ['online'],
    tags: ['doctor', 'medical', 'form 1a'],
    documents: [],
    eligibility: [],
    steps: [
      { en: 'Search by district', hi: 'ज़िले से खोजें' },
      { en: 'Book an appointment with the doctor', hi: 'डॉक्टर से अपॉइंटमेंट लें' },
    ],
  },
  {
    slug: 'track-application',
    category: 'support',
    title: { en: 'Track an application', hi: 'आवेदन की स्थिति देखें' },
    summary: {
      en: 'See exactly where your application is, what is pending, and what to do next.',
      hi: 'देखें आपका आवेदन कहाँ है, क्या बाकी है और आगे क्या करना है।',
    },
    description: {
      en: 'Enter your reference number to see a live timeline of submissions, payments, slots and approvals.',
      hi: 'जमा, भुगतान, स्लॉट और स्वीकृति की लाइव टाइमलाइन देखने के लिए संदर्भ संख्या दर्ज करें।',
    },
    fee: 0,
    feeNote: { en: 'Free', hi: 'मुफ़्त' },
    minutes: 2,
    mode: ['online'],
    tags: ['status', 'track', 'timeline'],
    documents: [],
    eligibility: [],
    steps: [
      { en: 'Enter your reference number', hi: 'संदर्भ संख्या दर्ज करें' },
      { en: 'Open the live timeline', hi: 'लाइव टाइमलाइन खोलें' },
    ],
  },
];

export const SERVICE_BY_SLUG = new Map(SERVICES.map((s) => [s.slug, s]));
