import { _decorator, Component, Node, EventTouch, UITransform, Vec3, Sprite, Color } from 'cc';
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
            // Thả đúng: trả về vị trí ban đầu và làm xám
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition);
            }

            const sprite = this.node.getComponent(Sprite);
            if (sprite) sprite.color = new Color(180, 180, 180); // Làm xám

            this.isDropped = true;

            // Hủy các sự kiện di chuyển
            this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        } else {
            // Thả sai: trả về vị trí ban đầu chính xác
            if (this.originalParent) {
                this.node.setParent(this.originalParent);
                this.node.setPosition(this.originalPosition);
            }
        }
    }

}
