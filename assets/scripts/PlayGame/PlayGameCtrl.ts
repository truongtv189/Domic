import { _decorator, Component, Node, Prefab, resources, SpriteFrame, instantiate, JsonAsset, AnimationClip, Animation, Sprite, director, Vec3, Rect, UITransform, Color } from 'cc';
import { DraggableItem } from './DraggableItem';
import { GameDataManager } from '../GameDataManager';
import { ThemeCtrl, themeEventTarget } from './ThemeCtrl';

const { ccclass, property } = _decorator;

@ccclass('PlayGameCtrl')
export class PlayGameCtrl extends Component {
    @property([Node]) dropTargets: Node[] = [];  // Mảng chứa các điểm thả
    @property(Prefab) itemPrefab: Prefab = null;
    @property(Node) nodeCategoryFigure: Node = null;
    // @property(Node) nodeLoading: Node = null;
    private animClips: AnimationClip[] = [];
    private imageData: any[] = [];
    private dropTargetRects: { node: Node, rect: Rect }[] = [];
    onLoad() {
        // ThemeCtrl.instance.loadJsonData();
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
        themeEventTarget.on('theme-selected', this.applyThemeColors, this);
    }
    //Thay đường dẫn phát animation động
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
        // Lấy danh sách các item đã xem ads
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};

        this.nodeCategoryFigure.removeAllChildren();
        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            if (!data || !data.image) continue;

            const imagePath = data.image.replace(/\.png$/, '');
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);

            // Kiểm tra và ẩn/hiện node ADS dựa vào trạng thái đã xem
            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                // Chỉ hiển thị node ADS nếu item yêu cầu ads và chưa xem
                adsNode.active = data.isAds === true && !watched[data.core];
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
    applyThemeColors(themeData: { color1: string, color2: string }) {
        console.log('Theme selected:', themeData);

        const color1 = this.hexToColor(themeData.color1);
        const color2 = this.hexToColor(themeData.color2);

        // Apply to dropTargets
        for (let i = 0; i < this.dropTargets.length; i++) {
            const drop = this.dropTargets[i];
            const sprite = drop.getComponent(Sprite);
            if (sprite) {
                sprite.color = i % 2 === 0 ? color1 : color2;
            }
        }

        // Apply to children of nodeCategoryFigure (items)
        const categoryChildren = this.nodeCategoryFigure.children;
        for (let i = 0; i < categoryChildren.length; i++) {
            const item = categoryChildren[i];
            const sprite = item.getComponent(Sprite);
            if (sprite) {
                sprite.color = i % 2 === 0 ? color1 : color2;
            }
        }
    }


    hexToColor(hex: string): Color {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return new Color(r, g, b);
    }

    onDestroy() {
        this.node.off('reset-all-items', this.resetAllItems, this);
        this.node.off('reset-all-items', this.resetAllItems, this);
        themeEventTarget.off('theme-selected', this.applyThemeColors, this);
    }
}
