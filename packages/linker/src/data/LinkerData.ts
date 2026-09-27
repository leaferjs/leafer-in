import { ILinkerData } from "@leafer-ui/interface"
import { LineData } from '@leafer-ui/draw'


export class LinkerData extends LineData implements ILinkerData {

    public get __usePathBox(): boolean {
        return ((this as ILinkerData).path || (this as ILinkerData).__pathInputed) as any as boolean
    }

}
