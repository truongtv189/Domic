import { _decorator, Component, Node, EventTouch, director, Label } from 'cc';
import { I18n } from './I18n';
import { GameDataManager } from './GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('LanguageCtrl')
export class LanguageCtrl extends Component {
    @property(Node) PopupLanguage: Node; // Node popup ngôn ngữ

    async onLoad() {
        const savedLang = GameDataManager.getInstance().data.language || 'english';
        await I18n.loadLanguage(savedLang);
        I18n.updateAllLabels(director.getScene());
        this.PopupLanguage.children.forEach((langNode) => {
            if (langNode.name !== 'CloseLanguage') {
                langNode.on(Node.EventType.TOUCH_END, this.onLanguageSelected, this);
            }
        });
        this.updateCheckbox(savedLang);
    }
    onHidePopupLanguage() {
        this.PopupLanguage.active = false;
    }
    async onLanguageSelected(event: EventTouch) {
        const selectedNode = event.target as Node;
        const langCode = selectedNode.name;  // Lấy tên node làm mã ngôn ngữ
        // Thay đổi ngôn ngữ và cập nhật checkbox
        await this.setLanguage(langCode);
        this.updateCheckbox(langCode);  // Cập nhật checkbox tương ứng
    }

    async setLanguage(langCode: string) {
        try {
            // Tải lại ngôn ngữ mới
            await I18n.loadLanguage(langCode);
            GameDataManager.getInstance().updateField('language', langCode);
            // Cập nhật label trong toàn bộ scene
            I18n.updateAllLabels(director.getScene());
            // Cập nhật lại label trong PopupLanguage nếu có
            if (this.PopupLanguage) {
                I18n.updateAllLabels(this.PopupLanguage);
            }

        } catch (error) {
        }
    }

    // Cập nhật checkbox cho node ngôn ngữ đã chọn
    updateCheckbox(currentLang: string) {
        this.PopupLanguage.children.forEach((langNode) => {
            const checkbox = langNode.getChildByName('Checkbox');
            if (checkbox) {
                checkbox.active = (langNode.name === currentLang);  // Hiển thị checkbox tương ứng
            }
        });
    }
}
