import {
    _decorator,
    Component,
    ImageAsset,
    Node,
    Sprite,
    SpriteFrame,
    Texture2D,
    resources,
    instantiate,
    Prefab,
    Animation,
    AnimationClip,
} from 'cc';
import { GameDataManager } from '../GameDataManager';
const { ccclass, property } = _decorator;

@ccclass('SetSprites')
export class SetSprites extends Component {
    @property(Node)
    container1: Node = null;  // Node cha 1
    @property(Node)
    container2: Node = null;  // Node cha 2
    private animClips: AnimationClip[] = []; // Danh sách các animation clip
    onLoad() {
        this.loadAnimClips(() => {
            const imageUrl = GameDataManager.getInstance().data.ItemSelect.figure;
            const finalUrl = `${imageUrl}${/\.(png|jpe?g)$/.test(imageUrl) ? '' : '.png'}`;
            this.loadImageFromPath(finalUrl, (spriteFrame) => {
                if (!spriteFrame) {
                    return;
                }
                this.setSprites(this.container1, spriteFrame);
                this.setSprites(this.container2, spriteFrame);
            });
        });
    }

    loadAnimClips(callback: () => void) {
        // Load tất cả animation clip từ thư mục 'Animator/animationRainBow'
        resources.loadDir('Animator/animationRainBow', AnimationClip, (err, clips) => {
            if (err) {
                callback();
                return;
            }
            this.animClips = clips;
            callback();
        });
    }

    loadImageFromPath(path: string, callback: (spriteFrame: SpriteFrame | null) => void) {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            const imageAsset = new ImageAsset(image);
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            callback(spriteFrame);
        };

        image.onerror = () => {
            callback(null);
        };

        image.src = path;
    }

    setSprites(container: Node, spriteFrame: SpriteFrame) {
        const children = container.children;

        // Giới hạn chỉ gán ảnh cho 7 node con
        for (let i = 0; i < Math.min(children.length, 7); i++) {
            const spriteNode = children[i];
            const sprite = spriteNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = spriteFrame;
            }

            // Nếu có các anim clip, thêm một clip ngẫu nhiên vào node và phát animation
            if (this.animClips.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.animClips.length);
                const randomClip = this.animClips[randomIndex];

                let anim = spriteNode.getComponent(Animation);
                if (!anim) {
                    anim = spriteNode.addComponent(Animation);
                }

                anim.addClip(randomClip);
                anim.defaultClip = randomClip;

                // Lấy state của animation
                const state = anim.getState(randomClip.name);

                // Phát animation
                anim.play(randomClip.name);

                // Chờ một frame rồi set thời gian thủ công
                setTimeout(() => {
                    const duration = randomClip.duration;
                    const randomTime = Math.random() * duration;
                    state.time = randomTime;
                }, 0);
            }
        }
    }
}
