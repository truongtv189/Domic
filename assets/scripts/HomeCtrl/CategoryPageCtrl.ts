import { _decorator, Asset, Component, director, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D, Size, Widget } from 'cc';
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
    @property(Layout)
    page1Layout: Layout = null;
    @property(Layout)
    page2Layout: Layout = null;
    private spriteCache: Map<string, SpriteFrame> = new Map();

    protected onLoad(): void {
        const loadingNode = instantiate(this.LoadingContainer);
        this.Loading.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.Loading.active = true;
        this.setupLayouts();
        this.loadJsonData();
        this.Loading.active = false;
    }

    private setupLayouts() {
        // Cấu hình Widget cho page1Layout
        if (this.page1Layout) {
            const widget1 = this.page1Layout.node.getComponent(Widget) || this.page1Layout.node.addComponent(Widget);
            widget1.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
            widget1.isAlignLeft = true;
            widget1.isAlignRight = true;
            widget1.left = 0;
            widget1.right = 0;
            widget1.isAlignTop = true;
            widget1.isAlignBottom = true;
            widget1.top = 0;
            widget1.bottom = 0;
            widget1.updateAlignment();
        }

        // Cấu hình Widget cho page2Layout
        if (this.page2Layout) {
            const widget2 = this.page2Layout.node.getComponent(Widget) || this.page2Layout.node.addComponent(Widget);
            widget2.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
            widget2.isAlignLeft = true;
            widget2.isAlignRight = true;
            widget2.left = 0;
            widget2.right = 0;
            widget2.isAlignTop = true;
            widget2.isAlignBottom = true;
            widget2.top = 0;
            widget2.bottom = 0;
            widget2.updateAlignment();
        }
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
        const itemsPerPage = Math.ceil(totalItems / 2);

        // Lấy content node từ PageView
        const content = this.pageView.content;
        if (!content) return;

        // Lấy 2 page từ content
        const page1 = content.children[0];
        const page2 = content.children[1];
        if (!page1 || !page2) return;

        // Xóa các items cũ
        page1.removeAllChildren();
        page2.removeAllChildren();

        // Cấu hình Layout cho page1
        const layout1 = page1.getComponent(Layout) || page1.addComponent(Layout);
        layout1.type = Layout.Type.GRID;
        layout1.cellSize = new Size(200, 200); // Điều chỉnh kích thước cell theo nhu cầu
        layout1.spacingX = 20;
        layout1.spacingY = 20;
        layout1.startAxis = Layout.AxisDirection.HORIZONTAL;
        layout1.resizeMode = Layout.ResizeMode.CONTAINER;

        // Cấu hình Layout cho page2
        const layout2 = page2.getComponent(Layout) || page2.addComponent(Layout);
        layout2.type = Layout.Type.GRID;
        layout2.cellSize = new Size(200, 200);
        layout2.spacingX = 20;
        layout2.spacingY = 20;
        layout2.startAxis = Layout.AxisDirection.HORIZONTAL;
        layout2.resizeMode = Layout.ResizeMode.CONTAINER;

        // Phân phối items vào 2 page
        const page1Items = this.imageData.slice(0, itemsPerPage);
        const page2Items = this.imageData.slice(itemsPerPage);

        // Tạo items cho page 1
        page1Items.forEach((itemData) => {
            const itemNode = instantiate(this.itemPrefab); // itemNode là ContainerImgCategory
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

            page1.addChild(itemNode);

            const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
            this.loadImageFromResource(imagePath, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
            });
        });

        // Tạo items cho page 2
        page2Items.forEach((itemData) => {
            const itemNode = instantiate(this.itemPrefab); // itemNode là ContainerImgCategory
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

            page2.addChild(itemNode);

            const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
            this.loadImageFromResource(imagePath, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
            });
        });

        // Cập nhật layout
        layout1.updateLayout();
        layout2.updateLayout();
    }

    private onItemClicked(itemNode: Node) {
        const data = itemNode['itemData'];
        if (data) {
            const logoData = {
                code: data.code,
                image: data.image,
                isAds: data.isAds,
                name: data.name,
                figure: data.figure,
                animation: data.animation,
                loadingCategory: data.loadingCategory
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
                        setTimeout(() => {
                            director.loadScene('playgame');
                        }, 100);
                    }
                });
            } else {
                // Handle non-ads items
                GameDataManager.getInstance().updateField('ItemSelect', logoData);
                this.Loading.active = true;
                setTimeout(() => {
                    director.loadScene('playgame');
                }, 100);
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
