import CryptoJS from "crypto-js";

export interface ItemSelect {
    code: string;
    image: string;
    isAds: boolean;
    name: string;
    figure: string;
    animation: string;
    loadingCategory: string;
    backgorund: string;
    backgorund1: string;
}
interface ThemeItem {
    image: string;
    isAds: boolean;
    color1: string;
    color2: string;
}

export interface GameDataType {
    language: string;
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    ItemSelect: ItemSelect;
    ItemSlectTheme: ThemeItem;
    watchedAdsItems: {
        [key: string]: boolean;
    }
}

const KEY = 'GameData';
const SECRET_KEY = 'your_secret_key'; // sử dụng từ env nếu cần

export class GameDataManager {
    private static _instance: GameDataManager;
    public data: GameDataType;

    private constructor() {
        this.data = this.load();
    }

    public static getInstance(): GameDataManager {
        if (!this._instance) {
            this._instance = new GameDataManager();
        }
        return this._instance;
    }

    private encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    }

    public decrypt(data: string): string {
        try {
            const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return '';
        }
    }

    public load(): GameDataType {
        const defaultData: GameDataType = {
            language: "english",
            masterVolume: 1,
            bgmVolume: 1,
            sfxVolume: 1,
            ItemSelect: {
                code: "", image: "", isAds: false, name: "", figure: "",
                animation: "", loadingCategory: "", backgorund: "", backgorund1: ""
            },
            ItemSlectTheme: {
                image: "",
                isAds: false,
                color1: "",
                color2: ""
            },
            watchedAdsItems: {}
        };

        let raw: any = {};
        const encrypted = localStorage.getItem(KEY);
        if (encrypted) {
            const decrypted = this.decrypt(encrypted);
            try {
                raw = JSON.parse(decrypted);
                if (typeof raw.selectedLogo === 'string') {
                    try {
                        raw.selectedLogo = JSON.parse(raw.selectedLogo);
                    } catch {
                        raw.selectedLogo = { imagePath: "", imageName: "" };
                    }
                }
            } catch (e) { }
        }

        return { ...defaultData, ...raw };
    }
    // Gọi hàm này khi game khởi động
    checkAndApplyDataFromQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        const encrypted = urlParams.get("data");
        if (!encrypted) {
            return;
        }

        try {
            const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            const parsed = JSON.parse(decrypted);
            const manager = GameDataManager.getInstance();
            Object.assign(manager.data, parsed);
            manager.save();
        } catch (e) {
        }
    }
    public static version: string = "0015";
    public static RemoteConfig: {
        cdn: string;
    } = {
            cdn: "http://127.0.0.1:8000",
        };
    public static fetchRemoteConfig(cb?: () => void): void {
        const win: any = window;
        if (win.ysdk) {
            win.ysdk.getFlags().then((flags: Record<string, any>) => {
                if (flags) {
                    for (let prop in flags) {
                        if (flags.hasOwnProperty(prop) && !prop.startsWith("forVersion")) {
                            const currentValue = this.RemoteConfig[prop];
                            if (typeof currentValue === "string") {
                                this.RemoteConfig[prop] = flags[prop];
                            } else if (typeof currentValue === "boolean") {
                                this.RemoteConfig[prop] = flags[prop] === "true" || flags[prop] === true;
                            } else {
                                this.RemoteConfig[prop] = parseInt(flags[prop]);
                            }
                        }
                    }

                    const versionKey = `forVersion_${this.version}`;
                    if (flags[versionKey]) {
                        try {
                            const versionFlags = JSON.parse(flags[versionKey]);
                            for (let prop in versionFlags) {
                                const currentValue = this.RemoteConfig[prop];
                                if (typeof currentValue === "string") {
                                    this.RemoteConfig[prop] = versionFlags[prop];
                                } else if (typeof currentValue === "boolean") {
                                    this.RemoteConfig[prop] = versionFlags[prop] === "true" || versionFlags[prop] === true;
                                } else {
                                    this.RemoteConfig[prop] = parseInt(versionFlags[prop]);
                                }
                            }
                        } catch (e) {
                            console.warn("Không thể parse forVersion config:", e);
                        }
                    }
                }

                cb?.();
            });
        } else {
            cb?.();
        }
    }

    public reload() {
        this.data = this.load();
    }

    public get<K extends keyof GameDataType>(key: K): GameDataType[K] {
        return this.data[key];
    }

    public updateField<K extends keyof GameDataType>(key: K, value: GameDataType[K]) {
        this.data[key] = value;
        this.save();
    }

    public saveDynamicField(key: string, value: any) {
        (this.data as any)[key] = value;
        this.save();
    }

    public loadDynamicField<T = any>(key: string): T | undefined {
        return (this.data as any)[key];
    }
    public save() {
        const str = JSON.stringify(this.data);
        const encrypted = this.encrypt(str);
        localStorage.setItem(KEY, encrypted);
    }


}
