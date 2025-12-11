import { Monitor } from 'lucide-react';
import Image from 'next/image';
import React, { type CSSProperties } from 'react';
import styles from './screenshot.module.css';

export type ScreenshotProps = {
  src?: string | null;
  alt?: string;
  width: number;
  height: number;
  style?: CSSProperties;
};

export function Screenshot({ src, alt, style, width, height }: ScreenshotProps) {
  return (
    <div className={styles.screenshotBox} style={style}>
      {src && <Image src={src} alt={alt ?? 'screenshot'} width={width} height={height} loading="eager" />}
      {!src && (
        <div className={styles.noImage}>
          <Monitor aria-hidden="true" className={styles.noImageIcon} />
          <div>No screenshot</div>
        </div>
      )}
    </div>
  );
}

export default Screenshot;
