import { _decorator, Component, Node, Prefab, resources, SpriteFrame, instantiate, JsonAsset, AnimationClip, Animation, Sprite, director, Vec3, Rect, UITransform, Color, tween, v3, AudioClip, Vec2, Layout } from 'cc';
import { DraggableItem } from './DraggableItem';
import { GameDataManager } from '../GameDataManager';
import { ThemeCtrl, themeEventTarget } from './ThemeCtrl';
import { LoadingCtrl } from '../LoadingCtrl';
import { AudioManager } from '../AudioManager';
import { I18n } from '../I18n';
const { ccclass, property } = _decorator;
@ccclass('PlayGameCtrl')
export class PlayGameCtrl extends Component {
    @property([Node]) dropTargets: Node[] = [];  // Mảng chứa các điểm thả
    @property(Prefab) itemPrefab: Prefab = null;
    @property(Node) nodeCategoryFigure: Node = null;
    @property(Node) Farm1: Node = null;
    @property(Node) Farm2: Node = null;
    @property(Node) Container1: Node = null;
    @property(Node) Container2: Node = null;
    @property(Prefab) LoadingPrefab: Prefab = null;
    @property(Node) Loading: Node = null;
    private loadingCtrl: LoadingCtrl = null!;
    private animClips: AnimationClip[] = [];
    private imageData: any[] = [];
    private dropTargetRects: { node: Node, rect: Rect }[] = [];
    private carouselNodeGroups: Node[][] = [];
    private readonly NODE_COUNT: number = 3; // Số lượng node
    private readonly NODE_SPACING: number = 0.2; // Khoảng cách giữa các node (20% chiều rộng node)

    onLoad() {
        const loadingNode = instantiate(this.LoadingPrefab);
        this.Loading.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.Loading.active = true;
        AudioManager.getInstance().stopBGM()
        this.loadingCtrl = loadingNode.getComponent(LoadingCtrl);
        if (!this.loadingCtrl) {
            console.error('[PlayGameCtrl] LoadingCtrl component not found on loading prefab');
            return;
        }
        if (!this.itemPrefab) {
            return;
        }
        if (!this.nodeCategoryFigure) {
            return;
        }

        // Set black color for dropTargets if isDis is true
        if (GameDataManager.getInstance().data.ItemSelect.isDis === true) {
            this.dropTargets.forEach(target => {
                const sprite = target.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(0, 0, 0, 255);
                }
            });
        }

        // Update all labels in the scene
        I18n.updateAllLabels(director.getScene());

        // Convert loadAnimClips to Promise
        const loadAnimClipsPromise = new Promise<void>((resolve) => {
            this.loadAnimClips(() => resolve());
        });

        // Get game data
        const gameData = GameDataManager.getInstance()?.data;
        const backgorund = gameData?.ItemSelect?.backgorund;
        const backgorund1 = gameData?.ItemSelect?.backgorund1;
        const figure = gameData?.ItemSelect?.figure;

        // Create array of promises for loading all resources
        const loadPromises: Promise<any>[] = [loadAnimClipsPromise];

        // Load figure sprite frames
        let figureSpriteFramesPromise: Promise<SpriteFrame[]> | null = null;
        if (figure) {
            const imagePath = `PlayGame/${figure}`;
            figureSpriteFramesPromise = this.loadSpriteFramesPromise(imagePath);
            loadPromises.push(
                figureSpriteFramesPromise.then(spriteFrames => {
                    // Không gọi setSprites ở đây nữa
                })
            );
        }
        this.loadJsonData();
        // Load background sprite frames
        if (backgorund) {
            const bgDir = backgorund.replace(/\.png$/, '').replace(/\/spriteFrame$/, '');
            loadPromises.push(
                this.loadSpriteFramesPromise(bgDir)
                    .then(spriteFrames => {
                        if (spriteFrames.length > 0) {
                            const isRotateMove = GameDataManager.getInstance()?.data?.ItemSelect?.isRotateMove;
                            if (isRotateMove) {
                                [this.Container1, this.Container2].forEach(container => {
                                    if (!container) return;
                                    const spriteNode = container.getChildByName('Sprite');
                                    if (!spriteNode) return;
                                    ['Node1', 'Node2', 'Node3'].forEach((nodeName, idx) => {
                                        const node = spriteNode.getChildByName(nodeName);
                                        if (!node) return;
                                        if (spriteFrames.length > idx) {
                                            let sprite = node.getComponent(Sprite);
                                            if (!sprite) sprite = node.addComponent(Sprite);
                                            sprite.spriteFrame = spriteFrames[idx];
                                            this.applyRotateAndMove(node, 200, 2 + idx);
                                        }
                                    });
                                });
                            } else {
                                if (this.Container1 && spriteFrames[0]) this.setBackgroundSprite(this.Container1, spriteFrames[0]);
                                if (this.Container2 && spriteFrames[0]) this.setBackgroundSprite(this.Container2, spriteFrames[0]);
                            }
                        }
                    })
            );
        }

        // Load background1 sprite frames
        if (backgorund1 && backgorund1.trim() !== "") {
            const bgPath1 = `${backgorund1.replace(/\.png$/, '')}/spriteFrame`;
            loadPromises.push(
                this.loadSpriteFramesPromise(bgPath1)
                    .then(spriteFrames => {
                        if (spriteFrames.length > 0) {
                            const spriteFrame = spriteFrames[0];
                            // Set sprite for Farm1's child nodes
                            if (this.Farm1 && this.Farm1.children.length >= 2) {
                                const farm1Child1 = this.Farm1.children[0];
                                const farm1Child2 = this.Farm1.children[1];
                                this.setBackgroundSprite(farm1Child1, spriteFrame);
                                this.setBackgroundSprite(farm1Child2, spriteFrame);

                                const nodeWidth = farm1Child1.getComponent(UITransform)?.contentSize.width || 0;
                                const originalPos1 = farm1Child1.getPosition();
                                const originalPos2 = farm1Child2.getPosition();
                                farm1Child1.setPosition(new Vec3(0, originalPos1.y, originalPos1.z));
                                farm1Child2.setPosition(new Vec3(nodeWidth, originalPos2.y, originalPos2.z));
                                this.setupContinuousMovement(farm1Child1);
                                this.setupContinuousMovement(farm1Child2);
                            }

                            // Set sprite for Farm2's child nodes
                            if (this.Farm2 && this.Farm2.children.length >= 2) {
                                const farm2Child1 = this.Farm2.children[0];
                                const farm2Child2 = this.Farm2.children[1];
                                this.setBackgroundSprite(farm2Child1, spriteFrame);
                                this.setBackgroundSprite(farm2Child2, spriteFrame);

                                const nodeWidth = farm2Child1.getComponent(UITransform)?.contentSize.width || 0;
                                const originalPos1 = farm2Child1.getPosition();
                                const originalPos2 = farm2Child2.getPosition();
                                farm2Child1.setPosition(new Vec3(0, originalPos1.y, originalPos1.z));
                                farm2Child2.setPosition(new Vec3(nodeWidth, originalPos2.y, originalPos2.z));
                                this.setupContinuousMovement(farm2Child1);
                                this.setupContinuousMovement(farm2Child2);
                            }
                        }
                    })
            );
        }

        // Load phase11 background
        const bgDir = 'PlayGame/BackGround/phase11';
        loadPromises.push(
            this.loadSpriteFramesPromise(bgDir)
                .then(spriteFrames => {
                    if (spriteFrames.length > 0) {
                        [this.Farm1, this.Farm2].forEach(farm => {
                            if (!farm) return;
                            const spriteNode = farm.getChildByName('Sprite');
                            if (!spriteNode) return;
                            ['Node1', 'Node2', 'Node3'].forEach((nodeName, idx) => {
                                const node = spriteNode.getChildByName(nodeName);
                                if (!node) return;
                                if (spriteFrames.length > idx) {
                                    let sprite = node.getComponent(Sprite);
                                    if (!sprite) sprite = node.addComponent(Sprite);
                                    sprite.spriteFrame = spriteFrames[idx];
                                    this.applyRotateAndMove(node, 200, 2 + idx);
                                }
                            });
                        });
                    }
                })
        );

        // Execute all promises in parallel
        Promise.all(loadPromises)
            .then(async () => {
                this.cacheDropTargetRects();
                this.node.on('reset-all-items', this.resetAllItems, this);
                themeEventTarget.on('theme-selected', this.applyThemeColors, this);
                // Đảm bảo animClips đã load xong, giờ mới setSprites
                if (figureSpriteFramesPromise) {
                    const spriteFrames = await figureSpriteFramesPromise;
                    if (spriteFrames.length > 0) {
                        this.setSprites(this.dropTargets, spriteFrames[0]);
                    }
                }
            })
            .catch(error => {
                console.error('[PlayGameCtrl] Error loading resources:', error);
            });
    }

    loadAnimClips(callback: () => void) {
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
        try {
            let path = GameDataManager.getInstance().data.ItemSelect.code;
            const jsonAsset = await this.loadResource<JsonAsset>(`category/${path}`);
            if (jsonAsset && jsonAsset.json && jsonAsset.json.DATA) {
                console.log('[PlayGameCtrl] JSON data loaded successfully');
                this.imageData = jsonAsset.json.DATA;

                // Preload all images first
                console.log('[PlayGameCtrl] Starting to preload all images...');
                await this.preloadAllImages(this.imageData);
                console.log('[PlayGameCtrl] All images preloaded successfully');

                // Then create images after preloading is complete
                this.createImages();

                // Hide loading after everything is done
                this.Loading.active = false;
            } else {
                console.error('[PlayGameCtrl] Invalid JSON data structure');
                this.Loading.active = false;
            }

        } catch (err) {
            console.error('[PlayGameCtrl] Error loading JSON data:', err);
            this.Loading.active = false;
        }
    }

    async preloadAllImages(imageList: any[]) {
        const totalItems = imageList.length;
        let loadedItems = 0;

        const preloadPromises = imageList.map((data) => {
            return new Promise<void>((resolve) => {
                // Load sprite frames
                const spriteFolderPath = `PlayGame/image/${data.image}`;
                resources.loadDir(spriteFolderPath, SpriteFrame, (err, spriteFrames) => {
                    if (err) {
                        console.warn(`[Image preload] Failed to load folder ${data.image}`, err);
                        loadedItems++;
                        this.updateLoadingProgress(loadedItems / totalItems);
                        resolve();
                        return;
                    }

                    // Store sprite frames from index 1 onwards
                    if (spriteFrames && spriteFrames.length > 1) {
                        data._spriteFrames = spriteFrames.slice(1);
                    } else {
                        console.warn(`[Image preload] Not enough sprites found in folder ${data.image}`);
                    }

                    // Load audio clip
                    const audioPath = `audio/${data.image}`;
                    resources.load(audioPath, AudioClip, (err, audioClip) => {
                        if (err) {
                            console.warn(`[Audio preload] Failed to load audio ${data.image}`, err);
                        } else {
                            data._audioClip = audioClip;
                        }
                        loadedItems++;
                        this.updateLoadingProgress(loadedItems / totalItems);
                        resolve();
                    });
                });
            });
        });

        await Promise.all(preloadPromises);
        console.log('[PlayGameCtrl] All images and audio preloaded');
    }

    private updateLoadingProgress(progress: number) {
        if (this.loadingCtrl) {
            this.loadingCtrl.updateProgress(progress);
        }
    }

    setBackgroundSprite(targetNode: Node, spriteFrame: SpriteFrame) {
        if (!targetNode || !spriteFrame) {
            console.warn('[PlayGameCtrl] setBackgroundSprite: Target or spriteFrame is null');
            return;
        }
        let sprite = targetNode.getComponent(Sprite);
        if (!sprite) {
            sprite = targetNode.addComponent(Sprite);
        }
        sprite.spriteFrame = spriteFrame;
    }
    // Add continuous movement animation
    private setupContinuousMovement(node: Node) {
        if (!node) return;
        // Get the parent's width to determine movement range
        const parent = node.parent;
        if (!parent) return;
        const nodeWidth = node.getComponent(UITransform)?.contentSize.width || 0;
        const originalPos = node.getPosition();
        // Create movement action
        const moveRight = () => {
            const currentPos = node.getPosition();
            const newX = currentPos.x + 1; // Move 1 unit per frame
            // If node moves beyond right edge, reset to left
            if (newX > nodeWidth) {
                node.setPosition(new Vec3(-nodeWidth, originalPos.y, originalPos.z));
            } else {
                node.setPosition(new Vec3(newX, originalPos.y, originalPos.z));
            }
        };
        // Schedule the movement
        this.schedule(moveRight, 0);
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
            console.error('[PlayGameCtrl] Required components missing for createImages');
            return;
        }
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        console.log('[PlayGameCtrl] Watched ads items:', watched);
        this.nodeCategoryFigure.removeAllChildren();
        console.log('[PlayGameCtrl] Creating', this.imageData.length, 'images');
        let itemSizeW = 0;
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
            itemNode.parent = this.nodeCategoryFigure;
            itemSizeW = itemNode.getComponent(UITransform).width;

            // Update labels in the item node
            // I18n.updateAllLabels(itemNode);

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
        let col = this.nodeCategoryFigure.getComponent(Layout).constraintNum;
        this.nodeCategoryFigure.getComponent(UITransform).width = (itemSizeW * col + 20 * (col - 1));
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
        AudioManager.getInstance().playClickClip()
        director.loadScene('Home');
    }
    resetAllItems() {
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
        AudioManager.getInstance().playClickClip()
        const color1 = this.hexToColor(themeData.color1);
        const color2 = this.hexToColor(themeData.color2);
        for (let i = 0; i < this.dropTargets.length; i++) {
            const drop = this.dropTargets[i];
            const sprite = drop.getComponent(Sprite);
            if (sprite) {
                sprite.color = i % 2 === 0 ? color1 : color2;
            }
        }
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
    // Thêm hàm hiệu ứng
    applyRotateAndMove(node: Node, moveRange: number, duration: number) {
        if (!node) return;

        // Chỉ xoay tại chỗ
        tween(node)
            .by(duration, { angle: 360 })
            .repeatForever()
            .start();
    }

    applyCarouselMove(node: Node, node3: Node, duration: number) {
        if (!node || !node3) return;

        // Chỉ xoay tại chỗ
        tween(node)
            .by(duration, { angle: 360 })
            .repeatForever()
            .start();
    }

    startCarouselForSpriteNodes(spriteNode: Node) {
        const nodes = [
            spriteNode.getChildByName('Node1'),
            spriteNode.getChildByName('Node2'),
            spriteNode.getChildByName('Node3')
        ];

        if (nodes.some(n => !n)) return;

        // Sử dụng kích thước ban đầu của node
        const parent = spriteNode.parent;
        if (parent) {
            const parentWidth = parent.getComponent(UITransform)?.contentSize.width || 1280;
            const nodeWidth = nodes[0].getComponent(UITransform)?.contentSize.width || 100;

            // Tính toán vị trí để căn giữa các node
            const totalSpacing = nodeWidth * this.NODE_SPACING * (this.NODE_COUNT - 1);
            const totalWidth = (nodeWidth * this.NODE_COUNT) + totalSpacing;
            const startX = -totalWidth / 2 + nodeWidth / 2;

            // Cập nhật vị trí cho từng node
            nodes.forEach((node, index) => {
                if (node) {
                    const x = startX + (index * (nodeWidth + (nodeWidth * this.NODE_SPACING)));
                    const y = node.getPosition().y;
                    const z = node.getPosition().z;
                    node.setPosition(v3(x, y, z));
                }
            });
        }

        this.carouselNodeGroups.push(nodes);
    }

    private loadSpriteFramesPromise(path: string): Promise<SpriteFrame[]> {
        return new Promise((resolve, reject) => {
            resources.loadDir(path, SpriteFrame, (err, spriteFrames) => {
                if (err) {
                    console.error(`[PlayGameCtrl] Error loading sprite frames from ${path}:`, err);
                    reject(err);
                    return;
                }
                resolve(spriteFrames || []);
            });
        });
    }
}

