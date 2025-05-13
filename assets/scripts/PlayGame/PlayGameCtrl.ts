import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, resources, instantiate, Prefab, Animation, AnimationClip, ImageAsset, director, JsonAsset } from 'cc';
import { DraggableItem } from './DraggableItem';
import { AudioManager } from '../AudioManager';
import { GameDataManager } from '../GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    // Properties for SetSprites logic
    @property(Node)
    container1: Node = null;  // Node container 1
    @property(Node)
    container2: Node = null;  // Node container 2
    private animClips: AnimationClip[] = [];  // List of animation clips

    // Properties for PlayGameCtrl logic
    @property(Node)
    nodeFigure: Node = null;
    private imageData: any[] = [];
    @property(Prefab)
    itemPrefab: Prefab = null;
    @property([Node])
    dropSlots: Node[] = [];  // Drop slots for draggable items
    @property(Node)
    nodeCategoryFigure: Node = null;

    onLoad() {
        this.nodeFigure.active = true;
        this.loadAnimClips(() => {
            const imageUrl = GameDataManager.getInstance().data.ItemSelect.figure;
            const finalUrl = `${imageUrl}${/\.(png|jpe?g)$/.test(imageUrl) ? '' : '.png'}`;
            this.loadImageFromPath(finalUrl, (spriteFrame) => {
                if (spriteFrame) {
                    this.setSprites(this.container1, spriteFrame);
                    this.setSprites(this.container2, spriteFrame);
                }
            });
        });
        this.loadJsonData();
    }

    // SetSprites Logic
    loadAnimClips(callback: () => void) {
        resources.loadDir('Animator/animationRainBow', AnimationClip, (err, clips) => {
            if (err) {
                callback();
                return;
            }
            this.animClips = clips;
            callback();
        });
    }

    loadImageFromPath(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            const imageAsset = new ImageAsset(image);
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            callback(spriteFrame);
        };

        image.onerror = () => {
            callback(null);
        };

        image.src = path;
    }

    setSprites(container: Node, spriteFrame: SpriteFrame) {
        if (!container) {
            return;
        }
        const children = container.children;
        if (children.length === 0) {
        }
        for (let i = 0; i < Math.min(children.length, 7); i++) {
            const spriteNode = children[i];
            const sprite = spriteNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = spriteFrame;
            }

            if (this.animClips.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.animClips.length);
                const randomClip = this.animClips[randomIndex];

                let anim = spriteNode.getComponent(Animation);
                if (!anim) {
                    anim = spriteNode.addComponent(Animation);
                }

                anim.addClip(randomClip);
                anim.defaultClip = randomClip;

                const state = anim.getState(randomClip.name);
                anim.play(randomClip.name);

                setTimeout(() => {
                    const duration = randomClip.duration;
                    const randomTime = Math.random() * duration;
                    state.time = randomTime;
                }, 0);
            }
        }
    }

    // PlayGameCtrl Logic
    async loadJsonData() {
        try {
            const jsonPaths = ['category/rainbow'];
            const [jsonAsset] = await Promise.all(jsonPaths.map(path => this.loadResource<JsonAsset>(path)));
            this.imageData = jsonAsset.json.RAINBOW;
            this.createImages();
        } catch (err) {
        }
    }

    private loadResource<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, (err, asset) => {
                if (err) reject(err);
                else resolve(asset as T);
            });
        });
    }

    private createImages() {
        this.nodeCategoryFigure.removeAllChildren();
        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            const imageUrl = `image/${data.image}${/\.(png|jpe?g)$/.test(data.image) ? '' : '.png'}`;
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);
            const dragComponent = itemNode.addComponent(DraggableItem);
            dragComponent.init(this.dropSlots);

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

    onGoHome() {
        director.loadScene('Home');
    }
}
