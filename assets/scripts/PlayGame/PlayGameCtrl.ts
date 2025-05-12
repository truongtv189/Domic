import { _decorator, Component, ImageAsset, instantiate, JsonAsset, Node, Prefab, resources, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayGameCtrl')
export class PlayGameCtrl extends Component {
    @property(Node)
    nodeFigure: Node = null;
    private imageData: any[] = [];
    @property(Prefab)
    itemPrefab: Prefab = null;
    @property(Node)
    nodeCategoryFigure: Node = null;
    protected onLoad(): void {
        this.nodeFigure.active = true;
        this.loadJsonData();
    }
    async loadJsonData() {
        try {
            const jsonPaths = ['category/rainbow']; // Đảm bảo 'datacategory' là đúng đường dẫn
            const [jsonAsset] = await Promise.all(jsonPaths.map(path => this.loadResource<JsonAsset>(path)));
            this.imageData = jsonAsset.json.RAINBOW; // Dữ liệu có trong 'CATEGORY'
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
    for (let i = 0; i < this.imageData.length; i++) {
        const data = this.imageData[i];
        const imageUrl = `image/${data.image}${/\.(png|jpe?g)$/.test(data.image) ? '' : '.png'}`;

        const itemNode = instantiate(this.itemPrefab);
        this.nodeCategoryFigure.addChild(itemNode); // Layout sẽ tự động xếp

        this.loadImageFromPath(imageUrl, (spriteFrame) => {
            if (spriteFrame) {
                const sprite = itemNode.getComponent(Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                }
            }
        });
    }
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


