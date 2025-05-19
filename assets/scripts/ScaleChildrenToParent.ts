import { _decorator, Component, Node, UITransform, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScaleChildrenWithParent')
export class ScaleChildrenWithParent extends Component {
  @property(Node)
    parentNode: Node = null; // Farm1

    @property([Node])
    childrenToScale: Node[] = []; // Default1 - Default7

    private originalSizes: Map<Node, { width: number, height: number }> = new Map();

    start() {
        // Lưu lại kích thước ban đầu của mỗi node con
        for (const child of this.childrenToScale) {
            const size = child.getComponent(UITransform).contentSize;
            this.originalSizes.set(child, { width: size.width, height: size.height });
        }

        this.updateScale();
        this.node.on(Node.EventType.SIZE_CHANGED, this.updateScale, this);
        view.on('design-resolution-changed', this.updateScale, this);
    }

    updateScale = () => {
        const parentSize = this.parentNode.getComponent(UITransform).contentSize;

        for (const child of this.childrenToScale) {
            const original = this.originalSizes.get(child);
            if (!original) continue;

            const scaleX = parentSize.width / original.width;
            const scaleY = parentSize.height / original.height;

            child.setScale(new Vec3(scaleX, scaleY, 1));
        }
    };

    onDestroy() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.updateScale, this);
        view.off('design-resolution-changed', this.updateScale, this);
    }
}
