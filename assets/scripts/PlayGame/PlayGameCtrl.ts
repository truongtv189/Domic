import { _decorator, Component, Node, Prefab, resources, SpriteFrame, instantiate, JsonAsset, AnimationClip, Animation, Sprite, director, Vec3, Rect, UITransform, Color, tween, v3, AudioClip, Vec2, Layout, view } from 'cc';
import { DraggableItem } from './DraggableItem';
import { GameDataManager } from '../GameDataManager';
import { ThemeCtrl, themeEventTarget } from './ThemeCtrl';
import { LoadingCtrl } from '../LoadingCtrl';
import { AudioManager } from '../AudioManager';
import { I18n } from '../I18n';
import { ResizableNode } from './ResizableNode';
import { GlobalScaleManager } from '../GlobalScaleManager';
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

        // Add ResizableNode component to each dropTarget
        this.dropTargets.forEach(target => {
            if (!target.getComponent(ResizableNode)) {
                target.addComponent(ResizableNode);
            }
        });
        // Đảm bảo nodeCategoryFigure không bị gắn ResizableNode
        if (this.nodeCategoryFigure && this.nodeCategoryFigure.getComponent(ResizableNode)) {
            this.nodeCategoryFigure.removeComponent(ResizableNode);
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
<<<<<<< HEAD
=======
                    this.setSprites(this.dropTargets, spriteFrames[0] || null);
>>>>>>> truongtv
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
                            // Dùng chung 1 spriteFrame cho cả Container1 và Container2
                            const sharedSpriteFrame = spriteFrames[0];
                            if (this.Container1 && sharedSpriteFrame) this.setBackgroundSprite(this.Container1, sharedSpriteFrame);
                            if (this.Container2 && sharedSpriteFrame) this.setBackgroundSprite(this.Container2, sharedSpriteFrame);
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
                console.log('Registering theme-selected event listener');
                themeEventTarget.on('theme-selected', this.applyThemeColors, this);
                // Đảm bảo animClips đã load xong, giờ mới setSprites
                if (figureSpriteFramesPromise) {
                    const spriteFrames = await figureSpriteFramesPromise;
                    if (spriteFrames.length > 0) {
                        // Sắp xếp spriteFrames theo tên (a-b)
                        spriteFrames.sort((a, b) => a.name.localeCompare(b.name));
                        this.setDropTargetsSprites(spriteFrames);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading resources:', error);
            });

        view.on('canvas-resize', this.onResized, this);

        // Đăng ký sự kiện global scale changed
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.on('global-scale-changed', this.onGlobalScaleChanged, this);
        }
    }

    loadAnimClips(callback: () => void) {
        let path = GameDataManager.getInstance().data.ItemSelect.animation;
        if (!path) {
            callback();
            return;
        }
        resources.loadDir(path, AnimationClip, (err, clips) => {
            if (err) {
                callback();
                return;
            }
            if (!clips || clips.length === 0) {
            } else {
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
        if (!nodes) {
            return;
        }
        if (!spriteFrame) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const spriteNode = nodes[i];
            if (!spriteNode) {
                continue;
            }
            let sprite = spriteNode.getComponent(Sprite);
            if (!sprite) {
                sprite = spriteNode.addComponent(Sprite);
            }
            sprite.spriteFrame = spriteFrame;
            if (this.animClips && this.animClips.length > 0) {
                const randomClip = this.animClips[Math.floor(Math.random() * this.animClips.length)];
                if (!randomClip) {
                    continue;
                }
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
                }
            }
        }
    }

    async loadJsonData() {
        try {
            let path = GameDataManager.getInstance().data.ItemSelect.code;
            const jsonAsset = await this.loadResource<JsonAsset>(`category/${path}`);
            if (jsonAsset && jsonAsset.json && jsonAsset.json.DATA) {
                this.imageData = jsonAsset.json.DATA;
                // Preload all images first
                await this.preloadAllImages(this.imageData);
                // Then create images after preloading is complete
                this.createImages();
                // Hide loading after everything is done
                this.Loading.active = false;
            } else {
                this.Loading.active = false;
            }

        } catch (err) {
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
                        loadedItems++;
                        this.updateLoadingProgress(loadedItems / totalItems);
                        resolve();
                        return;
                    }
                    // Sort sprite frames alphabetically by filename
                    if (spriteFrames && spriteFrames.length > 0) {
                        const sortedFrames = spriteFrames.sort((a, b) => {
                            const nameA = a.name.toLowerCase();
                            const nameB = b.name.toLowerCase();
                            return nameA.localeCompare(nameB);
                        });
                        data._spriteFrames = sortedFrames;
                    }
                    // Không gán spriteFrame cho dropTargets ở đây nữa!
                    // Load audio clip
                    const audioPath = `audio/${data.image}`;
                    resources.load(audioPath, AudioClip, (err, audioClip) => {
                        if (!err && audioClip) {
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
    }
    private updateLoadingProgress(progress: number) {
        if (this.loadingCtrl) {
            this.loadingCtrl.updateProgress(progress);
        }
    }
    setBackgroundSprite(targetNode: Node, spriteFrame: SpriteFrame) {
        if (!targetNode || !spriteFrame) {
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
            return;
        }
        const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
        this.nodeCategoryFigure.removeAllChildren();
        let itemSizeW = 0;
        for (let i = 0; i < this.imageData.length; i++) {
            const data = this.imageData[i];
            if (!data || !data.image) {
                continue;
            }
            const imagePath = data.image.replace(/\.png$/, '');
            const cleanPath = `PlayGame/image/${imagePath}/spriteFrame`;
            const itemNode = instantiate(this.itemPrefab);
            itemNode.parent = this.nodeCategoryFigure;
            itemSizeW = itemNode.getComponent(UITransform).width;
            // Update labels in the item node
            // I18n.updateAllLabels(itemNode);
            const adsNode = itemNode.getChildByName("ADS");
            if (adsNode) {
                const shouldShowAds = data.isAds === true && !watched[data.core];
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
                } else {
                }
            });
        }
        // Gọi hàm cập nhật layout sau khi tạo xong item
        this.updateCategoryFigureLayout();
    }
    updateCategoryFigureLayout() {
        const layout = this.nodeCategoryFigure.getComponent(Layout);
        const spacingX = layout.spacingX;
        const spacingY = layout.spacingY || 0;
        const parentNode = this.nodeCategoryFigure.parent;
        const parentWidth = parentNode.getComponent(UITransform).width;
        const parentHeight = parentNode.getComponent(UITransform).height;
        const itemNodes = this.nodeCategoryFigure.children;
        if (itemNodes.length === 0) return;

        // Lấy kích thước item mẫu
        const itemSample = itemNodes[0];
        const itemSizeW = itemSample.getComponent(UITransform).width;
        const itemSizeH = itemSample.getComponent(UITransform).height;

        // Lấy kích thước canvas
        const canvasWidth = view.getVisibleSize().width;

        let col = 1;
        if (canvasWidth > 720) {
            col = 7; // Cố định 4 cột khi màn hình lớn
        } else {
            // Tính số cột tối đa vừa với node cha
            const maxCol = Math.floor((parentWidth + spacingX) / (itemSizeW + spacingX));
            col = Math.max(1, Math.min(maxCol, itemNodes.length));
        }
        layout.constraintNum = col;

        // Tính số hàng dựa vào số item và số cột
        const row = Math.ceil(itemNodes.length / col);

        // Tính lại chiều rộng/chiều cao nodeCategoryFigure cho vừa vặn
        this.nodeCategoryFigure.getComponent(UITransform).width = (itemSizeW * col + spacingX * (col - 1));
        this.nodeCategoryFigure.getComponent(UITransform).height = (itemSizeH * row + spacingY * (row - 1));

        // Nếu muốn scale nhỏ lại để vừa chiều cao node cha (nếu quá nhiều hàng)
        const totalHeight = itemSizeH * row + spacingY * (row - 1);
        let scale = 1;
        if (totalHeight > parentHeight) {
            scale = parentHeight / totalHeight;
        }
        itemNodes.forEach(child => {
            child.setScale(scale, scale);
        });
    }
    onResized() {
        this.updateCategoryFigureLayout();
        this.updateDropTargetsSize();
    }
    private updateDropTargetsSize() {
        if (!this.dropTargets || this.dropTargets.length === 0) return;
        const canvasWidth = view.getVisibleSize().width;
        let globalScale = GlobalScaleManager.instance?.getCurrentScale() || 1;

        // Responsive: desktop/tablet vs mobile
        if (canvasWidth <= 720) {
            globalScale = 1; // Không scale nhỏ lại trên mobile
        }

        this.dropTargets.forEach(target => {
            if (!target) return;
            if (!target['_originalSize']) {
                const uiTransform = target.getComponent(UITransform);
                if (uiTransform) {
                    target['_originalSize'] = {
                        width: uiTransform.contentSize.width,
                        height: uiTransform.contentSize.height
                    };
                }
            }
            if (target['_originalSize']) {
                const uiTransform = target.getComponent(UITransform);
                if (uiTransform) {
                    uiTransform.setContentSize(
                        target['_originalSize'].width * globalScale,
                        target['_originalSize'].height * globalScale
                    );
                }
                target.setScale(globalScale, globalScale);
            }
        });

        this.cacheDropTargetRects();
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
        const loadingCtrl = this.Loading.getComponentInChildren(LoadingCtrl);
        if (loadingCtrl) {
            loadingCtrl.resetLoading();
        }
        this.Loading.active = true;
        director.loadScene('Home');
    }
    resetAllItems() {
        if (!this.nodeCategoryFigure) {
            return;
        }
        const items = this.nodeCategoryFigure.children;
        items.forEach((itemNode, index) => {
            if (!itemNode) {
                return;
            }
            const dragComponent = itemNode.getComponent(DraggableItem);
            if (dragComponent && dragComponent.originalPosition && dragComponent.originalParent) {
                itemNode.setPosition(dragComponent.originalPosition);
                if (itemNode.parent !== dragComponent.originalParent) {
                    dragComponent.originalParent.addChild(itemNode);
                }
                dragComponent.resetState();
            } else {
            }
        });
    }
    applyThemeColors(themeData: { color1?: string, color?: string, color2: string }) {
        AudioManager.getInstance().playClickClip()
        if (!themeData.color1 && !themeData.color) {
            console.error('No primary color found in theme data');
            return;
        }
        if (!themeData.color2) {
            console.error('No secondary color found in theme data');
            return;
        }
        const color1 = this.hexToColor(themeData.color1 || themeData.color);
        const color2 = this.hexToColor(themeData.color2);
        for (let i = 0; i < this.dropTargets.length; i++) {
            const drop = this.dropTargets[i];
            const sprite = drop.getComponent(Sprite);
            if (sprite) {
                const targetColor = i % 2 === 0 ? color1 : color2;
                console.log(`Setting drop target ${i} color to:`, targetColor);
                sprite.color = targetColor;
            }
        }
        const categoryChildren = this.nodeCategoryFigure.children;
        for (let i = 0; i < categoryChildren.length; i++) {
            const item = categoryChildren[i];
            const sprite = item.getComponent(Sprite);
            if (sprite) {
                const targetColor = i % 2 === 0 ? color1 : color2;
                console.log(`Setting category item ${i} color to:`, targetColor);
                sprite.color = targetColor;
            }
        }
    }
    hexToColor(hex: string): Color {
        if (!hex) {
            console.error('Invalid hex color:', hex);
            return new Color(255, 255, 255); // Return white as fallback
        }
        hex = hex.replace('#', '');
        if (hex.length !== 6) {
            console.error('Invalid hex color length:', hex);
            return new Color(255, 255, 255); // Return white as fallback
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        console.log(`Converting hex ${hex} to RGB:`, { r, g, b });
        return new Color(r, g, b);
    }
    onDestroy() {
        this.node.off('reset-all-items', this.resetAllItems, this);
        this.node.off('reset-all-items', this.resetAllItems, this);
        themeEventTarget.off('theme-selected', this.applyThemeColors, this);
        view.off('canvas-resize', this.onResized, this);
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.off('global-scale-changed', this.onGlobalScaleChanged, this);
        }
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
        const parent = spriteNode.parent;
        if (parent) {
            const nodeWidth = nodes[0].getComponent(UITransform)?.contentSize.width || 100;
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
                    reject(err);
                    return;
                }
                resolve(spriteFrames || []);
            });
        });
    }

    private onGlobalScaleChanged(scale: number) {
        this.updateCategoryFigureLayout();
        this.updateDropTargetsSize();
    }

    setDropTargetsSprites(spriteFrames: SpriteFrame[]) {
        if (!this.dropTargets || !spriteFrames) return;
        for (let i = 0; i < this.dropTargets.length; i++) {
            const node = this.dropTargets[i];
            const spriteFrame = spriteFrames[i % spriteFrames.length]; // Lặp lại nếu thiếu frame
            if (!node || !spriteFrame) continue;
            let sprite = node.getComponent(Sprite);
            if (!sprite) sprite = node.addComponent(Sprite);
            sprite.spriteFrame = spriteFrame;
<<<<<<< HEAD
=======

            // Thêm đoạn này để phát animation nếu có
            if (this.animClips && this.animClips.length > 0) {
                const randomClip = this.animClips[Math.floor(Math.random() * this.animClips.length)];
                if (randomClip) {
                    let anim = node.getComponent(Animation);
                    if (!anim) anim = node.addComponent(Animation);
                    anim.addClip(randomClip);
                    anim.defaultClip = randomClip;
                    anim.play(randomClip.name);
                    // Đặt thời gian random nếu muốn
                    const state = anim.getState(randomClip.name);
                    if (state) {
                        const randomTime = Math.random() * randomClip.duration;
                        state.time = randomTime;
                        state.sample();
                    }
                }
            }
>>>>>>> truongtv
        }
    }
}

