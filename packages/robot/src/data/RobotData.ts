import { IRobot, IRobotData, IRobotActionName, IRobotKeyframe } from '@leafer-ui/interface'
import { UIData } from '@leafer-ui/draw'


export class RobotData extends UIData implements IRobotData {

    public get __isCanvas(): boolean { return true }

    public get __drawAfterFill(): boolean { return true }

    public get __boxStroke(): boolean { return !(this as IRobotData).__pathInputed }

    protected _robot: IRobotKeyframe | IRobotKeyframe[]
    protected _action: IRobotActionName

    protected setRobot(value: IRobotKeyframe | IRobotKeyframe[]): void {
        this._robot = value;
        (this.__leaf as IRobot).__updateRobot()
    }

    protected setAction(value: IRobotActionName): void {
        this._action = value;
        (this.__leaf as IRobot).__updateAction()
    }

}
