import { dimType, Plugin, UI } from '@leafer-ui/draw'


Plugin.add('bright')

UI.addAttr('bright', false, dimType)

// 后续 dim / bright 逻辑将全部迁移至此插件中