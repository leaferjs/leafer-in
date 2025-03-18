import { IExportFileType, IExportOptions, IExportResult } from '@leafer-ui/interface'
import { Export, UI, Plugin } from '@leafer-ui/draw'

import { ExportModule } from './export'
import './canvas'


Plugin.add('export')


Object.assign(Export, ExportModule)

UI.prototype.export = function (filename: IExportFileType | string, options?: IExportOptions | number | boolean): Promise<IExportResult> {
    return Export.export(this, filename, options)
}

UI.prototype.syncExport = function (filename: string, options?: IExportOptions | number | boolean): IExportResult {
    return Export.syncExport(this, filename, options)
}
