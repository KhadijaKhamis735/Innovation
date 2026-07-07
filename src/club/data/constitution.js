// IBARA YA 46–48 — Constitutional Lifecycle
//
// This module holds:
//   - The full text of the constitution (Kiswahili primary, English summary per article)
//   - Rules for proposing amendments (IBARA 46) — ⅔ majority at quorum
//   - Rules for dissolution (IBARA 47) — ¾ majority + asset transfer protocol
//   - Transitional provisions (IBARA 48) — onboarding of new branches
//
// The constitution covers all 48 articles (IBARA) across 12 chapters (SURA).

export const CONSTITUTION_META = Object.freeze({
  title: 'Katiba ya Startup Innovation Club',
  titleEnglish: 'Constitution of the Startup Innovation Club',
  version: '1.0',
  ratifiedAt: '2026-01-20',
  workingLanguage: 'Kiswahili',
  parentBody: 'Zanzibar Startup Association (ZSA)',
});

export const SURA_LIST = Object.freeze([
  { id: 1, name: 'Utambulisho wa Klabu', nameEnglish: 'Club Identity', articles: [1, 2, 3, 4, 5] },
  { id: 2, name: 'Dira, Dhima, Maadili na Malengo', nameEnglish: 'Vision, Mission, Values & Goals', articles: [6, 7, 8, 9, 10] },
  { id: 3, name: 'Uanachama', nameEnglish: 'Membership', articles: [11, 12, 13, 14, 15, 16] },
  { id: 4, name: 'Vyombo vya Uongozi', nameEnglish: 'Leadership Organs', articles: [17, 18, 19, 20, 21, 22] },
  { id: 5, name: 'Majukumu ya Viongozi', nameEnglish: 'Duties of Office Bearers', articles: [23, 24, 25, 26, 27, 28, 29] },
  { id: 6, name: 'Uchaguzi', nameEnglish: 'Elections', articles: [30, 31, 32, 33, 34] },
  { id: 7, name: 'Mikutano', nameEnglish: 'Meetings', articles: [35, 36, 37] },
  { id: 8, name: 'Fedha', nameEnglish: 'Finance', articles: [38, 39, 40, 41] },
  { id: 9, name: 'Maadili, Migongano na Haki Miliki', nameEnglish: 'Ethics, Conflicts & IP', articles: [42, 43, 44] },
  { id: 10, name: 'Utaratibu wa Kinidhamu na Rufaa', nameEnglish: 'Discipline & Appeals', articles: [45] },
  { id: 11, name: 'Marekebisho ya Katiba', nameEnglish: 'Constitutional Amendments', articles: [46] },
  { id: 12, name: 'Kuvunjwa kwa Klabu na Masharti ya Mpito', nameEnglish: 'Dissolution & Transitional', articles: [47, 48] },
]);

// All 48 articles in Kiswahili with short English summary
// Numbering matches the constitution document 1:1.
export const IBARA_LIST = Object.freeze([
  // SURA 1 — Identity
  { number: 1, chapter: 1, kiswahili: 'Jina la Klabu litakuwa Startup Innovation Club Vyuo na Vyuo Vikuu Zanzibar.', english: 'The club shall be called the Startup Innovation Club of Universities and Colleges of Zanzibar.' },
  { number: 2, chapter: 1, kiswahili: 'Makao Makuu ya klabu yatakuwa Mbweni katika Afisi za Zanzibar Startup Association (ZSA).', english: 'The headquarters are at Mbweni, at the Zanzibar Startup Association offices.' },
  { number: 3, chapter: 1, kiswahili: 'Klabu ni ya hiari, isiyo ya kisiasa, isiyo ya kidini, na isiyo ya kibiashara kwa faida ya wanachama binafsi.', english: 'The club is voluntary, non-political, non-religious, and not for personal commercial gain.' },
  { number: 4, chapter: 1, kiswahili: 'Klabu itafanya kazi kupitia matawi chini ya vyuo na vyuo vikuu, kwa ushirikiano wa kitaasisi na kuratibu ibara kwa ZSA.', english: 'The club operates through branches at universities, with inter-branch and ZSA coordination.' },
  { number: 5, chapter: 1, kiswahili: 'Maneno muhimu yanatafsiriwa katika jedwali la maneno ya Katiba.', english: 'Key terms are defined in the constitution glossary.' },

  // SURA 2 — Vision, Mission, Values, Goals, Activities
  { number: 6, chapter: 2, kiswahili: 'Dira: Kuwa chachu ya kujenga kizazi cha wanafunzi wabunifu, wanaojitegemea.', english: 'Vision: a generation of innovative, self-reliant graduates.' },
  { number: 7, chapter: 2, kiswahili: 'Dhima: Kukuza utamaduni wa ubunifu na ujasiriamali miongoni mwa wanafunzi.', english: 'Mission: cultivate innovation and entrepreneurship among students.' },
  { number: 8, chapter: 2, kiswahili: 'Maadili: ubunifu, uadilifu, ujumuishi, ushirikiano, heshima, mtazamo wa kutatua matatizo.', english: 'Values: innovation, integrity, inclusion, collaboration, respect, problem-solving.' },
  { number: 9, chapter: 2, kiswahili: 'Malengo ni pamoja na kujenga utamaduni wa ubunifu, kuwatambua wanafunzi wabunifu, na kuendesha programu za mafunzo.', english: 'Goals include building an innovation culture and running training programs.' },
  { number: 10, chapter: 2, kiswahili: 'Shughuli za klabu ni pamoja na mikutano, mafunzo, mashindano, miradi ya kijamii, na maonesho.', english: 'Activities include meetings, training, competitions, community projects, and exhibitions.' },

  // SURA 3 — Membership
  { number: 11, chapter: 3, kiswahili: 'Makundi ya uanachama: Wanafunzi, Watumishi wa Vyuo, Wahitimu, Wadau wa Makampuni & NGOs.', english: 'Membership categories: students, university staff, alumni, corporate & NGO partners.' },
  { number: 12, chapter: 3, kiswahili: 'Kila kundi lina sifa zinazohitajika kwa usajili, kama nambari ya usajili, kitambulisho cha wafanyakazi, au jina la shirika.', english: 'Each category has specific eligibility criteria.' },
  { number: 13, chapter: 3, kiswahili: 'Uandikishaji hufanywa kupitia fomu rasmi; uanachama huanza baada ya kuthibitishwa na Mlezi.', english: 'Registration via formal form; membership begins after Patron verification.' },
  { number: 14, chapter: 3, kiswahili: 'Wanachama wana haki za kushiriki, kupiga kura, kupata taarifa, na kukata rufaa.', english: 'Members have rights to participate, vote, receive information, and appeal.' },
  { number: 15, chapter: 3, kiswahili: 'Wajibu: kuheshimu Katiba, kuhudhuria, kutoa michango, na kutunza sifa ya klabu.', english: 'Duties: respect the constitution, attend, contribute, uphold club reputation.' },
  { number: 16, chapter: 3, kiswahili: 'Uanachama unaweza kusimamishwa au kukoma kwa kujiuzulu, kusimamishwa, au kufukuzwa kwa sababu za nidhamu.', english: 'Membership may end by withdrawal, suspension, or expulsion.' },

  // SURA 4 — Leadership Organs
  { number: 17, chapter: 4, kiswahili: 'Vyombo vya uongozi: Mkutano Mkuu, Kamati Tendaji, Mlezi, Kamati Ndogo, na uhusiano na ZSA.', english: 'Leadership organs: General Meeting, Executive Committee, Patron, sub-committees, ZSA link.' },
  { number: 18, chapter: 4, kiswahili: 'Mkutano Mkuu ndio chombo cha juu cha maamuzi.', english: 'The General Meeting is the supreme decision-making body.' },
  { number: 19, chapter: 4, kiswahili: 'Kamati Tendaji ina nafasi 7: Mwenyekiti, Makamu, Katibu, Mweka Hazina, na Maafisa watatu.', english: 'The Executive Committee has 7 positions: Chair, Vice, Secretary, Treasurer, and three Officers.' },
  { number: 20, chapter: 4, kiswahili: 'Mlezi wa Klabu ni mhadhiri au mtumishi wa chuo anayeteuliwa na chuo.', english: 'The Patron is a faculty or staff member appointed by the university.' },
  { number: 21, chapter: 4, kiswahili: 'Kamati Tendaji inaweza kuanzisha Kamati Ndogo kwa shughuli maalum.', english: 'The Executive Committee may form sub-committees for specific tasks.' },
  { number: 22, chapter: 4, kiswahili: 'ZSA ni mshirika mkuu wa kimfumo; matawi yanawasilisha mpango na ripoti.', english: 'ZSA is the main systemic partner; branches submit plans and reports to ZSA.' },

  // SURA 5 — Duties of Office Bearers
  { number: 23, chapter: 5, kiswahili: 'Mwenyekiti anaongoza klabu na kuhakikisha malengo yanatekelezwa.', english: 'The Chair leads the club and ensures goals are met.' },
  { number: 24, chapter: 5, kiswahili: 'Makamu Mwenyekiti anamsaidia Mwenyekiti na kuchukua nafasi yake.', english: 'The Vice supports the Chair and steps in when needed.' },
  { number: 25, chapter: 5, kiswahili: 'Katibu anashughulikia kumbukumbu, mawasiliano, na nyaraka rasmi.', english: 'The Secretary manages records, communications, and documents.' },
  { number: 26, chapter: 5, kiswahili: 'Mweka Hazina anasimamia fedha, bajeti, na akaunti.', english: 'The Treasurer manages finances, budgets, and accounts.' },
  { number: 27, chapter: 5, kiswahili: 'Afisa Programu na Miradi anaratibu mafunzo, mashindano, na miradi.', english: 'The Programs Officer coordinates training, competitions, and projects.' },
  { number: 28, chapter: 5, kiswahili: 'Afisa Ubunifu, Mafunzo na Utafiti anasimamia ideation, prototyping, na utafiti.', english: 'The Innovation Officer runs ideation, prototyping, and research.' },
  { number: 29, chapter: 5, kiswahili: 'Afisa Mawasiliano na Uhamasishaji anasimamia mitandao ya kijamii na uanachama.', english: 'The Communications Officer manages social media and outreach.' },

  // SURA 6 — Elections
  { number: 30, chapter: 6, kiswahili: 'Uchaguzi ni wa kidemokrasia, wa haki, na kwa kura ya siri.', english: 'Elections are democratic, fair, and by secret ballot.' },
  { number: 31, chapter: 6, kiswahili: 'Mgombea awe mwanachama hai, mwenye mwenendo mzuri, na anayeelewa malengo ya klabu.', english: 'Candidates must be active members in good standing who understand the goals.' },
  { number: 32, chapter: 6, kiswahili: 'Kamati ya Uchaguzi (3–5 wanachama) inaongoza uchaguzi na kushughulikia malalamiko.', english: 'The Election Committee (3–5 members) oversees elections and handles complaints.' },
  { number: 33, chapter: 6, kiswahili: 'Muda wa madaraka ni mwaka mmoja, unaweza kuchaguliwa tena mara moja tu; makabidhiano ndani ya siku 14.', english: 'Term is one year, renewable once; handover within 14 days.' },
  { number: 34, chapter: 6, kiswahili: 'Kiongozi anaweza kuondolewa kwa kujiuzulu, ukiukaji, au kura ya kutokuwa na imani.', english: 'An executive may be removed by resignation, misconduct, or vote of no confidence.' },

  // SURA 7 — Meetings
  { number: 35, chapter: 7, kiswahili: 'Aina nne za mikutano: Kawaida, Maalum, Kamati Tendaji, na Kamati Ndogo.', english: 'Four meeting types: Ordinary GM, Extraordinary GM, Executive Committee, Sub-committee.' },
  { number: 36, chapter: 7, kiswahili: 'Maamuzi ya kawaida kwa wingi wa kura; ikiwa kura zinafungana, Mwenyekiti anatoa kura ya uamuzi.', english: 'Decisions by majority; ties resolved by Chair.' },
  { number: 37, chapter: 7, kiswahili: 'Kila mkutano una kumbukumbu rasmi zinazohifadhiwa na Katibu.', english: 'Each meeting has official minutes kept by the Secretary.' },

  // SURA 8 — Finance
  { number: 38, chapter: 8, kiswahili: 'Vyanzo vya fedha: ada za usajili, michango, ufadhili, na msaada wa taasisi.', english: 'Income sources: registration fees, donations, sponsorships, institutional support.' },
  { number: 39, chapter: 8, kiswahili: 'Fedha zinadhibitiwa kwa uwazi; akaunti rasmi ya benki au wallet inatumiwa.', english: 'Funds managed transparently; official bank account or wallet used.' },
  { number: 40, chapter: 8, kiswahili: 'Matumizi yanaruhusiwa: mafunzo, vifaa, usafiri, nyenzo za kujifunzia, msaada wa miradi, gharama za uendeshaji.', english: 'Permitted expenses: training, materials, transport, learning materials, project support, operations.' },
  { number: 41, chapter: 8, kiswahili: 'Mweka Hazina anaowasilisha taarifa kila muhula; wanachama wanaweza kuuliza ufafanuzi.', english: 'Treasurer reports each term; members may ask for clarification.' },

  // SURA 9 — Ethics, Conflicts, IP
  { number: 42, chapter: 9, kiswahili: 'Maadili: heshima, usalama, ujumuishi; hakuna ubaguzi, unyanyasaji, udanganyifu.', english: 'Ethics: respect, safety, inclusion; no discrimination, harassment, fraud.' },
  { number: 43, chapter: 9, kiswahili: 'Kiongozi mwenye mgongano wa maslahi anautangaza na kujiepusha na uamuzi.', english: 'Leaders with conflicts of interest must disclose and recuse.' },
  { number: 44, chapter: 9, kiswahili: 'Mawazo ya wanachama yanabaki mali ya wabunifu; masharti ya ufadhili yaandikwe kabla ya utekelezaji.', english: 'Members keep IP ownership; funded projects require written terms.' },

  // SURA 10 — Discipline
  { number: 45, chapter: 10, kiswahili: 'Malalamiko yanaandikwa; mhusika anasikilizwa; adhabu ni onyo, kusimamishwa, au kufukuzwa; rufaa inawezekana.', english: 'Complaints are written; the accused is heard; sanctions range from warnings to expulsion; appeals allowed.' },

  // SURA 11 — Amendments
  { number: 46, chapter: 11, kiswahili: 'Marekebisho ya Katiba yanapitishwa kwa theluthi mbili (⅔) ya wanachama hai waliohudhuria mkutano wenye quorum.', english: 'Constitutional amendments pass with a two-thirds (⅔) majority of active members at a quorum meeting.' },

  // SURA 12 — Dissolution & Transitional
  { number: 47, chapter: 12, kiswahili: 'Kuvunjwa kwa klabu kunapitishwa na robo tatu (¾); mali inakabidhiwa kwa chuo, ZSA, au taasisi nyingine — si wanachama.', english: 'Dissolution requires three-quarters (¾) majority; assets go to university/ZSA — not members.' },
  { number: 48, chapter: 12, kiswahili: 'Masharti ya mpito: viongozi wa mpito wanaweza kuteuliwa kwa muda usiozidi muhula mmoja; lugha ya kazi ni Kiswahili.', english: 'Transitional: interim leaders may be appointed for at most one term; working language is Kiswahili.' },
]);

// ----------------------- AMENDMENTS (IBARA 46) -----------------------
export const AMENDMENT_RULES = Object.freeze({
  threshold: 2 / 3,
  proposers: ['Kamati Tendaji', 'Mlezi wa Klabu', '⅓ of active members'],
  note: 'No amendment is allowed if it would violate national law, university rules, or the voluntary non-political status of the club.',
});

// ----------------------- DISSOLUTION (IBARA 47) -----------------------
export const DISSOLUTION_RULES = Object.freeze({
  threshold: 3 / 4,
  noticeRequired: ['university', 'ZSA'],
  assetRecipients: ['university', 'ZSA', 'taasisi nyingine ya kielimu/ubunifu'],
  note: 'Assets are NOT distributed to individual members. They are transferred to an institution.',
});

// ----------------------- ONBOARDING (IBARA 48) -----------------------
export const ONBOARDING_STEPS = Object.freeze([
  {
    id: 'name',
    label: 'Branch name',
    description: 'Choose a name and confirm the university is one of the four approved institutions.',
  },
  {
    id: 'patron',
    label: 'Patron',
    description: 'Identify a faculty or staff member to serve as Branch Patron (Mlezi).',
  },
  {
    id: 'interim',
    label: 'Interim committee',
    description: 'Appoint up to 7 interim office bearers to serve until the first election.',
  },
  {
    id: 'charter',
    label: 'Charter signing',
    description: 'Sign the constitution ratification record and submit to ZSA for record.',
  },
  {
    id: 'language',
    label: 'Working language',
    description: 'Working language is Kiswahili. English translation available if needed.',
  },
  {
    id: 'go-live',
    label: 'Activation',
    description: 'Branch goes live with full constitutional protection.',
  },
]);