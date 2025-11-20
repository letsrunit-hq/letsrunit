import React from 'react';
import Image from 'next/image';
import styles from './screenshot.module.css';

export type ScreenshotProps = {
  image?: string;
  alt?: string;
  width: number;
  height: number;
};

export function Screenshot({ image, alt, width, height }: ScreenshotProps) {
  return (
    <div className={styles.screenshotBox}>
      {image && <Image src={image} alt={alt ?? 'screenshot'} width={width} height={height} />}
      {!image && (
        <div className={styles.noImage}>
          <i className="pi pi-desktop"></i>
          <div>No screenshot</div>
        </div>
      )}
    </div>
  );
}

export default Screenshot;
