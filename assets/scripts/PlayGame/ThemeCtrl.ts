import {
    _decorator, Component, Node, Prefab, resources, JsonAsset,
    instantiate, Sprite, SpriteFrame, UITransform, Size, tween, Vec3, EventTarget
} from 'cc';
import AdsManager from '../AdsPlatform/AdsManager';
import { GameDataManager } from '../GameDataManager';
export { themeEventTarget };
const { ccclass, property } = _decorator;
const themeEventTarget = new EventTarget(); // Export nó

// Trong ThemeCtrl.ts
interface ThemeItem {
    image: string;
    isAds: boolean;
    core?: string; // Thêm core để lưu trạng thái đã xem ads
}

@ccclass('ThemeCtrl')
export class ThemeCtrl extends Component {
    public static instance: ThemeCtrl = null;
    @property(Prefab)
    itemPrefab: Prefab = null;
    @property(Node)
    ScrollView: Node = null;
    @property(Node)
    nodeCategoryFigure: Node = null;
    private selectedItem: Node | null = null;
    private readonly ANIMATION_DURATION = 0.2;
    private originalPosition: Vec3;
    private imageData: ThemeItem[] = [];
    onLoad() {
        this.originalPosition = this.ScrollView.getPosition(); // lưu vị trí gốc
        this.loadJsonData();
        this.ScrollView.active = false;
    }

    private loadResource<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, (err, asset) => {
                if (err || !asset) {
                    reject(err || new Error());
                } else {
                    resolve(asset as T);
                }
            });
        });
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            resources.load(path, SpriteFrame, (err, spriteFrame) => {
                if (err || !spriteFrame) {
                    reject(err || new Error());
                    return;
                }
                resolve(spriteFrame);
            });
        });
    }

    async loadJsonData() {
        try {
            const jsonAsset = await this.loadResource<JsonAsset>('theme'); // resources/theme.json
            const raw = jsonAsset.json;
            if (raw && raw.THEME && Array.isArray(raw.THEME)) {
                this.imageData = raw.THEME;
                await this.createImages();
            } else {
            }
        } catch (err) {
        }
    }

    async createImages() {
        this.nodeCategoryFigure.removeAllChildren();
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        
        for (const data of this.imageData) {
            const itemNode = instantiate(this.itemPrefab);
            const checkNode = itemNode.getChildByName("Check");
            if (checkNode) checkNode.active = false;
            this.nodeCategoryFigure.addChild(itemNode);
            
            // Hiển thị node ADS nếu item chưa được xem ads
            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                adsNode.active = data.isAds && !watched[data.core];
            }

            try {
                const spriteFrame = await this.loadSpriteFrame(`PlayGame/${data.image}/spriteFrame`);
                const sprite = itemNode.getComponent(Sprite) || itemNode.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;
                const uiTransform = itemNode.getComponent(UITransform) || itemNode.addComponent(UITransform);
                uiTransform.setContentSize(new Size(100, 100));
            } catch (err) {
            }
            if (!this.selectedItem) {
                this.selectedItem = itemNode;
                const checkNode = itemNode.getChildByName("Check");
                if (checkNode) checkNode.active = true;
            }
            
            // Lưu data vào node để sử dụng sau này
            itemNode['itemData'] = data;
            
            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.onSelectItem(itemNode);
            }, this);
        }
    }

    private onSelectItem(itemNode: Node) {
        const data = itemNode['itemData'] as ThemeItem;
        if (!data) return;
        if (data.isAds) {
            AdsManager.showRewarded((status) => {
                if (status) {
                    // Cập nhật trạng thái đã xem ads
                    const watched = GameDataManager.getInstance().data.watchedAdsItems;
                    watched[data.core] = true;
                    GameDataManager.getInstance().updateField('watchedAdsItems', watched);
                    // Ẩn node ads
                    const adsNode = itemNode.getChildByName("ADS");
                    if (adsNode) {
                        adsNode.active = false;
                    }
                    // Cập nhật data
                    data.isAds = false;
                    // Xử lý chọn theme
                    this.handleThemeSelection(itemNode, data);
                }
            });
        } else {
            // Xử lý chọn theme nếu không cần xem ads
            this.handleThemeSelection(itemNode, data);
        }
    }

    private handleThemeSelection(itemNode: Node, data: ThemeItem) {
        if (this.selectedItem === itemNode) return;
        // Ẩn check ở item cũ
        const oldCheck = this.selectedItem?.getChildByName("Check");
        if (oldCheck) oldCheck.active = false;

        // Hiện check ở item mới
        const newCheck = itemNode.getChildByName("Check");
        if (newCheck) newCheck.active = true;

        this.selectedItem = itemNode;
        this.ScrollView.active = false;

        // Emit sự kiện theme đã được chọn
        themeEventTarget.emit('theme-selected', data);
    }

    onClickHideTheme() {
        tween(this.ScrollView)
            .to(this.ANIMATION_DURATION, { position: new Vec3(0, 500, 0) }, { easing: 'quartIn' })
            .call(() => {
                this.ScrollView.active = false;
            })
            .start();
    }
    onClickOpenTheme() {
        if (!this.originalPosition) {
            console.warn("originalPosition is undefined");
            return;
        }
        this.ScrollView.active = true;
        const startY = this.originalPosition.y + 600;
        this.ScrollView.setPosition(new Vec3(this.originalPosition.x, startY, this.originalPosition.z));

        tween(this.ScrollView)
            .to(this.ANIMATION_DURATION, { position: this.originalPosition }, { easing: 'backOut' })
            .start();
    }


}
