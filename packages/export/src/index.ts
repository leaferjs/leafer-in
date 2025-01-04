import { IExportFileType, IExportOptions, IExportResult } from '@leafer-ui/interface'
import { Export, UI } from '@leafer-ui/draw'

import { ExportModule } from './export'
import './canvas'


Object.assign(Export, ExportModule)

UI.prototype.export = function (filename: IExportFileType | string, options?: IExportOptions | number | boolean): Promise<IExportResult> {
    return Export.export(this, filename, options)
}