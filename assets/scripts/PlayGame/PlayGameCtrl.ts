import {
    _decorator, Component, Node, Sprite, SpriteFrame, resources,
    instantiate, Prefab, Animation, AnimationClip, director, JsonAsset
} from 'cc';
import { DraggableItem } from './DraggableItem';
import { AudioManager } from '../AudioManager';
import { GameDataManager } from '../GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Node) container1: Node = null;
    @property(Node) container2: Node = null;
    private animClips: AnimationClip[] = [];

    @property(Node) nodeFigure: Node = null;
    private imageData: any[] = [];
    @property(Prefab) itemPrefab: Prefab = null;
    @property([Node]) dropSlots: Node[] = [];
    @property(Node) nodeCategoryFigure: Node = null;

    onLoad() {
        this.nodeFigure.active = true;
        AudioManager.instance.stopBGM();

        this.loadAnimClips(() => {
            let imagePath = GameDataManager.getInstance().data.ItemSelect.figure;
            imagePath = imagePath.replace(/\.png$/, ''); // Remove extension if exists
            const cleanPath = `PlayGame/${imagePath}/spriteFrame`;

            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                if (spriteFrame) {
                    this.setSprites(this.container1, spriteFrame);
                    this.setSprites(this.container2, spriteFrame);
                } else {
                    console.error('Failed to load figure sprite:', cleanPath);
                }
            });
        });

        this.loadJsonData();
    }

    loadAnimClips(callback: () => void) {
        resources.loadDir('Animator/animationRainBow', AnimationClip, (err, clips) => {
            if (err) {
                console.error('Failed to load animation clips:', err);
                callback();
                return;
            }
            this.animClips = clips;
            callback();
        });
    }

    loadSpriteFrameFromResources(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                console.error(`❌ SpriteFrame not found at path: ${path}`, err);
                callback(null);
                return;
            }
            callback(spriteFrame);
        });
    }

    setSprites(container: Node, spriteFrame: SpriteFrame) {
        if (!container) return;

        const children = container.children;
        for (let i = 0; i < Math.min(children.length, 7); i++) {
            const spriteNode = children[i];
            const sprite = spriteNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = spriteFrame;
            }

            if (this.animClips.length > 0) {
                const randomClip = this.animClips[Math.floor(Math.random() * this.animClips.length)];
                const anim = spriteNode.getComponent(Animation) || spriteNode.addComponent(Animation);
                anim.addClip(randomClip);
                anim.defaultClip = randomClip;
                const state = anim.getState(randomClip.name);
                anim.play(randomClip.name);
                setTimeout(() => state.time = Math.random() * randomClip.duration, 0);
            }
        }
    }

    async loadJsonData() {
        try {
            const jsonAsset = await this.loadResource<JsonAsset>('category/rainbow');
            this.imageData = jsonAsset.json.RAINBOW;
            this.createImages();
        } catch (err) {
            console.error('❌ Failed to load JSON data:', err);
        }
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

    private createImages() {
        this.nodeCategoryFigure.removeAllChildren();

        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            const imagePath = data.image.replace(/\.png$/, ''); // remove extension
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);

            const dragComponent = itemNode.addComponent(DraggableItem);
            dragComponent.init(this.dropSlots);

            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                if (spriteFrame) {
                    const sprite = itemNode.getComponent(Sprite);
                    if (sprite) {
                        sprite.spriteFrame = spriteFrame;
                    }
                } else {
                    console.error('❌ Could not load image for item:', cleanPath);
                }
            });
        }
    }

    onGoHome() {
        director.loadScene('Home');
    }
}
