import { _decorator, Component, instantiate, Node, Prefab, Label, BlockInputEvents } from 'cc';
import { I18n } from '../I18n';
import AdsManager from '../AdsPlatform/AdsManager';
import { GameDataManager } from '../GameDataManager';
import { AudioManager } from '../AudioManager';
const { ccclass, property } = _decorator;

@ccclass('HomeCtrl')
export class HomeCtrl extends Component {
    @property(Prefab)
    PopUpLanguagePrefab: Prefab;
    @property(Node)
    PopUpLanguage: Node;
    @property(Prefab)
    popUpSettingPrefabs: Prefab;
    @property(Node)
    nodeOverlay: Node;
    @property(Node)
    popUpSetting: Node;
    @property(Prefab)
    LoadingContainer: Prefab = null;
    @property(Node) Loading: Node
    async start() {
        this.Loading.active = true;
        this.nodeOverlay.active = false;
        
        // Thêm BlockInputEvents component vào nodeOverlay
        if (!this.nodeOverlay.getComponent(BlockInputEvents)) {
            this.nodeOverlay.addComponent(BlockInputEvents);
        }

        const supportedLanguages = ['english', 'french', 'spanish', 'france', 'portuguese', 'deutsch', 'russian', 'turkey'];
        const langMap: Record<string, string> = {
            en: 'english',
            fr: 'france',
            es: 'spanish',
            pt: 'portuguese',
            de: 'deutsch',
            ru: 'russian',
            tr: 'turkey'
        };
        function normalizeLang(inputLang: string): string | null {
            if (!inputLang) return null;
            const lower = inputLang.toLowerCase();
            const mapped = langMap[lower] || lower;
            return supportedLanguages.includes(mapped) ? mapped : null;
        }

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const urlLang = urlParams.get('lang');
        const adsLang = AdsManager.getLanguage?.();
        const normalizedAdsLang = normalizeLang(adsLang);
        let currentLang = normalizedAdsLang || 'english';
        GameDataManager.getInstance().updateField("language", currentLang);

        // Load language
        await I18n.loadLanguage(currentLang);

        // Cập nhật tất cả Label sau khi load ngôn ngữ
        this.updateLabelsInPrefab(this.node);

        this.Loading.active = false;
    }

    onShowPopupSetting() {
        AudioManager.getInstance().playClickClip()
        // Đóng PopUpLanguage nếu đang mở
        if (this.PopUpLanguage.active) {
            this.PopUpLanguage.active = false;
            this.nodeOverlay.active = false;
        }

        const loadingNode = instantiate(this.popUpSettingPrefabs);
        this.popUpSetting.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.popUpSetting.active = true;
        this.nodeOverlay.active = true;

        // Cập nhật label trong Prefab khi nó đã được tạo
        this.updateLabelsInPrefab(loadingNode);
    }
    onOpenLanguage() {
        AudioManager.getInstance().playClickClip()
        // Đóng popUpSetting nếu đang mở
        if (this.popUpSetting.active) {
            this.popUpSetting.active = false;
            this.nodeOverlay.active = false;
        }

        const loadingNode = instantiate(this.PopUpLanguagePrefab);
        this.PopUpLanguage.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.PopUpLanguage.active = true;
        this.nodeOverlay.active = true;

        // Cập nhật label trong Prefab khi nó đã được tạo
        this.updateLabelsInPrefab(loadingNode);
    }

    // Hàm cập nhật các label trong prefab khi nó được instantiate
    updateLabelsInPrefab(prefabNode: Node) {
        prefabNode.children.forEach((childNode) => {
            const label = childNode.getComponent(Label);
            if (label) {
                const labelKey = childNode.name;  // Giả sử tên node là key label
                const translatedString = I18n.t(labelKey); // Lấy bản dịch của label từ I18n
                if (translatedString) {
                    label.string = translatedString; // Cập nhật label
                }
            }
            // Đệ quy kiểm tra các node con
            if (childNode.children.length > 0) {
                this.updateLabelsInPrefab(childNode);
            }
        });
    }
}
