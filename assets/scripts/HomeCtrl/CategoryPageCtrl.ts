import { _decorator, Asset, Component, director, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D } from 'cc';
import { GameDataManager } from '../GameDataManager';
import { LoadingCtrl } from '../LoadingCtrl';
import { LoadingManager } from '../LoadingManager';
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
        const loadingCtrl = loadingNode.getComponent(LoadingCtrl);
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

                // Gán dữ liệu cho node
                itemNode['itemData'] = itemData;

                // Thêm sự kiện click
                itemNode.on(Node.EventType.TOUCH_END, () => {
                    this.onItemClicked(itemNode);
                });

                // Thêm node vào layout ngay lập tức (đảm bảo thứ tự)
                layout.addChild(itemNode);

                // Load ảnh và gán spriteFrame sau, không ảnh hưởng thứ tự hiển thị node
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
            console.log("Item selected:", data);
            const logoData = {
                core: data.core,
                image: data.image,
                isAds: data.isAds,
                name: data.name,
                figure: data.figure,
                animation: data.animation
            };

            GameDataManager.getInstance().updateField('ItemSelect', logoData);
            this.Loading.active = true;
            setTimeout(() => {
                director.loadScene('playgame');
            }, 100);
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
