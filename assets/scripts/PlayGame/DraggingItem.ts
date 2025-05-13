import { _decorator, Component, EventTouch, Node, Sprite, UITransform, Vec2, Color, instantiate, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    private originalPosition: Vec3;
    private isDragging = false;
    private dropSlots: Node[] = [];
    private cloneNode: Node | null = null;
    private cloneParent: Node = null;
    private isDragged = false;  // Xác nhận đã bị kéo

    start() {
        this.originalPosition = this.node.position.clone();
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        this.cloneParent = this.node.parent;
    }

    initDropSlots(slots: Node[]) {
        this.dropSlots = slots;
    }

    private onTouchStart(event: EventTouch) {
        if (this.isDragged) return;  // Nếu đã kéo, không xử lý tiếp

        this.isDragging = true;
        this.node.setSiblingIndex(999);
        this.node.opacity = 160;
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;
        const delta = event.getDelta();
        const pos = this.node.position;
        this.node.setPosition(pos.x + delta.x, pos.y + delta.y);
    }

    private onTouchEnd(event: EventTouch) {
        const worldPos = this.node.getWorldPosition();
        const point = new Vec2(worldPos.x, worldPos.y);
        let dropped = false;

        for (const slot of this.dropSlots) {
            const rect = slot.getComponent(UITransform)?.getBoundingBoxToWorld();
            if (rect?.contains(point)) {
                const dragSprite = this.node.getComponent(Sprite)?.spriteFrame;
                const slotSprite = slot.getComponent(Sprite);
                if (dragSprite && slotSprite) {
                    slotSprite.spriteFrame = dragSprite;
                    (slot as any)._linkedItem = this; // lưu liên kết ngược
                    slot.once(Node.EventType.TOUCH_END, this.onSlotClick, this);

                    this.createClone(); // tạo bản sao xám
                    dropped = true;
                    break;
                }
            }
        }

        if (dropped) {
            this.isDragged = true; // Đánh dấu đã bị kéo
            this.node.opacity = 255; // Không làm mờ ảnh gốc nữa
        }
    }

    private createClone() {
        if (this.cloneNode) return;  // Nếu đã có clone thì không tạo nữa
        this.cloneNode = instantiate(this.node);
        this.cloneParent.addChild(this.cloneNode);
        this.cloneNode.setPosition(this.originalPosition);
        const sprite = this.cloneNode.getComponent(Sprite);
        if (sprite) sprite.color = new Color(150, 150, 150, 255); // Làm xám
        this.cloneNode.removeComponent(DraggableItem); // Không cho kéo
    }

    private onSlotClick(event: EventTouch) {
        const slot = event.currentTarget as Node;
        const sprite = slot.getComponent(Sprite);
        if (sprite) sprite.spriteFrame = null;

        // Khôi phục lại ảnh gốc
        if (this.cloneNode && this.cloneNode.isValid) {
            this.cloneNode.destroy();
            this.cloneNode = null;
        }

        // Cho phép slot được tương tác lại nếu kéo lần nữa
        slot.off(Node.EventType.TOUCH_END, this.onSlotClick, this);
        (slot as any)._linkedItem = null;

        // Khi click vào slot, ảnh gốc có thể được kéo lại
        this.isDragged = false;  // Đánh dấu ảnh gốc có thể kéo lại
    }
}
