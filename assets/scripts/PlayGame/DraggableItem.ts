import { _decorator, Component, Node, EventTouch, UITransform, Vec3, Sprite, Color, AudioSource, SpriteFrame, AudioClip, resources } from 'cc';
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
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition);
            }
            const dropZoneSprite = matchedDropZone.getComponent(Sprite);
            if (dropZoneSprite) {
                dropZoneSprite.enabled = false; // Ẩn ảnh tại vị trí thả
            }
            const sprite = this.node.getComponent(Sprite);
            if (sprite) sprite.color = new Color(180, 180, 180);
            this.isDropped = true;
            this.sprite = sprite;

            // Tạo node mới tại vị trí dropZone
            const animationNode = new Node('AnimationNode');
            matchedDropZone.addChild(animationNode);
            animationNode.setPosition(Vec3.ZERO); // Hoặc tuỳ chỉnh nếu muốn offset
            const newSprite = animationNode.addComponent(Sprite);

            // Gán AudioSource cho animation node nếu cần
            const audioSource = animationNode.addComponent(AudioSource);

            // Lưu sprite mới vào class để điều khiển animation
            this.sprite = newSprite;
            this._audioSource = audioSource;
            this.loadAndPlayAssets(this.dragData.image);

        }
        else {
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition); // Quay lại vị trí gốc
            }
        }
        this.targetDropZone = matchedDropZone;
        matchedDropZone.on(Node.EventType.TOUCH_END, this.onDropZoneClick, this, true);
    }
    private onDropZoneClick() {
    if (!this.isDropped || !this.targetDropZone) return;

    // Xóa animation node con bên trong drop zone (nếu có)
    const animNode = this.targetDropZone.getChildByName('AnimationNode');
    if (animNode) {
        animNode.destroy();
    }

    // Hiện lại sprite gốc
    const sprite = this.node.getComponent(Sprite);
    if (sprite) {
        sprite.color = new Color(255, 255, 255); // Trả lại màu bình thường
    }

    // Di chuyển node về vị trí gốc
    if (this.originalParent) {
        this.node.setParent(this.originalParent);
        this.node.setPosition(this.originalPosition);
    }

    // Hiện lại dropZone nếu trước đó bị ẩn
    const dropZoneSprite = this.targetDropZone.getComponent(Sprite);
    if (dropZoneSprite) {
        dropZoneSprite.enabled = true;
    }

    // Reset lại state
    this.isDropped = false;
    this.targetDropZone.off(Node.EventType.TOUCH_END, this.onDropZoneClick, this, true);
    this.targetDropZone = null;
}

    private loadAndPlayAssets(imagePath: string) {
        const spriteFolderPath = `PlayGame/image/${imagePath}`;
        const audioPath = `PlayGame/image/${imagePath.split("/")[0]}/${imagePath.split("/")[1]}/${imagePath.split("/")[1]}`;  // Ví dụ: image/rainbow/rainbow1/rainbow1.mp3
        resources.loadDir(spriteFolderPath, SpriteFrame, (err, assets: SpriteFrame[]) => {
            if (err) {
                console.error('Failed to load sprite frames:', err);
                return;
            }
            this._spriteFrames = assets;
            resources.load<AudioClip>(audioPath, AudioClip, (err, audioClip) => {
                if (err || !audioClip) {
                    console.error(` Không thể load audio tại ${audioPath}`, err);
                    return;
                }
                this.setData(assets, audioClip, 0.911);
            });
        });

    }

    public setData(spriteFrames: SpriteFrame[], audioClip: AudioClip, duration: number = 0.911) {
        this._spriteFrames = spriteFrames;
        this._duration = duration;
        this.play()
        if (!this._audioSource) {
            this._audioSource = this.node.getComponent(AudioSource) || this.node.addComponent(AudioSource);
        }
        this._audioSource.clip = audioClip;
        if (this._spriteFrames.length > 0) {
            this.sprite.spriteFrame = this._spriteFrames[0];
        }
    }
    public play() {
        if (!this._audioSource || this._spriteFrames.length === 0) return;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;
        this._deltaTime = this._duration / this._spriteFrames.length;
        this._audioSource.stop();
        this._audioSource.play();
        this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
    }
    update(dt: number) {
        if (!this._isPlaying) return;
        this._timer += dt;
        if (this._timer >= this._deltaTime) {
            this._timer -= this._deltaTime;
            this._frameIndex++;
            if (this._frameIndex < this._spriteFrames.length) {
                this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
            } else {
                this._isPlaying = false;
                this.play();
            }
        }
    }


}
