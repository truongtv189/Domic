import { _decorator, Component, Node, Prefab, resources, SpriteFrame, instantiate, JsonAsset, AnimationClip, Animation, Sprite, director, Vec3, Rect, UITransform } from 'cc';
import { DraggableItem } from './DraggableItem';
import { GameDataManager } from '../GameDataManager';
import { ThemeCtrl } from './ThemeCtrl';

const { ccclass, property } = _decorator;

@ccclass('PlayGameCtrl')
export class PlayGameCtrl extends Component {
    @property([Node]) dropTargets: Node[] = [];  // Mảng chứa các điểm thả
    @property(Prefab) itemPrefab: Prefab = null;
    @property(Node) nodeCategoryFigure: Node = null;
    private animClips: AnimationClip[] = [];
    private imageData: any[] = [];
    private dropTargetRects: { node: Node, rect: Rect }[] = [];
    onLoad() {
        if (!this.itemPrefab) {
            return;
        }
        if (!this.nodeCategoryFigure) {
            return;
        }
        this.loadAnimClips(() => {
            const gameData = GameDataManager.getInstance()?.data;
            if (!gameData || !gameData.ItemSelect || !gameData.ItemSelect.figure) {
                return;
            }
            let imagePath = gameData.ItemSelect.figure;
            imagePath = imagePath.replace(/\.png$/, ''); // Remove extension if exists
            const cleanPath = `PlayGame/${imagePath}/spriteFrame`;
            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                if (spriteFrame) {
                    this.setSprites(this.dropTargets, spriteFrame);
                } else {
                }
            });
        });

        this.cacheDropTargetRects();
        this.loadJsonData();
        // Listen for reset event from LoadingPlayAudio
        this.node.on('reset-all-items', this.resetAllItems, this);
    }

    loadAnimClips(callback: () => void) {
        resources.loadDir('Animator/animationRainBow', AnimationClip, (err, clips) => {
            if (err) {
                callback();
                return;
            }
            this.animClips = clips || [];
            callback();
        });
    }

    loadSpriteFrameFromResources(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                callback(null);
                return;
            }
            callback(spriteFrame);
        });
    }

    setSprites(nodes: Node[], spriteFrame: SpriteFrame) {
        if (!nodes || !spriteFrame || !this.animClips) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const spriteNode = nodes[i];
            if (!spriteNode) continue;

            let sprite = spriteNode.getComponent(Sprite);
            if (!sprite) {
                sprite = spriteNode.addComponent(Sprite);
            }
            sprite.spriteFrame = spriteFrame;
            if (this.animClips && this.animClips.length > 0) {
                const randomClip = this.animClips[Math.floor(Math.random() * this.animClips.length)];
                if (!randomClip) continue;
                const anim = spriteNode.getComponent(Animation) || spriteNode.addComponent(Animation);
                anim.addClip(randomClip);
                anim.defaultClip = randomClip;
                anim.play(randomClip.name);
                const state = anim.getState(randomClip.name);
                if (state) {
                    const randomTime = Math.random() * randomClip.duration;
                    state.time = randomTime;
                    state.sample();
                }
            }
        }
    }

    async loadJsonData() {
        try {
            const jsonAsset = await this.loadResource<JsonAsset>('category/rainbow');
            if (jsonAsset && jsonAsset.json && jsonAsset.json.RAINBOW) {
                this.imageData = jsonAsset.json.RAINBOW;
                this.createImages();
            } else {
            }
        } catch (err) {
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
        if (!this.nodeCategoryFigure || !this.imageData || !this.itemPrefab) {
            return;
        }
        this.nodeCategoryFigure.removeAllChildren();
        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            if (!data || !data.image) continue;
            const imagePath = data.image.replace(/\.png$/, '');
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);
            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                adsNode.active = data.isAds === true;
            }
            const dragComponent = itemNode.getComponent(DraggableItem) || itemNode.addComponent(DraggableItem);
            this.scheduleOnce(() => {
                dragComponent.originalParent = this.nodeCategoryFigure;
                dragComponent.originalPosition = itemNode.getPosition().clone();
                dragComponent.dropTargets = this.dropTargets;
                dragComponent.dragData = data;
            }, 0);

            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                const sprite = itemNode.getComponent(Sprite);
                if (sprite && spriteFrame) sprite.spriteFrame = spriteFrame;
            });
        }
    }

    cacheDropTargetRects() {
        if (!this.dropTargets) {
            return;
        }
        this.dropTargetRects = this.dropTargets.map(node => {
            if (!node) return null;
            const uiTransform = node.getComponent(UITransform);
            if (!uiTransform) return null;

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
        }).filter(item => item !== null);
    }
    getDropTargetRects(): { node: Node, rect: Rect }[] {
        return this.dropTargetRects || [];
    }

    onGoHome() {
        director.loadScene('Home');
    }

    resetAllItems() {
        if (!this.nodeCategoryFigure) return;
        const items = this.nodeCategoryFigure.children;
        items.forEach(itemNode => {
            if (!itemNode) return;
            const dragComponent = itemNode.getComponent(DraggableItem);
            if (dragComponent && dragComponent.originalPosition && dragComponent.originalParent) {
                itemNode.setPosition(dragComponent.originalPosition);
                if (itemNode.parent !== dragComponent.originalParent) {
                    dragComponent.originalParent.addChild(itemNode);
                }
                dragComponent.resetState();
            }
        });
    }

    onDestroy() {
        this.node.off('reset-all-items', this.resetAllItems, this);
    }
}
