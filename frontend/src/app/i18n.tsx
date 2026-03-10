import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'ro';

type Dictionary = Record<string, string>;

const STORAGE_KEY = 'app-settings';
const ORIGINAL_PLACEHOLDER = 'data-i18n-original-placeholder';
const ORIGINAL_TEXT = new WeakMap<Text, string>();
const TRANSLATED_TEXT = new WeakMap<Text, string>();

const autoRoMap: Record<string, string> = {
  'Home': 'Acasa',
  'About Us': 'Despre noi',
  'Log In': 'Autentificare',
  'Sign Up': 'Inregistrare',
  'Total Balance': 'Sold total',
  'vs last month': 'vs luna trecuta',
  'Community Members': 'Membri comunitate',
  'Everything you need to': 'Tot ce ai nevoie pentru',
  'manage and grow your finances': 'a gestiona si creste finantele tale',
  'Built for modern professionals who demand clarity, control, and community.': 'Construit pentru profesionisti moderni care cer claritate, control si comunitate.',
  'Create your account': 'Creeaza-ti contul',
  'Welcome back': 'Bine ai revenit',
  'Full Name': 'Nume complet',
  'Email Address': 'Adresa de email',
  'Password': 'Parola',
  'Back': 'Inapoi',
  'Loading...': 'Se incarca...',
  'Next': 'Urmatorul',
  'From': 'Din',
  'To': 'Catre',
  'Amount': 'Suma',
  'Description': 'Descriere',
  'Description (optional)': 'Descriere (optional)',
  'Transfer Overview': 'Rezumat transfer',
  'New Balance': 'Sold nou',
  'Your Contacts': 'Contactele tale',
  'Business': 'Companie',
  'Recipient': 'Destinatar',
  'From Account': 'Din cont',
  'Send Money': 'Trimite bani',
  'Transfer funds to another account': 'Transfera fonduri catre alt cont',
  'Insufficient funds': 'Fonduri insuficiente',
  'Currency Exchange': 'Schimb valutar',
  'Exchange currencies at competitive rates': 'Schimba valute la cursuri competitive',
  'Convert': 'Converteste',
  'Rate updated just now': 'Curs actualizat chiar acum',
  'Processing Exchange...': 'Se proceseaza schimbul...',
  'Exchange Successful!': 'Schimb reusit!',
  'Top Counties': 'Top judete',
  'Transaction Pins': 'Puncte tranzactii',
  'Romania Spending Heatmap': 'Harta termica cheltuieli Romania',
  'Low': 'Scazut',
  'High': 'Ridicat',
  'Filters': 'Filtre',
  'Category': 'Categorie',
  'Date Range': 'Perioada',
  'Amount Range (RON)': 'Interval suma (RON)',
  'All': 'Toate',
  'This month': 'Luna aceasta',
  'Last 3 months': 'Ultimele 3 luni',
  'This year': 'Anul acesta',
  'All time': 'Tot timpul',
  'Today': 'Astazi',
  'Last 7 Days': 'Ultimele 7 zile',
  'This Month': 'Luna aceasta',
  'Last Month': 'Luna trecuta',
  'Custom Range': 'Interval personalizat',
  'Start Date': 'Data de start',
  'End Date': 'Data finala',
  'Recent': 'Recente',
  'Category Breakdown': 'Defalcare pe categorii',
  'AI Insights': 'Perspective AI',
  'Real-time analysis of your finances': 'Analiza in timp real a finantelor tale',
  'Ask AI Assistant': 'Intreaba asistentul AI',
  'Search transactions...': 'Cauta tranzactii...',
  'All Categories': 'Toate categoriile',
  'No transactions found for the selected filters.': 'Nu au fost gasite tranzactii pentru filtrele selectate.',
  'No classification data available': 'Nu exista date de clasificare disponibile',
  'Merchant Details': 'Detalii comerciant',
  'Transaction history and info': 'Istoric tranzactii si informatii',
  'Total Spent': 'Total cheltuit',
  'Transactions': 'Tranzactii',
  'transactions shown': 'tranzactii afisate',
  'Avg. Transaction': 'Tranzactie medie',
  'Transaction Locations': 'Locatii tranzactii',
  'Recent Activity': 'Activitate recenta',
  'No location data available': 'Nu exista date de locatie',
  'No data found': 'Nu s-au gasit date',
  'Go Back': 'Inapoi',
  'Transaction Details': 'Detalii tranzactie',
  'Full breakdown & location': 'Detalii complete si locatie',
  'Completed': 'Finalizata',
  'Pending': 'In asteptare',
  'Date': 'Data',
  'Transaction ID': 'ID tranzactie',
  'Location': 'Locatie',
  'County': 'Judet',
  'Transaction Location': 'Locatie tranzactie',
  'With this Merchant': 'La acest comerciant',
  'Visits': 'Vizite',
  'Last Visit': 'Ultima vizita',
  'View Merchant Page': 'Vezi pagina comerciantului',
  'All Merchants': 'Toti comerciantii',
  'Search merchants...': 'Cauta comercianti...',
  'Total Merchants': 'Total comercianti',
  'Total Transactions': 'Total tranzactii',
  'No merchants found.': 'Nu au fost gasiti comercianti.',
  'Find People on the Platform': 'Gaseste persoane pe platforma',
  'Invite Someone New': 'Invita pe cineva nou',
  'Send Invite': 'Trimite invitatie',
  'Copy Link': 'Copiaza linkul',
  'Copied!': 'Copiat!',
  'Merchants': 'Comercianti',
  'Details': 'Detalii',
  'Exchange': 'Schimb',
  'Send': 'Trimite',
  'Invite friends and earn RON 50 for each successful referral.' : 'Invita prieteni si castiga 50 RON pentru fiecare recomandare reusita.',
  'Your Referral Link': 'Linkul tau de recomandare',
  'Invites Sent': 'Invitatii trimise',
  'Joined': 'Alaturati',
  'Earned': 'Castigat',
  'Connect': 'Conecteaza-te',
  'Sent': 'Trimis',
  'Online': 'Online',
  'Offline': 'Offline',
  'Search by Name': 'Cauta dupa nume',
  'Search by Career': 'Cauta dupa profesie',
  'Join by Team Code': 'Alatura-te cu cod echipa',
  'Join': 'Alatura-te',
  'Community joined!': 'Comunitate alaturata!',
  'Invalid code or already joined.': 'Cod invalid sau deja alaturat.',
  'Public Community': 'Comunitate publica',
  'Verified Community': 'Comunitate verificata',
  'Create Post': 'Creeaza postare',
  'Title': 'Titlu',
  'Post': 'Posteaza',
  'Like': 'Apreciaza',
  'Comment': 'Comenteaza',
  'Share': 'Distribuie',
  'Write a comment...': 'Scrie un comentariu...',
  'Share something with the community...': 'Distribuie ceva cu comunitatea...',
  'Loading feed...': 'Se incarca fluxul...',
  'No posts yet. Be the first to share something!': 'Nu exista postari inca. Fii primul care posteaza ceva!',
  'Hello,': 'Salut,',
  'Ask anything about your finances': 'Intreaba orice despre finantele tale',
  'Lidl Transactions': 'Tranzactii Lidl',
  'Monthly': 'Lunar',
  'Cancel': 'Anuleaza',
  'All Clear': 'Totul este in regula',
  'All Done': 'Totul este gata',
  'Back to Dashboard': 'Inapoi la dashboard',
  'Confirm Transaction': 'Confirma tranzactia',
  'Payment Amount': 'Suma platii',
  'Status': 'Status',
  'Awaiting Auth': 'Asteapta autorizare',
  'Merchant': 'Comerciant',
  'Merchant Relationship': 'Relatie comerciant',
  'Previous Transactions': 'Tranzactii anterioare',
  'Avg. Spend': 'Cheltuiala medie',
  'Security reminder': 'Memento de securitate',
  'Monthly statement available': 'Extrasul lunar este disponibil',
  'Review Confirmations': 'Verifica confirmarile',
  'No notifications right now.': 'Nu exista notificari acum.',
  'You have no pending confirmations.': 'Nu ai confirmari in asteptare.',
  'Account Details': 'Detalii cont',
  'View your account information': 'Vezi informatiile contului tau',
  'Account Information': 'Informatii cont',
  'Account Type': 'Tip cont',
  'Owner': 'Titular',
  'Balance': 'Sold',
  'Secured Data': 'Date securizate',
  'Unlocked': 'Deblocat',
  'Enter Security Code': 'Introdu codul de securitate',
  'Unlock': 'Deblocheaza',
  'Incorrect code. Please try again.': 'Cod incorect. Incearca din nou.',
  'Card Number': 'Numar card',
  'Expiry Date': 'Data expirarii',
  'Account Opened': 'Cont deschis',
  'Branch': 'Sucursala',
  'Generating...': 'Se genereaza...',
  'Statement Ready - Download': 'Extras pregatit - Descarca',
  'Generate Extras de Cont': 'Genereaza extras de cont',
  'Admin Panel': 'Panou admin',
  'Manage users, transactions, and contacts': 'Gestioneaza utilizatori, tranzactii si contacte',
  'Add User': 'Adauga utilizator',
  'Search users...': 'Cauta utilizatori...',
  'Name': 'Nume',
  'Email': 'Email',
  'IBAN': 'IBAN',
  'Actions': 'Actiuni',
  'No users found': 'Nu au fost gasiti utilizatori',
  'Create User': 'Creeaza utilizator',
  'Edit User': 'Editeaza utilizator',
  'Save User': 'Salveaza utilizator',
  'Add Contact': 'Adauga contact',
  'Edit Contact': 'Editeaza contact',
  'Save Contact': 'Salveaza contact',
  'Add Confirmation': 'Adauga confirmare',
  'Create Confirmation': 'Creeaza confirmare',
  'Groceries': 'Alimente',
  'Food': 'Mancare',
  'Fuel': 'Combustibil',
  'Shopping': 'Cumparaturi',
  'Subscriptions': 'Abonamente',
  'Transport': 'Transport',
  'Health': 'Sanatate',
  'Utilities': 'Utilitati',
  "Hello! I'm your Connect & Grow AI Assistant. I can analyze your spending, find patterns, and give you smart financial insights. What would you like to know?" : "Salut! Sunt asistentul tau AI Connect & Grow. Pot analiza cheltuielile tale, gasi tipare si oferi perspective financiare inteligente. Ce ai vrea sa stii?",
};

const autoRoPlaceholderMap: Record<string, string> = {
  'Search transactions...': 'Cauta tranzactii...',
  'Search merchants...': 'Cauta comercianti...',
  'Search users...': 'Cauta utilizatori...',
  'Community name...': 'Nume comunitate...',
  'e.g. Engineer, Analyst...': 'ex: Inginer, Analist...',
  'e.g. TECH2024': 'ex: TECH2024',
  'Enter email address...': 'Introdu adresa de email...',
  'RO00XXXX... or +40 7XX...': 'RO00XXXX... sau +40 7XX...',
  'Payment for...': 'Plata pentru...',
  'Ask anything about your finances': 'Intreaba orice despre finantele tale',
  'Write a comment...': 'Scrie un comentariu...',
  'What do you want to talk about?': 'Despre ce vrei sa vorbesti?',
};

const autoRoRegexRules: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(\d+) merchants found$/, (m) => `${m[1]} comercianti gasiti`],
  [/^(\d+) transactions shown$/, (m) => `${m[1]} tranzactii afisate`],
  [/^(\d+) contacts$/, (m) => `${m[1]} contacte`],
  [/^(\d+) confirmations$/, (m) => `${m[1]} confirmari`],
  [/^(\d+) transactions$/, (m) => `${m[1]} tranzactii`],
  [/^No communities found for "(.*)"$/, (m) => `Nu s-au gasit comunitati pentru "${m[1]}"`],
  [/^No users found for "(.*)"$/, (m) => `Nu s-au gasit utilizatori pentru "${m[1]}"`],
];

function translateTextValue(value: string, language: Language): string {
  if (language === 'en') return value;

  if (autoRoMap[value]) return autoRoMap[value];
  for (const [regex, make] of autoRoRegexRules) {
    const match = value.match(regex);
    if (match) return make(match);
  }
  return value;
}

function localizeDom(language: Language) {
  const root = document.getElementById('root');
  if (!root) return;

  // Translate plain text nodes.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;

  while (node) {
    const current = node.textContent || '';
    const trimmed = current.trim();

    if (trimmed) {
      if (!ORIGINAL_TEXT.has(node)) {
        ORIGINAL_TEXT.set(node, current);
      }
      const original = ORIGINAL_TEXT.get(node) || current;
      const lastTranslated = TRANSLATED_TEXT.get(node);

      if (language === 'en') {
        // Restore only text we previously translated; otherwise keep live values.
        if (lastTranslated && current === lastTranslated) {
          node.textContent = original;
        } else {
          // Keep baseline synced for dynamic English values.
          ORIGINAL_TEXT.set(node, current);
        }
        TRANSLATED_TEXT.delete(node);
      } else {
        // If node changed since our last translation, refresh baseline from current text.
        if (!lastTranslated || current !== lastTranslated) {
          ORIGINAL_TEXT.set(node, current);
        }

        const source = ORIGINAL_TEXT.get(node) || current;
        const sourceTrimmed = source.trim();
        const translatedTrimmed = translateTextValue(sourceTrimmed, language);
        const translatedFull = translatedTrimmed !== sourceTrimmed
          ? source.replace(sourceTrimmed, translatedTrimmed)
          : source;

        if (current !== translatedFull) {
          node.textContent = translatedFull;
        }
        TRANSLATED_TEXT.set(node, translatedFull);
      }
    }

    node = walker.nextNode() as Text | null;
  }

  // Translate placeholders.
  const textFields = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]');
  textFields.forEach((el) => {
    const existingOriginal = el.getAttribute(ORIGINAL_PLACEHOLDER);
    if (!existingOriginal) {
      el.setAttribute(ORIGINAL_PLACEHOLDER, el.placeholder);
    }
    const original = el.getAttribute(ORIGINAL_PLACEHOLDER) || el.placeholder;
    if (language === 'en') {
      el.placeholder = original;
    } else {
      el.placeholder = autoRoPlaceholderMap[original] || translateTextValue(original, language);
    }
  });
}

const translations: Record<Language, Dictionary> = {
  en: {
    'layout.title.dashboard': 'Dashboard',
    'layout.title.chat': 'Smart Chat',
    'layout.title.map': 'Spending Map',
    'layout.title.confirm': 'Confirmations',
    'layout.title.invite': 'Invite Friends',
    'layout.title.join': 'Join Community',
    'layout.title.community': 'Community Feed',
    'layout.title.notifications': 'Notifications',
    'layout.title.settings': 'Settings',
    'layout.title.analytics': 'Analytics',
    'layout.title.default': 'Connect & Grow',
    'layout.quick.bank': 'Bank',
    'layout.quick.community': 'Community',
    'layout.profile': 'My Profile',
    'layout.settings': 'Settings',
    'layout.analytics': 'Analytics',
    'layout.signout': 'Sign Out',

    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your account experience.',
    'settings.section.preferences': 'Preferences',
    'settings.emailAlerts.title': 'Email Alerts',
    'settings.emailAlerts.subtitle': 'Receive notifications in your inbox.',
    'settings.pushAlerts.title': 'Push Alerts',
    'settings.pushAlerts.subtitle': 'Show immediate in-app notifications.',
    'settings.hideSmallAmounts.title': 'Hide Small Amounts',
    'settings.hideSmallAmounts.subtitle': 'Hide transactions below 10 RON in lists and analytics views.',
    'settings.language.title': 'Language',
    'settings.language.subtitle': 'Choose app language preference.',
    'settings.save': 'Save Settings',
    'settings.saved': 'Saved',
    'settings.language.english': 'English',
    'settings.language.romanian': 'Romanian',

    'notifications.title': 'Notifications',
    'notifications.subtitle': 'Stay up to date with important account activity.',
    'notifications.review': 'Review Confirmations',
    'notifications.section.recent': 'Recent Activity',
    'notifications.loading': 'Loading notifications...',
    'notifications.empty': 'No notifications right now.',
    'notifications.security.title': 'Security reminder',
    'notifications.security.subtitle': 'Enable extra verification for high-value payments.',
    'notifications.statement.title': 'Monthly statement available',
    'notifications.statement.subtitle': 'Your last monthly account statement is ready to download.',
    'notifications.today': 'Today',
    'notifications.yesterday': 'Yesterday',
    'notifications.confirmationRequired': 'Confirmation required:',
    'notifications.unknownMerchant': 'Unknown merchant',
    'notifications.category.transaction': 'Transaction',

    'analytics.title': 'Analytics',
    'analytics.subtitle': 'A quick overview of your spending behavior.',
    'analytics.totalSpend': 'Total Spend',
    'analytics.transactions': 'Transactions',
    'analytics.average': 'Average',
    'analytics.topCategory': 'Top Category',
    'analytics.savingsProgress': 'Savings Goal Progress',
    'analytics.savingsDescription': 'from your tracked spend target.',
    'analytics.breakdown': 'Category Breakdown',
    'analytics.noData': 'No transactions available.',
  },
  ro: {
    'layout.title.dashboard': 'Tablou de bord',
    'layout.title.chat': 'Chat Inteligent',
    'layout.title.map': 'Harta cheltuielilor',
    'layout.title.confirm': 'Confirmari',
    'layout.title.invite': 'Invita prieteni',
    'layout.title.join': 'Alatura-te comunitatii',
    'layout.title.community': 'Flux comunitate',
    'layout.title.notifications': 'Notificari',
    'layout.title.settings': 'Setari',
    'layout.title.analytics': 'Statistici',
    'layout.title.default': 'Connect & Grow',
    'layout.quick.bank': 'Banca',
    'layout.quick.community': 'Comunitate',
    'layout.profile': 'Profilul meu',
    'layout.settings': 'Setari',
    'layout.analytics': 'Statistici',
    'layout.signout': 'Deconectare',

    'settings.title': 'Setari',
    'settings.subtitle': 'Personalizeaza experienta contului tau.',
    'settings.section.preferences': 'Preferinte',
    'settings.emailAlerts.title': 'Alerte pe email',
    'settings.emailAlerts.subtitle': 'Primeste notificari in inbox.',
    'settings.pushAlerts.title': 'Alerte push',
    'settings.pushAlerts.subtitle': 'Afiseaza notificari imediate in aplicatie.',
    'settings.hideSmallAmounts.title': 'Ascunde sumele mici',
    'settings.hideSmallAmounts.subtitle': 'Ascunde tranzactiile sub 10 RON din liste si din vizualizarile de analiza.',
    'settings.language.title': 'Limba',
    'settings.language.subtitle': 'Alege limba aplicatiei.',
    'settings.save': 'Salveaza setarile',
    'settings.saved': 'Salvat',
    'settings.language.english': 'Engleza',
    'settings.language.romanian': 'Romana',

    'notifications.title': 'Notificari',
    'notifications.subtitle': 'Fii la curent cu activitatea importanta a contului.',
    'notifications.review': 'Verifica confirmarile',
    'notifications.section.recent': 'Activitate recenta',
    'notifications.loading': 'Se incarca notificarile...',
    'notifications.empty': 'Nu exista notificari acum.',
    'notifications.security.title': 'Memento de securitate',
    'notifications.security.subtitle': 'Activeaza verificare suplimentara pentru platile mari.',
    'notifications.statement.title': 'Extrasul lunar este disponibil',
    'notifications.statement.subtitle': 'Ultimul extras de cont lunar este gata de descarcare.',
    'notifications.today': 'Astazi',
    'notifications.yesterday': 'Ieri',
    'notifications.confirmationRequired': 'Confirmare necesara:',
    'notifications.unknownMerchant': 'Comerciant necunoscut',
    'notifications.category.transaction': 'Tranzactie',

    'analytics.title': 'Statistici',
    'analytics.subtitle': 'O privire rapida asupra comportamentului tau de cheltuire.',
    'analytics.totalSpend': 'Total cheltuieli',
    'analytics.transactions': 'Tranzactii',
    'analytics.average': 'Medie',
    'analytics.topCategory': 'Categoria principala',
    'analytics.savingsProgress': 'Progres obiectiv economii',
    'analytics.savingsDescription': 'din tinta ta de cheltuieli urmarite.',
    'analytics.breakdown': 'Defalcare pe categorii',
    'analytics.noData': 'Nu exista tranzactii disponibile.',
  },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: string) => string;
  tt: (en: string, ro: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'en';
    const parsed = JSON.parse(raw) as { language?: Language };
    return parsed.language === 'ro' ? 'ro' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  const setLanguage = (next: Language) => {
    setLanguageState(next);
  };

  useEffect(() => {
    const onStorage = () => {
      setLanguageState(getInitialLanguage());
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('language-changed', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('language-changed', onStorage);
    };
  }, []);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let raf = 0;

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => localizeDom(language));
    };

    schedule();

    observer = new MutationObserver(() => {
      schedule();
    });

    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = translations[language];
    return {
      language,
      setLanguage,
      t: (key: string) => dict[key] || translations.en[key] || key,
      tt: (en: string, ro: string) => (language === 'ro' ? ro : en),
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
