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
        console.log('[PlayGameCtrl] onLoad started');
        if (!this.itemPrefab) {
            console.error('[PlayGameCtrl] itemPrefab is not set');
            return;
        }
        if (!this.nodeCategoryFigure) {
            console.error('[PlayGameCtrl] nodeCategoryFigure is not set');
            return;
        }
        console.log('[PlayGameCtrl] Loading animation clips...');
        this.loadAnimClips(() => {
            console.log('[PlayGameCtrl] Animation clips loaded, loading game data...');
            const gameData = GameDataManager.getInstance()?.data;
            if (!gameData || !gameData.ItemSelect || !gameData.ItemSelect.figure) {
                console.error('[PlayGameCtrl] Game data or figure data is missing:', gameData);
                return;
            }
            let imagePath = gameData.ItemSelect.figure;
            imagePath = imagePath.replace(/\.png$/, '');
            const cleanPath = `PlayGame/${imagePath}/spriteFrame`;
            console.log('[PlayGameCtrl] Loading sprite frame from path:', cleanPath);
            this.loadSpriteFrameFromResources(cleanPath, (spriteFrame) => {
                if (spriteFrame) {
                    console.log('[PlayGameCtrl] Sprite frame loaded successfully');
                    this.setSprites(this.dropTargets, spriteFrame);
                } else {
                    console.error('[PlayGameCtrl] Failed to load sprite frame');
                }
            });
        });

        this.cacheDropTargetRects();
        this.loadJsonData();
        this.node.on('reset-all-items', this.resetAllItems, this);
        themeEventTarget.on('theme-selected', this.applyThemeColors, this);
        console.log('[PlayGameCtrl] onLoad completed');
    }

    loadAnimClips(callback: () => void) {
        console.log('[PlayGameCtrl] Loading animation clips from Animator/animationRainBow');
        let path = GameDataManager.getInstance().data.ItemSelect.animation;
        if (!path) {
            console.warn('[PlayGameCtrl] Animation path is null or empty. Skipping load.');
            callback();
            return;
        }
        resources.loadDir(path, AnimationClip, (err, clips) => {
            if (err) {
                console.error('[PlayGameCtrl] Error loading animation clips:', err);
                callback();
                return;
            }
            if (!clips || clips.length === 0) {
                console.warn('[PlayGameCtrl] No animation clips found');
            } else {
                console.log(`[PlayGameCtrl] Loaded ${clips.length} animation clips`);
            }
            this.animClips = clips || [];
            callback();
        });
    }

    loadSpriteFrameFromResources(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        console.log('[PlayGameCtrl] Loading sprite frame from:', path);
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                console.error('[PlayGameCtrl] Failed to load sprite frame:', err);
                callback(null);
                return;
            }
            console.log('[PlayGameCtrl] Sprite frame loaded successfully');
            callback(spriteFrame);
        });
    }

    setSprites(nodes: Node[], spriteFrame: SpriteFrame) {
        console.log('[PlayGameCtrl] Setting sprites for', nodes?.length, 'nodes');
        if (!nodes) {
            console.error('[PlayGameCtrl] setSprites: nodes array is null or undefined');
            return;
        }
        if (!spriteFrame) {
            console.error('[PlayGameCtrl] setSprites: spriteFrame is null or undefined');
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const spriteNode = nodes[i];
            if (!spriteNode) {
                console.warn(`[PlayGameCtrl] setSprites: node at index ${i} is null or undefined`);
                continue;
            }

            let sprite = spriteNode.getComponent(Sprite);
            if (!sprite) {
                console.log(`[PlayGameCtrl] Adding Sprite component to node at index ${i}`);
                sprite = spriteNode.addComponent(Sprite);
            }
            sprite.spriteFrame = spriteFrame;
            if (this.animClips && this.animClips.length > 0) {
                const randomClip = this.animClips[Math.floor(Math.random() * this.animClips.length)];
                if (!randomClip) {
                    console.warn(`[PlayGameCtrl] setSprites: randomClip is null for node at index ${i}`);
                    continue;
                }
                console.log(`[PlayGameCtrl] Adding animation clip ${randomClip.name} to node at index ${i}`);
                const anim = spriteNode.getComponent(Animation) || spriteNode.addComponent(Animation);
                anim.addClip(randomClip);
                anim.defaultClip = randomClip;
                anim.play(randomClip.name);
                const state = anim.getState(randomClip.name);
                if (state) {
                    const randomTime = Math.random() * randomClip.duration;
                    state.time = randomTime;
                    state.sample();
                } else {
                    console.warn(`[PlayGameCtrl] setSprites: animation state not found for clip ${randomClip.name}`);
                }
            }
        }
    }

    async loadJsonData() {
        console.log('[PlayGameCtrl] Loading JSON data...');
        try {
            let path = GameDataManager.getInstance().data.ItemSelect.code;
            console.log('[PlayGameCtrl] Loading JSON from path:', path);
            const jsonAsset = await this.loadResource<JsonAsset>(`category/${path}`);
            if (jsonAsset && jsonAsset.json && jsonAsset.json.DATA) {
                console.log('[PlayGameCtrl] JSON data loaded successfully');
                this.imageData = jsonAsset.json.DATA;
                this.createImages();
            } else {
                console.error('[PlayGameCtrl] Invalid JSON data structure');
            }
        } catch (err) {
            console.error('[PlayGameCtrl] Error loading JSON data:', err);
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
        console.log('[PlayGameCtrl] Creating images...');
        if (!this.nodeCategoryFigure || !this.imageData || !this.itemPrefab) {
            console.error('[PlayGameCtrl] Required components missing for createImages');
            return;
        }
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        console.log('[PlayGameCtrl] Watched ads items:', watched);

        this.nodeCategoryFigure.removeAllChildren();
        console.log('[PlayGameCtrl] Creating', this.imageData.length, 'images');
        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            if (!data || !data.image) {
                console.warn(`[PlayGameCtrl] Invalid data at index ${i}`);
                continue;
            }

            const imagePath = data.image.replace(/\.png$/, '');
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            console.log(`[PlayGameCtrl] Creating item ${i} with path:`, cleanPath);
            const itemNode = instantiate(this.itemPrefab);
            this.nodeCategoryFigure.addChild(itemNode);

            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                const shouldShowAds = data.isAds === true && !watched[data.core];
                console.log(`[PlayGameCtrl] Item ${i} ADS node visibility:`, shouldShowAds);
                adsNode.active = shouldShowAds;
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
                if (sprite && spriteFrame) {
                    sprite.spriteFrame = spriteFrame;
                    console.log(`[PlayGameCtrl] Set sprite frame for item ${i}`);
                } else {
                    console.warn(`[PlayGameCtrl] Failed to set sprite frame for item ${i}`);
                }
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
        console.log('[PlayGameCtrl] Resetting all items...');
        if (!this.nodeCategoryFigure) {
            console.error('[PlayGameCtrl] nodeCategoryFigure is not set');
            return;
        }
        const items = this.nodeCategoryFigure.children;
        console.log('[PlayGameCtrl] Resetting', items.length, 'items');
        items.forEach((itemNode, index) => {
            if (!itemNode) {
                console.warn(`[PlayGameCtrl] Item at index ${index} is null`);
                return;
            }
            const dragComponent = itemNode.getComponent(DraggableItem);
            if (dragComponent && dragComponent.originalPosition && dragComponent.originalParent) {
                itemNode.setPosition(dragComponent.originalPosition);
                if (itemNode.parent !== dragComponent.originalParent) {
                    dragComponent.originalParent.addChild(itemNode);
                }
                dragComponent.resetState();
                console.log(`[PlayGameCtrl] Reset item at index ${index}`);
            } else {
                console.warn(`[PlayGameCtrl] Invalid drag component for item at index ${index}`);
            }
        });
    }
    applyThemeColors(themeData: { color1: string, color2: string }) {
        console.log('[PlayGameCtrl] Applying theme colors:', themeData);
        const color1 = this.hexToColor(themeData.color1);
        const color2 = this.hexToColor(themeData.color2);

        console.log('[PlayGameCtrl] Applying colors to', this.dropTargets.length, 'drop targets');
        for (let i = 0; i < this.dropTargets.length; i++) {
            const drop = this.dropTargets[i];
            const sprite = drop.getComponent(Sprite);
            if (sprite) {
                sprite.color = i % 2 === 0 ? color1 : color2;
            }
        }

        const categoryChildren = this.nodeCategoryFigure.children;
        console.log('[PlayGameCtrl] Applying colors to', categoryChildren.length, 'category items');
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
