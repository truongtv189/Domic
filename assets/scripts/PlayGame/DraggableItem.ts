import { _decorator, Component, Node, EventTouch, UITransform, Vec3, Sprite, Color, AudioSource, SpriteFrame, AudioClip, resources, Widget, director } from 'cc';
import { LoadingPlayAudio } from '../LoadingPlayAudio/LoadingPlayAudio';
import AdsManager from '../AdsPlatform/AdsManager';
import { GameDataManager } from '../GameDataManager';
const { ccclass, property } = _decorator;

// Định nghĩa hằng số cho tên sự kiện
const RESET_AUDIO_FRAME_EVENT = 'reset-audio-frame';

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    public targetDropZone: Node | null = null;
    public originalParent: Node | null = null;
    public originalPosition: Vec3 = new Vec3();
    public dropTargets: Node[] = [];
    public dragData: { id: number, core: string, image: string, _deltaTime: number, isAds: boolean };
    private offset = new Vec3();
    private isDropped = false;
    private sprite: Sprite = null!;
    private _audioSource: AudioSource | null = null;
    private _frameIndex = 0;
    private _deltaTime = 0;
    private _timer = 0;
    private _isPlaying = false;
    private _spriteFrames: SpriteFrame[] = [];
    private static dropZoneMap: Map<Node, DraggableItem> = new Map();

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_START, this.onClickOriginalItem, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.originalPosition = this.node.getPosition().clone();
        this.originalParent = this.node.parent;

        // Thêm listener cho sự kiện reset
        director.on(RESET_AUDIO_FRAME_EVENT, this.handleReset, this);

        // Kiểm tra trạng thái đã xem ads dựa vào core của item
        this.scheduleOnce(() => {
            if (this.dragData && this.dragData.core) {
                const watched = GameDataManager.getInstance().data.watchedAdsItems || {};
                // Kiểm tra dựa vào core của item (ví dụ: rainbow1, rainbow2,...)
                if (watched[this.dragData.core] === true) {
                    // Ẩn node ads nếu đã xem
                    const adsNode = this.node.getChildByName("ADS");
                    if (adsNode) {
                        adsNode.active = false;
                    }
                    this.dragData.isAds = false;
                }
            }
        }, 0);
    }
    onDestroy() {
        // Dọn dẹp event listener
        director.off(RESET_AUDIO_FRAME_EVENT, this.handleReset, this);
    }
    private handleReset = () => {
        // Dừng các animation và audio đang chạy
        if (this._audioSource) {
            this._audioSource.stop();
        }
        // Reset frame index và timer
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = false;
        // Reset sprite về frame đầu tiên nếu có
        if (this.sprite && this._spriteFrames.length > 0) {
            this.sprite.spriteFrame = this._spriteFrames[0];
        }
        // Gọi resetState để xử lý các cleanup khác
        this.resetState();
    }

    onTouchStart(event: EventTouch) {
        if (this.isDropped) return;
        const touchPos = event.getUILocation();
        const nodePos = this.node.getPosition();
        this.offset.set(nodePos.x - touchPos.x, nodePos.y - touchPos.y, 0);
    }
    private onClickOriginalItem(event: EventTouch) {
        if (this.dragData.isAds == true) {
            AdsManager.showRewarded((status) => {
                if (status) {
                    const watched = GameDataManager.getInstance().data.watchedAdsItems;
                    // Lưu trạng thái đã xem ads theo core của item
                    watched[this.dragData.core] = true;
                    GameDataManager.getInstance().updateField('watchedAdsItems', watched);
                    // Ẩn node quảng cáo sau khi xem xong
                    const adsNode = this.node.getChildByName("ADS");
                    if (adsNode) {
                        adsNode.active = false;
                    }
                    // Cập nhật dragData để phản ánh rằng không cần quảng cáo nữa
                    this.dragData.isAds = false;
                }
            });
        }
        if (this.isDropped) return; // chỉ xử lý nếu chưa drop
    }
    onTouchMove(event: EventTouch) {
        if (this.isDropped) return;
        const touchPos = event.getUILocation();
        const newPos = new Vec3(touchPos.x + this.offset.x, touchPos.y + this.offset.y, 0);
        this.node.setPosition(newPos);
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
                oldItem.resetState();
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
                // Tăng kích thước thêm 30px cho cả width và height
                const extraSize = 30;
                newTransform.setContentSize(
                    dropZoneTransform.contentSize.width + extraSize,
                    dropZoneTransform.contentSize.height + extraSize
                );
                newTransform.anchorPoint = dropZoneTransform.anchorPoint;
            }

            // Sao chép các thuộc tính Widget từ dropZone
            if (dropZoneWidget) {
                const newWidget = animationNode.addComponent(Widget);
                // Sao chép tất cả các thuộc tính từ widget gốc
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

            // Đặt vị trí về trung tâm của dropZone
            animationNode.setPosition(Vec3.ZERO);
            // Thiết lập Sprite với kích thước phù hợp
            const newSprite = animationNode.addComponent(Sprite);
            newSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            newSprite.trim = false;

            // Đảm bảo scale để fit với dropZone và giữ tỷ lệ
            if (dropZoneTransform) {
                const size = dropZoneTransform.contentSize;
                // Tính toán scale để item vừa với dropZone
                const scale = Math.min(1, size.height / size.width);
                animationNode.setScale(new Vec3(scale, scale, 1));
            }
            const audioSource = animationNode.addComponent(AudioSource);

            // Ẩn dropZone sprite
            const dropZoneSprite = matchedDropZone.getComponent(Sprite);
            if (dropZoneSprite) {
                dropZoneSprite.enabled = false;
            }
            // Đặt màu cho sprite gốc
            const sprite = this.node.getComponent(Sprite);
            if (sprite) sprite.color = new Color(180, 180, 180);
            // Thiết lập các thuộc tính
            this.isDropped = true;
            this.sprite = newSprite;
            this._audioSource = audioSource;
            this.targetDropZone = matchedDropZone;
            // Đặt parent và position
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
    public resetState() {
        // 1. Xóa dropZone khỏi map nếu đang giữ
        if (this.targetDropZone) {
            DraggableItem.dropZoneMap.delete(this.targetDropZone);
            // Hiện lại drop zone
            const dropZoneSprite = this.targetDropZone.getComponent(Sprite);
            if (dropZoneSprite) dropZoneSprite.enabled = true;
            // Xóa animationNode nếu có
            const animNode = this.targetDropZone.getChildByName('AnimationNode');
            if (animNode) {
                const audio = animNode.getComponent(AudioSource);
                if (audio) audio.stop();
                animNode.destroy();
            }
            this.targetDropZone.off(Node.EventType.TOUCH_END, this.onDropZoneClick, this);
            this.targetDropZone = null;
        }
        // Quay về vị trí ban đầu
        if (this.originalParent) {
            this.node.setParent(this.originalParent);
            this.node.setPosition(this.originalPosition);
        }
        // Trả lại màu trắng
        const sprite = this.node.getComponent(Sprite);
        if (sprite) sprite.color = new Color(255, 255, 255);

        // Dừng update/play
        this.isDropped = false;
        this._audioSource = null!;
        this.sprite = null!;
    }

    private onDropZoneClick() {
        if (!this.isDropped || !this.targetDropZone) return;
        // Xóa animation node cũ
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

        // Dừng audio
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
        // Load sprite frames
        resources.loadDir(spriteFolderPath, SpriteFrame, (err, assets: SpriteFrame[]) => {
            if (err) {
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
            // Load audio clip
            resources.load<AudioClip>(audioPath, AudioClip, (err, audioClip) => {
                if (err || !audioClip) {
                    return;
                }

                if (this._spriteFrames.length > 0) {
                    // Đặt frame ban đầu
                    if (this.sprite && this._spriteFrames[0]) {
                        this.sprite.spriteFrame = this._spriteFrames[0];
                    }
                    // Đặt audio clip
                    if (this._audioSource) {
                        this._audioSource.clip = audioClip;
                    }
                    // Tìm LoadingPlayAudio component từ scene
                    let loadingPlayAudio = this.findLoadingPlayAudio();
                    if (loadingPlayAudio) {
                        loadingPlayAudio.resetLoadingState(); // Reset trạng thái trước khi set callback mới
                        loadingPlayAudio.setOnLoadComplete(() => {
                            this.startPlayback(this._spriteFrames, audioClip, this.dragData._deltaTime);
                        });
                    } else {
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
        this._spriteFrames = spriteFrames;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;
        this._deltaTime = duration / spriteFrames.length;
        // Bắt đầu audio và animation
        if (this._audioSource && this.sprite && this.sprite.node.isValid) {
            this._audioSource.play();
            this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
        } else {

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
