import {
    _decorator, Component, Node, Prefab, resources, JsonAsset,
    instantiate, Sprite, SpriteFrame, UITransform, Size, tween, Vec3, EventTarget,
    view, Canvas
} from 'cc';
import AdsManager from '../AdsPlatform/AdsManager';
import { GameDataManager } from '../GameDataManager';
import { AudioManager } from '../AudioManager';
export { themeEventTarget };
const { ccclass, property } = _decorator;
const themeEventTarget = new EventTarget(); // Export nó

// Trong ThemeCtrl.ts
interface ThemeItem {
    image: string;
    isAds: boolean;
    core?: string; // Thêm core để lưu trạng thái đã xem ads
    color1?: string;
    color?: string;
    color2: string;
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
    @property(Canvas)
    canvas: Canvas = null;

    private selectedItem: Node | null = null;
    private readonly ANIMATION_DURATION = 0.2;
    private originalPosition: Vec3;
    private imageData: ThemeItem[] = [];
    private readonly BASE_ITEM_SIZE = 200; // Kích thước cơ bản của item

    onLoad() {
        this.originalPosition = this.ScrollView.getPosition();
        this.loadJsonData();
        this.ScrollView.active = false;

        // Đăng ký lắng nghe sự kiện thay đổi kích thước canvas
        view.on('canvas-resize', this.onCanvasResize, this);

        // Khởi tạo kích thước ban đầu
        this.updateItemsScale();
    }

    onDestroy() {
        // Hủy đăng ký sự kiện khi component bị hủy
        view.off('canvas-resize', this.onCanvasResize, this);
    }

    private onCanvasResize() {
        this.updateItemsScale();
    }

    private updateItemsScale() {
        if (!this.nodeCategoryFigure) return;

        const canvasSize = view.getVisibleSize();
        const scaleFactor = Math.min(canvasSize.width / 1280, canvasSize.height / 720); // Giả sử 1280x720 là kích thước thiết kế cơ bản

        // Cập nhật kích thước cho tất cả các item
        this.nodeCategoryFigure.children.forEach(item => {
            const uiTransform = item.getComponent(UITransform);
            if (uiTransform) {
                const newSize = this.BASE_ITEM_SIZE * scaleFactor;
                uiTransform.setContentSize(new Size(newSize, newSize));
            }
        });
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
            console.log('Loading theme data...');
            const jsonAsset = await this.loadResource<JsonAsset>('theme'); // resources/theme.json
            const raw = jsonAsset.json;
            if (raw && raw.THEME && Array.isArray(raw.THEME)) {
                console.log('Loaded theme data:', raw.THEME);
                this.imageData = raw.THEME;
                await this.createImages();
            } else {
                console.error('Invalid theme data format');
            }
        } catch (err) {
            console.error('Error loading theme data:', err);
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
                const canvasSize = view.getVisibleSize();
                const scaleFactor = Math.min(canvasSize.width / 1280, canvasSize.height / 720);
                const newSize = this.BASE_ITEM_SIZE * scaleFactor;
                uiTransform.setContentSize(new Size(newSize, newSize));
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
        AudioManager.getInstance().playClickClip()
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
        console.log('Handling theme selection for data:', data);
        
        // Validate theme data
        if (!data.color1 && !data.color) {
            console.error('No primary color found in theme data');
            return;
        }
        if (!data.color2) {
            console.error('No secondary color found in theme data');
            return;
        }

        // Ẩn check ở item cũ
        const oldCheck = this.selectedItem?.getChildByName("Check");
        if (oldCheck) oldCheck.active = false;

        // Hiện check ở item mới
        const newCheck = itemNode.getChildByName("Check");
        if (newCheck) newCheck.active = true;

        this.selectedItem = itemNode;
        this.ScrollView.active = false;

        // Create a copy of the theme data to ensure all required properties
        const themeData = {
            color1: data.color1 || data.color,
            color2: data.color2
        };

        // Emit sự kiện theme đã được chọn
        console.log('Emitting theme-selected event with data:', themeData);
        themeEventTarget.emit('theme-selected', themeData);
    }

    onClickHideTheme() {
        AudioManager.getInstance().playClickClip()
        tween(this.ScrollView)
            .to(this.ANIMATION_DURATION, { position: new Vec3(0, 500, 0) }, { easing: 'quartIn' })
            .call(() => {
                this.ScrollView.active = false;
            })
            .start();
    }
    onClickOpenTheme() {
        AudioManager.getInstance().playClickClip()
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
