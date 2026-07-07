// IBARA YA 48.3 — i18n strings (English + Kiswahili)
//
// Per IBARA YA 48: "Lugha ya kazi ya Katiba hii ni Kiswahili; tafsiri ya
// Kiingereza inaweza kuandaliwa kwa matumizi ya washirika bila kubadilisha
// maana ya msingi wa toleo la Kiswahili..."
//
// This file holds user-visible strings for the Phase 6 toggle. We keep the
// core legal text in Kiswahili (see `constitution.js`); only chrome/UI
// strings are translated here.

export const STRINGS = {
  en: {
    // Common chrome
    appName: 'Club Hub',
    dashboard: 'Dashboard',
    home: 'Home',
    logout: 'Logout',
    back: 'Back',
    language: 'Language',
    workingLanguage: 'Working language',
    kiswahili: 'Kiswahili',
    english: 'English',

    // Constitution
    constitution: 'Constitution',
    constitutionFull: 'Constitution of the Startup Innovation Club',
    fullText: 'Full text',
    chapter: 'Chapter',
    chapters: 'Chapters',
    article: 'Article',
    articleShort: 'Art.',
    articles: 'Articles',

    // Amendments
    proposeAmendment: 'Propose amendment',
    amendmentHistory: 'Amendment history',
    amendmentRules: 'Amendment rules (IBARA YA 46)',
    requiresTwoThirds: 'Requires ⅔ majority at a quorum meeting',
    rationale: 'Rationale',
    proposedText: 'Proposed text',
    currentText: 'Current text',
    voteFor: 'Vote in favour',
    voteAgainst: 'Vote against',
    openVoting: 'Open voting',
    tallyClose: 'Tally & close',

    // Dissolution
    dissolution: 'Dissolution',
    dissolutionProposal: 'Dissolution proposal',
    dissolutionRules: 'Dissolution rules (IBARA YA 47)',
    requiresThreeQuarters: 'Requires ¾ majority at an Extraordinary General Meeting',
    assetRecipients: 'Asset recipients',
    assetRecipientNote: 'Assets must go to university, ZSA, or another educational institution — NOT to individual members.',
    notifyParties: 'Notify university & ZSA',
    execute: 'Execute dissolution',

    // Onboarding
    onboarding: 'New branch onboarding',
    startOnboarding: 'Start a new branch',
    activate: 'Activate branch',

    // Notifications / summary
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
  },

  sw: {
    appName: 'Club Hub',
    dashboard: 'Dashibodi',
    home: 'Mwanzo',
    logout: 'Toka',
    back: 'Rudi',
    language: 'Lugha',
    workingLanguage: 'Lugha ya kazi',
    kiswahili: 'Kiswahili',
    english: 'Kiingereza',

    constitution: 'Katiba',
    constitutionFull: 'Katiba ya Startup Innovation Club',
    fullText: 'Maandishi kamili',
    chapter: 'Sura',
    chapters: 'Masura',
    article: 'Ibara',
    articleShort: 'Ibara',
    articles: 'Ibara',

    proposeAmendment: 'Pendekeza marekebisho',
    amendmentHistory: 'Historia ya marekebisho',
    amendmentRules: 'Kanuni za marekebisho (IBARA YA 46)',
    requiresTwoThirds: 'Inahitaji theluthi mbili (⅔) ya kura katika mkutano wenye quorum',
    rationale: 'Sababu',
    proposedText: 'Maandishi yaliyopendekezwa',
    currentText: 'Maandishi ya sasa',
    voteFor: 'Piga kura kwa ndiyo',
    voteAgainst: 'Piga kura dhidi',
    openVoting: 'Fungua kupiga kura',
    tallyClose: 'Hesabu na funga',

    dissolution: 'Kuvunjwa',
    dissolutionProposal: 'Pendekezo la kuvunjwa',
    dissolutionRules: 'Kanuni za kuvunjwa (IBARA YA 47)',
    requiresThreeQuarters: 'Inahitaji robo tatu (¾) katika Mkutano Mkuu Maalum',
    assetRecipients: 'Wapokeaji wa mali',
    assetRecipientNote: 'Mali inapaswa kwenda kwa chuo, ZSA, au taasisi nyingine ya kielimu — si kwa wanachama binafsi.',
    notifyParties: 'Arifu chuo na ZSA',
    execute: 'Tekeleza kuvunjwa',

    onboarding: 'Usajili wa tawi jipya',
    startOnboarding: 'Anzisha tawi jipya',
    activate: 'Amilisha tawi',

    pending: 'Inasubiri',
    completed: 'Imekamilika',
    failed: 'Imeshindwa',
  },
};

// `t()` is a tiny helper that reads the active language from preferences.
// It is intentionally not React-state-aware so any caller may invoke it; pages
// should re-render when language changes (they already do because the context
// value updates `preferences`).
export function translate(prefs, key) {
  const lang = (prefs && prefs.language) || 'en';
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}