import React, { type CSSProperties } from 'react';
import Image from 'next/image';
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
      {src && <Image src={src} alt={alt ?? 'screenshot'} width={width} height={height} />}
      {!src && (
        <div className={styles.noImage}>
          <i className="pi pi-desktop"></i>
          <div>No screenshot</div>
        </div>
      )}
    </div>
  );
}

export default Screenshot;
