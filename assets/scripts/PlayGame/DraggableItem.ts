import { _decorator, Component, Node, EventTouch, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    @property(Node)
    targetDropZone: Node | null = null;

    public dropTargets: Node[] = [];
    public originalPosition: Vec3 = new Vec3();
    public originalParent: Node = null;

    private isDragging: boolean = false;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(touch: EventTouch) {
        this.isDragging = true;
        // Đảm bảo node luôn trên cùng khi kéo
        this.node.setSiblingIndex(this.node.parent.children.length - 1);
    }

    onTouchMove(touch: EventTouch) {
        if (!this.isDragging) return;
        const delta = touch.getUIDelta();
        this.node.setPosition(this.node.position.add3f(delta.x, delta.y, 0));
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
