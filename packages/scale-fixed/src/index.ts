import { Plugin, UI } from '@leafer-ui/draw'

import { scaleFixedType } from './decorator'
import './helper'


Plugin.add('scale-fixed')

UI.addAttr('scaleFixed', undefined, scaleFixedType)