import * as dat from 'dat.gui'
import { ConditionalPanelParam, LineDisplay } from '../../types';

export const useConditionalPanelParams = () => {

  const params: ConditionalPanelParam = {
    display: LineDisplay.THRESHOLD_EDGES,
    threshold: 40,
    displayConditionalEdges: true,
    thickness: 1,
    useThickLines: false,
    lineColor: 0x455A64,
    reDrawFn: undefined,
  }

  const initGui = (onChange?: (key: keyof ConditionalPanelParam, value?: any) => void) => {
    const gui = new dat.GUI({hideable: true})
    gui.width = 300
    gui.add( params, 'reDrawFn' ).name("重新绘制");
    gui.addColor( params, 'lineColor' ).onChange((value?: any) => onChange && onChange('lineColor', value));
    const linesFolder = gui.addFolder( 'conditional lines' );
    linesFolder.add( params, 'threshold' )
      .min( 0 )
      .max( 120 )
      .onChange( (value?: any) => {

        onChange && onChange('threshold', value)
      } );

    linesFolder.add( params, 'display', [
      LineDisplay.THRESHOLD_EDGES,
      LineDisplay.NORMAL_EDGES,
      LineDisplay.NONE,
    ] ).onFinishChange( (value?: any) => onChange && onChange('display', value) );

    linesFolder.add( params, 'displayConditionalEdges' ).onChange((value?: any) => onChange && onChange('displayConditionalEdges', value));

    linesFolder.add( params, 'useThickLines' ).onChange((value?: any) => onChange && onChange('useThickLines', value));

    linesFolder.add( params, 'thickness', 0, 5 ).onChange((value?: any) => onChange && onChange('thickness', value));

    linesFolder.open();

    gui.open();

    gui.hide()

    return gui;
  }

  return {initGui, params}
}