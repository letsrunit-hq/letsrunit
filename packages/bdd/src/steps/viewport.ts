import { Given } from '../registry';

const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

export const viewport = Given(
  "I'm on a {mobile|tablet|desktop} device",
  async function (type: 'mobile' | 'tablet' | 'desktop') {
    const size = viewports[type];
    const current = this.page.viewportSize();

    if (current?.height !== size.height || current?.width !== size.width) {
      await this.page.setViewportSize(size);
    }
  },
);  
