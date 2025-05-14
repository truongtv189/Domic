import { _decorator, Component, Node, Prefab, resources, SpriteFrame, instantiate, JsonAsset, AnimationClip, Animation, Sprite, director, Vec3, Rect, UITransform } from 'cc';
import { DraggableItem } from './DraggableItem';
import { GameDataManager } from '../GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property([Node]) dropTargets: Node[] = [];  // Mảng chứa các điểm thả
    @property(Prefab) itemPrefab: Prefab = null;
    @property(Node) nodeCategoryFigure: Node = null;

    private animClips: AnimationClip[] = [];
    private imageData: any[] = [];
    private originalPositions: { [key: string]: Node } = {};  // Lưu trữ các vị trí gốc của các đối tượng
    private dropTargetRects: { node: Node, rect: Rect }[] = [];
    onLoad() {
        this.loadAnimClips(() => {
            let imagePath = GameDataManager.getInstance().data.ItemSelect.figure;
            imagePath = imagePath.replace(/\.png$/, ''); // Remove extension if exists
            const cleanPath = `PlayGame/${imagePath}/spriteFrame`;
            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                if (spriteFrame) {
                    this.setSprites(this.dropTargets, spriteFrame);  // Cập nhật sprite cho các node
                } else {
                    console.error('Failed to load figure sprite:', cleanPath);
                }
            });
        });
        this.scheduleOnce(() => {
            this.cacheDropTargetRects();
        }, 0);
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

    setSprites(nodes: Node[], spriteFrame: SpriteFrame) {
        for (let i = 0; i < Math.min(nodes.length, 7); i++) {
            const spriteNode = nodes[i];
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
    createImages() {
        this.nodeCategoryFigure.removeAllChildren();

        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            const imagePath = data.image.replace(/\.png$/, '');
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);
            const dragComponent = itemNode.getComponent(DraggableItem) || itemNode.addComponent(DraggableItem);
            this.scheduleOnce(() => {
                dragComponent.originalParent = this.nodeCategoryFigure;
                dragComponent.originalPosition = itemNode.getPosition().clone();
                dragComponent.dropTargets = this.dropTargets;
                dragComponent.dragData = data;
            }, 0);
            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                const sprite = itemNode.getComponent(Sprite);
                if (sprite) sprite.spriteFrame = spriteFrame;
            });
        }
    }

    cacheDropTargetRects() {
        this.dropTargetRects = this.dropTargets.map(node => {
            const uiTransform = node.getComponent(UITransform);
            const worldPos = node.getWorldPosition();
            const size = uiTransform.contentSize;
            const anchor = uiTransform.anchorPoint;

            const rect = new Rect(
                worldPos.x - size.width * anchor.x,
                worldPos.y - size.height * anchor.y,
                size.width,
                size.height
            );

            return { node, rect };
        });
    }

    getDropTargetRects(): { node: Node, rect: Rect }[] {
        return this.dropTargetRects;
    }

    onGoHome() {
        director.loadScene('Home');
    }
}
