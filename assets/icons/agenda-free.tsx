import React from 'react';
import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';

/**
 * Ilustração do estado "Agenda livre": um calendário com um visto — passa a
 * ideia de "tudo tratado, estás livre" sem prometer conteúdo que não existe.
 * `color` desenha o calendário (tom neutro); `accent` é o visto (verde suave).
 */
interface AgendaFreeProps {
  color: string;
  accent: string;
  size?: number;
}

const AgendaFree: React.FC<AgendaFreeProps> = ({ color, accent, size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Corpo do calendário */}
    <Rect x={7} y={11} width={34} height={30} rx={6} stroke={color} strokeWidth={2} />
    {/* Divisória do cabeçalho */}
    <Line x1={7} y1={19} x2={41} y2={19} stroke={color} strokeWidth={2} />
    {/* Argolas */}
    <Line x1={16} y1={7} x2={16} y2={14} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={32} y1={7} x2={32} y2={14} stroke={color} strokeWidth={2} strokeLinecap="round" />
    {/* Selo com visto — "livre / tudo em ordem" */}
    <Circle cx={34} cy={34} r={9} fill={accent} />
    <Path
      d="M30.2 34.2l2.6 2.6 5-5.2"
      stroke="#FFFFFF"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default AgendaFree;
