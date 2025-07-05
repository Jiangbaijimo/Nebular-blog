// 云函数主题API服务
import httpClient from '../http';

// 云函数主题配置接口
export interface ThemeConfig {
  footer: {
    otherInfo: {
      date: string;
      icp: {
        text: string;
        link: string;
      };
    };
    linkSections: Array<{
      name: string;
      links: Array<{
        name: string;
        href: string;
        external?: boolean;
      }>;
    }>;
  };
  config: {
    color: {
      light: string[];
      dark: string[];
    };
    site: {
      favicon: string;
      faviconDark: string;
    };
    hero: {
      title: {
        template: Array<{
          type: string;
          text: string;
          class: string;
        }>;
      };
      description: string;
    };
    module: {
      activity: {
        enable: boolean;
        endpoint: string;
      };
      donate: {
        enable: boolean;
      };
    };
  };
}

// 云函数响应接口
export interface CloudFunctionResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

class CloudFunctionThemeAPI {
  /**
   * 获取Shiro主题配置
   */
  async getShiroThemeConfig(): Promise<ThemeConfig> {
    try {
      const response = await httpClient.get<CloudFunctionResponse<ThemeConfig>>(
        '/api/fn/shiro/',
        { skipAuth: true }
      );
      return response.data;
    } catch (error) {
      console.error('获取主题配置失败:', error);
      // 返回默认配置
      return this.getDefaultThemeConfig();
    }
  }

  /**
   * 获取默认主题配置
   */
  private getDefaultThemeConfig(): ThemeConfig {
    return {
      footer: {
        otherInfo: {
          date: `2024-${new Date().getFullYear()}`,
          icp: {
            text: "备案号示例",
            link: "https://beian.miit.gov.cn"
          }
        },
        linkSections: [
          {
            name: "😊关于",
            links: [
              {
                name: "关于我",
                href: "/about"
              },
              {
                name: "关于此项目",
                href: "https://github.com/your-repo",
                external: true
              }
            ]
          },
          {
            name: "🧐更多",
            links: [
              {
                name: "时间线",
                href: "/timeline"
              },
              {
                name: "友链",
                href: "/friends"
              }
            ]
          },
          {
            name: "🤗联系",
            links: [
              {
                name: "写留言",
                href: "/message"
              },
              {
                name: "发邮件",
                href: "mailto:admin@example.com",
                external: true
              }
            ]
          }
        ]
      },
      config: {
        color: {
          light: [
            "#33A6B8",
            "#FF6666",
            "#26A69A",
            "#fb7287",
            "#69a6cc"
          ],
          dark: [
            "#F596AA",
            "#A0A7D4",
            "#ff7b7b",
            "#99D8CF",
            "#838BC6"
          ]
        },
        site: {
          favicon: "/favicon.ico",
          faviconDark: "/favicon-dark.ico"
        },
        hero: {
          title: {
            template: [
              {
                type: "h1",
                text: "Hi, I'm ",
                class: "font-light text-4xl"
              },
              {
                type: "h1",
                text: "Admin",
                class: "font-medium mx-2 text-4xl"
              },
              {
                type: "h1",
                text: "👋。",
                class: "font-light text-4xl"
              }
            ]
          },
          description: "欢迎来到我的博客系统！"
        },
        module: {
          activity: {
            enable: true,
            endpoint: "/fn/ps/update"
          },
          donate: {
            enable: false
          }
        }
      }
    };
  }
}

export const cloudFunctionThemeAPI = new CloudFunctionThemeAPI();
export default cloudFunctionThemeAPI;