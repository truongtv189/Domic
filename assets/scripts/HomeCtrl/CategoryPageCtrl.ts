import { _decorator, Asset, Component, director, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D } from 'cc';
import { GameDataManager } from '../GameDataManager';
import { LoadingCtrl } from '../LoadingCtrl';
import { LoadingManager } from '../LoadingManager';
import AdsManager from '../AdsPlatform/AdsManager';
const { ccclass, property } = _decorator;

@ccclass('CategoryPageCtrl')
export class CategoryPageCtrl extends Component {
    private imageData: any[] = [];
    @property(PageView)
    pageView: PageView = null;
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
        const totalPages = this.pageView.getPages().length;
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {}; // Tránh null
        const itemsPerPage = Math.ceil(this.imageData.length / totalPages);
        const dataPerPage: any[][] = [];
        for (let i = 0; i < totalPages; i++) {
            dataPerPage.push(this.imageData.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
        }
        const pages = this.pageView.getPages();
        pages.forEach((pageNode, pageIndex) => {
            const layout = pageNode.getChildByName('Layout');
            if (!layout) return;
            layout.removeAllChildren();
            const items = dataPerPage[pageIndex] || [];
            items.forEach((itemData) => {
                const itemNode = instantiate(this.itemPrefab);
                const icon = itemNode.getComponent(Sprite);
                const nameLabel = itemNode.getChildByName("Label")?.getComponent(Label);
                if (nameLabel) nameLabel.string = itemData.name;
                // Check if item has been unlocked (watched ad)
                const itemKey = itemData.code;
                const isUnlocked = watched[itemKey] === true;
                // Handle ADS node visibility
                const adsNode = itemNode.getChildByName("ADS");
                if (adsNode) {
                    adsNode.active = itemData.isAds === true && !isUnlocked;
                }
                // Gán dữ liệu cho node
                itemNode['itemData'] = itemData;
                // Gán sự kiện click
                itemNode.on(Node.EventType.TOUCH_END, () => {
                    this.onItemClicked(itemNode);
                });
                layout.addChild(itemNode);
                // Load sprite image
                const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
                this.loadImageFromResource(imagePath, (spriteFrame) => {
                    if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
                });
            });
        });
    }


    private onItemClicked(itemNode: Node) {
        const data = itemNode['itemData'];
        if (data) {
            const logoData = {
                core: data.core,
                image: data.image,
                isAds: data.isAds,
                name: data.name,
                figure: data.figure,
                animation: data.animation,
                loadingCategory: data.loadingCategory
            };
            if (logoData.isAds === true) {
                AdsManager.showRewarded((status) => {
                    if (status) {
                        // Đánh dấu item đã xem quảng cáo
                        const watched = GameDataManager.getInstance().data.watchedAdsItems;
                        watched[data.code] = true;
                        GameDataManager.getInstance().updateField('watchedAdsItems', watched);
                        GameDataManager.getInstance().updateField('ItemSelect', logoData);
                        this.Loading.active = true;
                        setTimeout(() => {
                            director.loadScene('playgame');
                        }, 100);
                    }
                });
            }
        }
    }

    // Hàm load ảnh từ resources
    loadImageFromResource(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn("Load image failed:", path);
                callback(null);
            } else {
                callback(spriteFrame);
            }
        });
    }
}
