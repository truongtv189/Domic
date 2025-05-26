import { _decorator, Asset, Component, director, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D, Size, Widget, UITransform, Canvas, ScrollView, Vec2 } from 'cc';
import { GameDataManager } from '../GameDataManager';
import { LoadingCtrl } from '../LoadingCtrl';
import { LoadingManager } from '../LoadingManager';
import AdsManager from '../AdsPlatform/AdsManager';
import { AudioManager } from '../AudioManager';
const { ccclass, property } = _decorator;

@ccclass('CategoryPageCtrl')
export class CategoryPageCtrl extends Component {
    private imageData: any[] = [];
    @property(ScrollView)
    pageView: ScrollView = null;
    @property(Prefab)
    itemPrefab: Prefab = null;
    @property(Prefab)
    LoadingContainer: Prefab = null;
    @property(Node)
    Loading: Node;
    private spriteCache: Map<string, SpriteFrame> = new Map();

    protected onLoad(): void {
        const loadingNode = instantiate(this.LoadingContainer);
        this.Loading.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.Loading.active = true;
        this.loadJsonData();
        this.Loading.active = false;
    }

    // Load JSON data
    async loadJsonData() {
        try {
            const jsonPaths = ['datacategory']; // Đảm bảo 'datacategory' là đúng đường dẫn
            const [jsonAsset] = await Promise.all(jsonPaths.map(path => this.loadResource<JsonAsset>(path)));
            this.imageData = jsonAsset.json.CATEGORY; // Dữ liệu có trong 'CATEGORY'
            this.createImages();
        } catch (err) {
            console.error("Failed to load JSON:", err);
        }
    }
    // Load resource helper function
    private loadResource<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, (err, asset) => {
                if (err) reject(err);
                else resolve(asset as T);
            });
        });
    }
    // Tạo ảnh từ dữ liệu JSON
    private createImages() {
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        const totalItems = this.imageData.length;
        const rows = 2; // Số hàng cố định
        const spacingX = 50;
        const spacingY = 50;

        // Lấy content node từ ScrollView
        const content = this.pageView.content;
        if (!content) return;

        // Xóa các items cũ
        content.removeAllChildren();

        // Lấy kích thước của item prefab
        const itemNode = instantiate(this.itemPrefab);
        const itemWidth = itemNode.getComponent(UITransform)?.contentSize.width || 0;
        const itemHeight = itemNode.getComponent(UITransform)?.contentSize.height || 0;
        itemNode.destroy();

        // Tính toán số cột cần thiết
        const columns = Math.ceil(totalItems / rows);

        // Tính toán kích thước content
        const contentWidth = columns * itemWidth + (columns - 1) * spacingX;
        const contentHeight = rows * itemHeight + (rows - 1) * spacingY;

        // Set content size cho ScrollView
        const contentUITransform = content.getComponent(UITransform);
        if (contentUITransform) {
            contentUITransform.setContentSize(contentWidth, contentHeight);
        }

        // Tạo items cho ScrollView
        this.imageData.forEach((itemData, idx) => {
            const itemNode = instantiate(this.itemPrefab);
            const imageNode = itemNode.getChildByName('Image');
            const adsNode = imageNode?.getChildByName('ADS');
            const labelNode = itemNode.getChildByName('Label');
            const icon = imageNode?.getComponent(Sprite);
            const nameLabel = labelNode?.getComponent(Label);
            if (nameLabel) nameLabel.string = itemData.name;

            const itemKey = itemData.code;
            const isUnlocked = watched[itemKey] === true;

            if (adsNode) {
                adsNode.active = itemData.isAds === true && !isUnlocked;
            }

            itemNode['itemData'] = itemData;
            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.onItemClicked(itemNode);
            });

            // Tính toán vị trí cho cuộn ngang
            const col = Math.floor(idx / rows);
            const row = idx % rows;
            const x = col * (itemWidth + spacingX);
            const y = -row * (itemHeight + spacingY);
            itemNode.setPosition(x, y, 0);

            content.addChild(itemNode);

            const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
            this.loadImageFromResource(imagePath, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
            });
        });

        const scrollView = this.pageView.getComponent(ScrollView);
        const viewWidth = scrollView.node.getComponent(UITransform)?.contentSize.width || 0;

        // Nếu content nhỏ hơn viewport, căn giữa content
        if (contentWidth < viewWidth) {
            content.setPosition((viewWidth - contentWidth) / 2, content.position.y, content.position.z);
        } else {
            content.setPosition(0, content.position.y, content.position.z);
            // Nếu muốn scroll đến giữa khi content lớn hơn viewport
            this.scheduleOnce(() => {
                scrollView.scrollToPercentHorizontal(0.5, 0, false);
            }, 0);
        }
    }

    private onItemClicked(itemNode: Node) {
        AudioManager.getInstance().playClickClip()
        const data = itemNode['itemData'];
        if (data) {
            const logoData = {
                code: data.code,
                image: data.image,
                isAds: data.isAds,
                name: data.name,
                figure: data.figure,
                animation: data.animation,
                loadingCategory: data.loadingCategory,
                backgorund: data.backgorund,
                backgorund1: data.backgorund1,
                isDis: data.isDis,
                isRotateMove: data.isRotateMove
            };

            // Ẩn node ADS cho cả hai trường hợp
            const imageNode = itemNode.getChildByName('Image');
            const adsNode = imageNode?.getChildByName('ADS');
            if (adsNode) {
                adsNode.active = false;
            }

            if (logoData.isAds === true) {
                AdsManager.showRewarded((status) => {
                    if (status) {
                        const watched = GameDataManager.getInstance().data.watchedAdsItems;
                        watched[data.code] = true;

                        GameDataManager.getInstance().updateField('watchedAdsItems', watched);
                        GameDataManager.getInstance().updateField('ItemSelect', logoData);

                        this.Loading.active = true;
                        AudioManager.getInstance().stopBGM();
                        setTimeout(() => {
                            director.loadScene('playgame');
                        }, 100);
                    }
                });
            } else {
                // Handle non-ads items
                GameDataManager.getInstance().updateField('ItemSelect', logoData);
                this.Loading.active = true;
                AudioManager.getInstance().stopBGM();
                setTimeout(() => {
                    director.loadScene('playgame');
                }, 100);
            }
        }
    }

    // Hàm load ảnh từ resources
    loadImageFromResource(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        if (this.spriteCache.has(path)) {
            callback(this.spriteCache.get(path));
            return;
        }
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn("Load image failed:", path);
                callback(null);
            } else {
                this.spriteCache.set(path, spriteFrame); // cache
                callback(spriteFrame);
            }
        });
    }
    
}
