import { _decorator, Asset, Component, ImageAsset, instantiate, JsonAsset, Label, Layout, Node, PageView, Prefab, resources, Sprite, SpriteFrame, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CategoryPageCtrl')
export class CategoryPageCtrl extends Component {
    private imageData: any[] = [];
    @property(PageView)
    pageView: PageView = null;
    @property(Prefab)
    itemPrefab: Prefab = null;
    private spriteCache: Map<string, SpriteFrame> = new Map();
    protected onLoad(): void {
        this.loadJsonData();
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

    // Chia dữ liệu thành mảng con theo số lượng page
    const dataPerPage: any[][] = [];
    for (let i = 0; i < totalPages; i++) {
        dataPerPage.push(this.imageData.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
    }

    const pages = this.pageView.getPages();
    pages.forEach((pageNode, pageIndex) => {
        const layout = pageNode.getChildByName('Layout');
        if (!layout) return;

        // Xoá các node cũ nếu có
        layout.removeAllChildren();

        const items = dataPerPage[pageIndex] || [];
        items.forEach((itemData) => {
            const itemNode = instantiate(this.itemPrefab);
            const icon = itemNode.getComponent(Sprite);
            const nameLabel = itemNode.getChildByName("Label")?.getComponent(Label);
            if (nameLabel) nameLabel.string = itemData.name;

            this.loadImageFromPath(`${itemData.image}${/\.(png|jpe?g)$/.test(itemData.image) ? '' : '.png'}`, (spriteFrame) => {
                if (spriteFrame && icon) icon.spriteFrame = spriteFrame;

                // Add the item to the layout only after image loading is complete
                layout.addChild(itemNode);
            });
        });
    });
}


    // Hàm load ảnh từ đường dẫn ngoài assets
    loadImageFromPath(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            const imageAsset = new ImageAsset(img);
            const texture = new Texture2D();
            texture.image = imageAsset;
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            callback(spriteFrame);
        };

        img.onerror = () => {
            console.warn("Load image failed:", path);
            callback(null);
        };
    }
}
