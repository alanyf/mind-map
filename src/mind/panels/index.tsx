import { EditorPanel } from '../types';
import { AIPanel } from './ai-generate';
import { EdgeStylePanel } from './edge-style-panel';
import { HistoryPanel } from './history-panel';
import { ImportPanel } from './import-export';
import { LayoutPanel } from './layout-panel';
import { SavePanel } from './save-panel';
import { ColorThemePanel } from './theme';

export const panels: EditorPanel[] = [
  {
    position: 'top-right',
    content: (
      <div style={{ display: 'flex', gap: 12 }}>
        <HistoryPanel />
        <AIPanel />
        <ImportPanel />
        <ColorThemePanel />
        <SavePanel />
        <EdgeStylePanel />
        <LayoutPanel />
      </div>
    ),
  },
];
