import {
    _decorator,
    Component,
    Node,
    EventTouch,
    Vec3,
    Vec2,
    Prefab,
    instantiate,
    UITransform,
    Animation,
    AudioSource,
    tween,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DragDropHandle')
export class DragDropHandle extends Component {
    @property([Node])
    dragNodes: Node[] = [];
    @property([Node])
    dropTargets: Node[] = [];
    @property(Prefab)
    dropResultPrefab: Prefab = null!;
    private isDragging = false;
    private currentDragNode: Node | null = null;
    private originalPositions: Map<Node, Vec3> = new Map();
    // Lưu mối quan hệ: dropResult -> { dragNode, dropTarget }
    private resultMapping: Map<Node, { dragNode: Node, dropTarget: Node }> = new Map();
    onLoad() {
        // Lưu vị trí gốc của dragNodes
        this.dragNodes.forEach(node => {
            this.originalPositions.set(node, node.position.clone());
            node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        });
    }

    onTouchStart(event: EventTouch) {
        this.currentDragNode = event.target as Node;
        this.isDragging = true;
        this.currentDragNode.setSiblingIndex(999);
    }

    onTouchMove(event: EventTouch) {
        if (!this.isDragging || !this.currentDragNode) return;
        const delta = event.getDelta();
        const pos = this.currentDragNode.position;
        this.currentDragNode.setPosition(pos.x + delta.x, pos.y + delta.y);
    }

    onTouchEnd(event: EventTouch) {
        if (!this.isDragging || !this.currentDragNode) return;
        this.isDragging = false;
        const dragWorldPos = this.currentDragNode.getWorldPosition();
        const dragWorldPos2D = new Vec2(dragWorldPos.x, dragWorldPos.y);
        for (let target of this.dropTargets) {
            const targetRect = target.getComponent(UITransform)!.getBoundingBoxToWorld();

            if (targetRect.contains(dragWorldPos2D)) {
                this.currentDragNode.active = false;
                target.active = false;
                const parent = target.parent!;
                const localPos = parent.getComponent(UITransform)!.convertToNodeSpaceAR(target.worldPosition);
                const prefabInstance = instantiate(this.dropResultPrefab);
                prefabInstance.setPosition(localPos);
                parent.addChild(prefabInstance);
                this.resultMapping.set(prefabInstance, {
                    dragNode: this.currentDragNode,
                    dropTarget: target
                });
                prefabInstance.on(Node.EventType.TOUCH_END, this.onResultClick, this);
                const anim = prefabInstance.getComponent(Animation);
                if (anim) anim.play();

                // Phát audio nếu có
                const audio = prefabInstance.getComponent(AudioSource);
                if (audio) audio.play();

                break;
            }
        }

        this.currentDragNode = null;
    }

    onResultClick(event: EventTouch) {
        const resultNode = event.target as Node;
        const data = this.resultMapping.get(resultNode);
        if (!data) return;
        const { dragNode, dropTarget } = data;
        resultNode.active = false;
        dragNode.active = true;
        const origin = this.originalPositions.get(dragNode)!;
        tween(dragNode)
            .to(0.3, { position: origin }, { easing: 'quadOut' })
            .start();

        dropTarget.active = true;
        this.resultMapping.delete(resultNode);
    }
}
