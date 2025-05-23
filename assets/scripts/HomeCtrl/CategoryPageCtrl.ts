import { _decorator, Asset, Component, director, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D, Size, Widget, UITransform, Canvas } from 'cc';
import { GameDataManager } from '../GameDataManager';
import { LoadingCtrl } from '../LoadingCtrl';
import { LoadingManager } from '../LoadingManager';
import AdsManager from '../AdsPlatform/AdsManager';
import { AudioManager } from '../AudioManager';
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
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        const totalItems = this.imageData.length;
        const baseWidth = 720;
        const baseHeight = 720;
        const columns = 4;
        const padding = 20;
        const spacingX = 50;
        const spacingY = 50;

        const canvas = director.getScene().getComponentInChildren(Canvas);
        const canvasWidth = canvas?.getComponent(UITransform)?.contentSize.width || baseWidth;
        const scale = canvasWidth < baseWidth ? canvasWidth / baseWidth : 1;

        // Scale PageView
        this.pageView.node.setScale(scale, scale, 1);

        // Tính toán layout dựa trên baseWidth/baseHeight
        const pageWidth = baseWidth;
        const pageHeight = baseHeight;
        const itemsPerPage = Math.ceil(totalItems / 2);
        const rows = Math.ceil(itemsPerPage / columns);

        const itemWidth = (pageWidth - 2 * padding - (columns - 1) * spacingX) / columns;
        const itemHeight = (pageHeight - 2 * padding - (rows - 1) * spacingY) / rows;

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

        // Hàm set vị trí và scale cho item
        function setItemPositionAndSize(itemNode: Node, index: number) {
            const col = index % columns;
            const row = Math.floor(index / columns);

            // Tính tổng chiều rộng/chiều cao của lưới item
            const totalGridWidth = columns * itemWidth + (columns - 1) * spacingX;
            const totalGridHeight = rows * itemHeight + (rows - 1) * spacingY;

            // Tính vị trí bắt đầu để căn giữa lưới trong page, đồng thời cộng padding
            const startX = -pageWidth / 2 + padding + (pageWidth - 2 * padding - totalGridWidth) / 2 + itemWidth / 2;
            const startY = pageHeight / 2 - padding - (pageHeight - 2 * padding - totalGridHeight) / 2 - itemHeight / 2;

            const x = startX + col * (itemWidth + spacingX);
            const y = startY - row * (itemHeight + spacingY);

            itemNode.setPosition(x, y, 0);

            // Set lại kích thước cho itemNode
            const uiTrans = itemNode.getComponent(UITransform);
            if (uiTrans) {
                uiTrans.setContentSize(itemWidth, itemHeight);
            }
        }

        // Phân phối items vào 2 page
        const page1Items = this.imageData.slice(0, itemsPerPage);
        const page2Items = this.imageData.slice(itemsPerPage);

        // Tạo items cho page 1
        page1Items.forEach((itemData, idx) => {
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

            setItemPositionAndSize(itemNode, idx);
            page1.addChild(itemNode);

            const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
            this.loadImageFromResource(imagePath, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
            });
        });

        // Tạo items cho page 2
        page2Items.forEach((itemData, idx) => {
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

            setItemPositionAndSize(itemNode, idx);
            page2.addChild(itemNode);

            const imagePath = `PlayGame/${itemData.image}/spriteFrame`;
            this.loadImageFromResource(imagePath, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;
            });
        });
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
