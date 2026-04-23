import DefaultTheme from 'vitepress/theme';
import LatestLanhuHelperDownloadLink from './components/LatestLanhuHelperDownloadLink.vue';
import MyLayout from './MyLayout.vue';
import 'vitepress-component-medium-zoom/style.css';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component(
      'LatestLanhuHelperDownloadLink',
      LatestLanhuHelperDownloadLink
    );
  }
};
