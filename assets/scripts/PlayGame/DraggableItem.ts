import { _decorator, Component, Node, Vec3, EventTouch, CameraComponent, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DraggableItem')
export class DraggableItem extends Component {
    @property(Node)
    dropTargets: Node[] = [];  // Array of drop slots
    private isDragging: boolean = false;
    private originalPosition: Vec3 = new Vec3();
    private camera: CameraComponent = null;  // Reference to the camera component
    private ghostNode: Node | null = null;

    start() {
        this.originalPosition = this.node.position.clone();
        this.camera = this.node.scene?.getComponentInChildren(CameraComponent); // Get the camera component from the scene
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        this.isDragging = true;
    }

    onTouchMove(event: EventTouch) {
        if (this.isDragging) {
            // Get the touch position in screen space
            const touchPos = event.getLocation();

            // Convert the touch position (screen space) to world space
            const worldPos = this.camera!.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));

            // Update the position of the node to follow the mouse in world space
            this.node.setWorldPosition(worldPos);
        }
    }
    onTouchEnd(event: EventTouch) {
        this.isDragging = false;

        // Check if the item is dropped on a valid drop slot
        let droppedOnSlot = false;
        for (let slot of this.dropTargets) {
            if (this.isNodeInSlot(slot)) {
                droppedOnSlot = true;
                this.node.setWorldPosition(slot.getWorldPosition());  // Đặt node vào vị trí trung tâm của slot
                break;
            }
        }

        if (!droppedOnSlot) {
            // Nếu không thả đúng slot nào thì trả về vị trí ban đầu
            this.node.setPosition(this.originalPosition);
        }
    }


    // Check if the node is inside a drop slot
    isNodeInSlot(slot: Node): boolean {
        const itemBox = this.node.getComponent(UITransform)!.getBoundingBoxToWorld();
        const slotBox = slot.getComponent(UITransform)!.getBoundingBoxToWorld();
        const nodeWorldPos = this.node.getWorldPosition();  // Get the global position of the node
        const slotWorldPos = slot.getWorldPosition();  // Get the global position of the slot
        const slotWidth = slot.getContentSize().width;  // Width of the slot
        const slotHeight = slot.getContentSize().height;  // Height of the slot

        // Check if the node is within the bounds of the slot
        const withinX = nodeWorldPos.x >= slotWorldPos.x - slotWidth / 2 &&
            nodeWorldPos.x <= slotWorldPos.x + slotWidth / 2;
        const withinY = nodeWorldPos.y >= slotWorldPos.y - slotHeight / 2 &&
            nodeWorldPos.y <= slotWorldPos.y + slotHeight / 2;

        return withinX && withinY;  // Return true if node is inside the slot
    }

    init(dropTargets: Node[]) {
        this.dropTargets = dropTargets;
    }
}
