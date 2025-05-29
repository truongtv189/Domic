import { _decorator, Component, Node, EventTouch, director, Label, Scene, Director, find } from 'cc';
import { I18n } from './I18n';
import { GameDataManager } from './GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('LanguageCtrl')
export class LanguageCtrl extends Component {
    @property(Node) PopupLanguage: Node; // Node popup ngôn ngữ

    // Thêm biến static để lưu trữ tất cả các scene
    private static allScenes: Scene[] = [];
    private static instance: LanguageCtrl = null;

    onLoad() {
        // Set instance
        if (!LanguageCtrl.instance) {
            LanguageCtrl.instance = this;
        }

        // Get saved language from GameDataManager
        const savedLang = GameDataManager.getInstance().data.language;
        console.log('LanguageCtrl - Loading saved language:', savedLang);
        
        if (!savedLang) {
            console.warn('LanguageCtrl - No saved language found, using default');
            return;
        }
        
        // Load language and update UI
        I18n.loadLanguage(savedLang).then(() => {
            // Update all labels in current scene
            I18n.updateAllLabels(director.getScene());
            
            // Add click handlers for language selection
            this.PopupLanguage.children.forEach((langNode) => {
                if (langNode.name !== 'CloseLanguage') {
                    langNode.on(Node.EventType.TOUCH_END, this.onLanguageSelected, this);
                }
            });
            
            // Update checkbox to show current language
            this.updateCheckbox(savedLang);
        }).catch(error => {
            console.error('LanguageCtrl - Error loading language:', error);
        });

        // Add current scene to tracked scenes
        const currentScene = director.getScene();
        if (currentScene && !LanguageCtrl.allScenes.includes(currentScene)) {
            LanguageCtrl.allScenes.push(currentScene);
        }

        // Listen for scene changes
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLoaded, this);
    }

    onDestroy() {
        // Remove scene change listener
        director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLoaded, this);
    }

    private onSceneLoaded(scene: Scene) {
        if (scene && !LanguageCtrl.allScenes.includes(scene)) {
            LanguageCtrl.allScenes.push(scene);
            // Get current language and update labels in the new scene
            const currentLang = GameDataManager.getInstance().data.language;
            console.log('LanguageCtrl - Updating new scene with language:', currentLang);
            I18n.loadLanguage(currentLang).then(() => {
                I18n.updateAllLabels(scene);
            }).catch(error => {
                console.error('LanguageCtrl - Error updating scene language:', error);
            });
        }
    }

    onHidePopupLanguage() {
        this.PopupLanguage.active = false;
        // Tìm và ẩn nodeOverlay
        const nodeOverlay = find('Canvas/nodeOverlay');
        if (nodeOverlay) {
            nodeOverlay.active = false;
        }
    }
    async onLanguageSelected(event: EventTouch) {
        const selectedNode = event.target as Node;
        const langCode = selectedNode.name;  // Lấy tên node làm mã ngôn ngữ
        console.log('LanguageCtrl - Language selected:', langCode);
        
        if (!langCode) {
            console.warn('LanguageCtrl - Invalid language code selected');
            return;
        }
        
        // Thay đổi ngôn ngữ và cập nhật checkbox
        await this.setLanguage(langCode);
        this.updateCheckbox(langCode);  // Cập nhật checkbox tương ứng
    }

    async setLanguage(langCode: string) {
        try {
            if (!langCode) {
                console.warn('LanguageCtrl - Attempted to set empty language code');
                return;
            }

            console.log('LanguageCtrl - Setting language to:', langCode);
            
            // Save to GameDataManager first
            GameDataManager.getInstance().updateField('language', langCode);
            
            // Load new language
            await I18n.loadLanguage(langCode);
            
            // Update all scenes
            LanguageCtrl.updateAllScenes();
            
            // Update labels in PopupLanguage if exists
            if (this.PopupLanguage) {
                I18n.updateAllLabels(this.PopupLanguage);
            }

            // Verify the language was saved correctly
            const savedLang = GameDataManager.getInstance().data.language;
            console.log('LanguageCtrl - Verified saved language:', savedLang);
            
            if (savedLang !== langCode) {
                console.error('LanguageCtrl - Language verification failed. Expected:', langCode, 'Got:', savedLang);
            }
        } catch (error) {
            console.error('LanguageCtrl - Error setting language:', error);
        }
    }

    private static updateAllScenes() {
        const currentLang = GameDataManager.getInstance().data.language;
        console.log('LanguageCtrl - Updating all scenes with language:', currentLang);
        
        // Update language for all tracked scenes
        LanguageCtrl.allScenes.forEach(scene => {
            if (scene && scene.isValid) {
                I18n.updateAllLabels(scene);
            }
        });
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
