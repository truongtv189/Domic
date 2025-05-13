import { _decorator, Component, Node, EventTouch, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    @property(Node)
    targetDropZone: Node | null = null;

    public dropTargets: Node[] = [];
    public originalPosition: Vec3 = new Vec3();
    public originalParent: Node = null;
    private offset = new Vec3();
    private isDragging: boolean = false;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        const touchPos = event.getUILocation(); // Lấy vị trí chuột trong không gian UI
        const nodePos = this.node.getWorldPosition(); // Vị trí node trong không gian thế giới
        this.offset.set(nodePos.x - touchPos.x, nodePos.y - touchPos.y, 0); // Lưu lại offset
    }

    onTouchMove(event: EventTouch) {
        const touchPos = event.getUILocation(); // Lấy vị trí chuột trong không gian UI
        // Chuyển vị trí chuột từ UI space thành world space rồi áp dụng offset
        this.node.setWorldPosition(touchPos.x + this.offset.x, touchPos.y + this.offset.y, 0);
    }

    onTouchEnd(touch: EventTouch) {
        this.isDragging = false;

        const worldPos = this.node.worldPosition;

        for (const dropZone of this.dropTargets) {
            const dropBox = dropZone.getComponent(UITransform);
            if (!dropBox) continue;

            const localPos = dropBox.convertToNodeSpaceAR(worldPos);
            const size = dropBox.contentSize;

            if (
                Math.abs(localPos.x) <= size.width / 2 &&
                Math.abs(localPos.y) <= size.height / 2
            ) {
                this.node.setParent(dropZone);
                const finalPos = dropZone.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
                this.node.setPosition(finalPos);
                return;
            }
        }

        // Không thả đúng → quay lại vị trí cũ
        this.node.setParent(this.originalParent);
        const returnPos = this.originalParent.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
        this.node.setPosition(returnPos);
    }
}
