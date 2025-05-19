import { en } from '../../i18n/en';
import { vi } from '../../i18n/vi';
import { sys } from 'cc';

export class I18nService {
    private static instance: I18nService;
    private currentLanguage: string = 'en';
    private translations: { [key: string]: any } = {
        en,
        vi
    };

    private constructor() {
        // Load saved language preference
        const savedLang = sys.localStorage.getItem('language');
        if (savedLang) {
            this.currentLanguage = savedLang;
        }
    }

    public static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    public setLanguage(lang: string): void {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            sys.localStorage.setItem('language', lang);
        }
    }

    public t(key: string): string {
        const keys = key.split('.');
        let result = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (result[k] === undefined) {
                return key;
            }
            result = result[k];
        }
        
        return result;
    }

    public getCurrentLanguage(): string {
        return this.currentLanguage;
    }
} 