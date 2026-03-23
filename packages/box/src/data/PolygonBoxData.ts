import { IPolygonBoxData } from '@leafer-ui/interface'
import { BoxData } from '@leafer-ui/draw'


export class PolygonBoxData extends BoxData implements IPolygonBoxData {

    public get __usePathBox(): boolean {
        return ((this as IPolygonBoxData).points || (this as IPolygonBoxData).__pathInputed) as any as boolean
    }

}
