import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupItem')
export class PopupItem extends Component {
    @property({ type: Node })
    container: Node = null;

    close() {
        if (this.container) {
            this.container.active = false;
        }

    }

    open() {
        if (this.container) {
            this.container.active = true;
        }
    }

    openWithEffect(): void {
        if (this.container) {
            this.container.active = true;
            this.container.getComponent(UIOpacity).opacity = 0; // Bắt đầu từ 0
            tween(this.container.getComponent(UIOpacity))
                .to(0.2, { opacity: 255 }) // Tween fade in trong 0.5s
                .start();
        }
    }

    closeWithEffect(): void {
        tween(this.container.getComponent(UIOpacity))
            .to(0.2, { opacity: 0 }) // Tween fade in trong 0.5s
            .call(() => {
                this.container.active = false;
            })
            .start();
    }
}


