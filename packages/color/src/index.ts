import { ColorConvert, Plugin } from '@leafer-ui/draw'

import { colorToRGBA } from './helper'


Plugin.add('color')


ColorConvert.object = colorToRGBA