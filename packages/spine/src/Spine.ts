import {
  IRobotComputedKeyframe,
  registerUI,
  surfaceType,
  UI,
  ILeaferCanvas,
  // Debug,
} from 'leafer-ui';
import * as spineCanvas from '@esotericsoftware/spine-canvas';

// Debug.showRepaint = true

@registerUI()
export class Spine extends UI {
  public skeleton: spineCanvas.Skeleton;
  public spineScale: number;
  public skeletonData: spineCanvas.SkeletonData;
  public skeletonRenderer: spineCanvas.SkeletonRenderer;
  public animationState: spineCanvas.AnimationState;
  public lastFrameTime: number;
  public get __tag() {
    return 'Spine';
  }

  constructor(props: any) {
    super(props);
    this.skeletonData = props.skeletonData;
  }

  public running: boolean;
  public get nowFrame(): IRobotComputedKeyframe {
    return this.robotFrames && this.robotFrames[this.now];
  }

  public robotFrames?: IRobotComputedKeyframe[];
  @surfaceType(0)
  public now?: number;

  initSpine = async (canvas: HTMLCanvasElement) => {
    if (this.skeleton) return;
    const context = canvas.getContext('2d');
    this.skeletonRenderer = new spineCanvas.SkeletonRenderer(context);
    this.skeletonRenderer.triangleRendering = true;

    this.skeleton = new spineCanvas.Skeleton(this.skeletonData);
    this.skeleton.setToSetupPose();
    this.skeleton.updateWorldTransform(spineCanvas.Physics.update);

    var animationStateData = new spineCanvas.AnimationStateData(
      this.skeleton.data
    );
    animationStateData.defaultMix = 0.2;
    this.animationState = new spineCanvas.AnimationState(animationStateData);
    this.animationState.setAnimation(0, 'walk', true);

    this.lastFrameTime = Date.now() / 1000;

    this.skeleton.x = this.skeletonData.x + this.skeletonData.width;
    this.skeleton.y = this.skeletonData.y + this.skeletonData.height;
    this.skeleton.scaleX = 1;
    this.skeleton.scaleY = -1;
  };
  __updateBoxBounds = () => {
    const box = this.__layout.boxBounds;
    if (this.skeleton) {
      const Rect = this.skeleton.getBoundsRect();
      box.x = Rect.x;
      box.y = Rect.y;
      box.width = Rect.width;
      box.height = Rect.height;
      this.forceUpdate('width');
    } else {
      box.x = 0;
      box.y = 0;
      box.width = this.skeletonData.width;
      box.height = this.skeletonData.height;
    }
  };
  __draw = (canvas: ILeaferCanvas) => {
    this.initSpine(canvas.view);
    this.render();
  };
  render = () => {
    var now = Date.now() / 1000;
    var delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.animationState.update(delta);
    this.animationState.apply(this.skeleton);
    this.skeleton.updateWorldTransform(spineCanvas.Physics.update);
    this.skeletonRenderer.draw(this.skeleton);
    this.__updateBoxBounds();
  };
}

export const loadAsset = async ({
  baseUrl,
  skelName,
  atlasName,
}: {
  baseUrl: string;
  skelName: string;
  atlasName: string;
}) => {
  const assetManager = new spineCanvas.AssetManager(baseUrl);
  assetManager.loadBinary(skelName);
  assetManager.loadTextureAtlas(atlasName);
  await assetManager.loadAll();

  let atlas = assetManager.require(atlasName);
  let atlasLoader = new spineCanvas.AtlasAttachmentLoader(atlas);
  let skeletonBinary = new spineCanvas.SkeletonBinary(atlasLoader);
  let skeletonData = skeletonBinary.readSkeletonData(
    assetManager.require(skelName)
  );
  return skeletonData;
};
