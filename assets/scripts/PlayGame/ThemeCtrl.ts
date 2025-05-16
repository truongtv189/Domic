import {
    _decorator, Component, Node, Prefab, resources, JsonAsset,
    instantiate, Sprite, SpriteFrame, UITransform, Size, tween, Vec3
} from 'cc';
import { DraggableItem } from './DraggableItem';

const { ccclass, property } = _decorator;

interface ThemeItem {
    image: string;
    isAds: boolean;
}

@ccclass('ThemeCtrl')
export class ThemeCtrl extends Component {
    @property(Prefab)
    itemPrefab: Prefab = null;

    @property(Node)
    ScrollView: Node = null;
    @property(Node)
    nodeCategoryFigure: Node = null;

    private readonly ANIMATION_DURATION = 0.2;
    private readonly SLIDE_DISTANCE = 800;
    private isAnimating = false;
    private originalPosition: Vec3;
    private imageData: ThemeItem[] = [];
    onLoad() {
        this.loadJsonData();
        this.ScrollView.active = false;
        this.originalPosition = this.ScrollView.getPosition(); // lưu vị trí gốc
    }

    private loadResource<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, (err, asset) => {
                if (err || !asset) {
                    reject(err || new Error('Asset not found'));
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
                    reject(err || new Error(`Failed to load sprite frame: ${path}`));
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
                console.warn('Invalid theme.json structure');
            }
        } catch (err) {
            console.error('Failed to load theme data:', err);
        }
    }

    async createImages() {
        this.nodeCategoryFigure.removeAllChildren();
        for (const data of this.imageData) {
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);

            // Hiển thị node ADS nếu cần
            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                adsNode.active = data.isAds;
            }

            try {
                const spriteFrame = await this.loadSpriteFrame(`PlayGame/${data.image}/spriteFrame`);
                const sprite = itemNode.getComponent(Sprite) || itemNode.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;

                const uiTransform = itemNode.getComponent(UITransform) || itemNode.addComponent(UITransform);
                uiTransform.setContentSize(new Size(100, 100)); // hoặc tuỳ chỉnh theo tỷ lệ ảnh
            } catch (err) {
                console.error(`Failed to load image: ${data.image}`, err);
            }
        }
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
        this.ScrollView.active = true;
        const startY = this.originalPosition.y + 600;
        this.ScrollView.setPosition(new Vec3(this.originalPosition.x, startY, this.originalPosition.z));

        tween(this.ScrollView)
            .to(this.ANIMATION_DURATION, { position: this.originalPosition }, { easing: 'backOut' })
            .start();
    }

}
