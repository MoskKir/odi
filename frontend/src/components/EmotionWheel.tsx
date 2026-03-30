import { useState, useMemo } from 'react';
import { Dialog, Button } from '@blueprintjs/core';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { setEmotion } from '@/store/appSlice';
import { getSocket } from '@/api/socket';

/* ── Emotion data ── */

interface Sector {
  core: string;
  color: string;
  colorMid: string;
  colorLight: string;
  level1: string[];
  level2: string[];
}

const SECTORS: Sector[] = [
  {
    core: 'грусть',
    color: '#4878B8',
    colorMid: '#6898D0',
    colorLight: '#98B8E0',
    level1: [
      'одиночество',
      'подавленность',
      'вина',
      'стыд',
      'скука',
      'вялость',
    ],
    level2: [
      'робость',
      'глупость',
      'несчастье',
      'неадекватность',
      'неполноценность',
      'безразличие',
    ],
  },
  {
    core: 'бешенство',
    color: '#D07030',
    colorMid: '#E09050',
    colorLight: '#F0B888',
    level1: [
      'враждебность',
      'злость',
      'свирепость',
      'ненависть',
      'придирчивость',
    ],
    level2: [
      'зависть',
      'эгоизм',
      'разочарование',
      'ярость',
      'раздражение',
      'скептичность',
    ],
  },
  {
    core: 'страх',
    color: '#906048',
    colorMid: '#B08868',
    colorLight: '#D0B098',
    level1: [
      'покинутость',
      'смущение',
      'беспомощность',
      'покорность',
      'безнадежность',
      'тревожность',
    ],
    level2: [
      'озадаченность',
      'обескураженность',
      'ничтожность',
      'слабость',
      'неловкость',
      'нелепость',
    ],
  },
  {
    core: 'радость',
    color: '#D08080',
    colorMid: '#E8A8A0',
    colorLight: '#F8C8C0',
    level1: [
      'восторг',
      'чувственность',
      'энергичность',
      'игривость',
      'творчество',
      'осознание',
    ],
    level2: [
      'смелость',
      'очарование',
      'возбуждение',
      'удовольствие',
      'экстравагантность',
      'наслаждение',
      'бодрость',
    ],
  },
  {
    core: 'сила',
    color: '#C0A020',
    colorMid: '#D8C040',
    colorLight: '#E8D880',
    level1: [
      'гордость',
      'уважение',
      'признание',
      'уверенность',
      'великодушие',
      'преданность',
      'сдержанность',
    ],
    level2: [
      'удовлетворённость',
      'авторитетность',
      'значимость',
      'разумность',
      'решительность',
      'благодарность',
    ],
  },
  {
    core: 'спокойствие',
    color: '#509840',
    colorMid: '#78B868',
    colorLight: '#A0D090',
    level1: [
      'умиротворённость',
      'задумчивость',
      'близость',
      'нежность',
      'доверие',
    ],
    level2: [
      'созерцательность',
      'расслабленность',
      'отзывчивость',
      'безмятежность',
      'чувствительность',
    ],
  },
];

/* ── Geometry ── */

const DEG2RAD = Math.PI / 180;

function polar(r: number, deg: number): [number, number] {
  const rad = (deg - 90) * DEG2RAD;
  return [r * Math.cos(rad), r * Math.sin(rad)];
}

function arcPath(ri: number, ro: number, a1: number, a2: number): string {
  const [ox1, oy1] = polar(ro, a1);
  const [ox2, oy2] = polar(ro, a2);
  const [ix2, iy2] = polar(ri, a2);
  const [ix1, iy1] = polar(ri, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${ox1},${oy1}A${ro},${ro},0,${lg},1,${ox2},${oy2}L${ix2},${iy2}A${ri},${ri},0,${lg},0,${ix1},${iy1}Z`;
}

function radialRotation(midAngle: number): number {
  let r = midAngle - 90;
  if (midAngle > 180) r -= 180;
  return r;
}

function tangentialRotation(midAngle: number): number {
  let r = midAngle;
  if (midAngle > 90 && midAngle <= 270) r += 180;
  return r;
}

/** Arc length at given radius for an angular span */
function arcLen(r: number, angleDeg: number): number {
  return (2 * Math.PI * r * angleDeg) / 360;
}

/**
 * Compute font size that fits within the segment.
 * For radial text:
 *   - text "width" (along text baseline) must fit in ringHeight (ro - ri)
 *   - text "height" (perpendicular) must fit in arcWidth at midRadius
 * For tangential text:
 *   - text "width" must fit in arcWidth
 *   - text "height" must fit in ringHeight
 */
function fitFontSize(
  label: string,
  ri: number,
  ro: number,
  angleDeg: number,
  mode: 'radial' | 'tangential',
  maxFont: number,
): number {
  const ringH = ro - ri;
  const midR = (ri + ro) / 2;
  const arcW = arcLen(midR, angleDeg);
  // Cyrillic chars are wide; bold even wider
  const cw = 0.62;

  let byLength: number; // text must fit along its baseline
  let byHeight: number; // text must fit perpendicular to baseline

  if (mode === 'radial') {
    // baseline goes along radius → text length must fit ringH
    byLength = (ringH * 0.88) / (label.length * cw);
    // perpendicular = arc width → font height must fit
    byHeight = arcW * 0.72;
  } else {
    // baseline along arc → text length must fit arcW
    byLength = (arcW * 0.88) / (label.length * cw);
    // perpendicular = ring height → font height must fit
    byHeight = ringH * 0.55;
  }

  return Math.min(maxFont, byLength, byHeight);
}

/* ── Segment ── */

interface Seg {
  path: string;
  fill: string;
  label: string;
  x: number;
  y: number;
  rotate: number;
  fontSize: number;
  fontWeight: number;
  ring: number;
  textColor: string;
}

/* ── Component ── */

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EmotionWheel({ isOpen, onClose }: Props) {
  const currentEmotion = useAppSelector((s) => s.app.currentEmotion);
  const user = useAppSelector((s) => s.auth.user);
  const socketJoined = useAppSelector((s) => s.app.socketJoined);
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Reset selection when dialog opens
  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handlePick = (emotion: string) => {
    setSelected(selected === emotion ? null : emotion);
  };

  const handleConfirm = () => {
    if (!selected || !sessionId) return;
    const socket = getSocket();
    // Update emotion state
    dispatch(setEmotion(selected as any));
    socket?.emit('emotion:set', { sessionId, emotion: selected });
    // Send system message to chat
    const name = user?.name || 'Пользователь';
    socket?.emit('chat:send', {
      sessionId,
      text: `🎭 ${name} сейчас испытывает: ${selected}`,
    });
    setSelected(null);
    onClose();
  };

  const handleReset = () => {
    dispatch(setEmotion(null));
    if (sessionId) {
      const socket = getSocket();
      socket?.emit('emotion:set', { sessionId, emotion: null });
    }
    setSelected(null);
    onClose();
  };

  const R0 = 9;
  const R1 = 19;
  const R2 = 34;
  const R3 = 50;

  const sectorDeg = 360 / SECTORS.length;
  const gap = 0.5;

  const segments = useMemo(() => {
    const result: Seg[] = [];

    SECTORS.forEach((sector, si) => {
      const base = si * sectorDeg;
      const cA1 = base + gap;
      const cA2 = base + sectorDeg - gap;
      const cAngle = cA2 - cA1;
      const coreMid = (cA1 + cA2) / 2;

      /* Core — tangential */
      const coreMidR = (R0 + R1) / 2;
      const [cx, cy] = polar(coreMidR, coreMid);
      const coreFontSize = fitFontSize(
        sector.core,
        R0,
        R1,
        cAngle,
        'tangential',
        3.0,
      );
      result.push({
        path: arcPath(R0, R1, cA1, cA2),
        fill: sector.color,
        label: sector.core,
        x: cx,
        y: cy,
        rotate: tangentialRotation(coreMid),
        fontSize: coreFontSize,
        fontWeight: 800,
        ring: 0,
        textColor: '#fff',
      });

      /* Level 1 — radial */
      const l1n = sector.level1.length;
      const l1deg = (sectorDeg - gap * 2) / l1n;
      sector.level1.forEach((lbl, i) => {
        const a1 = base + gap + i * l1deg;
        const a2 = a1 + l1deg - gap * 0.4;
        const segAngle = a2 - a1;
        const mid = (a1 + a2) / 2;
        const midR = (R1 + R2) / 2;
        const [x, y] = polar(midR, mid);
        const fs = fitFontSize(lbl, R1, R2, segAngle, 'radial', 2.0);
        result.push({
          path: arcPath(R1 + 0.15, R2, a1, a2),
          fill: sector.colorMid,
          label: lbl,
          x,
          y,
          rotate: radialRotation(mid),
          fontSize: fs,
          fontWeight: 600,
          ring: 1,
          textColor: '#222',
        });
      });

      /* Level 2 — radial */
      const l2n = sector.level2.length;
      const l2deg = (sectorDeg - gap * 2) / l2n;
      sector.level2.forEach((lbl, i) => {
        const a1 = base + gap + i * l2deg;
        const a2 = a1 + l2deg - gap * 0.4;
        const segAngle = a2 - a1;
        const mid = (a1 + a2) / 2;
        const midR = (R2 + R3) / 2;
        const [x, y] = polar(midR, mid);
        const fs = fitFontSize(lbl, R2, R3, segAngle, 'radial', 1.8);
        result.push({
          path: arcPath(R2 + 0.15, R3, a1, a2),
          fill: sector.colorLight,
          label: lbl,
          x,
          y,
          rotate: radialRotation(mid),
          fontSize: fs,
          fontWeight: 400,
          ring: 2,
          textColor: '#333',
        });
      });
    });

    return result;
  }, []);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      className="!bg-odi-surface !p-0 !w-[95vw] !max-w-[1200px]"
    >
      <div className="flex flex-col items-center p-3">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-1 px-1">
          <span className="text-sm font-bold text-odi-text">Колесо эмоций</span>
          <div className="flex items-center gap-2">
            {currentEmotion && (
              <span className="text-[10px] text-odi-text-muted">
                сейчас:{' '}
                <span className="text-odi-accent font-medium">
                  {currentEmotion}
                </span>
              </span>
            )}
            <Button
              minimal
              small
              icon="small-cross"
              onClick={handleClose}
              className="!text-odi-text-muted"
            />
          </div>
        </div>

        {/* Hover / selection label */}
        <div className="h-6 flex items-center justify-center">
          {(hovered || selected) && (
            <span
              className={`text-sm font-semibold animate-fade-in ${selected && !hovered ? 'text-odi-accent' : 'text-odi-text'}`}
            >
              {hovered || selected}
            </span>
          )}
        </div>

        {/* SVG Wheel */}
        <svg
          viewBox="-52 -52 104 104"
          className="w-full max-w-[min(1100px,85vh)] aspect-square"
        >
          {segments.map((seg, i) => {
            const isSelected = selected === seg.label;
            const isCurrent = currentEmotion === seg.label;
            const isHov = hovered === seg.label;
            const highlighted = isSelected || (isCurrent && !selected);
            return (
              <g key={i}>
                <path
                  d={seg.path}
                  fill={highlighted ? '#4A7FC0' : seg.fill}
                  stroke={
                    highlighted ? '#3060A0' : isHov ? '#fff' : '#ffffffa0'
                  }
                  strokeWidth={highlighted ? 0.4 : 0.12}
                  opacity={isHov && !highlighted ? 0.8 : 1}
                  className="cursor-pointer"
                  style={{ transition: 'opacity 0.12s, fill 0.12s' }}
                  onMouseEnter={() => setHovered(seg.label)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handlePick(seg.label)}
                />
                <text
                  x={seg.x}
                  y={seg.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={seg.fontSize}
                  fontWeight={seg.fontWeight}
                  fill={highlighted ? '#fff' : seg.textColor}
                  className="pointer-events-none select-none"
                  transform={`rotate(${seg.rotate},${seg.x},${seg.y})`}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Footer — confirm / reset */}
        <div className="flex items-center gap-2 mt-2 w-full px-1">
          {currentEmotion && (
            <Button
              minimal
              small
              text="Сбросить"
              icon="cross"
              onClick={handleReset}
              className="!text-odi-text-muted"
            />
          )}
          <div className="flex-1" />
          <Button
            small
            text="Отмена"
            onClick={handleClose}
            className="!text-odi-text-muted"
          />
          <Button
            small
            intent="primary"
            icon="tick"
            text={selected ? `Выбрать: ${selected}` : 'Выберите эмоцию'}
            disabled={!selected || !socketJoined}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Dialog>
  );
}
