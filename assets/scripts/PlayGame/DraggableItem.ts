import { _decorator, Component, Node, EventTouch, UITransform, Vec3, Sprite, Color, AudioSource, SpriteFrame, AudioClip, resources, Widget } from 'cc';
import { LoadingPlayAudio } from '../LoadingPlayAudio/LoadingPlayAudio';
const { ccclass, property } = _decorator;

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    public targetDropZone: Node | null = null;
    public originalParent: Node | null = null;
    public originalPosition: Vec3 = new Vec3();
    public dropTargets: Node[] = [];
    public dragData: { id: number, image: string, _deltaTime: number };
    private offset = new Vec3();
    private isDropped = false;
    private sprite: Sprite = null!;
    private _audioSource: AudioSource | null = null;
    private _frameIndex = 0;
    private _deltaTime = 0;
    private _timer = 0;
    private _isPlaying = false;
    private _spriteFrames: SpriteFrame[] = [];
    private _duration: number = 0.911;
    private assetsLoaded = false;
    private static dropZoneMap: Map<Node, DraggableItem> = new Map();
    private canPlayAndUpdate: boolean = false;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.originalPosition = this.node.getPosition().clone();
        this.originalParent = this.node.parent;
    }

    onTouchStart(event: EventTouch) {
        if (this.isDropped) return;
        const touchPos = event.getUILocation();
        const nodePos = this.node.getPosition(); // Thay vì getWorldPosition
        this.offset.set(nodePos.x - touchPos.x, nodePos.y - touchPos.y, 0); // Tính offset chuẩn
    }
    onTouchMove(event: EventTouch) {
        if (this.isDropped) return;
        const touchPos = event.getUILocation();
        const newPos = new Vec3(touchPos.x + this.offset.x, touchPos.y + this.offset.y, 0);
        this.node.setPosition(newPos); // Di chuyển node theo vị trí mới
    }
    onTouchEnd(event: EventTouch) {
        if (this.isDropped) return;
        const worldPos = this.node.getWorldPosition();
        let matchedDropZone: Node | null = null;
        for (const dropZone of this.dropTargets) {
            const dropBox = dropZone.getComponent(UITransform);
            if (!dropBox) continue;
            const localPos = dropBox.convertToNodeSpaceAR(worldPos);
            const size = dropBox.contentSize;
            if (Math.abs(localPos.x) <= size.width / 2 && Math.abs(localPos.y) <= size.height / 2) {
                matchedDropZone = dropZone;
                break;
            }
        }
        if (matchedDropZone) {
            // Dừng animation cũ nếu có
            const oldItem = DraggableItem.dropZoneMap.get(matchedDropZone);
            if (oldItem && oldItem !== this) {
                oldItem.resetPosition();
            }
            DraggableItem.dropZoneMap.set(matchedDropZone, this);

            // Tạo và setup animation node
            const animationNode = new Node('AnimationNode');
            matchedDropZone.addChild(animationNode);
            
            // Lấy kích thước từ dropTarget và thiết lập cho animation node
            const dropZoneTransform = matchedDropZone.getComponent(UITransform);
            const dropZoneWidget = matchedDropZone.getComponent(Widget);
            const newTransform = animationNode.addComponent(UITransform);

            if (dropZoneTransform && newTransform) {
                // Tăng kích thước thêm 20px cho cả width và height
                const extraSize = 20;
                newTransform.setContentSize(
                    dropZoneTransform.contentSize.width + extraSize,
                    dropZoneTransform.contentSize.height + extraSize
                );
                newTransform.anchorPoint = dropZoneTransform.anchorPoint;
            }

            // Copy Widget properties từ dropZone
            if (dropZoneWidget) {
                const newWidget = animationNode.addComponent(Widget);
                // Copy tất cả các thuộc tính từ widget gốc
                newWidget.alignFlags = dropZoneWidget.alignFlags;
                newWidget.alignMode = dropZoneWidget.alignMode;
                newWidget.left = dropZoneWidget.left;
                newWidget.right = dropZoneWidget.right;
                newWidget.top = dropZoneWidget.top;
                newWidget.bottom = dropZoneWidget.bottom;
                newWidget.horizontalCenter = dropZoneWidget.horizontalCenter;
                newWidget.verticalCenter = dropZoneWidget.verticalCenter;
                newWidget.isAlignLeft = dropZoneWidget.isAlignLeft;
                newWidget.isAlignRight = dropZoneWidget.isAlignRight;
                newWidget.isAlignTop = dropZoneWidget.isAlignTop;
                newWidget.isAlignBottom = dropZoneWidget.isAlignBottom;
                newWidget.isAlignHorizontalCenter = dropZoneWidget.isAlignHorizontalCenter;
                newWidget.isAlignVerticalCenter = dropZoneWidget.isAlignVerticalCenter;
                // Cập nhật widget ngay lập tức
                newWidget.updateAlignment();
            }

            // Set position về center của dropZone
            animationNode.setPosition(Vec3.ZERO);
            
            // Setup Sprite với kích thước phù hợp
            const newSprite = animationNode.addComponent(Sprite);
            newSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            newSprite.trim = false;

            // Đảm bảo scale để fit với dropZone và giữ tỷ lệ
            if (dropZoneTransform) {
                const size = dropZoneTransform.contentSize;
                // Tính toán scale để item fit vừa với dropZone
                const scale = Math.min(1, size.height / size.width);
                animationNode.setScale(new Vec3(scale, scale, 1));
            }
            
            const audioSource = animationNode.addComponent(AudioSource);

            // Ẩn dropZone sprite
            const dropZoneSprite = matchedDropZone.getComponent(Sprite);
            if (dropZoneSprite) {
                dropZoneSprite.enabled = false;
            }

            // Set màu cho sprite gốc
            const sprite = this.node.getComponent(Sprite);
            if (sprite) sprite.color = new Color(180, 180, 180);

            // Set các thuộc tính
            this.isDropped = true;
            this.sprite = newSprite;
            this._audioSource = audioSource;
            this.targetDropZone = matchedDropZone;

            // Set parent và position
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition);
            }

            // Load assets và đợi LoadingPlayAudio
            this.loadAssetsAndWaitForLoading(this.dragData.image);

            matchedDropZone.on(Node.EventType.TOUCH_END, this.onDropZoneClick, this, true);
        } else {
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition);
            }
        }
    }
    public resetPosition() {
        // 1. Gỡ dropZone khỏi map nếu đang giữ
        if (this.targetDropZone) {
            DraggableItem.dropZoneMap.delete(this.targetDropZone);

            // Hiện lại drop zone
            const dropZoneSprite = this.targetDropZone.getComponent(Sprite);
            if (dropZoneSprite) dropZoneSprite.enabled = true;

            // Xoá animationNode nếu có
            const animNode = this.targetDropZone.getChildByName('AnimationNode');
            if (animNode) {
                const audio = animNode.getComponent(AudioSource);
                if (audio) audio.stop();
                animNode.destroy();
            }

            this.targetDropZone.off(Node.EventType.TOUCH_END, this.onDropZoneClick, this);
            this.targetDropZone = null;
        }

        // 2. Quay về vị trí ban đầu
        if (this.originalParent) {
            this.node.setParent(this.originalParent);
            this.node.setPosition(this.originalPosition);
        }

        // 3. Trả lại màu trắng
        const sprite = this.node.getComponent(Sprite);
        if (sprite) sprite.color = new Color(255, 255, 255);

        // 4. Dừng update/play
        this.isDropped = false;
        this._audioSource = null!;
        this.sprite = null!;
    }



    private onDropZoneClick() {
        if (!this.isDropped || !this.targetDropZone) return;

        // Xoá animation node cũ
        const animNode = this.targetDropZone.getChildByName('AnimationNode');
        if (animNode) {
            animNode.destroy();
        }

        // Trả lại màu bình thường cho sprite gốc
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255);
        }

        // Hiển thị lại drop zone nếu có
        const dropZoneSprite = this.targetDropZone.getComponent(Sprite);
        if (dropZoneSprite) {
            dropZoneSprite.enabled = true;
        }

        // Reset state
        this.isDropped = false;
        this._isPlaying = false;
        this.targetDropZone.off(Node.EventType.TOUCH_END, this.onDropZoneClick, this);
        this.targetDropZone = null;

        // Stop audio
        if (this._audioSource) {
            this._audioSource.stop();
        }

        // Reset LoadingPlayAudio state nếu cần
        const loadingPlayAudio = this.node.getComponent(LoadingPlayAudio);
        if (loadingPlayAudio) {
            loadingPlayAudio.resetLoadingState();
        }
    }


    private loadAssetsAndWaitForLoading(imagePath: string) {
        const spriteFolderPath = `PlayGame/image/${imagePath}`;
        const audioPath = `audio/${imagePath.split("/")[1]}`;

        console.log("Loading assets for:", imagePath);

        // Load sprite frames
        resources.loadDir(spriteFolderPath, SpriteFrame, (err, assets: SpriteFrame[]) => {
            if (err) {
                console.error('Failed to load sprite frames:', err);
                return;
            }

            const filteredAssets = assets.slice(1).filter((asset) => {
                const fileName = asset['_name'];
                const fileNumber = parseInt(fileName.replace(/\D/g, ''));
                return fileNumber >= 1;
            });

            this._spriteFrames = filteredAssets.sort((a, b) => {
                const numA = parseInt(a['_name'].replace(/\D/g, ''));
                const numB = parseInt(b['_name'].replace(/\D/g, ''));
                return numA - numB;
            });

            console.log("Sprite frames loaded, count:", this._spriteFrames.length);

            // Load audio clip
            resources.load<AudioClip>(audioPath, AudioClip, (err, audioClip) => {
                if (err || !audioClip) {
                    console.error(`Không thể load audio tại ${audioPath}`, err);
                    return;
                }

                console.log("Audio clip loaded");

                if (this._spriteFrames.length > 0) {
                    // Set initial frame
                    if (this.sprite && this._spriteFrames[0]) {
                        this.sprite.spriteFrame = this._spriteFrames[0];
                    }

                    // Set audio clip
                    if (this._audioSource) {
                        this._audioSource.clip = audioClip;
                    }

                    // Tìm LoadingPlayAudio component từ scene
                    let loadingPlayAudio = this.findLoadingPlayAudio();
                    if (loadingPlayAudio) {
                        console.log("Found LoadingPlayAudio component");
                        loadingPlayAudio.resetLoadingState(); // Reset trạng thái trước khi set callback mới
                        loadingPlayAudio.setOnLoadComplete(() => {
                            console.log("LoadingPlayAudio completed, starting playback");
                            this.startPlayback(this._spriteFrames, audioClip, 0.911);
                        });
                    } else {
                        console.error("Could not find LoadingPlayAudio component anywhere in the scene");
                    }
                }
            });
        });
    }

    private findLoadingPlayAudio(): LoadingPlayAudio | null {
        // Thử tìm trong node cha
        let loadingPlayAudio = this.node.parent?.getComponent(LoadingPlayAudio);
        if (loadingPlayAudio) {
            return loadingPlayAudio;
        }

        // Thử tìm trong node con của node cha
        if (this.node.parent) {
            loadingPlayAudio = this.node.parent.getComponentInChildren(LoadingPlayAudio);
            if (loadingPlayAudio) {
                return loadingPlayAudio;
            }
        }

        // Thử tìm trong scene
        const scene = this.node.scene;
        const allNodes = scene.children;
        for (const node of allNodes) {
            loadingPlayAudio = node.getComponent(LoadingPlayAudio);
            if (loadingPlayAudio) {
                return loadingPlayAudio;
            }

            // Tìm trong con của node
            loadingPlayAudio = node.getComponentInChildren(LoadingPlayAudio);
            if (loadingPlayAudio) {
                return loadingPlayAudio;
            }
        }

        return null;
    }

    private startPlayback(spriteFrames: SpriteFrame[], audioClip: AudioClip, duration: number) {
        console.log("Starting playback");
        this._spriteFrames = spriteFrames;
        this._duration = duration;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;
        this._deltaTime = duration / spriteFrames.length;

        // Start audio and animation
        if (this._audioSource && this.sprite && this.sprite.node.isValid) {
            console.log("Playing audio and setting initial frame");
            this._audioSource.play();
            this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
        } else {
            console.warn("Missing components for playback:", {
                hasAudioSource: !!this._audioSource,
                hasSprite: !!this.sprite,
                isSpriteNodeValid: this.sprite?.node.isValid
            });
        }
    }

    update(dt: number) {
        if (!this.isDropped || !this.sprite || !this.sprite.node.isValid || !this._isPlaying) return;

        this._timer += dt;
        if (this._timer >= this._deltaTime) {
            this._timer -= this._deltaTime;
            this._frameIndex++;
            if (this._frameIndex < this._spriteFrames.length) {
                this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
            } else {
                this._frameIndex = 0;
                if (this.sprite && this._spriteFrames.length > 0) {
                    this.sprite.spriteFrame = this._spriteFrames[0];
                }
                if (this._audioSource) {
                    this._audioSource.stop();
                    this._audioSource.play();
                }
            }
        }
    }


}
